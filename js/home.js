/**
 * @fileoverview 首页脚本，负责“网易云音乐-最近在听”模块的数据加载与渲染
 * @author dsy4567
 * @license
 * Copyright (c) 2026 dsy4567
 * SPDX-License-Identifier: MIT
 */

// @ts-check
"use strict";

/** 最近在听接口所在主机：接口无需登录，歌词与副歌也由该主机提供 */
const 接口主机 = "https://ncm.vercel.dsy4567.icu";

/** 最近在听接口：返回的 weekData 含 score 字段，作为排行依据 */
const 最近在听接口 = 接口主机 + "/user/record?uid=8223493733&type=1";

/** 排行展示上限：接口可能返回上百条，只展示前 30 名 */
const 排行上限 = 30;

const css变量_item_height = "124px";

let /** @type {最近在听项[]} */ 排行歌曲 = [],
	/**
	 * 本次渲染实际展示的排行项（全榜按档等比采样、按歌手加权的结果）：渲染时写入，点击时同样只加入这些
	 * @type {最近在听项[]}
	 */
	展示歌曲 = [],
	/** 是否已请求过排行数据（失败/非法也算“有结论”，避免换页后重复请求） */
	排行已请求 = false,
	/** 排行数据是否有效（无效时隐藏整个 section） */
	排行有效 = false,
	/** @type {{ lrc?: { lyric?: string } } | null} */ 歌词原始 = null,
	/** @type {{ code?: number; chorus?: 副歌信息[] } | null} */ 副歌原始 = null,
	/** @type {精选歌词 | "失败" | null} */ 精选歌词缓存 = null,
	正在处理点击 = false;

/** 全/半角标点与符号，用于无副歌数据时挑选“干净”的歌词行 */
const 标点符号正则 = /[\p{P}\p{S}]/u;

/** 已完成加载的 640px 大封面地址缓存：换页重渲染时可直接显示大图，避免先糊后清 */
const 大封面已加载 = new Set();

/** 正在加载的大图：持有强引用直至加载结束，游离的 Image 若无人引用可能被回收而中断加载，封面将永远等不到大图、动画也就无从启动 */
const 大图加载中 = new Set();

/** 封面平移动画的一个半周期时长（毫秒）：正放、倒放各一次构成一个完整往返 */
const 封面动画半周期毫秒 = 15000;

/** 大图预加载提前量：观察区上下各外扩这么多像素，使排行项在真正进入视口前就被判定为可见，提前发起大图请求并启动动画，滚动到时已就绪 */
const 预加载提前量 = "250px";

/** 封面平移动画的公共相位基准毫秒（首个动画启动时确立）：所有封面据此对齐进度 */
let 动画基准毫秒 = 0;

/** 逐项观察排行项：首次可见时才加载大图、启动封面动画；不在视口内（含被滚动裁剪）时暂停其动画，回到视口恢复（懒创建，换页后逐项重新观察） */
let /** @type {IntersectionObserver | null} */ 排行可见性观察器 = null;

/** 观察整个 section 是否进入视口：无有效缓存时只有 section 可见才发起请求，避免访客不滚动时白白消耗流量（懒创建，换页重建 section 后重新观察） */
let /** @type {IntersectionObserver | null} */ 模块可见性观察器 = null;

/** 东八区当天 23:59:59.999 的时间戳：先偏移到东八区、按 UTC 取当天末尾，再偏移回来，避免受访客本地时区影响 */
function 今日缓存过期时间() {
	const 东八区当天末尾 = new Date(Date.now() + 8 * 60 * 60 * 1000);
	东八区当天末尾.setUTCHours(23, 59, 59, 999);
	return 东八区当天末尾.getTime() - 8 * 60 * 60 * 1000;
}

/** 读取 localStorage 中的排行缓存；缺失或结构非法时返回 null */
function 读取排行缓存() {
	try {
		const 原文 = localStorage.getItem("最近在听");
		if (!原文) return null;
		const 缓存 = JSON.parse(原文);
		if (typeof 缓存?.过期时间 !== "number" || !Array.isArray(缓存?.排行项)) return null;
		return /** @type {最近在听缓存} */ (缓存);
	} catch (e) {
		console.warn(e);
		return null;
	}
}

/** 写入排行缓存：排行与歌词同批存入，有效期为东八区当天 23:59:59.999；写入失败（如隐私模式）静默忽略 */
function 写入排行缓存() {
	try {
		localStorage.setItem(
			"最近在听",
			JSON.stringify({
				过期时间: 今日缓存过期时间(),
				排行项: 排行歌曲,
				歌词原始,
				副歌原始,
			})
		);
	} catch (e) {
		console.warn(e);
	}
}

/** 用缓存填充内存状态（命中有效缓存或请求失败兜底时调用） */
function 应用缓存(/** @type {最近在听缓存} */ 缓存) {
	排行歌曲 = 缓存.排行项;
	歌词原始 = 缓存.歌词原始 ?? null;
	副歌原始 = 缓存.副歌原始 ?? null;
	排行有效 = 排行歌曲.length > 0;
}

/**
 * 歌曲的歌手键：id 为 0 时接口只给了名字（占位 id），退回名字，避免同一歌手被拆成多个
 * 坑：歌手 id 不可靠：洛天依 在接口里有三种身份——906118 洛天依Official、59655434 洛天依、0 洛天依；乐正绫 有两种（0、1102240）
 */
function 歌手键列表(/** @type {最近在听项} */ 项) {
	return 项.song.ar.map(歌手信息 => 歌手信息.id || 歌手信息.name);
}

/**
 * 按档等比采样：score 相同者算一档，档内保留约 √条数 条（开方缩减，长尾档不会因基数大而淹没榜单）。
 * 档内隐藏哪些由随机决定，但按歌手加权——某歌手已展示越多，其歌曲被抽中的权重越低，
 * ；第 1 名恒保留，避免榜首被抽掉
 * @param {最近在听项[]} 歌曲列表 - 已按 score 降序排列
 * @returns {最近在听项[]} 本次渲染展示的列表（保持原相对顺序）
 */
function 采样排行(歌曲列表) {
	if (歌曲列表.length <= 1) return 歌曲列表;
	/** @type {Map<number, 最近在听项[]>} */
	const 档位 = new Map();
	for (const 项 of 歌曲列表) {
		if (!档位.has(项.score)) 档位.set(项.score, []);
		档位.get(项.score)?.push(项);
	}
	/** 跨档累计每个歌手的已展示条数：高档先抽，已亮相的歌手在靠后档权重更低 */
	/** @type {Map<number | string, number>} */
	const 已展示歌手数 = new Map();
	const 记入展示 = (/** @type {最近在听项} */ 项) => {
		for (const 键 of 歌手键列表(项)) 已展示歌手数.set(键, (已展示歌手数.get(键) ?? 0) + 1);
	};
	/** 歌曲权重 = 1/(1+其歌手中已展示条数最多者的条数)，合唱曲的权重由最“超标”的歌手决定 */
	const 计算权重 = (/** @type {最近在听项} */ 项) =>
		1 / (1 + Math.max(0, ...歌手键列表(项).map(键 => 已展示歌手数.get(键) ?? 0)));
	const 第一名 = 歌曲列表[0];
	/** @type {最近在听项[]} */
	const 展示列表 = [];
	for (const 档内歌曲 of 档位.values()) {
		const 配额 = Math.ceil(Math.sqrt(档内歌曲.length));
		const 全保留 = 配额 >= 档内歌曲.length;
		/** @type {Set<最近在听项>} */
		const 选中 = new Set();
		/** @type {最近在听项[]} */
		const 候选 = [];
		for (const 项 of 档内歌曲)
			// 档内条数不足配额时全保留；第 1 名直接入选，不参与随机
			if (全保留 || 项 === 第一名) {
				选中.add(项);
				记入展示(项);
			} else 候选.push(项);

		// 轮盘赌逐条抽取：每抽一条就重算权重，同歌手歌曲的权重随之下降
		while (选中.size < 配额 && 候选.length) {
			const 权重列表 = 候选.map(计算权重);
			let 随机值 = Math.random() * 权重列表.reduce((累加, 权重) => 累加 + 权重, 0);
			let 抽取索引 = 候选.length - 1;
			for (let i = 0; i < 候选.length; i++) {
				随机值 -= 权重列表[i];
				if (随机值 < 0) {
					抽取索引 = i;
					break;
				}
			}
			选中.add(候选[抽取索引]);
			记入展示(候选[抽取索引]);
			候选.splice(抽取索引, 1);
		}
		// 按原顺序输出，档内名次不因随机而乱跳
		展示列表.push(...档内歌曲.filter(项 => 选中.has(项)));
	}
	return 展示列表;
}

/** 将排行项映射为播放列表使用的歌单结构 */
function 排行项转歌单(/** @type {最近在听项} */ 项) {
	const 歌手 = 项.song.ar.map(歌手信息 => 歌手信息.name).join(" / ");
	return {
		完整歌名: 歌手 ? 歌手 + " - " + 项.song.name : 项.song.name,
		歌名: 项.song.name,
		歌手,
		专辑: 项.song.al?.name || "",
		封面: 项.song.al?.picUrl ? 项.song.al.picUrl.replace("http://", "https://") : "",
		id: 项.song.id,
		mv: 项.song.mv ?? 0,
	};
}

/**
 * 选取用于展示的歌词行：优先取副歌（chorus）起始起的连续 5 句；
 * 副歌数据无效时兜底取从头开始第一组连续 5 句不含全/半角标点的歌词
 * @returns {Promise<string[] | null>} 选出的歌词行，无歌词时返回 null
 */
async function 选取歌词行() {
	const 歌词文本 = 歌词原始?.lrc?.lyric;
	if (typeof 歌词文本 !== "string" || !歌词文本.includes("[")) return null;
	let 脚本;
	try {
		// 结尾追加哨兵行，保证最后一句歌词有结束时间（与 ncm.js 的用法一致）
		脚本 = lrcParser(歌词文本 + "[999:59.99]\n").scripts;
		await schedulerYield();
	} catch (e) {
		console.warn(e);
		return null;
	}

	// 有副歌字段-选取副歌部分前5句
	const 副歌起始毫秒 = 副歌原始?.chorus?.[0]?.startTime;
	if (副歌原始?.code === 200 && typeof 副歌起始毫秒 === "number") {
		// 副歌时间为毫秒，歌词行时间为秒
		const 起始 = 脚本.findIndex(行 => 行.start >= 副歌起始毫秒 / 1000 - 0.05);
		if (起始 >= 0) {
			const 行 = 脚本
				.slice(起始, 起始 + 5)
				.map(行 => 行.text.trim())
				.filter(Boolean);
			if (行.length) return 行;
		}
	}
	// 无副歌字段-从头开始第一组连续 5 句不含全/半角标点的歌词
	const 所有行 = 脚本.map(行 => 行.text.trim()).filter(Boolean);
	for (let i = 0; i + 5 <= 所有行.length; i++)
		if (所有行.slice(i, i + 5).every(行 => !标点符号正则.test(行)))
			return 所有行.slice(i, i + 5);
	return null;
}

/** 将选出的歌词渲染进容器（原占位内容被整体替换） */
async function 渲染精选歌词(/** @type {HTMLElement} */ 容器, /** @type {精选歌词} */ 歌词) {
	容器.textContent = "";
	for (const 行 of 歌词.行) {
		const 单句 = ce("span");
		单句.className = "单句";
		单句.textContent = 行;
		容器.append(单句);
	}
	const 歌曲信息 = ce("span");
	歌曲信息.className = "歌曲信息";
	歌曲信息.textContent = `—— ${歌词.歌手}《${歌词.歌名}》`;
	容器.append(歌曲信息);

	await schedulerYield();
}

/** 加载、选取并渲染精选歌词；失败或无歌词时隐藏容器 */
async function 填充精选歌词() {
	const 容器 = qs("#网易云音乐-最近在听 .精选歌词容器");
	if (!容器) return;
	if (精选歌词缓存 === "失败") {
		容器.remove();
		return;
	}
	if (精选歌词缓存) return 渲染精选歌词(容器, 精选歌词缓存);
	try {
		await 添加脚本("/js/lib/lrc-parser.js");
		const 行 = await 选取歌词行();
		if (!行) throw new Error("无可展示的歌词");
		精选歌词缓存 = {
			行,
			歌手: 排行歌曲[0].song.ar.map(歌手信息 => 歌手信息.name).join(" / "),
			歌名: 排行歌曲[0].song.name,
		};
		渲染精选歌词(容器, 精选歌词缓存);
	} catch (e) {
		console.warn(e);
		精选歌词缓存 = "失败";
		容器.remove();
	}

	await schedulerYield();
}

/**
 * 点击排行项：将当前展示的排行（与现有歌单去重后）批量加入播放列表，并立即播放被点击的歌曲。
 * 展示的排行已在播放列表时（重复点击）仅切换播放被点击的歌曲
 */
async function 处理排行点击(/** @type {number} */ 歌曲id) {
	if (正在处理点击) return;
	正在处理点击 = true;
	try {
		// 直接引用 ncm.js 默认导出的类型，获得精确的类型提示
		const 网易云音乐 = /** @type {typeof import("./ncm.js").default | undefined} */ (
			_global["ncm.js"]?.().网易云音乐
		);
		if (!网易云音乐) throw new Error("ncm.js 尚未加载");
		// 等待 ncm.js 基础歌单填充完成，避免其按索引写入时覆盖本次添加的歌曲
		await 网易云音乐.歌单加载完成;
		const 待添加 = 展示歌曲
			.map(排行项转歌单)
			.filter(歌曲 => typeof 网易云音乐.歌单索引[歌曲.id] === "undefined");
		if (待添加.length) await 网易云音乐.添加歌曲到播放列表(待添加);
		await 网易云音乐.切换音乐(歌曲id, true);
	} catch (e) {
		提示("添加到播放列表失败");
		console.error(e);
	} finally {
		正在处理点击 = false;
	}
}

/** 当前公共相位（毫秒）：相对基准已流逝的时间，按一个完整往返取模，各封面据此对齐到同一进度 */
function 封面动画相位() {
	if (!动画基准毫秒) 动画基准毫秒 = performance.now();
	return (performance.now() - 动画基准毫秒) % (封面动画半周期毫秒 * 2);
}

/**
 * 创建封面平移动画：改用 Web Animations API 而非 CSS 动画，以便用 currentTime 精确对齐公共相位、
 * 直接控制暂停与播放（无需再权衡 animation 简写与 animation-play-state 的优先级）
 * @returns {Animation | null} 用户偏好减少动效时返回 null，此时保持 CSS 的居中静止态
 */
function 创建封面动画(/** @type {HTMLImageElement} */ 封面) {
	// WAAPI 动画不受 CSS 媒体查询约束，需在 JS 侧自行尊重该偏好
	if (matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
	// 行高基准从计算样式读取，保持 CSS 为唯一数据源；100% 为封面自身高度，交给浏览器按当前布局解析
	// const 行高基准 = getComputedStyle(封面).getPropertyValue("--item-height").trim();
	const 行高基准 = css变量_item_height;
	return 封面.animate(
		[{ transform: "translateY(0px)" }, { transform: `translateY(calc(${行高基准} - 100%))` }],
		{
			duration: 封面动画半周期毫秒,
			easing: "ease-in-out",
			direction: "alternate",
			iterations: Infinity,
		}
	);
}

/** 将封面动画对齐到公共相位并播放（尚无动画则创建）；暂停与否一律由观察器按最新可视状态决定，这里不读任何可视状态快照 */
function 播放封面动画(/** @type {HTMLImageElement} */ 封面) {
	const 动画 = 封面.getAnimations().at(0) || 创建封面动画(封面);
	if (!动画) return;
	// 暂停期间时间照常流逝，重新对齐相位可避免恢复播放后进度落后于其他封面
	动画.currentTime = 封面动画相位();
	动画.play();
}

/** 首次可见后加载大图：完成后换入大图，启动动画并让观察器按最新可视状态重新判定 */
function 加载封面大图(/** @type {HTMLImageElement} */ 封面) {
	const 大图地址 = 封面.dataset.大图地址;
	if (!大图地址) return;
	delete 封面.dataset.大图地址;
	const 大图 = new Image();
	大图.decoding = "async";
	大图加载中.add(大图);
	const 结束加载 = () => 大图加载中.delete(大图);
	大图.onerror = 结束加载;
	大图.onload = () => {
		结束加载();
		大封面已加载.add(大图地址);
		// 换页会重建列表，此时元素可能已脱离文档
		if (!封面.isConnected) return;
		封面.src = 大图地址;
		封面.classList.add("大图就绪");
		播放封面动画(封面);
		// 重新观察该项：大图就绪可能发生在该项滚出视口之后，此时旧的可视状态已过期，
		// 重新观察必定换来一次基于最新状态的回调，需要暂停的项由此暂停，可见的项保持播放
		const 项元素 = 封面.parentElement;
		if (项元素) {
			排行可见性观察器?.unobserve(项元素);
			排行可见性观察器?.observe(项元素);
		}
	};
	大图.src = 大图地址;
}

async function 渲染最近在听() {
	const 模块 = gd("网易云音乐-最近在听");
	if (!模块) return;
	if (!排行有效) {
		// 请求已有结论（失败或数据非法）时隐藏整个 section，未请求时保留骨架等待渲染
		if (排行已请求) 模块.remove();
		return;
	}
	/** @type {HTMLElement | null} */
	const 排行容器 = 模块.querySelector(".播放排行");
	if (!排行容器) return;
	// 数据已就绪、准备操作 DOM，此时才摘掉骨架的闪烁样式
	模块.classList.remove("加载中");
	// 接口不提供统计区间，文案固定为「最近一周」，写入 CSS 变量交给 .播放排行::before 展示（值含引号，content 可直接引用）
	排行容器.style.setProperty("--date-range", '"—— 最近一周 | 双击以播放 ——"');
	// 换页重渲染会丢弃旧列表：先取消其 WAAPI 动画，否则无限动画会继续持有已脱离文档的元素
	for (const 封面 of 排行容器.querySelectorAll("img.封面"))
		for (const 动画 of 封面.getAnimations()) 动画.cancel();
	排行容器.textContent = "";
	await schedulerYield();

	// 用文档片段收集后一次性插入，避免逐项写入已连接容器引发多次样式失效
	const 排行片段 = document.createDocumentFragment();
	// 每次渲染重新按档等比采样：展示的只是全榜的代表，排行歌曲本身保持完整，点击时只加入展示出来的
	展示歌曲 = 采样排行(排行歌曲).slice(0, 排行上限);
	// 第 1 名恒为 100%，靠后按 score 等比递减
	const 最大score = Math.max(...展示歌曲.map(项 => 项.score), 1);
	/** @type {HTMLElement[]} */
	const 项元素列表 = [];
	await 批量低阻塞操作(展示歌曲, 项 => {
		const 项元素 = ce("div");
		项元素.style.setProperty("--progress", (项.score / 最大score) * 100 + "%");
		项元素.tabIndex = 0;
		项元素.dataset.songId = "" + 项.song.id;
		const 歌手 = 项.song.ar.map(歌手信息 => 歌手信息.name).join(" / ");
		项元素.title = 歌手 ? `${歌手} - ${项.song.name}` : 项.song.name;
		if (项.song.al?.picUrl) {
			const 封面 = ce("img");
			封面.className = "封面";
			const 封面地址 = 项.song.al.picUrl.replace("http://", "https://");
			// 封面铺满整行，16px 小图放大严重模糊：lazy 小图立即占位（居中静止），首次可见后再并行请求大图，加载完成后换入并启用平移动画
			封面.src = 封面地址 + "?param=16y16";
			封面.alt = "";
			封面.loading = "lazy";
			// 封面.decoding = "async";
			const 大图地址 = 封面地址 + "?param=640y640";
			if (大封面已加载.has(大图地址)) {
				// 缓存命中：立即换入大图；此刻元素还在文档片段中，动画交由可见性观察器在插入文档后启动
				封面.src = 大图地址;
				封面.classList.add("大图就绪");
			} else
				// 暂存大图地址，交由可见性观察器在该项首次可见（含预加载提前量）时发起请求
				封面.dataset.大图地址 = 大图地址;
			项元素.append(封面);
		}
		const 歌曲信息 = ce("div");
		歌曲信息.className = "歌曲信息";
		歌曲信息.append(项.song.name);
		if (歌手) {
			const 歌手元素 = ce("span");
			歌手元素.className = "淡化";
			歌手元素.textContent = 歌手;
			歌曲信息.append(" ", 歌手元素);
		}
		// 不展示任何数字，名次由 CSS 的 counter 输出「TOP n」
		const 排名 = ce("div");
		排名.className = "排名";
		项元素.append(歌曲信息, 排名);
		排行片段.append(项元素);
		项元素列表.push(项元素);
	});
	排行容器.append(排行片段);
	// 换页会重建正文：先解除旧项的观察，再逐项观察；项首次可见时开始加载大图、启动封面动画
	if (!排行可见性观察器)
		排行可见性观察器 = new IntersectionObserver(
			条目列表 => {
				for (const 条目 of 条目列表) {
					const 项元素 = 条目.target;
					const 封面 = 项元素.querySelector("img.封面");
					if (!(封面 instanceof HTMLImageElement)) continue;
					// 不在外扩区域内时暂停（回调只在可视状态变化时下发，据此判定始终有效，无需另存状态快照）
					if (!条目.isIntersecting) {
						for (const 动画 of 封面.getAnimations()) 动画.pause();
						continue;
					}
					// 首次可见（含预加载提前量）才请求大图；大图就绪后（含缓存命中）对齐公共相位并播放
					if (封面.dataset.大图地址) 加载封面大图(封面);
					else if (封面.classList.contains("大图就绪")) 播放封面动画(封面);
				}
			},
			{ rootMargin: `${预加载提前量} 0px` }
		);
	排行可见性观察器.disconnect();
	for (const 项元素 of 项元素列表) 排行可见性观察器.observe(项元素);
	const 定位并播放 = (/** @type {Event} */ 事件) => {
		if (!(事件.target instanceof HTMLElement)) return;
		const 项元素 = 事件.target.closest("[data-song-id]");
		if (项元素 instanceof HTMLElement && 项元素.dataset.songId)
			处理排行点击(+项元素.dataset.songId);
	};
	排行容器.addEventListener("dblclick", 定位并播放);
	/** @param {KeyboardEvent} 事件 */
	const 键盘定位并播放 = 事件 => {
		if (事件.key === "Enter") 定位并播放(事件);
	};
	排行容器.addEventListener("keyup", 键盘定位并播放);

	await schedulerYield();
	填充精选歌词();
}

/** 请求并渲染最近在听：仅在无有效缓存、且 section 已进入视口时调用 */
async function 获取并渲染最近在听() {
	if (排行已请求) return 渲染最近在听();
	排行已请求 = true;
	const 动态加载自增计数器拷贝 = 动态加载自增计数器;
	try {
		// NOTE: 接口返回数据中 playCount 非登录状态恒为 0，只能通过 score 大致判断播放次数
		const 响应 = /** @type {最近在听响应} */ (await (await fetch(最近在听接口)).json());
		if (动态加载自增计数器拷贝 !== 动态加载自增计数器) return;

		const 原始项 = 响应?.weekData;
		if (!Array.isArray(原始项)) throw new Error("最近在听数据非法");
		const 有效项 = 原始项.filter(
			项 =>
				项 &&
				typeof 项.score === "number" &&
				项.song &&
				typeof 项.song.id === "number" &&
				typeof 项.song.name === "string" &&
				Array.isArray(项.song.ar)
		);
		if (!有效项.length) throw new Error("最近在听数据为空");
		// score 是排行依据（不是播放次数），降序排列；同分保持接口原顺序，展示上限在渲染时按 排行上限 截断
		排行歌曲 = 有效项.sort((甲, 乙) => 乙.score - 甲.score);
		排行有效 = true;

		// 接口不提供歌词与副歌，由客户端为第 1 名补取；失败时留空，歌词容器会自行移除
		const 第一名id = 排行歌曲[0].song.id;
		const [歌词响应, 副歌响应] = await Promise.all([
			fetch(`${接口主机}/lyric?id=${第一名id}`)
				.then(结果 => 结果.json())
				.catch(() => null),
			fetch(`${接口主机}/song/chorus?id=${第一名id}`)
				.then(结果 => 结果.json())
				.catch(() => null),
		]);
		歌词原始 = 歌词响应;
		副歌原始 = 副歌响应;
		写入排行缓存();
	} catch (e) {
		console.error(e);
		// 请求失败时用已过期的旧缓存兜底
		const 缓存 = 读取排行缓存();
		if (缓存) 应用缓存(缓存);
	}
	渲染最近在听();
}

/**
 * 无有效缓存时，等整个 section 进入视口再发起请求。
 * 观察器的首次回调会带上元素当前的可视状态，因此首屏 section 已在视口时无需滚动即可立即加载；
 * 换页会重建 section，观察前需先解除对旧元素的观察
 */
function 观察模块可见性() {
	const 模块 = gd("网易云音乐-最近在听");
	if (!模块) return;
	if (!模块可见性观察器)
		模块可见性观察器 = new IntersectionObserver(条目列表 => {
			for (const 条目 of 条目列表) {
				if (!条目.isIntersecting) continue;
				// 已开始加载，无需继续观察
				模块可见性观察器?.disconnect();
				获取并渲染最近在听();
				return;
			}
		});
	模块可见性观察器.disconnect();
	模块可见性观察器.observe(模块);
}

export function main() {
	显示或隐藏进度条(false);
	if (!location.hash && 已触发动态加载)
		qs("main .右")?.scrollIntoView({
			behavior: "smooth",
		});

	// 动态加载换页会重建正文，每次进入首页都需重新渲染；已有结论（请求完成、失败或已用缓存渲染）时直接用内存数据重绘
	if (排行已请求) return 渲染最近在听();
	// 命中仍在有效期内的缓存（东八区当天 23:59 前）不产生网络请求，直接渲染
	const 缓存 = 读取排行缓存();
	if (缓存 && 缓存.过期时间 > Date.now()) {
		排行已请求 = true;
		应用缓存(缓存);
		return 渲染最近在听();
	}
	// 无有效缓存：整个 section 进入视口后才请求
	观察模块可见性();
}
