/**
 * @fileoverview 网抑云阴乐组件
 * @author dsy4567
 * @license
 * Copyright (c) 2026 dsy4567
 * SPDX-License-Identifier: MIT
 */

// @ts-check
"use strict";

// @ts-ignore
let /** @type {HTMLDivElement} */ 网抑云阴乐元素 = gd("网抑云阴乐", true),
	// @ts-ignore
	/** @type {HTMLDivElement} */ 歌词元素 = gd("歌词", true),
	// @ts-ignore
	/** @type {HTMLImageElement} */ 网抑云阴乐封面元素 = gd("网抑云阴乐封面", true);
let 网抑云阴乐 = {
	重试timeout: -1,
	已初始化: false,
	已首次播放: false,
	立即播放: false,
	设置: { 音量: 50 / 100, 随机播放: false, 域名: "ncm.vercel.dsy4567.icu" },
	/** @type {歌单[]} */ 歌单: [],
	/** @type {Record<number, number>} */ 歌单索引: {},
	/** @type {number[]} */ 洗牌后的索引: [],
	洗牌位置: 0,
	连续失败次数: 0,
	/**
	 * 每次调用“播放第几首”时自增，用于标识最新的播放请求，
	 * 旧请求完成时可通过对比令牌来忽略，避免频繁操作导致的竞争
	 */
	播放请求令牌: 0,
	正在播放: {
		索引: 0,
		/** @type {HTMLAudioElement} */ Audio: new Audio(),
		/** @type {VTTCue[]} */ 所有歌词: [],
		/** @type {VTTCue[]} */ 所有歌词翻译: [],
		/** @type {TextTrack | undefined} */ 歌词track: undefined,
		/** @type {TextTrack | undefined} */ 翻译track: undefined,
	},
	启用或禁用随机播放(/** @type {HTMLButtonElement} */ 按钮) {
		网抑云阴乐.设置.随机播放 = !网抑云阴乐.设置.随机播放;
		按钮.ariaChecked = "" + 网抑云阴乐.设置.随机播放;
		if (网抑云阴乐.设置.随机播放) 按钮.classList.add("激活");
		else 按钮.classList.remove("激活");
	},
	更改音量() {
		// 0.5→0.75→1→0→0.25
		网抑云阴乐.正在播放.Audio.volume = 网抑云阴乐.设置.音量 =
			((网抑云阴乐.设置.音量 * 100 + 25) % 125) / 100;
	},
	设置闪烁动画(/** @type {boolean} */ 启用) {
		const svg = 网抑云阴乐元素.querySelector("svg");
		if (svg) svg.classList[启用 ? "add" : "remove"]("网抑云加载闪烁");
		if (网抑云阴乐封面元素)
			网抑云阴乐封面元素.classList[启用 ? "add" : "remove"]("网抑云加载闪烁");
	},
	设置封面旋转动画(/** @type {boolean} */ 启用) {
		if (网抑云阴乐封面元素) {
			网抑云阴乐封面元素.classList.add("网抑云封面旋转"); // 初始状态为没有这个class，目的是便于统一管理
			网抑云阴乐封面元素.classList[启用 ? "remove" : "add"]("暂停动画");
		}
	},
	async 获取音乐地址(/** @type {number} */ id) {
		if (网抑云阴乐.已首次播放) 网抑云阴乐.设置闪烁动画(true);
		let 数据 = (
			await (
				await fetch(
					`https://${网抑云阴乐.设置.域名}/song/url?id=${id}&realIP=116.25.146.177`
				)
			).json()
		)?.data[0];
		// vip 歌曲尝试获取 mv
		if (数据?.fee === 0 || 数据?.fee === 8) return 数据?.url?.replace("http://", "https://");
		else
			return (
				await (
					await fetch(
						`https://${网抑云阴乐.设置.域名}/mv/url?id=${
							网抑云阴乐.歌单[网抑云阴乐.歌单索引[id]].mv
						}&r=${
							// 最小分辨率
							(
								await (
									await fetch(
										`https://${网抑云阴乐.设置.域名}/mv/detail?mvid=${
											网抑云阴乐.歌单[网抑云阴乐.歌单索引[id]].mv
										}`
									)
								).json()
							)?.data?.brs?.[0]?.br
						}`
					)
				).json()
			)?.data?.url?.replace("http://", "https://");
	},
	/** 随机播放时按洗牌顺序取下一首（方向 1）或上一首（方向 -1）的歌单索引 */
	洗牌取索引(/** @type {number} */ 方向) {
		let 歌单长度 = 网抑云阴乐.歌单.length;
		// 首次随机切换或歌单变化时重新洗牌，并定位到当前正在播放的歌曲
		if (网抑云阴乐.洗牌后的索引.length !== 歌单长度) {
			网抑云阴乐.洗牌后的索引 = 洗牌([...Array(歌单长度).keys()]);
			网抑云阴乐.洗牌位置 = Math.max(
				0,
				网抑云阴乐.洗牌后的索引.indexOf(网抑云阴乐.正在播放.索引)
			);
		}
		网抑云阴乐.洗牌位置 += 方向;
		if (网抑云阴乐.洗牌位置 >= 歌单长度) {
			// 一轮播完，重新洗牌
			网抑云阴乐.洗牌后的索引 = 洗牌([...Array(歌单长度).keys()]);
			网抑云阴乐.洗牌位置 = 0;
		} else if (网抑云阴乐.洗牌位置 < 0) 网抑云阴乐.洗牌位置 = 歌单长度 - 1;
		return 网抑云阴乐.洗牌后的索引[网抑云阴乐.洗牌位置];
	},
	async 切换音乐(/** @type {number} */ 欲播放的音乐id, 立即播放 = false) {
		if (typeof 网抑云阴乐.歌单索引[欲播放的音乐id] !== "undefined")
			网抑云阴乐.正在播放.索引 = 网抑云阴乐.歌单索引[欲播放的音乐id];
		if (!立即播放) return;

		try {
			clearTimeout(网抑云阴乐.重试timeout);
			await 网抑云阴乐.初始化();
			await 网抑云阴乐.播放第几首(网抑云阴乐.正在播放.索引);
		} catch (e) {
			提示("播放失败");
			console.error(e);
		}
	},
	async 播放第几首(/** @type {number} */ 索引) {
		if (!网抑云阴乐.已首次播放) 网抑云阴乐.已首次播放 = true;

		// 令牌用于丢弃过期的播放请求，防止快速切歌时旧请求覆盖新请求
		let 令牌 = ++网抑云阴乐.播放请求令牌;

		网抑云阴乐.正在播放.索引 = 索引;
		歌词元素.innerText = "";
		网抑云阴乐.正在播放.Audio.pause();
		网抑云阴乐.正在播放.Audio.currentTime = 0;

		网抑云阴乐.更新歌曲信息(令牌);
		网抑云阴乐.正在播放.Audio.src = await 网抑云阴乐.获取音乐地址(网抑云阴乐.歌单[索引].id);
		if (令牌 !== 网抑云阴乐.播放请求令牌) return;

		网抑云阴乐.正在播放.Audio.autoplay = true;
		网抑云阴乐元素 &&
			(网抑云阴乐元素.title = "网抑云阴乐 - 正在播放: " + 网抑云阴乐.歌单[索引].完整歌名);
		localStorage.setItem("上次播放", "" + 网抑云阴乐.歌单[索引].id);
	},
	async 播放暂停() {
		try {
			clearTimeout(网抑云阴乐.重试timeout);
			await 网抑云阴乐.初始化();

			if (!网抑云阴乐.已首次播放) 网抑云阴乐.已首次播放 = true;

			if (!网抑云阴乐.正在播放.Audio.src) {
				// 令牌用于丢弃过期的播放请求，防止快速切歌时旧请求覆盖新请求
				let 令牌 = ++网抑云阴乐.播放请求令牌;
				网抑云阴乐.更新歌曲信息(令牌);
				网抑云阴乐.正在播放.Audio.src = await 网抑云阴乐.获取音乐地址(
					网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].id
				);
				if (令牌 !== 网抑云阴乐.播放请求令牌) return;
			}

			if (网抑云阴乐.正在播放.Audio.paused) 网抑云阴乐.正在播放.Audio.play();
			else 网抑云阴乐.正在播放.Audio.pause();
		} catch (e) {
			提示("播放失败");
			console.error(e);
		}
	},
	async 上一首() {
		try {
			clearTimeout(网抑云阴乐.重试timeout);
			await 网抑云阴乐.初始化();
			let 索引;
			if (网抑云阴乐.设置.随机播放) 索引 = 网抑云阴乐.洗牌取索引(-1);
			else {
				索引 = 网抑云阴乐.正在播放.索引 - 1;
				if (索引 < 0) 索引 = 网抑云阴乐.歌单.length - 1;
			}
			await 网抑云阴乐.播放第几首(索引);
		} catch (e) {
			提示("播放失败");
			console.error(e);
		}
	},
	async 下一首() {
		try {
			clearTimeout(网抑云阴乐.重试timeout);
			await 网抑云阴乐.初始化();

			let 索引;
			if (网抑云阴乐.设置.随机播放) 索引 = 网抑云阴乐.洗牌取索引(1);
			else {
				索引 = 网抑云阴乐.正在播放.索引 + 1;
				if (索引 > 网抑云阴乐.歌单.length - 1) 索引 = 0;
			}
			await 网抑云阴乐.播放第几首(索引);
		} catch (e) {
			提示("播放失败");
			console.error(e);
		}
	},
	更新歌曲信息(/** @type {number} */ 令牌) {
		// @ts-ignore
		gd("播放列表", true)?.scrollTo({
			behavior: "smooth",
			top:
				qs("li[data-id='" + 网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].id + "']")
					?.offsetTop || 0,
		});

		let 封面 = "";
		navigator.mediaSession &&
			(navigator.mediaSession.metadata = new MediaMetadata({
				title: 网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].歌名,
				artist: 网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].歌手,
				artwork: [
					{
						src: (封面 = 网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].封面),
					},
				],
			}));
		网抑云阴乐封面元素.onerror = () => {
			网抑云阴乐封面元素.src = "";
		};
		网抑云阴乐封面元素.src = 封面 + "?param=128x128";

		// 歌词相关
		歌词元素.innerText = "";
		try {
			网抑云阴乐.正在播放.所有歌词.forEach(歌词 =>
				网抑云阴乐.正在播放.歌词track?.removeCue(歌词)
			);
			网抑云阴乐.正在播放.所有歌词翻译.forEach(歌词翻译 =>
				网抑云阴乐.正在播放.翻译track?.removeCue(歌词翻译)
			);
		} catch (e) {
			console.warn(e);
		}
		网抑云阴乐.正在播放.所有歌词 = [];
		网抑云阴乐.正在播放.所有歌词翻译 = [];
		fetch(
			`https://${网抑云阴乐.设置.域名}/lyric?id=${
				网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].id
			}&realIP=111.18.65.162`
		)
			.then(res => res.json())
			.then(async j => {
				if (令牌 !== 网抑云阴乐.播放请求令牌) return;

				let 待解析歌词,
					待解析歌词翻译 = j.tlyric?.lyric;
				if (
					(!(待解析歌词 = j.lrc.lyric) && j.lrc.version !== 6) ||
					!j.lrc.lyric.includes("[")
				) {
					歌词元素.innerText = "";
					网抑云阴乐.正在播放.所有歌词 = [];
					return;
				}
				await 添加脚本("/js/lib/lrc-parser.js");
				let 所有歌词 = lrcParser(待解析歌词 + "[999:59.99]\n").scripts;
				所有歌词.forEach(歌词 => {
					let c = new VTTCue(歌词.start, 歌词.end, 歌词.text);
					网抑云阴乐.正在播放.所有歌词.push(c);
					网抑云阴乐.正在播放.歌词track?.addCue(c);
				});

				if (待解析歌词翻译?.includes("[")) {
					let 所有歌词翻译 = lrcParser(待解析歌词翻译 + "[999:59.99]\n").scripts;
					所有歌词翻译.forEach(歌词翻译 => {
						let c = new VTTCue(歌词翻译.start, 歌词翻译.end, 歌词翻译.text);
						网抑云阴乐.正在播放.所有歌词翻译.push(c);
						网抑云阴乐.正在播放.翻译track?.addCue(c);
					});
				}
			})
			.catch(e => {
				console.error(e);
			});
	},
	async 初始化() {
		try {
			if (网抑云阴乐.已初始化) return;
			网抑云阴乐.已初始化 = true;
			// 根据 id 定位上次播放的音乐
			if (localStorage.getItem("上次播放")) {
				let 上次播放 = localStorage.getItem("上次播放");
				// 没有上次播放时，设置一个无效id
				网抑云阴乐.切换音乐(+(上次播放 || -1));
				// @ts-ignore
				gd("播放列表", true)?.scrollTo({
					behavior: "smooth",
					top: qs("li[data-id='" + 上次播放 + "']")?.offsetTop || 0,
				});
			}

			网抑云阴乐.正在播放.Audio.preload = "none";
			网抑云阴乐.正在播放.Audio.autoplay = false;
			网抑云阴乐.正在播放.Audio.volume = 网抑云阴乐.设置.音量;
			网抑云阴乐.正在播放.歌词track = 网抑云阴乐.正在播放.Audio.addTextTrack(
				"captions",
				"歌词"
			);
			网抑云阴乐.正在播放.翻译track = 网抑云阴乐.正在播放.Audio.addTextTrack(
				"subtitles",
				"翻译",
				"zh-CN"
			);
			网抑云阴乐.正在播放.歌词track.oncuechange = () => {
				// @ts-ignore
				let 歌词 = 网抑云阴乐.正在播放.歌词track?.activeCues[0]?.text;
				if (歌词) 歌词元素.innerText = 歌词;
			};
			网抑云阴乐.正在播放.翻译track.oncuechange = () => {
				// @ts-ignore
				let 翻译 = 网抑云阴乐.正在播放.翻译track?.activeCues[0]?.text;
				if (翻译) 歌词元素.innerText += ` (${翻译})`;
			};

			// 使用浏览器/系统提供的控件控制音乐播放
			// playbackState 与进度由 onplay/onpause/ontimeupdate 统一维护
			navigator.mediaSession?.setActionHandler("play", () =>
				网抑云阴乐.正在播放.Audio.play()
			);
			navigator.mediaSession?.setActionHandler("pause", () =>
				网抑云阴乐.正在播放.Audio.pause()
			);
			navigator.mediaSession?.setActionHandler("previoustrack", 网抑云阴乐.上一首);
			navigator.mediaSession?.setActionHandler("nexttrack", 网抑云阴乐.下一首);
			网抑云阴乐.正在播放.Audio.onended = 网抑云阴乐.下一首;
			网抑云阴乐.正在播放.Audio.onloadstart = () => {
				if (网抑云阴乐.已首次播放) 网抑云阴乐.设置闪烁动画(true);
			};
			网抑云阴乐.正在播放.Audio.onwaiting = () => {
				网抑云阴乐.设置闪烁动画(true);
			};
			网抑云阴乐.正在播放.Audio.onloadeddata = () => {
				网抑云阴乐.设置闪烁动画(false);
			};
			网抑云阴乐.正在播放.Audio.onloadedmetadata = () => {};
			网抑云阴乐.正在播放.Audio.onplay = () => {
				qsa("li.正在播放")?.forEach(元素 => {
					元素.classList.remove("正在播放");
				});
				qs(
					"li[data-id='" + 网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].id + "']"
				)?.classList.add("正在播放");
			};
			网抑云阴乐.正在播放.Audio.onplaying = () => {
				网抑云阴乐.设置闪烁动画(false);
				网抑云阴乐.设置封面旋转动画(true);
				网抑云阴乐.连续失败次数 = 0;
				if (navigator.mediaSession) navigator.mediaSession.playbackState = "playing";
			};
			网抑云阴乐.正在播放.Audio.onpause = () => {
				网抑云阴乐.设置封面旋转动画(false);
				if (navigator.mediaSession) navigator.mediaSession.playbackState = "paused";
			};
			网抑云阴乐.正在播放.Audio.ontimeupdate = () => {};
			网抑云阴乐.正在播放.Audio.onerror = e => {
				// 连续失败达到歌单长度时停止自动切换，成功播放一次即清零（见 onplaying）
				网抑云阴乐.连续失败次数++;
				console.error(e);
				if (网抑云阴乐.连续失败次数 >= 网抑云阴乐.歌单.length) {
					提示("已连续 " + 网抑云阴乐.歌单.length + " 首无法播放，已停止自动切换");
					return;
				}
				提示(
					"无法播放: " +
						网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].完整歌名 +
						", 将在 3 秒后切换下一首"
				);
				clearTimeout(网抑云阴乐.重试timeout);
				// @ts-ignore
				网抑云阴乐.重试timeout = setTimeout(网抑云阴乐.下一首, 3000);
			};
			网抑云阴乐元素.title =
				"网抑云阴乐 - 正在播放: " + 网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].完整歌名;
		} catch (e) {
			提示("播放失败");
			console.error(e);
			网抑云阴乐.已初始化 = false;
		}
	},
};

fetch("/json/ncm.json")
	.then(res => res.json())
	.then(async j => {
		for (let i = 0; i < j.songs.length; i++) {
			const /** @type {音乐信息} */ 音乐信息 = j.songs[i];

			let /** @type {string[]} */ 所有歌手 = [];
			音乐信息.ar.forEach(歌手 => 所有歌手.push(歌手.name));
			网抑云阴乐.歌单[i] = {
				完整歌名: "",
				歌名: 音乐信息.name,
				歌手: 所有歌手.join(" / "),
				专辑: 音乐信息.al.name,
				封面: 音乐信息.al.picUrl,
				mv: 音乐信息.mv,
				id: 音乐信息.id,
			};
			网抑云阴乐.歌单[i].完整歌名 = 网抑云阴乐.歌单[i].歌手 + " - " + 网抑云阴乐.歌单[i].歌名;
			网抑云阴乐.歌单索引[音乐信息.id] = i;
		}
		function svg(
			/** @type {string} */ html,
			/** @type {( 元素: HTMLButtonElement ) => void} */ onclick,
			/** @type {string} */ title,
			role = "button"
		) {
			// @ts-ignore
			let /** @type {HTMLButtonElement} */ btn = ce("button");
			btn.innerHTML = html;
			btn.onclick = async () => {
				await 网抑云阴乐.初始化();
				onclick(btn);
			};
			btn.type = "button";
			btn.title = title;
			btn.role = role;
			btn.ariaChecked = role === "checkbox" ? "false" : null;
			gd("阴乐控件", true)?.append(btn);
		}
		const f = () => {
			svg(`<svg class="特小尺寸" data-icon="上一首"></svg>`, 网抑云阴乐.上一首, "上一首");
			svg(
				`<svg class="特小尺寸" data-icon="播放暂停"></svg>`,
				网抑云阴乐.播放暂停,
				"播放/暂停"
			);
			svg(`<svg class="特小尺寸" data-icon="下一首"></svg>`, 网抑云阴乐.下一首, "下一首");
			svg(
				`<svg class="特小尺寸" data-icon="在网抑云阴乐中查看"></svg>`,
				() => {
					网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].id &&
						open(
							"https://music.163.com/#/song?id=" +
								网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].id
						);
				},
				"在网抑云阴乐中查看"
			);
			svg(
				`<svg class="特小尺寸" data-icon="随机播放"></svg>`,
				网抑云阴乐.启用或禁用随机播放,
				"随机播放",
				"checkbox"
			);
			svg(`<svg class="特小尺寸" data-icon="音量"></svg>`, 网抑云阴乐.更改音量, "音量");
			gd("阴乐控件", true)?.insertAdjacentHTML(
				"beforeend",
				`<a style="background:#000;color:#fff;" href="#切换主题" class="隐藏链接">跳过播放列表</a>`
			);
			网抑云阴乐.歌单.forEach(音乐信息 => {
				let li = ce("li");
				li.innerHTML = `${音乐信息.歌名} <span class="淡化">${音乐信息.歌手}</span>`;
				// @ts-ignore
				li.onclick = li.onkeyup = 事件 => {
					if (事件?.key === "Enter" || !事件?.key) 网抑云阴乐.切换音乐(音乐信息.id, true);
				};
				li.tabIndex = 0;
				li.title = 音乐信息.完整歌名;
				li.dataset.id = "" + 音乐信息.id;
				gd("播放列表", true)?.append(li);
			});
			_global["main.js"]().添加点击事件和设置图标();

			网抑云阴乐.初始化();
		};
		DOMContentLoaded ? f() : addEventListener("DOMContentLoaded", f);
	})
	.catch(e => console.error(e));

export default 网抑云阴乐;

_global["ncm.js"] = () => ({
	网抑云阴乐,
});
