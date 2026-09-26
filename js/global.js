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
console.time = () => {};
console.timeEnd = () => {};

//#region 全局工具函数
let /** @type {Record<string, HTMLElement | null>} */ gd缓存 = {},
	/** @type {Record<string, HTMLElement | null>} */ qs缓存 = {},
	/** @type {Map<string, Promise<Event>>} */ 已添加的脚本 = new Map(),
	/** @type {Map<string, Promise<Event | {}>>} */ 已添加的样式 = new Map(),
	/** @type {number} */ 通用计数器 = 0;

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
 * 传入 selector，使元素滚动到可见区域
 * @param {string} s - 选择器
 * @param {boolean} 缓存 - 是否使用缓存，默认 false
 * @param {ScrollIntoViewOptions} 选项 - 其他滚动到可见区域的选项，参考 ScrollIntoViewOptions 选项
 * @returns {void}
 */
function 滚动到可见区域(s, 缓存 = false, 选项 = {}) {
	qs(s, 缓存)?.scrollIntoView({
		behavior: 用户已禁用动画特效 ? "instant" : "smooth",
		...选项,
	});
}
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
	console.log(`触发事件: ${事件名}`);
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
						const _通用计数器 = ++通用计数器;
						console.time(`高优回调 id:${_通用计数器}`);
						await Promise.resolve().then(() => 回调());
						console.log(_通用计数器, 回调, 优先级);
						console.timeEnd(`高优回调 id:${_通用计数器}`);
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
						const _通用计数器 = ++通用计数器;
						console.time(`低优池回调 id:${_通用计数器}`);
						await 回调();
						// console.log(_通用计数器, 回调, 优先级);
						console.timeEnd(`低优池回调 id:${_通用计数器}`);
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
 * 顶部大图容器：#顶部大图 下的每个 .顶部大图层 都是一条封面注册项，
 * 注册信息一律写在 data-* 属性上，构建产物可据此在首屏直接声明好封面与优先级
 */
const /** @type {HTMLElement | null} */ 顶部大图 = gd("顶部大图");
/** 顶部大图默认优先级：数值越小越优先，未声明 data-优先级 的层按此值处理 */
const 顶部大图默认优先级 = 9999;
/** 顶部大图生命周期：永久，不随导航失效，直到被同优先级顶掉或被 撤销顶部大图 撤销 */
const 顶部大图永久 = "永久";
/** 顶部大图生命周期：仅当前页，离开注册时所在的路径后由 清理过期顶部大图层 回收 */
const 顶部大图仅当前页 = "仅当前页";
/** 顶部大图优先级梯度：数值越小越优先，调用方与构建产物共用同一套取值 */
const 顶部大图优先级 = {
	/** 文章自带的封面 */
	文章封面: 100,
	/** 网易云音乐正在播放的歌曲封面 */
	网易云封面: 1000,
	/** 无封面文章随机挑出的默认封面 */
	文章随机封面: 1001,
	/** HTML 里写死的基线图，始终兜底 */
	基线: 顶部大图默认优先级,
};
/** 等待层淡出动画结束的兜底超时（毫秒），需大于 CSS 的 --transition-slow */
const 顶部大图层淡出超时 = 1200;

/**
 * 取得顶部大图的全部层（含正在淡出的层）
 * @returns {HTMLElement[]}
 */
function 取顶部大图层() {
	return 顶部大图
		? /** @type {HTMLElement[]} */ (Array.from(顶部大图.querySelectorAll(".顶部大图层")))
		: [];
}
/**
 * 读取一个层的注册信息，属性缺失时按默认值处理
 * @param {HTMLElement} 层
 * @returns {{ 优先级: number, 生命周期: string, 注册路径: string }} 注册信息
 */
function 读取顶部大图信息(层) {
	const 声明值 = 层.getAttribute("data-优先级"),
		声明优先级 = 声明值 === null ? Number.NaN : Number(声明值);
	return {
		优先级: Number.isFinite(声明优先级) ? 声明优先级 : 顶部大图默认优先级,
		生命周期:
			层.getAttribute("data-生命周期") === 顶部大图永久 ? 顶部大图永久 : 顶部大图仅当前页,
		注册路径: 层.getAttribute("data-注册路径") || "",
	};
}
/**
 * 选出应当显示的层：优先级数值最小者胜出，同优先级时 DOM 中靠前者胜出
 * （同优先级的重复注册由 写入顶部大图层 顶掉，此处的先后次序只用于异常情况下也有图可显示）；
 * 正在淡出的层不参与评选
 * @returns {HTMLElement | null} 胜出的层，没有可显示的层时为 null
 */
function 选出顶部大图赢家() {
	let 赢家 = null,
		赢家优先级 = Number.POSITIVE_INFINITY;
	for (const 层 of 取顶部大图层()) {
		if (层.classList.contains("淡出中")) continue;
		const 优先级 = 读取顶部大图信息(层).优先级;
		if (优先级 < 赢家优先级) {
			赢家优先级 = 优先级;
			赢家 = 层;
		}
	}
	return 赢家;
}
/**
 * 让最优层显示：仅赢家持有 .显示，其余层由 CSS 过渡淡出（多层叠放与渐变见 global-fp.css）
 * @returns {void}
 */
function 应用顶部大图赢家() {
	const 赢家 = 选出顶部大图赢家();
	for (const 层 of 取顶部大图层()) 层.classList.toggle("显示", 层 === 赢家);
}
/**
 * 移除一个层：显示中的层先淡出再移除，其余立即移除；移除后立刻结算赢家，让下层接管
 * @param {HTMLElement} 层
 * @returns {void}
 */
function 移除顶部大图层(层) {
	if (!层.isConnected) return;
	const 需要淡出 = 层.classList.contains("显示") && !用户已禁用动画特效;
	// 打上标记立刻退出赢家评选，下层随即淡入，与本次淡出形成交叉渐变
	层.classList.add("淡出中");
	层.classList.remove("显示");
	应用顶部大图赢家();
	if (!需要淡出) {
		层.remove();
		return;
	}
	let 已移除 = false,
		/** @type {ReturnType<typeof setTimeout> | undefined} */ 超时定时器;
	const 清理 = () => {
		if (已移除) return;
		已移除 = true;
		clearTimeout(超时定时器);
		层.remove();
	};
	层.addEventListener("transitionend", 清理, { once: true });
	超时定时器 = setTimeout(清理, 顶部大图层淡出超时);
}
/**
 * 写入一个新层并接管显示：同优先级的旧层被顶掉
 * @param {HTMLImageElement} 图片 - 已预加载完成的图片
 * @param {number} 优先级
 * @param {string} 生命周期
 * @param {string} 注册路径
 * @returns {void}
 */
function 写入顶部大图层(图片, 优先级, 生命周期, 注册路径) {
	if (!顶部大图) return;
	const 层 = ce("div");
	层.className = "顶部大图层";
	层.setAttribute("data-优先级", String(优先级));
	层.setAttribute("data-生命周期", 生命周期);
	if (注册路径) 层.setAttribute("data-注册路径", 注册路径);
	层.append(图片);
	顶部大图.append(层);
	// 先撑出 opacity: 0 的初始样式，再加 .显示，新层才是淡入而非瞬现
	层.offsetHeight;
	应用顶部大图赢家();
	for (const 旧层 of 取顶部大图层())
		if (旧层 !== 层 && 读取顶部大图信息(旧层).优先级 === 优先级) 移除顶部大图层(旧层);
}
/**
 * 更新顶部大图：注册一张封面，由优先级决定显示哪一层
 * - 不同优先级：优先级数值最小者显示，其余层留在 DOM 中，待高优层失效后自动接管
 * - 同优先级：后注册者顶掉先注册者
 * 图片预加载失败时不会写入任何层，当前显示保持不变
 * @param {Object} 选项 - 选项
 * @param {string} [选项.url] - 封面图片 URL
 * @param {number} [选项.优先级=顶部大图默认优先级] - 优先级，数值越小越优先
 * @param {string} [选项.生命周期=顶部大图仅当前页] - 顶部大图永久 或 顶部大图仅当前页
 * @returns {void}
 */
function 更新顶部大图(
	{ url, 优先级 = 顶部大图默认优先级, 生命周期 = 顶部大图仅当前页 } = { url: "" }
) {
	if (!顶部大图 || !url) return;
	const 目标url = new URL(url, location.href).href,
		// 仅当前页 的层记下注册时的路径，导航离开后由 清理过期顶部大图层 回收
		注册路径 = 生命周期 === 顶部大图永久 ? "" : 获取清理后当前路径();

	// 已有同优先级、同一张图的层：无需重复注册，避免无谓的交叉渐变
	if (
		取顶部大图层().some(
			层 => 读取顶部大图信息(层).优先级 === 优先级 && 层.querySelector("img")?.src === 目标url
		)
	)
		return;

	const 预加载图片 = new Image();
	预加载图片.alt = "";
	预加载图片.onload = () => {
		// 竞态：预加载期间已经导航到别的路径，仅当前页 的封面不再有意义
		if (生命周期 === 顶部大图仅当前页 && 注册路径 !== 获取清理后当前路径()) return;
		写入顶部大图层(预加载图片, 优先级, 生命周期, 注册路径);
	};
	预加载图片.src = 目标url;
}
/**
 * 撤销顶部大图：移除指定优先级的全部层（显示中的先淡出），随后由更低优先级的层接管
 * @param {number} 优先级 - 要撤销的优先级
 * @returns {void}
 */
function 撤销顶部大图(优先级) {
	for (const 层 of 取顶部大图层()) if (读取顶部大图信息(层).优先级 === 优先级) 移除顶部大图层(层);
}
/**
 * 接管 HTML 里声明的层：补全缺省的注册信息、兜住首屏封面加载失败，并结算初始赢家
 * @returns {void}
 */
function 初始化顶部大图() {
	if (!顶部大图) return;
	const 当前路径 = 获取清理后当前路径();
	for (const 层 of 取顶部大图层()) {
		const 信息 = 读取顶部大图信息(层);
		// 构建产物里的 仅当前页 层不写 data-注册路径，此处按下直接访问时的路径补全
		if (信息.生命周期 === 顶部大图仅当前页 && !信息.注册路径)
			层.setAttribute("data-注册路径", 当前路径);

		const 图片 = /** @type {HTMLImageElement | null} */ (层.querySelector("img"));
		if (!图片?.getAttribute("src")) continue;
		// 首屏封面加载失败（含在脚本执行前就已失败）时回收该层，回落到优先级更低的层
		if (图片.complete && !图片.naturalWidth) {
			移除顶部大图层(层);
			continue;
		}
		图片.addEventListener("error", () => 移除顶部大图层(层), { once: true });
	}
	应用顶部大图赢家();
}
/**
 * 回收过期层：移除 仅当前页 且注册路径不是当前路径的层，永久 层不受影响
 * @returns {void}
 */
function 清理过期顶部大图层() {
	if (!顶部大图) return;
	const 当前路径 = 获取清理后当前路径();
	for (const 层 of 取顶部大图层()) {
		const 信息 = 读取顶部大图信息(层);
		if (信息.生命周期 === 顶部大图永久 || 信息.注册路径 === 当前路径) continue;
		移除顶部大图层(层);
	}
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
 * 获取清理后的一级路径：基于 location.pathname 的清理结果取第一级（如 "/blog/xxx/" → "/blog"），用于匹配加载清单
 * @returns {string} 一级路径，如 "/blog"
 */
function 获取清理后一级路径() {
	const pn = location.pathname;
	return "/" + (清理后的路径缓存[pn] ??= 清理路径(pn)).split("/")[1];
}
/**
 * 获取清理后的当前路径：基于 location.pathname 的清理结果，末尾附加 location.search
 * @returns {string} 清理后的完整路径加查询字符串
 */
function 获取清理后当前路径() {
	// 缓存只存依赖 pathname 的清理结果；search 每次现读，避免同路径不同查询参数时读到过期缓存
	const pn = location.pathname;
	return (清理后的路径缓存[pn] ??= 清理路径(pn)) + location.search;
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
/** 图标数据：图标名 → SVG 字符串，由 main.js 拉取 /json/icon.json 后赋值 @type {Record<string, string | undefined>} */
let 图标 = {};
/** (图标名 + class) → 已解析的 <template> 缓存，避免同一图标的 SVG 字符串被重复 HTML 解析 */
const 图标模板 = /** @type {Record<string, HTMLTemplateElement>} */ ({});
/** 匹配图标模板字符串中的尺寸类（小尺寸 / 特小尺寸），用于替换为元素自己的 class */
const 尺寸类正则 = /特?小尺寸/;
/** 在新增元素时调用，以确保图标正常显示、点击事件正常触发 @param {渲染图标选项} 选项 */
function 渲染图标(选项 = {}) {
	const 全部元素 = /** @type {ArrayLike<SVGSVGElement>} */ (
		选项.要渲染图标的元素?.[0] ? 选项.要渲染图标的元素 : qsa("svg[data-icon]")
	);
	批量低阻塞操作(全部元素, 元素 => {
		if (!元素.dataset.icon) return;
		// 批量处理是异步分批的，期间元素可能已被并发的其他“渲染图标”调用替换或移出文档，
		// 对游离元素克隆替换纯属浪费，直接跳过
		if (!元素.isConnected) return;
		const 名 = 元素.dataset.icon,
			c = 元素.getAttribute("class") || "",
			键 = 名 + "|" + c;
		let 模板 = 图标模板[键];
		if (!模板) {
			const h = c ? 图标[名]?.replace(尺寸类正则, c) : 图标[名];
			if (!h) return;
			模板 = ce("template");
			模板.innerHTML = h;
			图标模板[键] = 模板;
		}
		// cloneNode 走原生结构克隆，比 outerHTML 的“字符串 → HTML 解析 → 重建子树”快得多；
		// replaceWith 对游离节点是静默无操作，不会像 outerHTML 那样抛 DOMException
		元素.replaceWith(模板.content.cloneNode(true));
	});
}
//#endregion

// 自动模式下跟随系统深浅色变化
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", 刷新主题);
// 跨标签页同步主题设置
addEventListener("storage", 刷新主题);

/** 用户是否禁用了动画特效：跟随系统「减少动态效果」偏好（prefers-reduced-motion: reduce）实时更新 */
let 用户已禁用动画特效 = matchMedia("(prefers-reduced-motion: reduce)").matches;
matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", 事件 => {
	用户已禁用动画特效 = 事件.matches;
});

// 顶部大图：接管 HTML 里声明的层，并在导航（pushState 与 popstate 都会派发该事件）后回收过期层
初始化顶部大图();
addEventListener("URL发生变化", 清理过期顶部大图层);

let URL发生变化事件 = new CustomEvent("URL发生变化"),
	已触发动态加载 = false,
	/**
	 * 动态加载自增计数器：每次 动态加载（main.js 中换页）时自增。
	 * 仅用于异步任务判断自己所属的「代次」是否已过期——异步任务（如 fetch、图片 onload）
	 * 开始时拷贝当前值，回调里与最新值比较，不等则说明期间已切换页面，应放弃执行以免污染新页面。
	 * 注意它不是「是否会变化」的判据：同一次页面停留期间该值恒定不变。
	 */
	动态加载自增计数器 = 0;

// 方便暴露到全局变量
let _global = {};

DOMContentLoaded
	? 触发事件("DOMContentLoaded")
	: addEventListener("DOMContentLoaded", () => 触发事件("DOMContentLoaded"));

qsa("link[data-preload='style']").forEach(元素 => {
	if (!(元素 instanceof HTMLLinkElement)) return;
	const 加载样式 = () => (元素.rel = "stylesheet");

	const 支持预加载 = ce("link").relList.supports?.("preload");

	if (!支持预加载) return 加载样式();
	const 已加载 = Array.from(performance.getEntriesByName(元素.href)).some(
		entry => entry.entryType === "resource"
	);

	if (已加载) 加载样式();
	else 元素.addEventListener("load", 加载样式, { once: true });
});
