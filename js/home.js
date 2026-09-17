/**
 * @fileoverview 首页脚本，负责“网易云音乐-最近在听”模块的数据加载与渲染
 * @author dsy4567
 * @license
 * Copyright (c) 2026 dsy4567
 * SPDX-License-Identifier: MIT
 */

// @ts-check
"use strict";

let /** @type {最近聆听排行数据 | null} */ 排行原始数据 = null,
	/** 是否已请求过排行数据（失败/非法也算“有结论”，避免换页后重复请求） */
	排行已请求 = false,
	/** 排行数据是否有效（无效时隐藏整个 section） */
	排行有效 = false,
	/** @type {排行歌曲项[]} */ 排行歌曲 = [],
	/** @type {精选歌词 | "失败" | null} */ 精选歌词缓存 = null,
	正在处理点击 = false,
	/** main() 会随动态加载换页被 main.js 反复调用，延迟任务只在首次 main() 注册一次 */
	已注册排行加载 = false;

/** 全/半角标点与符号，用于无副歌数据时挑选“干净”的歌词行 */
const 标点符号正则 = /[\p{P}\p{S}]/u;

/** 已完成加载的 1024px 大封面地址缓存：换页重渲染时可直接显示大图，避免先糊后清；也是封面平移动画的启用依据 */
const 大封面已加载 = new Set();

/** 排行项不在视口内（含被排行容器滚动裁剪）时暂停其封面平移动画，回到视口恢复（懒创建，换页后逐项重新观察） */
let /** @type {IntersectionObserver | null} */ 排行可见性观察器 = null;

/** 将毫秒时间戳转为东八区日期文本（YYYY-MM-DD）；数据时间戳均为东八区整点，直接偏移计算，避免受访客本地时区影响 */
function 毫秒转东八区日期(/** @type {number} */ 毫秒) {
	return new Date(毫秒 + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** 将排行项映射为播放列表使用的歌单结构（排行数据无 mv 字段，统一置哨兵值 -0x66ccff，ncm.js 播放时会经歌曲详情接口补取真实 mv id） */
function 排行项转歌单(/** @type {排行歌曲项} */ 项) {
	const 歌手 = 项.artists.map(歌手信息 => 歌手信息.artistName).join(" / ");
	return {
		完整歌名: 歌手 ? 歌手 + " - " + 项.songName : 项.songName,
		歌名: 项.songName,
		歌手,
		专辑: 项.albumName || "",
		封面: 项.picUrl ? 项.picUrl.replace("http://", "https://") : "",
		id: 项.songId,
		mv: -0x66ccff,
	};
}

/**
 * 选取用于展示的歌词行：优先取副歌（first_chorus_raw）起始起的连续 5 句；
 * 副歌数据无效时兜底取从头开始第一组连续 5 句不含全/半角标点的歌词
 * @returns {string[] | null} 选出的歌词行，无歌词时返回 null
 */
function 选取歌词行() {
	const 歌词文本 = 排行原始数据?.first_lyric_raw?.lrc?.lyric;
	if (typeof 歌词文本 !== "string" || !歌词文本.includes("[")) return null;
	let 脚本;
	try {
		// 结尾追加哨兵行，保证最后一句歌词有结束时间（与 ncm.js 的用法一致）
		脚本 = lrcParser(歌词文本 + "[999:59.99]\n").scripts;
	} catch (e) {
		console.warn(e);
		return null;
	}

	// 有副歌字段-选取副歌部分前5句
	const 副歌起始毫秒 = 排行原始数据?.first_chorus_raw?.chorus?.[0]?.startTime;
	if (排行原始数据?.first_chorus_raw?.code === 200 && typeof 副歌起始毫秒 === "number") {
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
function 渲染精选歌词(/** @type {HTMLElement} */ 容器, /** @type {精选歌词} */ 歌词) {
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
		const 行 = 选取歌词行();
		if (!行) throw new Error("无可展示的歌词");
		精选歌词缓存 = {
			行,
			歌手: 排行歌曲[0].artists.map(歌手信息 => 歌手信息.artistName).join(" / "),
			歌名: 排行歌曲[0].songName,
		};
		渲染精选歌词(容器, 精选歌词缓存);
	} catch (e) {
		console.warn(e);
		精选歌词缓存 = "失败";
		容器.remove();
	}
}

/**
 * 点击排行项：将整个排行榜（与现有歌单去重后）批量加入播放列表，并立即播放被点击的歌曲。
 * 整榜已在播放列表时（重复点击）仅切换播放被点击的歌曲
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
		const 待添加 = 排行歌曲
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

function 渲染最近在听() {
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
	// 统计范围精确到日，写入 CSS 变量交给 .播放排行::before 文案展示（值含引号，content 可直接引用）
	const 起始毫秒 = 排行原始数据?.rank_raw?.data?.startTime;
	const 结束毫秒 = 排行原始数据?.rank_raw?.data?.endTime;
	if (typeof 起始毫秒 === "number" && typeof 结束毫秒 === "number")
		排行容器.style.setProperty(
			"--date-range",
			`"—— ${毫秒转东八区日期(起始毫秒)} ~ ${毫秒转东八区日期(结束毫秒)} | 双击以播放 ——"`
		);
	排行容器.textContent = "";
	// 用文档片段收集后一次性插入，避免逐项写入已连接容器引发多次样式失效
	const 排行片段 = document.createDocumentFragment();
	// 第 1 名恒为 100%，靠后按播放次数等比递减
	const 最大播放次数 = Math.max(...排行歌曲.map(项 => 项.playCount || 0), 1);
	for (const 项 of 排行歌曲) {
		const 项元素 = ce("div");
		项元素.style.setProperty("--progress", ((项.playCount || 0) / 最大播放次数) * 100 + "%");
		项元素.tabIndex = 0;
		项元素.dataset.songId = "" + 项.songId;
		const 歌手 = 项.artists.map(歌手信息 => 歌手信息.artistName).join(" / ");
		项元素.title = 歌手 ? `${歌手} - ${项.songName}` : 项.songName;
		if (项.picUrl) {
			const 封面 = ce("img");
			封面.className = "封面";
			const 封面地址 = 项.picUrl.replace("http://", "https://");
			// 封面铺满整行，16px 小图放大严重模糊：小图立即占位（居中静止），大图并行请求，加载完成后换入并启用平移动画
			封面.src = 封面地址 + "?param=16y16";
			封面.alt = "";
			封面.loading = "lazy";
			封面.decoding = "async";
			const 大图地址 = 封面地址 + "?param=1024y1024";
			if (大封面已加载.has(大图地址)) {
				封面.src = 大图地址;
				封面.classList.add("大图就绪");
			} else {
				const 大图 = new Image();
				大图.decoding = "async";
				大图.onload = () => {
					大封面已加载.add(大图地址);
					// 换页会重建列表，此时元素可能已脱离文档
					if (封面.isConnected) {
						封面.src = 大图地址;
						封面.classList.add("大图就绪");
					}
				};
				大图.src = 大图地址;
			}
			项元素.append(封面);
		}
		const 歌曲信息 = ce("div");
		歌曲信息.className = "歌曲信息";
		歌曲信息.append(项.songName);
		if (歌手) {
			const 歌手元素 = ce("span");
			歌手元素.className = "淡化";
			歌手元素.textContent = 歌手;
			歌曲信息.append(" ", 歌手元素);
		}
		const 播放次数 = ce("div");
		播放次数.className = "播放次数";
		播放次数.textContent = "" + (项.playCount ?? 0);
		项元素.append(歌曲信息, 播放次数);
		排行片段.append(项元素);
	}
	排行容器.append(排行片段);
	// 换页会重建正文：先解除旧项的观察，再逐项观察；不在视口内的项加类暂停其封面动画
	if (!排行可见性观察器)
		排行可见性观察器 = new IntersectionObserver(条目列表 => {
			for (const 条目 of 条目列表)
				条目.target.classList.toggle("不可见", !条目.isIntersecting);
		});
	排行可见性观察器.disconnect();
	排行可见性观察器.observe(排行容器);
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
	填充精选歌词();
}

async function 获取并渲染最近在听() {
	if (排行已请求) return 渲染最近在听();
	排行已请求 = true;
	try {
		const j = /** @type {最近聆听排行数据} */ (
			await (await fetch("/json/ncm-listen-rank.json")).json()
		);
		const 原始项 = j?.rank_raw?.data?.songItems;
		if (j?.rank_raw?.code !== 200 || !Array.isArray(原始项))
			throw new Error("最近在听排行数据非法");
		const 有效项 = 原始项.filter(
			项 =>
				项 &&
				typeof 项.songId === "number" &&
				typeof 项.songName === "string" &&
				Array.isArray(项.artists)
		);
		if (!有效项.length) throw new Error("最近在听排行为空");
		排行原始数据 = j;
		排行歌曲 = 有效项;
		排行有效 = true;
	} catch (e) {
		console.error(e);
	}
	渲染最近在听();
}

export function main() {
	显示或隐藏进度条(false);
	if (!location.hash && 已触发动态加载)
		qs("main .右")?.scrollIntoView({
			behavior: "smooth",
		});

	if (!已注册排行加载) {
		已注册排行加载 = true;
		延迟执行("关键任务完成", 获取并渲染最近在听, 3);
	}
	// 动态加载换页会重建正文，每次进入首页都需用缓存重新渲染
	渲染最近在听();
}
