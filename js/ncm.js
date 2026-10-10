/**
 * @fileoverview 网易云音乐组件
 * @author dsy4567
 * @license
 * Copyright (c) 2022-2026 dsy4567
 * SPDX-License-Identifier: MIT
 */

// @ts-check
"use strict";

/** mv 字段哨兵值：排行数据等来源无 mv 信息时填充，真实 mv id 恒为正数（见 home.js 的 排行项转歌单） */
const 无mv哨兵 = -0x66ccff;

/** 匹配行首连续的 LRC 时间标签，如 `[00:10.00][01:20.00]` */
const 行首时间标签 = /^(?:\[\d*:\d*\.?\d*\])+/;

/** 匹配单个 LRC 时间标签，如 [01:23.45] */
const 时间标签 = /\[\d*:\d*\.?\d*\]/g;

/** 触发下一首预加载地址请求的剩余播放时长（秒）：第三方接口响应很慢，需提前取回 */
const 预加载剩余秒数 = 30;

/** 触发预加载音频写入 src 的剩余播放时长（秒） */
const 预加载src剩余秒数 = 10;

/** 预加载结果的有效期（毫秒），超过后播放时不再复用 */
const 预加载有效期 = 2 * 60 * 1000;

/** 播放进度条的最小写入间隔（毫秒）：进度只是视觉反馈，1s 一次足够，避免高频样式写入 */
const 进度更新间隔 = 1000;

/** 将 `[mm:ss.xx]` 时间标签转换为秒数（与 lrc-parser 的 convertTime 一致） */
function 标签转秒(/** @type {string} */ 标签) {
	let [分钟, 秒数] = 标签.slice(1, -1).split(":");
	return +分钟 * 60 + +秒数;
}

/**
 * 把形如 `[00:10.00][01:20.00]歌词` 的多时间戳行拆成多行，并按时间升序重排。
 * lrc-parser 每行只取第一个时间戳，且以下一行的开始时间作为本行的结束时间，
 * 所以这类重复段落必须在解析前展开并重排，否则 cue 的时间区间会错位甚至倒序
 */
function 展开多时间戳行(/** @type {string} */ 歌词文本) {
	/** @type {{ 开始时间: number, 行: string }[]} */
	let 待排序行 = [];
	for (const 行 of 歌词文本.split("\n")) {
		let 行首标签 = 行.match(行首时间标签)?.[0];
		if (!行首标签) {
			待排序行.push({ 开始时间: Infinity, 行 });
			continue;
		}
		let 歌词 = 行.slice(行首标签.length);
		for (const 标签 of 行首标签.match(时间标签) ?? [])
			待排序行.push({ 开始时间: 标签转秒(标签), 行: 标签 + 歌词 });
	}
	// 展开后行序与时间轴无关，需按时间重排；元信息行等非时间行排到最后，会被解析器过滤
	待排序行.sort((甲, 乙) => 甲.开始时间 - 乙.开始时间);
	return 待排序行.map(项 => 项.行).join("\n");
}

// @ts-ignore
let /** @type {HTMLDivElement} */ 网易云音乐元素 = gd("网易云音乐", true),
	// @ts-ignore
	/** @type {HTMLDivElement} */ 歌词元素 = gd("歌词", true),
	// @ts-ignore
	/** @type {HTMLImageElement} */ 网易云音乐封面元素 = gd("网易云音乐封面", true);
let /** @type {(value?: any) => void} */ 歌单加载完成Resolve = () => {};
let 网易云音乐 = {
	重试timeout: -1,
	已初始化: false,
	/** 轨道与事件监听等一次性副作用是否已注册（初始化失败重试时避免重复注册） */
	已注册一次性副作用: false,
	已首次播放: false,
	立即播放: false,
	设置: {
		音量: 50 / 100,
		// 随机播放偏好持久化，刷新后仍沿用上次的选择
		随机播放: localStorage.getItem("随机播放") === "true",
		域名: "ncm.vercel.dsy4567.icu",
	},
	/** @type {Record<string, HTMLButtonElement>} */ 按钮: {},
	/** @type {歌单[]} */ 歌单: [],
	/** @type {Record<number, number>} */ 歌单索引: {},
	/** 预加载下一首用的共享 Audio：只预载元数据与必要数据 @type {HTMLAudioElement} */
	预加载音频: new Audio(),
	/** 预加载得到的音乐地址缓存：歌曲 id → 地址与写入时间，播放时命中可省去一次请求 @type {Map<number, { 地址: string, 时间戳: number }>} */
	预加载缓存: new Map(),
	/** @type {number[]} */ 洗牌后的索引: [],
	洗牌位置: 0,
	连续失败次数: 0,
	/** 上次写入 --progress 的时间戳（毫秒），用于把进度更新频率限制在 进度更新间隔 一次 */
	上次进度更新时间: 0,
	/** 播放列表面板是否展开：由 刷新面板展开状态 在鼠标/焦点事件中维护，供 timeupdate 廉价判断进度条是否可见 */
	面板已展开: false,
	/**
	 * 每次调用“播放第几首”时自增，用于标识最新的播放请求，
	 * 旧请求完成时可通过对比令牌来忽略，避免频繁操作导致的竞争
	 */
	播放请求令牌: 0,
	/**
	 * ncm.json 基础歌单填充完成的信号。
	 * 首页“最近在听”批量添加歌曲前需等待其完成，避免基础歌单按索引写入时覆盖新增歌曲
	 */
	歌单加载完成: new Promise(resolve => (歌单加载完成Resolve = resolve)),
	正在播放: {
		索引: 0,
		/** 最近一次写入 Audio.src 的歌曲 id，-1 表示尚未加载过 */
		已加载的音乐id: -1,
		/** 写入当前 src 的播放请求令牌，用于识别 error 事件是否来自已被替换的旧音频 */
		已加载的音乐令牌: -1,
		/** 本次进入预加载窗口后已触发预加载的歌曲 id，-1 表示尚未触发；离开窗口会被重置，ontimeupdate 高频回调据此保证每次进入窗口只预加载一次 */
		已预加载的歌曲id: -1,
		/** 预加载目标（下一首）的歌曲 id，-1 表示尚未确定 */
		预加载目标id: -1,
		/** 预加载目标的地址是否已取回并写入缓存 */
		预加载地址已就绪: false,
		/** 预加载目标的地址是否已写入预加载音频 */
		预加载src已设置: false,
		/** @type {HTMLAudioElement} */ Audio: new Audio(),
		/** @type {TextTrack | undefined} */ 歌词track: undefined,
		/** @type {TextTrack | undefined} */ 翻译track: undefined,
	},
	启用或禁用随机播放(/** @type {HTMLButtonElement} */ 按钮) {
		网易云音乐.设置.随机播放 = !网易云音乐.设置.随机播放;
		localStorage.setItem("随机播放", "" + 网易云音乐.设置.随机播放);
		网易云音乐.随机播放按钮外观(按钮);
		提示(按钮.title);
	},
	/** 把当前随机播放偏好同步到按钮的 checked 状态、激活样式与提示文案（首次渲染与切换后共用） */
	随机播放按钮外观(/** @type {HTMLButtonElement} */ 按钮) {
		按钮.setAttribute("aria-checked", "" + 网易云音乐.设置.随机播放);
		if (网易云音乐.设置.随机播放) 按钮.classList.add("激活");
		else 按钮.classList.remove("激活");
		按钮.title = "随机播放: " + (网易云音乐.设置.随机播放 ? "开" : "关");
	},
	更改音量() {
		// 0.5→0.75→1→0→0.25
		网易云音乐.正在播放.Audio.volume = 网易云音乐.设置.音量 =
			((网易云音乐.设置.音量 * 100 + 25) % 125) / 100;
		提示(
			(网易云音乐.按钮.音量.title = "音量: " + Math.round(网易云音乐.设置.音量 * 100) + "%")
		);
	},
	设置闪烁动画(/** @type {boolean} */ 启用) {
		const svg = 网易云音乐元素.querySelector("svg");
		if (svg) svg.classList[启用 ? "add" : "remove"]("网易云加载闪烁");
		if (网易云音乐封面元素)
			网易云音乐封面元素.classList[启用 ? "add" : "remove"]("网易云加载闪烁");
	},
	设置封面旋转动画(/** @type {boolean} */ 启用) {
		if (网易云音乐封面元素) {
			网易云音乐封面元素.classList.add("网易云封面旋转"); // 初始状态为没有这个class，目的是便于统一管理
			网易云音乐封面元素.classList[启用 ? "remove" : "add"]("暂停动画");
		}
	},
	/**
	 * 请求网易云音乐接口并解析为 json，网络等异常会抛出，由调用方统一兜底。
	 * 查询参数默认带上 randomCNIP=true，交由服务端随机选用中国大陆 IP 请求网易云音乐
	 */
	async 请求接口(
		/** @type {string} */ 路径,
		/** @type {Record<string, string | number>} */ 查询参数 = {}
	) {
		let 参数 = new URLSearchParams({ randomCNIP: "true" });
		for (const [键, 值] of Object.entries(查询参数)) 参数.set(键, "" + 值);
		return await (await fetch(`https://${网易云音乐.设置.域名}${路径}?${参数}`)).json();
	},
	/**
	 * 免费歌曲返回音频地址，其余（vip 等）降级为播放对应 mv 清晰度最低的一档。
	 * 预加载时把结果写入缓存（有效期见 预加载有效期），不涉及预加载音频；
	 * 非预加载时优先复用未过期的缓存，避免重复请求
	 */
	async 获取音乐地址(/** @type {number} */ id, 预加载 = false) {
		/** @type {string} */
		let 音乐地址 = `/404.html?failNcmId=${id}`;

		if (!预加载) {
			let 缓存 = 网易云音乐.预加载缓存.get(id);
			// 命中即消费，避免同一预加载结果被反复复用；过期的项留待下次预加载统一清理
			if (缓存) 网易云音乐.预加载缓存.delete(id);
			if (缓存 && Date.now() - 缓存.时间戳 < 预加载有效期) return 缓存.地址 || 音乐地址;
		}
		try {
			// 预加载在后台进行，不应触发加载闪烁动画
			if (!预加载 && 网易云音乐.已首次播放) 网易云音乐.设置闪烁动画(true);
			let 歌曲数据 = (await 网易云音乐.请求接口("/song/url", { id }))?.data[0];
			// vip 歌曲尝试获取 mv
			if (歌曲数据?.fee === 0 || 歌曲数据?.fee === 8)
				音乐地址 = 歌曲数据?.url?.replace("http://", "https://");
			else 音乐地址 = await 网易云音乐.获取mv地址(id);
		} catch (e) {
			console.error(e);
			音乐地址 = `/404.html?failNcmId=${id}`;
		}
		if (预加载) {
			// 每次预加载顺带清理过期项，避免缓存项无限累积
			网易云音乐.清理过期预加载缓存();
			网易云音乐.预加载缓存.set(id, { 地址: 音乐地址, 时间戳: Date.now() });
		}
		return 音乐地址;
	},
	/** 清理过期的预加载结果，避免缓存项无限累积（共享的预加载 Audio 会在下次预加载时被新地址替换） */
	清理过期预加载缓存() {
		let 现在 = Date.now();
		for (const [id, 缓存] of 网易云音乐.预加载缓存)
			if (现在 - 缓存.时间戳 >= 预加载有效期) 网易云音乐.预加载缓存.delete(id);
	},
	/** 获取歌曲对应 mv 清晰度最低一档的播放地址 */
	async 获取mv地址(/** @type {number} */ id) {
		let mv = 网易云音乐.歌单[网易云音乐.歌单索引[id]].mv;
		// mv 为哨兵值（来源数据无 mv 字段）时，经歌曲详情接口补取真实 mv id
		if (mv === 无mv哨兵)
			mv = (await 网易云音乐.请求接口("/song/detail", { ids: id }))?.songs?.[0]?.mv ?? 0;
		if (mv === 0) throw new Error("vip 歌曲且无 mv " + id);
		let 最小分辨率 = (await 网易云音乐.请求接口("/mv/detail", { mvid: mv }))?.data?.brs?.[0]
			?.br;
		return (
			await 网易云音乐.请求接口("/mv/url", { id: mv, r: 最小分辨率 })
		)?.data?.url?.replace("http://", "https://");
	},
	/** 随机播放时按洗牌顺序取下一首（方向 1）或上一首（方向 -1）的歌单索引 */
	洗牌取索引(/** @type {number} */ 方向) {
		let 歌单长度 = 网易云音乐.歌单.length;
		// 首次随机切换或歌单变化时重新洗牌，并定位到当前正在播放的歌曲
		if (网易云音乐.洗牌后的索引.length !== 歌单长度) {
			网易云音乐.洗牌后的索引 = 洗牌([...Array(歌单长度).keys()]);
			网易云音乐.洗牌位置 = Math.max(
				0,
				网易云音乐.洗牌后的索引.indexOf(网易云音乐.正在播放.索引)
			);
		}
		网易云音乐.洗牌位置 += 方向;
		if (网易云音乐.洗牌位置 >= 歌单长度) {
			// 一轮播完，重新洗牌，并把游标挪回新一轮开头
			网易云音乐.洗牌后的索引 = 洗牌([...Array(歌单长度).keys()]);
			网易云音乐.洗牌位置 = 0;
			// 新一轮首个若恰是刚播完的歌，与随机一首交换，避免连续重复同一首
			if (歌单长度 > 1 && 网易云音乐.洗牌后的索引[0] === 网易云音乐.正在播放.索引) {
				let 随机位置 = 1 + 随机含零自然数(歌单长度 - 1);
				[网易云音乐.洗牌后的索引[0], 网易云音乐.洗牌后的索引[随机位置]] = [
					网易云音乐.洗牌后的索引[随机位置],
					网易云音乐.洗牌后的索引[0],
				];
			}
		} else if (网易云音乐.洗牌位置 < 0) 网易云音乐.洗牌位置 = 歌单长度 - 1;
		return 网易云音乐.洗牌后的索引[网易云音乐.洗牌位置];
	},
	/**
	 * 立即重新洗牌，并把指定歌单索引排到游标处（位置 0）。
	 * 供点击侧栏播放列表项时调用：让随机播放从这首开始按全新顺序进行，
	 * 而不是沿用上次留下的洗牌顺序（否则接下来的“下一首”往往早已被旧顺序决定）
	 * @param {number} 索引 - 要排在洗牌顺序开头的歌单索引
	 */
	立即洗牌(/** @type {number} */ 索引) {
		let 歌单长度 = 网易云音乐.歌单.length;
		if (!歌单长度) return;
		网易云音乐.洗牌后的索引 = [
			索引,
			...洗牌([...Array(歌单长度).keys()].filter(当前索引 => 当前索引 !== 索引)),
		];
		网易云音乐.洗牌位置 = 0;
	},
	async 切换音乐(/** @type {number} */ 欲播放的音乐id, 立即播放 = false) {
		// 捕获本次点击对应的索引：初始化等 await 期间可能被其他点击改写 正在播放.索引，
		// 若之后重新读取会播成别人的歌
		let 目标索引 = 网易云音乐.歌单索引[欲播放的音乐id];
		// 歌单中不存在该 id（如 localStorage 记录的上次播放已被移除）时直接放弃，
		// 退回当前索引会因 id 与已加载歌曲不同，把正在播放的歌从头重放一遍
		if (typeof 目标索引 === "undefined") return;
		网易云音乐.正在播放.索引 = 目标索引;
		if (!立即播放) return;

		// 点击的就是已加载的当前歌曲（且未出错）：不重新获取资源，直接从头播放
		if (
			网易云音乐.正在播放.已加载的音乐id === 欲播放的音乐id &&
			!网易云音乐.正在播放.Audio.error
		) {
			try {
				网易云音乐.正在播放.Audio.currentTime = 0;
				await 网易云音乐.正在播放.Audio.play();
			} catch (e) {
				提示("播放失败");
				console.error(e);
			}
			return;
		}

		try {
			clearTimeout(网易云音乐.重试timeout);
			await 网易云音乐.初始化();
			await 网易云音乐.播放第几首(目标索引);
		} catch (e) {
			提示("播放失败");
			console.error(e);
		}
	},
	async 播放第几首(/** @type {number} */ 索引) {
		// 歌单为空或索引越界时无歌可播，提前放弃，避免随后读取 歌单[索引].id 抛错
		let 音乐信息 = 网易云音乐.歌单[索引];
		if (!音乐信息) return;

		if (!网易云音乐.已首次播放) 网易云音乐.已首次播放 = true;

		// 令牌用于丢弃过期的播放请求，防止快速切歌时旧请求覆盖新请求
		let 令牌 = ++网易云音乐.播放请求令牌;

		网易云音乐.正在播放.索引 = 索引;
		// 让随机播放游标跟随当前歌曲：手动点歌等未经 洗牌取索引 的切歌也落在正确位置，
		// 否则游标与正在播放的歌曲失配，下一首与预加载会重复或跳过歌曲
		if (网易云音乐.洗牌后的索引.length === 网易云音乐.歌单.length) {
			let 位置 = 网易云音乐.洗牌后的索引.indexOf(索引);
			if (位置 >= 0) 网易云音乐.洗牌位置 = 位置;
		}
		歌词元素.innerText = "";
		网易云音乐.正在播放.Audio.pause();
		网易云音乐.正在播放.Audio.currentTime = 0;
		网易云音乐封面元素.removeAttribute("src");

		网易云音乐.更新歌曲信息(令牌);
		// 先取地址并校验令牌，再写入 src：否则过期请求返回时会覆盖新请求已写入的 src
		let 音乐地址 = await 网易云音乐.获取音乐地址(音乐信息.id);
		if (令牌 !== 网易云音乐.播放请求令牌) return;

		网易云音乐.正在播放.Audio.src = 音乐地址;
		网易云音乐.正在播放.已加载的音乐id = 音乐信息.id;
		网易云音乐.正在播放.已加载的音乐令牌 = 令牌;
		网易云音乐.正在播放.Audio.autoplay = true;
		网易云音乐元素 && (网易云音乐元素.title = "网易云音乐 - 正在播放: " + 音乐信息.完整歌名);
		localStorage.setItem("上次播放", "" + 音乐信息.id);
	},
	async 播放暂停() {
		try {
			clearTimeout(网易云音乐.重试timeout);
			await 网易云音乐.初始化();

			if (!网易云音乐.已首次播放) 网易云音乐.已首次播放 = true;

			if (!网易云音乐.正在播放.Audio.src) {
				// 令牌用于丢弃过期的播放请求，防止快速切歌时旧请求覆盖新请求
				let 令牌 = ++网易云音乐.播放请求令牌;
				网易云音乐.更新歌曲信息(令牌);
				// 先取地址并校验令牌，再写入 src，避免过期请求覆盖新请求已写入的 src
				let 音乐信息 = 网易云音乐.歌单[网易云音乐.正在播放.索引];
				let 音乐地址 = await 网易云音乐.获取音乐地址(音乐信息.id);
				if (令牌 !== 网易云音乐.播放请求令牌) return;
				网易云音乐.正在播放.Audio.src = 音乐地址;
				网易云音乐.正在播放.已加载的音乐id = 音乐信息.id;
				网易云音乐.正在播放.已加载的音乐令牌 = 令牌;
			}

			if (网易云音乐.正在播放.Audio.paused) 网易云音乐.正在播放.Audio.play();
			else 网易云音乐.正在播放.Audio.pause();
		} catch (e) {
			提示("播放失败");
			console.error(e);
		}
	},
	async 上一首() {
		try {
			clearTimeout(网易云音乐.重试timeout);
			await 网易云音乐.初始化();
			let 索引;
			if (网易云音乐.设置.随机播放) 索引 = 网易云音乐.洗牌取索引(-1);
			else {
				索引 = 网易云音乐.正在播放.索引 - 1;
				if (索引 < 0) 索引 = 网易云音乐.歌单.length - 1;
			}
			await 网易云音乐.播放第几首(索引);
		} catch (e) {
			提示("播放失败");
			console.error(e);
		}
	},
	async 下一首() {
		try {
			clearTimeout(网易云音乐.重试timeout);
			await 网易云音乐.初始化();

			let 索引;
			if (网易云音乐.设置.随机播放) 索引 = 网易云音乐.洗牌取索引(1);
			else {
				索引 = 网易云音乐.正在播放.索引 + 1;
				if (索引 > 网易云音乐.歌单.length - 1) 索引 = 0;
			}
			await 网易云音乐.播放第几首(索引);
		} catch (e) {
			提示("播放失败");
			console.error(e);
		}
	},
	/**
	 * 当前歌曲剩余时长进入 预加载剩余秒数（30s）以内时预加载下一首：该窗口只为下一首请求并缓存播放地址。
	 * 地址取回后若已进入 预加载src剩余秒数（10s）以内且该曲尚未正式播放，则写入预加载音频预热网络；
	 * 否则仅留缓存，待剩余时长进入 10s 时再由 ontimeupdate 写入
	 */
	预加载下一首() {
		let { Audio, 索引 } = 网易云音乐.正在播放;
		let 音乐信息 = 网易云音乐.歌单[索引];
		if (!音乐信息) return;

		let 剩余秒数 = Audio.duration - Audio.currentTime;
		// 元数据未就绪时 duration 为 NaN，无法判断剩余时长；此时以及尚未进入预加载窗口时都清除本轮标记，
		// 使拖回开头重听、重播同一首后再次临近结尾仍能重新预加载（原缓存可能已被消费或过期）
		if (!Number.isFinite(剩余秒数) || 剩余秒数 > 预加载剩余秒数) {
			网易云音乐.正在播放.已预加载的歌曲id = -1;
			网易云音乐.正在播放.预加载src已设置 = false;
			return;
		}

		let /** @type {number | undefined} */ 下一首索引;
		if (网易云音乐.设置.随机播放) {
			// 洗牌顺序未生成或即将越过末尾重新洗牌时无法预判下一首，只能放弃。
			// 此处不得推进 洗牌位置：真正的 下一首 还会再推进一次，否则会跳歌
			if (网易云音乐.洗牌后的索引.length !== 网易云音乐.歌单.length) return;
			let 位置 = 网易云音乐.洗牌位置 + 1;
			if (位置 >= 网易云音乐.歌单.length) return;
			下一首索引 = 网易云音乐.洗牌后的索引[位置];
		} else 下一首索引 = (索引 + 1) % 网易云音乐.歌单.length;
		if (typeof 下一首索引 === "undefined") return;
		let 下一首id = 网易云音乐.歌单[下一首索引].id;

		// ontimeupdate 触发频繁，按歌曲 id 去重，保证每次进入窗口只请求一次地址
		if (网易云音乐.正在播放.已预加载的歌曲id !== 音乐信息.id) {
			网易云音乐.正在播放.已预加载的歌曲id = 音乐信息.id;
			网易云音乐.取预加载地址(下一首id);
		}
		// 已进入最后 10s：地址就绪就写入预加载音频；尚未就绪则什么都不做，等 取预加载地址 返回时处理
		if (剩余秒数 <= 预加载src剩余秒数) 网易云音乐.设置预加载src(下一首id);
	},
	/**
	 * 在预加载窗口为下一首取播放地址，结果只写缓存，不涉及预加载音频（不设置 src）。
	 * 取回时若已进入 10s 窗口且该曲尚未正式播放，则顺带写入预加载音频预热网络
	 */
	async 取预加载地址(/** @type {number} */ id) {
		// 同一首的地址已取回则直接复用（10s 窗口内缓存会被实际播放消费，不能据此判断，故另设标记）
		if (网易云音乐.正在播放.预加载目标id !== id || !网易云音乐.正在播放.预加载地址已就绪) {
			网易云音乐.正在播放.预加载目标id = id;
			网易云音乐.正在播放.预加载地址已就绪 = false;
			await 网易云音乐.获取音乐地址(id, true);
			网易云音乐.正在播放.预加载地址已就绪 = true;
		}
		// 取回时目标已被正式播放，则不必预热
		if (id === 网易云音乐.正在播放.已加载的音乐id) return;
		// 用 !(<=) 而非 >：duration 为 NaN（已切歌或元数据未就绪）时也走「不预热」分支
		if (
			!(
				网易云音乐.正在播放.Audio.duration - 网易云音乐.正在播放.Audio.currentTime <=
				预加载src剩余秒数
			)
		)
			return;
		网易云音乐.设置预加载src(id);
	},
	/**
	 * 把已取回的下一首地址写入预加载音频，提前预热网络，实际播放时能更快出声。
	 * 地址尚未取回时不写入（最后 10s 内不做任何事），留待 取预加载地址 返回时再处理
	 */
	设置预加载src(/** @type {number} */ id) {
		let { 预加载目标id, 预加载地址已就绪, 预加载src已设置 } = 网易云音乐.正在播放;
		if (预加载src已设置 || 预加载目标id !== id || !预加载地址已就绪) return;
		let 缓存 = 网易云音乐.预加载缓存.get(id);
		if (!缓存?.地址) return;
		网易云音乐.预加载音频.src = 缓存.地址;
		网易云音乐.正在播放.预加载src已设置 = true;
	},
	/**
	 * 同步播放列表面板的展开状态。面板的展开由 CSS 的 :hover 与 :has(*:focus-visible) 决定，
	 * 这里在鼠标移入移出、焦点进出时重算一次并缓存，timeupdate 便只需读一个布尔值，
	 * 无需每个 tick 都做选择器匹配；展开瞬间强制刷新一次，避免沿用收起期间的旧进度
	 */
	刷新面板展开状态() {
		// Chrome 86 无 :has()，需退化为 :focus-within，否则 matches 会抛 SyntaxError
		const 展开选择器 = 支持has选择器
			? ":hover, :has(*:focus-visible)"
			: ":hover, :focus-within";
		网易云音乐.面板已展开 = 网易云音乐元素?.matches(展开选择器) ?? false;
		if (网易云音乐.面板已展开) 网易云音乐.更新播放进度(true);
	},
	/**
	 * 把当前播放进度写入正在播放项的 --progress，驱动列表项 ::after 的进度填充。
	 * 面板收起或标签页不可见时进度条根本看不到，直接跳过；
	 * 两次写入至少间隔 进度更新间隔，强制为 true 时（开始播放等）跳过节流立即写入
	 */
	async 更新播放进度(强制 = false) {
		if (document.visibilityState !== "visible" || !网易云音乐.面板已展开) return;
		let 现在 = Date.now();
		if (!强制 && 现在 - 网易云音乐.上次进度更新时间 < 进度更新间隔) return;
		网易云音乐.上次进度更新时间 = 现在;

		let { Audio } = 网易云音乐.正在播放;
		// 元数据未就绪时 duration 为 NaN，已切歌时为 0，都无法换算百分比，一律按 0 处理，避免写入 NaN%
		let 百分比 =
			Number.isFinite(Audio.duration) && Audio.duration > 0
				? (Audio.currentTime / Audio.duration) * 100
				: 0;
		// 类 正在播放 在 onplay 时挂到目标项上，::after 也只在该状态下渲染，故只更新这一项
		await 立即渲染网易云音乐组件();
		qs("li.正在播放")?.style.setProperty("--progress", 百分比 + "%");
	},
	async 更新歌曲信息(/** @type {number} */ 令牌) {
		await 立即渲染网易云音乐组件();
		垂直滚动到容器内可见区域(
			"li[data-id='" + 网易云音乐.歌单[网易云音乐.正在播放.索引].id + "']",
			true
		);

		let 封面 = 网易云音乐.歌单[网易云音乐.正在播放.索引].封面;
		navigator.mediaSession &&
			(navigator.mediaSession.metadata = new MediaMetadata({
				title: 网易云音乐.歌单[网易云音乐.正在播放.索引].歌名,
				artist: 网易云音乐.歌单[网易云音乐.正在播放.索引].歌手,
				artwork: [
					{
						src: 封面 + "?param=1280y1280",
					},
				],
			}));
		封面
			? 更新顶部大图({
					url: 封面 + "?param=1280y1280",
					优先级: 顶部大图优先级.网易云封面,
					生命周期: 顶部大图永久,
				})
			: 撤销顶部大图(顶部大图优先级.网易云封面);
		网易云音乐封面元素.onerror = () => {
			网易云音乐封面元素.removeAttribute("src");
		};
		网易云音乐封面元素.src = 封面 + "?param=256y256";

		// 歌词相关
		歌词元素.innerText = "";
		// 直接清空轨道自身（cues 是实时列表）：removeCue 对不属于该轨道的 cue 会抛错，
		// 若中途抛出，后面的 cue 会漏删且再也无法回收，切歌后可能残留上一首的歌词
		try {
			for (const 轨道 of [网易云音乐.正在播放.歌词track, 网易云音乐.正在播放.翻译track]) {
				if (!轨道?.cues) continue;
				while (轨道.cues.length) 轨道.removeCue(轨道.cues[0]);
			}
		} catch (e) {
			console.warn(e);
		}
		网易云音乐
			.请求接口("/lyric", {
				id: 网易云音乐.歌单[网易云音乐.正在播放.索引].id,
			})
			.then(async j => {
				if (令牌 !== 网易云音乐.播放请求令牌) return;

				// 忽略非法歌词
				let 待解析歌词,
					待解析歌词翻译 = j.tlyric?.lyric;
				if (
					(!(待解析歌词 = j.lrc.lyric) && j.lrc.version !== 6) ||
					!j.lrc.lyric.includes("[")
				) {
					歌词元素.innerText = "";
					return;
				}
				await 添加脚本("/js/lib/lrc-parser.js");
				// 时间戳畸形（NaN）、重复（end === start）或倒序（end < start）的行会得到永不激活的
				// cue，甚至让 new VTTCue 抛错中断后续歌词，因此直接跳过
				let 所有歌词 = lrcParser(展开多时间戳行(待解析歌词) + "[999:59.99]\n").scripts;
				所有歌词.forEach(歌词 => {
					if (!(Number.isFinite(歌词.start) && 歌词.end > 歌词.start)) return;
					网易云音乐.正在播放.歌词track?.addCue(
						new VTTCue(歌词.start, 歌词.end, 歌词.text)
					);
				});

				if (待解析歌词翻译?.includes("[")) {
					let 所有歌词翻译 = lrcParser(
						展开多时间戳行(待解析歌词翻译) + "[999:59.99]\n"
					).scripts;
					所有歌词翻译.forEach(歌词翻译 => {
						if (!(Number.isFinite(歌词翻译.start) && 歌词翻译.end > 歌词翻译.start))
							return;
						网易云音乐.正在播放.翻译track?.addCue(
							new VTTCue(歌词翻译.start, 歌词翻译.end, 歌词翻译.text)
						);
					});
				}
			})
			.catch(e => {
				console.error(e);
			});
	},
	/** 动态批量添加歌曲到播放列表：跳过已在歌单中的 id（含本批次内的重复），写入歌单与歌单索引、创建列表元素，并重置随机播放的洗牌顺序 */
	async 添加歌曲到播放列表(/** @type {歌单[]} */ 待添加歌单) {
		await 立即渲染网易云音乐组件();
		if (!待添加歌单?.length) return;
		let 播放列表 = gd("播放列表", true);
		let 文档片段 = document.createDocumentFragment();
		let 已添加数量 = 0;
		await 批量低阻塞操作(待添加歌单, (/** @type {歌单} */ 音乐信息) => {
			// 已在基础歌单或先前添加进歌单的 id 直接跳过；同一批次内的重复由前面迭代写入的索引挡下
			if (typeof 网易云音乐.歌单索引[音乐信息.id] !== "undefined") return;
			// 数据与元素在同一迭代内写入，保证列表元素可见时其数据已可播放
			网易云音乐.歌单索引[音乐信息.id] = 网易云音乐.歌单.push(音乐信息) - 1;
			已添加数量++;
			文档片段.append(创建歌单项(音乐信息));
		});
		播放列表?.append(文档片段);
		// 歌单确有变化才重置洗牌顺序，下次随机切换时重新洗牌并定位到当前歌曲（见 洗牌取索引）
		if (已添加数量) 网易云音乐.洗牌后的索引 = [];
	},
	async 初始化() {
		try {
			if (网易云音乐.已初始化) return;
			网易云音乐.已初始化 = true;
			// 根据 id 定位上次播放的音乐
			if (localStorage.getItem("上次播放")) {
				let 上次播放 = localStorage.getItem("上次播放");
				// 没有上次播放时，设置一个无效id
				网易云音乐.切换音乐(+(上次播放 || -1));
			}

			网易云音乐.正在播放.Audio.preload = "none";
			网易云音乐.正在播放.Audio.autoplay = false;
			网易云音乐.正在播放.Audio.volume = 网易云音乐.设置.音量;
			// 预加载用的共享 Audio 只预载元数据等必要数据（见 获取音乐地址 的 预加载）
			网易云音乐.预加载音频.preload = "metadata";
			// 轨道与 mouseenter 监听属于一次性副作用：初始化失败会重置 已初始化 以便重试，
			// 若不加守卫，重试会重复 addTextTrack（泄漏旧轨道）并重复挂载 mouseenter 等监听
			if (!网易云音乐.已注册一次性副作用) {
				// kind 用 metadata：规范中供脚本使用的轨道，不会被视为面向用户的字幕而参与渲染/用户偏好
				网易云音乐.正在播放.歌词track = 网易云音乐.正在播放.Audio.addTextTrack(
					"metadata",
					"歌词"
				);
				网易云音乐.正在播放.翻译track = 网易云音乐.正在播放.Audio.addTextTrack(
					"metadata",
					"翻译",
					"zh-CN"
				);
				// 紧邻轨道创建处绑定监听，此时类型收窄为已定义（渲染歌词为函数声明，已提升）
				网易云音乐.正在播放.歌词track.oncuechange = 渲染歌词;
				网易云音乐.正在播放.翻译track.oncuechange = 渲染歌词;
				/**
				 * 依据当前活跃的歌词、翻译 cue 渲染歌词文本。
				 * 翻译 cue 的结束时间取自下一句翻译，会跨越中间没有翻译的歌词行而一直保持活跃，
				 * 因此主歌词与翻译必须在同一次渲染中确定，避免翻译残留到无翻译的歌词行
				 */
				function 渲染歌词() {
					let 歌词 = /** @type {VTTCue | undefined} */ (
						网易云音乐.正在播放.歌词track?.activeCues?.[0]
					);
					if (!歌词) {
						// 无活跃 cue 的区间（前奏、间奏等）要清空，否则上一句会一直残留
						歌词元素.innerText = "";
						return;
					}
					let 翻译 = /** @type {VTTCue | undefined} */ (
						网易云音乐.正在播放.翻译track?.activeCues?.[0]
					);

					// 只有开始时间落在当前歌词行内的翻译才属于当前歌词
					歌词元素.innerText =
						歌词.text +
						(翻译 && 翻译.startTime >= 歌词.startTime && 翻译.startTime < 歌词.endTime
							? ` (${翻译.text})`
							: "");
				}
				const f = async () => {
					await 立即渲染网易云音乐组件();
					垂直滚动到容器内可见区域(
						"li[data-id='" + 网易云音乐.歌单[网易云音乐.正在播放.索引].id + "']",
						true
					);
				};
				网易云音乐元素.addEventListener("mouseenter", f);
				网易云音乐元素.addEventListener("dblclick", f);
				// 面板展开/收起（含键盘聚焦展开）时同步状态，并立即刷新一次进度条
				网易云音乐元素.addEventListener("mouseenter", 网易云音乐.刷新面板展开状态);
				网易云音乐元素.addEventListener("mouseleave", 网易云音乐.刷新面板展开状态);
				网易云音乐元素.addEventListener("focusin", 网易云音乐.刷新面板展开状态);
				网易云音乐元素.addEventListener("focusout", 网易云音乐.刷新面板展开状态);
				网易云音乐.已注册一次性副作用 = true;
			}

			// 使用浏览器/系统提供的控件控制音乐播放
			// playbackState 与进度由 onplay/onpause/ontimeupdate 统一维护
			navigator.mediaSession?.setActionHandler("play", () =>
				网易云音乐.正在播放.Audio.play()
			);
			navigator.mediaSession?.setActionHandler("pause", () =>
				网易云音乐.正在播放.Audio.pause()
			);
			navigator.mediaSession?.setActionHandler("previoustrack", 网易云音乐.上一首);
			navigator.mediaSession?.setActionHandler("nexttrack", 网易云音乐.下一首);
			网易云音乐.正在播放.Audio.onended = 网易云音乐.下一首;
			网易云音乐.正在播放.Audio.onloadstart = () => {
				if (网易云音乐.已首次播放) 网易云音乐.设置闪烁动画(true);
			};
			网易云音乐.正在播放.Audio.onwaiting = () => {
				网易云音乐.设置闪烁动画(true);
			};
			网易云音乐.正在播放.Audio.onloadeddata = () => {
				网易云音乐.设置闪烁动画(false);
			};
			网易云音乐.正在播放.Audio.onloadedmetadata = () => {};
			网易云音乐.正在播放.Audio.onplay = () => {
				qsa("li.正在播放")?.forEach(元素 => {
					元素.classList.remove("正在播放");
				});
				qs(
					"li[data-id='" + 网易云音乐.歌单[网易云音乐.正在播放.索引].id + "']"
				)?.classList.add("正在播放");
				// 强制刷新一次：切歌后立即归零、暂停恢复后立即显示已播进度，都不必等下一次 timeupdate
				网易云音乐.更新播放进度(true);
			};
			网易云音乐.正在播放.Audio.onplaying = () => {
				网易云音乐.设置闪烁动画(false);
				网易云音乐.设置封面旋转动画(true);
				网易云音乐.连续失败次数 = 0;
				if (navigator.mediaSession) navigator.mediaSession.playbackState = "playing";
			};
			网易云音乐.正在播放.Audio.onpause = () => {
				网易云音乐.设置封面旋转动画(false);
				if (navigator.mediaSession) navigator.mediaSession.playbackState = "paused";
			};
			网易云音乐.正在播放.Audio.ontimeupdate = () => {
				网易云音乐.预加载下一首();
				网易云音乐.更新播放进度();
			};
			网易云音乐.正在播放.Audio.onerror = e => {
				// error 可能来自已被新请求替换的旧音频，此时不应计入失败或触发自动切歌
				if (网易云音乐.正在播放.已加载的音乐令牌 !== 网易云音乐.播放请求令牌) return;
				// 连续失败达到歌单长度时停止自动切换，成功播放一次即清零（见 onplaying）
				网易云音乐.连续失败次数++;
				console.error(e);
				if (网易云音乐.连续失败次数 >= 网易云音乐.歌单.length) {
					提示("已连续 " + 网易云音乐.歌单.length + " 首无法播放，已停止自动切换");
					return;
				}
				提示(
					"无法播放: " +
						网易云音乐.歌单[网易云音乐.正在播放.索引].完整歌名 +
						", 将在 3 秒后切换下一首"
				);
				clearTimeout(网易云音乐.重试timeout);
				网易云音乐.重试timeout = window.setTimeout(网易云音乐.下一首, 3000);
			};
			网易云音乐元素.title =
				"网易云音乐 - 正在播放: " + 网易云音乐.歌单[网易云音乐.正在播放.索引].完整歌名;
		} catch (e) {
			提示("播放失败");
			console.error(e);
			网易云音乐.已初始化 = false;
		}
	},
};

/**
 * 创建播放列表项：歌名与淡化歌手，并写入事件委托定位播放所需的 id 与完整歌名
 * @param {歌单} 音乐信息
 * @returns {HTMLLIElement}
 */
function 创建歌单项(/** @type {歌单} */ 音乐信息) {
	let li = ce("li");
	let 歌名 = ce("span");
	歌名.textContent = 音乐信息.歌名;
	let 歌手 = ce("span");
	歌手.className = "淡化";
	歌手.textContent = 音乐信息.歌手;
	li.append(歌名, " ", 歌手);
	li.tabIndex = 0;
	li.title = 音乐信息.完整歌名;
	li.dataset.id = "" + 音乐信息.id;
	return li;
}

let 染网易云音乐组件已渲染 = false;
async function 立即渲染网易云音乐组件() {
	if (染网易云音乐组件已渲染) return;
	染网易云音乐组件已渲染 = true;

	// 分组容器是 hover/聚焦即展开的，补分组语义与可访问名；role=group 不支持 aria-expanded，故不设展开态
	网易云音乐元素.setAttribute("role", "group");
	网易云音乐元素.setAttribute("aria-label", "网易云音乐");

	/** @type {HTMLButtonElement[]} */
	let 待添加按钮 = [];
	/**
	 * @param {string} 名称 - 按钮索引，也是 data-icon 图标名
	 * @param {(元素: HTMLButtonElement) => void} onclick
	 * @param {string} title
	 * @param {string} [role]
	 */
	function 创建按钮(名称, onclick, title, role = "button") {
		let /** @type {HTMLButtonElement} */ btn = ce("button");
		btn.innerHTML = `<svg class="特小尺寸" data-icon="${名称}"></svg>`;
		btn.onclick = () => onclick(btn); // 播放类按钮内部会自行初始化
		btn.type = "button";
		btn.title = title;
		btn.setAttribute("role", role);
		if (role === "checkbox") btn.setAttribute("aria-checked", "false");
		网易云音乐.按钮[名称] = btn;
		待添加按钮.push(btn);
	}

	创建按钮("上一首", 网易云音乐.上一首, "上一首");
	创建按钮("播放暂停", 网易云音乐.播放暂停, "播放/暂停");
	创建按钮("下一首", 网易云音乐.下一首, "下一首");
	创建按钮(
		"在网易云音乐中查看",
		() => {
			网易云音乐.歌单[网易云音乐.正在播放.索引].id &&
				open(
					"https://music.163.com/#/song?id=" +
						网易云音乐.歌单[网易云音乐.正在播放.索引].id
				);
		},
		"在网易云音乐中查看"
	);
	创建按钮("随机播放", 网易云音乐.启用或禁用随机播放, "随机播放", "checkbox");
	// 首次渲染即同步上次持久化的偏好，刷新后按钮外观与 设置.随机播放 保持一致
	网易云音乐.随机播放按钮外观(网易云音乐.按钮.随机播放);
	创建按钮("音量", 网易云音乐.更改音量, "音量: " + Math.round(网易云音乐.设置.音量 * 100) + "%");
	await schedulerYield();
	gd("音乐控件", true)?.append(...待添加按钮);
	gd("音乐控件", true)?.insertAdjacentHTML(
		"beforeend",
		`<a style="background:#000;color:#fff;" href="#切换主题" class="隐藏链接">跳过播放列表</a>`
	);

	let 播放列表 = gd("播放列表", true);

	if (播放列表) {
		// 事件委托：整个列表只挂 2 个监听器，靠 dataset.id 定位歌曲
		let 定位并播放 = (/** @type {Event} */ 事件) => {
			if (!(事件.target instanceof HTMLElement)) return;
			let li = 事件.target.closest("li");
			if (!(li instanceof HTMLElement) || !li.dataset.id) return;
			let 音乐id = +li.dataset.id;
			// 点击播放列表项即重新洗牌，让随机播放从这首开始按全新顺序进行
			let 索引 = 网易云音乐.歌单索引[音乐id];
			if (typeof 索引 !== "undefined") 网易云音乐.立即洗牌(索引);
			网易云音乐.切换音乐(音乐id, true);
		};
		播放列表.addEventListener("click", 定位并播放);
		播放列表.addEventListener("keydown", 事件 => {
			// Enter/Space 都是按钮的标准激活键；Space 需阻止默认的页面滚动
			if (事件.key !== "Enter" && 事件.key !== " ") return;
			事件.preventDefault();
			// 长按产生的重复事件不再触发，避免重复切歌
			if (事件.repeat) return;
			定位并播放(事件);
		});

		let 文档片段 = document.createDocumentFragment();
		await 批量低阻塞操作(网易云音乐.歌单, (/** @type {歌单} */ 音乐信息) =>
			文档片段.append(创建歌单项(音乐信息))
		);
		播放列表.append(文档片段);
	}

	渲染图标();
}

fetch("/json/ncm.json")
	.then(
		res =>
			new Promise((resolve, reject) => {
				延迟执行(
					"关键任务完成",
					() => {
						resolve(res.json());
					},
					3
				);
			})
	)
	.then(async j => {
		await 批量低阻塞操作(j.songs, async (/** @type {音乐信息} */ 音乐信息) => {
			let /** @type {string[]} */ 所有歌手 = [];
			音乐信息.ar.forEach(歌手 => 所有歌手.push(歌手.name));
			/** @type {歌单} */
			let 歌曲 = {
				完整歌名: "",
				歌名: 音乐信息.name,
				歌手: 所有歌手.join(" / "),
				专辑: 音乐信息.al.name,
				封面: 音乐信息.al.picUrl,
				mv: 音乐信息.mv,
				id: 音乐信息.id,
			};
			歌曲.完整歌名 = 歌曲.歌手 + " - " + 歌曲.歌名;
			// 与 添加歌曲到播放列表 一致地用 push 追加：按下标直写会留下数组空洞，
			// 两者若并发追加就可能互相覆盖索引
			网易云音乐.歌单索引[音乐信息.id] = 网易云音乐.歌单.push(歌曲) - 1;
		});

		网易云音乐元素.addEventListener("mousemove", 立即渲染网易云音乐组件, { once: true });
		// 键盘用户不产生 mousemove：首次按键时也提前渲染一次，使其能 Tab 进侧栏控件
		document.addEventListener("keydown", 立即渲染网易云音乐组件, { once: true });

		延迟执行("关键任务完成", 网易云音乐.初始化, 3);
		歌单加载完成Resolve();
	})
	.catch(e => {
		console.error(e);
		// 加载失败也要放行，避免首页“最近在听”的点击交互一直等待
		歌单加载完成Resolve();
	});

//#region 页面歌单数据
/**
 * 把一组歌单并入 歌单 与 歌单索引（按 id 去重）。
 * 与 ncm.json 基础歌单的填充保持一致：只写数据、不主动渲染播放列表面板，
 * 面板的整体渲染统一交给 立即渲染网易云音乐组件（它要等基础歌单填充完成后才会被触发，
 * 提前渲染会让随后追加的基础歌曲无法出现在列表里）；只有面板已经渲染过时才补上列表项
 * @param {歌单[]} 歌曲表
 */
function 并入歌单(歌曲表) {
	const 播放列表 = 染网易云音乐组件已渲染 ? gd("播放列表", true) : null;
	/** @type {HTMLLIElement[]} */
	const 待添加项 = [];
	for (const 歌曲 of 歌曲表 || []) {
		if (!歌曲 || typeof 歌曲.id !== "number") continue;
		if (typeof 网易云音乐.歌单索引[歌曲.id] !== "undefined") continue;
		网易云音乐.歌单索引[歌曲.id] = 网易云音乐.歌单.push(歌曲) - 1;
		if (播放列表) 待添加项.push(创建歌单项(歌曲));
	}
	if (待添加项.length) 播放列表?.append(...待添加项);
}

/**
 * 读取构建期注入的歌单数据（<script id="网易云音乐歌单" type="application/json">，内容为本页 歌单[]），
 * 并入歌单后移除脚本（换页时新页面会重新注入一份），并放行 歌单加载完成，
 * 使小组件不必等待 ncm.json 与额外的歌曲详情请求（见 tools/build.js 的 解析博文歌曲）
 * @returns {boolean} 是否读到并成功解析出数据
 */
function 同步页面歌单数据() {
	const 脚本 = /** @type {HTMLScriptElement | null} */ (
		qs("script#网易云音乐歌单", false, qs("main > .右", true) || document)
	);
	if (!脚本) return false;
	// 先移除再解析：解析失败也不留下脚本，避免下次进入同一页面时重复读取
	脚本.remove();
	let 歌曲表 = null;
	try {
		歌曲表 = JSON.parse(脚本.text);
	} catch (e) {
		console.error(e);
	}
	if (!Array.isArray(歌曲表)) return false;
	并入歌单(歌曲表);
	歌单加载完成Resolve();
	return true;
}

同步页面歌单数据();
// 动态换页只替换正文的 innerHTML，正文元素本身长期存在，观察其子节点即可覆盖每次导航；
// 只在新增节点里直接出现目标脚本时才处理，避免正文大量写入时反复查询
const 正文元素 = qs("main > .右", true);
if (正文元素)
	new MutationObserver(记录 => {
		if (
			!记录.some(记录项 =>
				Array.from(记录项.addedNodes).some(
					节点 => 节点 instanceof HTMLScriptElement && 节点.id === "网易云音乐歌单"
				)
			)
		)
			return;
		同步页面歌单数据();
	}).observe(正文元素, { childList: true, subtree: true });
//#endregion

//#region 网易云音乐小组件
/**
 * <x-163music data-id="音乐id">：在博文等页面内嵌展示单曲推荐。
 * 骨架由文档级 ::before 呈现（宿主无 .已加载 时），数据就绪后挂 shadow 渲染内容并加上 .已加载。
 * 支持先使用后注册：此处 define 会升级文档中已有实例并触发 connectedCallback，之后动态插入的实例同样会自动触发。
 */

/** 已解析歌曲缓存：音乐 id → 歌单（null 表示 id 非法或接口数据非法），避免同一 id 重复请求 */
const /** @type {Map<number, 歌单 | null>} */ 小组件歌曲缓存 = new Map();

/** 小组件内容（shadow DOM）的样式：文档级样式进不了 shadow，因此尺寸、填充色等需在此重写 */
const 小组件内容样式 = `
	:host {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		height: 64px;
	}
	.卡片 {
		background-color: var(--bg-color);
		border: 1px solid var(--overlay);
		border-radius: 64px;
		cursor: pointer;
		display: flex;
		flex-direction: row;
		align-items: stretch;
		justify-content: space-between;
		position: relative;
		width: 328px;
		height: 64px;
		overflow: hidden;
		transition: background-color var(--transition);
	}
	.卡片:hover,
	.卡片:focus-visible {
		background-color: var(--accent-color-transparent);
	}
	.卡片:focus-visible {
		outline: 2px dashed var(--link-color);
	}
	.卡片 > .封面,
	.卡片 > .歌曲信息 {
		z-index: 2;
	}
	/* 封面缺失时 img 会被移除 src，这个 64×64 圆形灰块即是兜底占位 */
	.卡片 > .封面 {
		background-color: var(--overlay-strong);
		border-radius: 50%;
		flex: none;
		width: 64px;
		height: 64px;
	}
	.卡片 > .封面 > img {
		border-radius: 50%;
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
	}
	.卡片 > .歌曲信息 {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		min-width: 0;
		width: calc(100% - 64px - 4px);
	}
	.卡片 > .歌曲信息 > .歌曲名称,
	.卡片 > .歌曲信息 > .歌手 {
		display: block;
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
		margin: 0 4px;
		width: 50%;
	}
	.卡片 > .歌曲信息 > .歌手 {
		flex: none;
		opacity: 0.7;
	}
	/* 文档级的 .中尺寸 / .fill 只作用于文档，shadow 内需自行给尺寸与填充色 */
	.卡片 > svg.logo {
		bottom: calc(50% - 24px);
		fill: var(--link-color);
		height: 48px;
		opacity: 0.1;
		position: absolute;
		right: 8px;
		width: 48px;
		z-index: 0;
	}
`;

/**
 * 在 shadow 内渲染图标：文档级的“渲染图标”只扫 document，不会进入 shadow；
 * 图标数据由 main.js 异步拉取，未就绪时短暂等待，避免 logo 永久空白
 * @param {ShadowRoot} shadow
 */
async function 渲染小组件图标(shadow) {
	for (let 次数 = 0; 次数 < 100 && !图标["网易云音乐"]; 次数++)
		await new Promise(resolve => setTimeout(resolve, 50));
	const 图标元素 = /** @type {SVGSVGElement[]} */ (
		Array.from(shadow.querySelectorAll("svg[data-icon]"))
	);
	// 传空数组会让 渲染图标 退回全文档查询，故仅在确有图标时调用
	if (图标元素.length) 渲染图标({ 要渲染图标的元素: 图标元素 });
}

/**
 * 解析小组件要展示的歌曲：优先命中已加载的歌单，未命中再请求歌曲详情；
 * data-id 非法或接口数据非法时返回 null，由调用方以“未知”占位
 * @param {string | null} 原始id
 * @returns {Promise<歌单 | null>}
 */
async function 解析小组件歌曲(原始id) {
	const id = Number(原始id);
	if (!原始id || !Number.isInteger(id) || id <= 0) return null;
	const 索引 = 网易云音乐.歌单索引[id];
	if (typeof 索引 !== "undefined") return 网易云音乐.歌单[索引] || null;
	if (小组件歌曲缓存.has(id)) return 小组件歌曲缓存.get(id) ?? null;

	let /** @type {歌单 | null} */ 歌曲 = null;
	try {
		const 详情 = (await 网易云音乐.请求接口("/song/detail", { ids: id }))?.songs?.[0];
		// 接口可能返回空或异常结构，只有确实拿到这首歌才认作有效数据
		if (详情?.id === id && typeof 详情.name === "string") {
			const 歌手 = (详情.ar || [])
				.map(/** @param {{ name?: string }} 歌手信息 */ 歌手信息 => 歌手信息?.name)
				.filter(Boolean)
				.join(" / ");
			歌曲 = {
				完整歌名: 歌手 ? 歌手 + " - " + 详情.name : 详情.name,
				歌名: 详情.name,
				歌手,
				专辑: 详情.al?.name || "",
				封面: (详情.al?.picUrl || "").replace("http://", "https://"),
				id,
				mv: 详情.mv || 0,
			};
		}
	} catch (e) {
		console.error(e);
	}
	小组件歌曲缓存.set(id, 歌曲);
	return 歌曲;
}

/**
 * 把歌曲写进 shadow：合法时展示封面/歌名/歌手，非法时以灰块与“未知歌名/未知歌手”兜底；
 * 完成后给宿主加上 .已加载，文档级样式据此把骨架 ::before 换成 shadow 内容
 * @param {网易云音乐小组件} 组件
 * @param {歌单 | null} 歌曲
 */
function 渲染小组件内容(组件, 歌曲) {
	const shadow = 组件.attachShadow({ mode: "open" });
	shadow.innerHTML = `
		<style>${小组件内容样式}</style>
		<div class="卡片">
			<div class="封面"><img alt="" loading="lazy" /></div>
			<div class="歌曲信息">
				<span class="歌曲名称"></span>
				<span class="歌手"></span>
			</div>
			<svg class="logo" data-icon="网易云音乐"></svg>
		</div>`;
	// 上面刚写入 shadow 内容，以下节点必然存在
	// @ts-ignore
	const /** @type {HTMLImageElement} */ 封面图 = shadow.querySelector("img");
	// @ts-ignore
	const /** @type {HTMLElement} */ 歌曲名称元素 = shadow.querySelector(".歌曲名称");
	// @ts-ignore
	const /** @type {HTMLElement} */ 歌手元素 = shadow.querySelector(".歌手");
	封面图.alt = 歌曲?.完整歌名 || "未知歌曲封面";
	if (歌曲?.封面) {
		// 与侧边栏一致地按 256×256 取图；加载失败退回灰底
		封面图.src = 歌曲.封面 + "?param=256y256";
		封面图.onerror = () => 封面图.removeAttribute("src");
	} else 封面图.hidden = true;
	歌曲名称元素.textContent = 歌曲?.歌名 || "未知歌名";
	歌手元素.textContent = 歌曲?.歌手 || "未知歌手";
	// tabindex/role 放在内层带圆角的卡片上；非法歌曲不可播放，不赋予可聚焦语义
	// @ts-ignore
	const /** @type {HTMLElement} */ 卡片元素 = shadow.querySelector(".卡片");
	if (歌曲) {
		卡片元素.tabIndex = 0;
		卡片元素.setAttribute("role", "button");
		卡片元素.title = "播放：" + 歌曲.完整歌名;
	}
	组件.classList.add("已加载");
	渲染小组件图标(shadow);
}

/**
 * 等待歌单就绪后解析 data-id 对应的歌曲，合法则自动加入播放列表，最后把骨架换成内容
 * @param {网易云音乐小组件} 组件
 */
async function 填充小组件(组件) {
	// 等待歌单就绪：命中构建期注入的数据时该 Promise 已被提前放行，否则等 ncm.json 填充完成
	await 网易云音乐.歌单加载完成;
	const 歌曲 = await 解析小组件歌曲(组件.getAttribute("data-id"));
	组件.歌曲 = 歌曲;
	// 用 并入歌单 而非 添加歌曲到播放列表：后者会提前渲染播放列表面板，
	// 令随后填入的基础歌单无法出现在列表里（详见 并入歌单）
	if (歌曲) 并入歌单([歌曲]);
	渲染小组件内容(组件, 歌曲);
}

/** <x-163music> 宿主元素：自行解析 data-id、切换骨架与内容，并响应点击/回车立即播放 */
class 网易云音乐小组件 extends HTMLElement {
	/** connectedCallback 可能因元素被移动而多次触发，用此标记确保只处理一次 @type {boolean} */
	已处理 = false;
	/** 解析得到的歌曲，null 表示未知（不可播放） @type {歌单 | null} */
	歌曲 = null;

	connectedCallback() {
		if (this.已处理) return;
		this.已处理 = true;
		// 焦点在内层卡片上，点击与回车/空格事件都会冒泡到宿主，此处统一处理
		this.addEventListener("click", () => this.播放());
		this.addEventListener("keydown", 事件 => {
			// Enter/Space 都是按钮的标准激活键；Space 需阻止默认的页面滚动
			if (事件.key !== "Enter" && 事件.key !== " ") return;
			事件.preventDefault();
			// 长按产生的重复事件不再触发，避免重复播放
			if (事件.repeat) return;
			this.播放();
		});
		填充小组件(this);
	}

	/** 点击/回车/空格立即播放本卡片对应的歌曲；数据非法时不播放 */
	播放() {
		if (this.歌曲) 网易云音乐.切换音乐(this.歌曲.id, true);
	}
}

if (!customElements.get("x-163music")) customElements.define("x-163music", 网易云音乐小组件);
//#endregion

export default 网易云音乐;

_global["ncm.js"] = () => ({
	网易云音乐,
});
