/**
 * @fileoverview 适用于所有页面的全局脚本，包含一些通用的函数和变量，还负责域名迁移、SW管理等任务
 * @author dsy4567
 * @license
 * Copyright (c) 2026 dsy4567
 * SPDX-License-Identifier: MIT
 */

// @ts-check
"use strict";

// for debug
// console.time = () => {};
// console.timeEnd = () => {};

//#region 全局工具函数
let /** @type {Record<string, HTMLElement | null>} */ gd缓存 = {},
	/** @type {Record<string, HTMLElement | null>} */ qs缓存 = {},
	/** @type {Map<string, Promise<Event>>} */ 已添加的脚本 = new Map(),
	/** @type {Map<string, Promise<Event | {}>>} */ 已添加的样式 = new Map();

/**
 * document.getElementById 的快捷方式，支持缓存
 * @param {string} s
 * @param {boolean} 缓存
 * @returns {HTMLElement | null}
 */
function gd(s, 缓存 = false) {
	if (缓存) {
		let r = gd缓存[s];
		return r || (gd缓存[s] = document.getElementById(s));
	}
	return document.getElementById(s);
}
/**
 * document.querySelector 的快捷方式，支持缓存
 * @param {string} s
 * @param {boolean} 缓存
 * @returns {HTMLElement | null}
 */
function qs(s, 缓存 = false) {
	if (缓存) {
		let r = qs缓存[s];
		return r || (qs缓存[s] = document.querySelector(s));
	}
	return document.querySelector(s);
}
/**
 * document.querySelectorAll 的快捷方式
 * @type {typeof document.querySelectorAll}
 */
const qsa = (/** @type {keyof HTMLElementTagNameMap} */ s) => {
	return document.querySelectorAll(s);
};
/**
 * document.getElementsByTagName 的快捷方式
 * @type {typeof document.getElementsByTagName}
 */
const ge = (/** @type {keyof HTMLElementTagNameMap} */ s) => {
	return document.getElementsByTagName(s);
};
/**
 * document.createElement 的快捷方式
 * @type {typeof document.createElement}
 */
const ce = (/** @type {keyof HTMLElementTagNameMap} */ s) => {
	return document.createElement(s);
};
/**
 * 显示或隐藏页面顶部的进度条
 * @param {boolean} 状态 - true 显示，false 隐藏
 */
function 显示或隐藏进度条(状态) {
	状态
		? qs(".进度条外面", true)?.classList.add("显示")
		: qs(".进度条外面", true)?.classList.remove("显示");
}
/**
 * 动态添加一个外部样式表，若样式表已添加或正在加载则不会重复添加，而是等待其完成或失败
 * 加载失败的 Promise 同样会被缓存，之后对同一 url 的调用会得到同一个失败的 Promise 而不会重新加载，由调用方自行处理失败
 * @param {string} url - 样式表 URL
 * @param {"anonymous" | "use-credentials" | null} [crossOrigin="use-credentials"] - 跨域属性
 * @returns {Promise<Event | {}>} 在样式表加载完成时 resolve，失败时 reject
 */
function 添加样式(url, crossOrigin = "use-credentials", 使用缓存 = true) {
	console.time("添加样式 " + url);
	let 已缓存 = 已添加的样式.get(url);
	if (使用缓存 && 已缓存) return 已缓存;
	/** @type {Promise<Event | {}>} */
	let 加载 = new Promise((resolve, reject) => {
		// 用 href*= 子串匹配判断样式表是否已在文档中，调用方需自行保证按一定规范传入 url
		// （如传入完整路径），使其能唯一匹配目标样式表而不误伤其他链接
		if (qs("link[href*='" + url + "'][rel='stylesheet']")) return resolve({});
		let l = ce("link");
		l.onload = 事件 => resolve(事件);
		l.onerror = 事件 => {
			l.remove();
			reject(事件);
		};
		l.href = url;
		l.rel = "stylesheet";
		l.crossOrigin = crossOrigin;
		document.head.append(l);
	});
	已添加的样式.set(url, 加载);
	console.timeEnd("添加样式 " + url);
	return 加载;
}
/**
 * 动态添加一个外部脚本，若脚本已加载或正在加载则不会重复添加，而是等待其完成或失败
 * 加载失败的 Promise 同样会被缓存，之后对同一 url 的调用会得到同一个失败的 Promise 而不会重新加载，由调用方自行处理失败
 * @param {string} url - 脚本 URL
 * @param {"anonymous" | "use-credentials" | null} [crossOrigin="use-credentials"] - 跨域属性
 * @returns {Promise<Event>} 在脚本加载完成时 resolve，失败时 reject
 */
function 添加脚本(url, crossOrigin = "use-credentials", 使用缓存 = true) {
	console.time("添加脚本 " + url);
	let 已缓存 = 已添加的脚本.get(url);
	if (使用缓存 && 已缓存) return 已缓存;
	/** @type {Promise<Event>} */
	let 加载 = new Promise((resolve, reject) => {
		let s = ce("script");
		s.onload = 事件 => resolve(事件);
		s.onerror = 事件 => {
			s.remove();
			reject(事件);
		};
		s.src = url;
		s.crossOrigin = crossOrigin;
		document.head.append(s);
	});
	已添加的脚本.set(url, 加载);
	console.timeEnd("添加脚本 " + url);
	return 加载;
}

/** scheduler.yield 的 polyfill 实现 */
async function schedulerYield() {
	// @ts-ignore
	if (window.scheduler?.yield) return window.scheduler.yield();
	return new Promise(resolve => {
		setTimeout(resolve, 0);
	});
}

let /** @type {延迟执行状态类型} */ 延迟执行状态 = {
		DOMContentLoaded: {
			回调: new Map(),
			已触发: false,
			低优池: new Map(),
			池定时器: null,
			池执行中: false,
			上次高优时间: Number.NEGATIVE_INFINITY,
		},
		关键任务完成: {
			回调: new Map(),
			已触发: false,
			低优池: new Map(),
			池定时器: null,
			池执行中: false,
			上次高优时间: Number.NEGATIVE_INFINITY,
		},
	};

/** 安静窗口时长（毫秒）：低优任务需在距离上次高优任务超过该时长后才执行 */
const 安静窗口 = 16;

/**
 * 批量处理元素，避免长时间阻塞主线程。
 * @template T
 * @param {ArrayLike<T>} 待处理元素 - 需要被处理的元素数组或类数组对象
 * @param {(元素: T, 索引: number) => any} 回调 - 对每个元素执行的操作
 * @param {Object} [选项] - 可选配置
 * @param {number} [选项.时间片=8] - 每次让出主线程前允许占用的最大毫秒数
 * @returns {Promise<void>}
 */
async function 批量低阻塞操作(待处理元素, 回调, { 时间片 = 8 } = {}) {
	const 总数 = 待处理元素.length;
	let 索引 = 0;

	while (索引 < 总数) {
		const 截止时间 = performance.now() + 时间片;
		// 至少处理一个元素，避免时间片为 0 时死循环
		do {
			await 回调(待处理元素[索引], 索引);
			索引++;
		} while (索引 < 总数 && performance.now() < 截止时间);
		// 时间片耗尽且仍有剩余，让出主线程后继续
		if (索引 < 总数) await schedulerYield();
	}
}

/**
 * 启动低优池检查定时器（幂等：已有定时器或无任务时不重复启动）
 * @param {"DOMContentLoaded" | "关键任务完成"} 事件名
 */
function 启动低优池定时器(事件名) {
	const 状态 = 延迟执行状态[事件名];
	if (状态.池定时器 === null && 状态.低优池.size > 0)
		状态.池定时器 = setTimeout(() => 检查低优池(事件名), 安静窗口);
}

/**
 * 触发一个事件：高优（优先级 <= 0）回调按优先级升序尽快执行（同优先级并行），
 * 低优（优先级 > 0）回调统一转入低优池等待安静窗口。
 * @param {"DOMContentLoaded" | "关键任务完成"} 事件名
 */
async function 触发事件(事件名) {
	const 状态 = 延迟执行状态[事件名];
	if (!状态 || 状态.已触发) return;
	状态.已触发 = true;

	// 分离高低优：高优进入本次执行批次，低优转入低优池等待安静窗口
	const /** @type {Map<number, (() => void)[]>} */ 高优快照 = new Map();
	for (const [优先级, 回调列表] of 状态.回调)
		if (优先级 <= 0) 高优快照.set(优先级, 回调列表);
		else {
			if (!状态.低优池.has(优先级)) 状态.低优池.set(优先级, []);
			状态.低优池.get(优先级)?.push(...回调列表);
		}

	状态.回调.clear();

	// 高优批次：按优先级数值升序处理，同优先级并行
	const 优先级列表 = [...高优快照.keys()].sort((a, b) => a - b);
	if (优先级列表.length > 0)
		await 批量低阻塞操作(优先级列表, async 优先级 => {
			const 回调列表 = 高优快照.get(优先级) || [];
			await Promise.all(
				回调列表.map(async 回调 => {
					try {
						await Promise.resolve().then(() => 回调());
					} catch (e) {
						console.error(`[${事件名}] 优先级 ${优先级} 回调执行失败:`, e);
					}
				})
			);
		});

	// 触发前积压的低优任务（以及执行期间新注册的低优任务）统一等待安静窗口
	if (状态.低优池.size > 0) 启动低优池定时器(事件名);

	// 事件链：DOMContentLoaded 的高优任务全部完成后，触发下一阶段
	if (事件名 === "DOMContentLoaded") await 触发事件("关键任务完成");
}

/**
 * 检查低优池：若距离上次高优任务注册已超过安静窗口，则按优先级升序执行池中所有回调
 * （同优先级并行）；否则再等一个窗口。执行完毕后若池中有新任务，自动开启下一轮。
 * @param {"DOMContentLoaded" | "关键任务完成"} 事件名
 */
async function 检查低优池(事件名) {
	const 状态 = 延迟执行状态[事件名];
	状态.池定时器 = null;

	if (performance.now() - 状态.上次高优时间 < 安静窗口 || 状态.池执行中) {
		// 尚未安静满一个窗口，或上一批低优任务仍在执行，再等一个窗口
		状态.池定时器 = setTimeout(() => 检查低优池(事件名), 安静窗口);
		return;
	}

	// 快照当前池并清空，防止执行期间新增回调干扰（新增回调会重新入池并启动新定时器）
	const 队列快照 = new Map(状态.低优池);
	状态.低优池.clear();
	if (队列快照.size === 0) return;

	状态.池执行中 = true;
	try {
		const 优先级列表 = [...队列快照.keys()].sort((a, b) => a - b);
		await 批量低阻塞操作(优先级列表, async 优先级 => {
			const 回调列表 = 队列快照.get(优先级) || [];
			await Promise.all(
				回调列表.map(async 回调 => {
					try {
						await 回调();
					} catch (e) {
						console.error(`[${事件名}] 低优池优先级 ${优先级} 回调执行失败:`, e);
					}
				})
			);
		});
	} finally {
		状态.池执行中 = false;
		// 执行期间有新任务入池则开启下一轮（此刻定时器必为 null，不会重复启动）
		if (状态.低优池.size > 0) 启动低优池定时器(事件名);
	}
}

/**
 * 延迟执行一个函数，优先级语义统一：
 * - 优先级 <= 0（高优）：尽快执行——事件未触发则排队等触发，已触发则立即执行并刷新安静窗口
 * - 优先级 > 0（低优）：进入低优池等待安静窗口（入池即返回，不等待执行完成）
 * @param {"DOMContentLoaded" | "关键任务完成"} 事件名
 * @param {() => any} 回调
 * @param {number} [优先级=0] - 数值越小越先执行；<= 0 视为高优
 */
async function 延迟执行(事件名, 回调, 优先级 = 0) {
	const 状态 = 延迟执行状态[事件名];
	if (!状态) throw new Error(`未知事件: ${事件名}`);

	if (优先级 <= 0) {
		if (!状态.已触发) {
			// 高优排队：事件触发时按优先级升序执行
			if (!状态.回调.has(优先级)) 状态.回调.set(优先级, []);
			状态.回调.get(优先级)?.push(回调);
			return;
		}
		// 高优立即执行，并刷新安静窗口计时起点
		状态.上次高优时间 = performance.now();
		try {
			await 回调();
			await schedulerYield();
		} catch (e) {
			console.error(`[${事件名}] 高优回调执行失败:`, e);
		}
	} else {
		// 低优入池等待安静窗口（触发前后语义一致）
		if (!状态.低优池.has(优先级)) 状态.低优池.set(优先级, []);
		状态.低优池.get(优先级)?.push(回调);
		启动低优池定时器(事件名);
	}
}
/**
 * 显示一个临时的通知消息，3 秒后自动隐藏
 * @param {string} m - 要显示的 HTML 内容
 */
function 提示(m) {
	let 元素 = ce("div");
	元素.innerHTML = m;
	元素.classList.add("通知");
	元素.ariaLive = "assertive";
	元素.role = "alert";
	document.body.append(元素);
	setTimeout(function () {
		元素.style.animationName = "隐藏";
		setTimeout(function () {
			元素.remove();
		}, 500);
	}, 3000);
}
/**
 * 设置 meta robots 为 noindex，阻止搜索引擎收录当前页面
 */
function 阻止搜索引擎收录() {
	gd("robots", true)?.setAttribute("content", "noindex");
}
let /** @type {Record<string, string>} */ 清理后的路径缓存 = {},
	re1 = /\/index(\.html)?$/, // "/index.html" -> "/"
	re2 = /\.html$/, // "/blog.html" -> "/blog"
	re3 = /\/{2,}/g; // "//" -> "/"
/**
 * 清理路径：去除结尾的 "index" / "index.html" / ".html"，并将连续斜杠压缩为单个
 * 只匹配结尾，避免误伤路径正文中含 "index" 或 ".html" 的部分
 * @param {string} 路径 - 待清理的路径（如 URL 的 pathname）
 * @returns {string} 清理后的路径
 */
function 清理路径(路径) {
	return 路径.replace(re1, "/").replace(re2, "").replace(re3, "/");
}
/**
 * 获取清理后的路径：基于 location.pathname 的清理结果
 * @param {boolean} [包含search=false] - 是否在结果末尾附加 location.search
 * @returns {string} 包含search 为 true 时返回完整清理路径加查询字符串；为 false 时只返回一级路径（如 "/blog/xxx/" → "/blog"），用于匹配加载清单
 */
function 获取清理后的路径(包含search = false) {
	// 缓存只存依赖 pathname 的清理结果；search 每次现读，避免同路径不同查询参数时读到过期缓存
	const pn = location.pathname;
	let 已清理路径 = (清理后的路径缓存[pn] ??= 清理路径(pn));
	return 包含search ? 已清理路径 + location.search : "/" + 已清理路径.split("/")[1];
}
/**
 * 生成一个包含 0 的随机自然数，范围为 [0, 最大]
 * @param {number} 最大 - 上限（包含）
 * @returns {number} 随机整数
 * @throws {RangeError} 当最大为负数或非整数时抛出异常
 */
function 随机含零自然数(最大) {
	if (!Number.isInteger(最大) || 最大 < 0) throw new RangeError("最大必须是非负整数");
	return Math.floor(Math.random() * (最大 + 1));
}
/**
 * 使用 Fisher-Yates 算法原地洗牌
 * @template T
 * @param {T[]} 数组 - 待洗牌的数组（会被原地修改）
 * @returns {T[]} 洗牌后的数组（与传入数组为同一引用）
 */
function 洗牌(数组) {
	for (let i = 数组.length - 1; i > 0; i--) {
		let j = 随机含零自然数(i);
		[数组[i], 数组[j]] = [数组[j], 数组[i]];
	}
	return 数组;
}
/**
 * 将 RGB 颜色转换为 HSL 颜色
 * @param {number} 红 - 红色分量，范围 0-255
 * @param {number} 绿 - 绿色分量，范围 0-255
 * @param {number} 蓝 - 蓝色分量，范围 0-255
 * @returns {[number, number, number]} [色相(0-1), 饱和度(0-1), 亮度(0-1)]
 */
function rgb转hsl(红, 绿, 蓝) {
	红 /= 255;
	绿 /= 255;
	蓝 /= 255;

	const 最大 = Math.max(红, 绿, 蓝);
	const 最小 = Math.min(红, 绿, 蓝);
	const 亮度 = (最大 + 最小) / 2;
	const 差值 = 最大 - 最小;

	// 非彩色：灰、白、黑
	if (差值 === 0) return [0, 0, 亮度];

	const 饱和度 = 亮度 > 0.5 ? 差值 / (2 - 最大 - 最小) : 差值 / (最大 + 最小);

	let 色相;
	if (最大 === 红) 色相 = (绿 - 蓝) / 差值 + (绿 < 蓝 ? 6 : 0);
	else if (最大 === 绿) 色相 = (蓝 - 红) / 差值 + 2;
	else 色相 = (红 - 绿) / 差值 + 4;

	色相 /= 6;

	return [色相, 饱和度, 亮度];
}
/**
 * 将十六进制颜色拆为 RGB 分量
 * @param {string} hex - 形如 "#66ccff" 的颜色
 * @returns {[number, number, number]} [红, 绿, 蓝]，范围 0-255
 */
function hex转rgb(hex) {
	return [
		parseInt(hex.slice(1, 3), 16),
		parseInt(hex.slice(3, 5), 16),
		parseInt(hex.slice(5, 7), 16),
	];
}
/**
 * 将 HSL 颜色转换为十六进制颜色
 * @param {number} 色相 - 0-1
 * @param {number} 饱和度 - 0-1
 * @param {number} 亮度 - 0-1
 * @returns {string} 形如 "#66ccff" 的颜色
 */
function hsl转hex(色相, 饱和度, 亮度) {
	const 分量 = (/** @type {number} */ n) => {
		const k = (n + 色相 * 12) % 12;
		const a = 饱和度 * Math.min(亮度, 1 - 亮度);
		return Math.round((亮度 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255)
			.toString(16)
			.padStart(2, "0");
	};
	return "#" + 分量(0) + 分量(8) + 分量(4);
}
/**
 * 将 hex 颜色转换为 WCAG 相对亮度（0~1）
 * @param {string} hex - 形如 "#66ccff"
 * @returns {number} 相对亮度
 */
function 相对亮度(hex) {
	const [r, g, b] = hex转rgb(hex).map(v => {
		v /= 255;
		return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * 计算两个颜色之间的 WCAG 对比度（1~21）
 * @param {string} 颜色1
 * @param {string} 颜色2
 * @returns {number} 对比度
 */
function 对比度(颜色1, 颜色2) {
	const L1 = 相对亮度(颜色1);
	const L2 = 相对亮度(颜色2);
	const 亮 = Math.max(L1, L2);
	const 暗 = Math.min(L1, L2);
	return (亮 + 0.05) / (暗 + 0.05);
}

/**
 * 保持色相和饱和度不变，调整亮度使前景色与背景色达到目标对比度。
 * 若原始颜色已满足对比度，则原样返回；否则沿正确方向微调，直至刚好达标。
 * @param {string} 前景hex - 原始强调色
 * @param {string} 背景hex - 背景色
 * @param {number} 目标对比度 - 默认 4.5（WCAG AA 文字）
 * @returns {string} 调整后的 hex
 */
function 调整亮度以满足对比度(前景hex, 背景hex, 目标对比度 = 4.5) {
	const [h, s, l原始] = rgb转hsl(...hex转rgb(前景hex));

	// 当前对比度
	const 当前对比度 = 对比度(前景hex, 背景hex);
	if (当前对比度 >= 目标对比度) return 前景hex;

	// 背景亮度决定调整方向：亮背景需变暗，暗背景需变亮
	const 背景相对亮度 = 相对亮度(背景hex);
	const 需要变暗 = 背景相对亮度 > 0.5; // 浅色背景

	// 二分查找临界亮度（在保证对比度达标的前提下，最小化与原亮度的差异）
	let 低 = 需要变暗 ? 0 : l原始;
	let 高 = 需要变暗 ? l原始 : 1;

	for (let i = 0; i < 20; i++) {
		const 中 = (低 + 高) / 2;
		const 候选hex = hsl转hex(h, s, 中);
		const 候选对比度 = 对比度(候选hex, 背景hex);
		if (候选对比度 >= 目标对比度)
			if (需要变暗)
				低 = 中; // 达标，尝试更接近原始亮度
			else 高 = 中;
		else if (需要变暗)
			高 = 中; // 未达标，需要更极端的亮度
		else 低 = 中;
	}

	// 取满足条件且最接近原始亮度的值（取高侧或低侧边界）
	const 最终亮度 = 需要变暗 ? 低 : 高;
	return hsl转hex(h, s, 最终亮度);
}
/**
 * 添加一个悬浮卡片到页面
 * @param {string} html - 要显示的 HTML 内容
 * @param {number} [x=0] - 水平位置（像素）
 * @param {number} [y=0] - 垂直位置（像素）
 * @param {boolean} [失去焦点时隐藏=true] - 是否失去焦点时隐藏卡片
 * @returns {HTMLDivElement} 卡片元素
 */
function 添加悬浮卡片(/** @type {string} */ html, x = 0, y = 0, 失去焦点时隐藏 = true) {
	let div = ce("div");
	div.className = "悬浮卡片";
	div.innerHTML = html;
	div.style.left = x + "px";
	div.style.top = y + "px";
	div.tabIndex = 0;
	div.role = "dialog";
	document.body.append(div);
	div.focus();
	失去焦点时隐藏 && div.addEventListener("focusout", () => div.remove());
	return div;
} /**
 * 在页面底部添加一个横幅通知，10 秒后自动隐藏
 * @param {string} html - 横幅内容的 HTML
 * @returns {HTMLDivElement} 创建的横幅元素
 */
function 添加横幅(/** @type {string} */ html) {
	let div = ce("div");
	div.className = "横幅";
	div.innerHTML = `<span>${html}</span>`;
	div.role = "alert";
	document.body.append(div);
	setTimeout(() => {
		div.style.animationName = "隐藏";
		setTimeout(() => {
			div.remove();
		}, 500);
	}, 10000);
	return div;
}
//#endregion

//#region 前期准备
//#region 主题（两级模型：背景模式 + 强调色）
/** 默认强调色（天依蓝） */
const 默认强调色 = "#66ccff";

/**
 * 读取背景模式设置
 * @returns {"自动" | "浅色" | "深色"}
 */
function 读取背景模式() {
	const 模式 = localStorage.getItem("主题背景");
	return 模式 === "浅色" || 模式 === "深色" ? 模式 : "自动";
}
/**
 * 读取强调色设置
 * @returns {string} 强调色的 hex 值，如 "#66ccff"
 */
function 读取强调色() {
	return localStorage.getItem("强调色") || 默认强调色;
}
/**
 * 判断当前生效的背景是否为深色（自动模式跟随系统偏好）
 * @returns {boolean}
 */
function 当前是否深色() {
	const 模式 = 读取背景模式();
	if (模式 === "深色") return true;
	if (模式 === "浅色") return false;
	return matchMedia("(prefers-color-scheme: dark)").matches;
}
/**
 * 按背景深浅对强调色做方向调整（浅色背景上加深、深色背景上提亮），
 * 连同衍生色一起写入 CSS 变量
 * @param {string} hex - 强调色原色，如 "#66ccff"
 */
function 写入强调色变量(hex, 深 = 当前是否深色()) {
	const 背景hex = 深 ? "#18171c" : "#eeeeee";

	// 主色用作链接/图标等前景文字
	const 主色 = 调整亮度以满足对比度(hex, 背景hex, 4.5);

	const 根 = document.documentElement.style;
	根.setProperty("--accent-color", 主色);
	// 原色低透明度，用作高亮底色（保持原色不变，因为透明度会降低对比度要求）
	根.setProperty("--accent-color-transparent", hex + "2e");
	// 强调色块上的文字色：深色模式的主色偏亮、浅色模式的主色偏暗，故方向相反
	根.setProperty("--accent-text-color", 深 ? "#222" : "#eee");
	根.setProperty("--link-color", 主色);
}
/**
 * 依据 localStorage 重算背景类、meta 主题色和强调色变量
 */
function 刷新主题() {
	console.time("刷新主题");
	const 深 = 当前是否深色();
	// 自动模式也解析为具体类，保证 hljs 等只认类的地方能跟随
	document.documentElement.classList.toggle("深色", 深);
	document.documentElement.classList.toggle("浅色", !深);
	gd("主题色", true)?.setAttribute("content", 深 ? "#18171c" : "#eeeeee");
	写入强调色变量(读取强调色(), 深);
	console.timeEnd("刷新主题");
}
/**
 * 切换背景模式并持久化
 * @param {"自动" | "浅色" | "深色"} 模式
 */
function 应用背景模式(模式) {
	localStorage.setItem("主题背景", 模式);
	刷新主题();
}
/**
 * 设置强调色并持久化
 * @param {string} hex - 强调色，如 "#66ccff"
 */
function 应用强调色(hex) {
	localStorage.setItem("强调色", hex);
	写入强调色变量(hex);
}

// 自动模式下跟随系统深浅色变化
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", 刷新主题);
// 跨标签页同步主题设置
addEventListener("storage", 刷新主题);
// 尽早应用主题，避免加载闪烁（global.js 位于 head，先于样式表和正文执行）
刷新主题();
//#endregion

let URL发生变化事件 = new CustomEvent("URL发生变化");

// 方便暴露到全局变量
let _global = {};

let DOMContentLoaded = false,
	loaded = false,
	已触发动态加载 = false;
addEventListener("load", () => {
	loaded = true;
});
document.addEventListener("DOMContentLoaded", () => {
	DOMContentLoaded = true;
	触发事件("DOMContentLoaded");
});
//#endregion
