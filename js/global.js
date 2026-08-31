/**
 * @fileoverview 适用于所有页面的全局脚本，包含一些通用的函数和变量，还负责域名迁移、SW管理等任务
 * @author dsy4567
 * @license
 * Copyright (c) 2026 dsy4567
 * SPDX-License-Identifier: MIT
 */

// @ts-check
"use strict";

//#region 全局工具函数
let /** @type {Record<string, HTMLElement | null>} */ gd缓存 = {},
	/** @type {Record<string, HTMLElement | null>} */ qs缓存 = {},
	/** @type {Record<string, {已完成加载: boolean, 回调: ((事件?: any) => void)[], 失败回调: ((错误?: any) => void)[]}>} */ 已添加的脚本 =
		{};
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
 * 动态添加一个外部样式表
 * @param {string} url - 样式表 URL
 * @param {"anonymous" | "use-credentials" | null} [crossOrigin="use-credentials"] - 跨域属性
 * @returns {Promise<Event | {}>} 在样式表加载完成时 resolve
 */
function 添加样式(url, crossOrigin = "use-credentials") {
	return new Promise(resolve => {
		if (qs("link[href*='" + url + "'][rel='stylesheet']")) return resolve({});
		let l = ce("link");
		l.onload = 事件 => {
			resolve(事件);
		};
		l.href = url;
		l.rel = "stylesheet";
		l.crossOrigin = crossOrigin;
		document.head.append(l);
	});
}
/**
 * 动态添加一个外部脚本，若脚本已加载或正在加载则不会重复添加，而是等待其完成或失败
 * @param {string} url - 脚本 URL
 * @param {"anonymous" | "use-credentials" | null} [crossOrigin="use-credentials"] - 跨域属性
 * @returns {Promise<Event>} 在脚本加载完成时 resolve，失败时 reject
 */
async function 添加脚本(url, crossOrigin = "use-credentials") {
	return new Promise((resolve, reject) => {
		if (已添加的脚本[url]) return 已添加的脚本[url].回调.push(resolve);

		已添加的脚本[url] = {
			已完成加载: false,
			回调: [],
			失败回调: [],
		};

		let a = 已添加的脚本[url];

		// @ts-ignore
		a.回调._push = a.回调.push;
		a.回调.push = (..._) => {
			if (a.已完成加载)
				_.forEach(回调 => {
					try {
						回调();
					} catch (e) {
						console.error(e);
					}
				});
			// @ts-ignore
			else a.回调._push(..._);
			return a.回调.length;
		};
		a.回调.push(resolve);

		// @ts-ignore
		a.失败回调._push = a.失败回调.push;
		a.失败回调.push = (..._) => {
			if (a.已完成加载)
				_.forEach(失败回调 => {
					try {
						失败回调();
					} catch (e) {
						console.error(e);
					}
				});
			// @ts-ignore
			else a.失败回调._push(..._);
			return a.失败回调.length;
		};
		a.失败回调.push(reject);

		let s = ce("script");
		s.onload = 事件 => {
			a.已完成加载 = true;
			let 回调 = a.回调.pop();
			while (回调) {
				try {
					回调();
				} catch (e) {
					console.error(e);
				}
				回调 = a.回调.pop();
			}
		};
		s.onerror = 事件 => {
			let 失败回调 = a.失败回调.pop();
			while (失败回调) {
				try {
					失败回调();
				} catch (e) {
					console.error(e);
				}
				失败回调 = a.失败回调.pop();
			}
			s.remove();
			delete 已添加的脚本[url];
		};
		s.src = url;
		s.crossOrigin = crossOrigin;
		document.head.append(s);
	});
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
let /** @type {Record<string, string>} */ 清理后的路径缓存 = {};
/**
 * 清理路径：去除结尾的 "index" / "index.html" / ".html"，并将连续斜杠压缩为单个
 * 只匹配结尾，避免误伤路径正文中含 "index" 或 ".html" 的部分
 * @param {string} 路径 - 待清理的路径（如 URL 的 pathname）
 * @returns {string} 清理后的路径
 */
function 清理路径(路径) {
	return 路径
		.replace(/\/index(\.html)?$/, "/")
		.replace(/\.html$/, "")
		.replace(/\/{2,}/g, "/");
}
/**
 * 获取清理后的路径：基于 location.pathname 的清理结果
 * @param {boolean} [包含search=false] - 是否在结果末尾附加 location.search
 * @returns {string} 包含search 为 true 时返回完整清理路径加查询字符串；为 false 时只返回一级路径（如 "/blog/xxx/" → "/blog"），用于匹配加载清单
 */
function 获取清理后的路径(包含search = false) {
	// 缓存只存依赖 pathname 的清理结果；search 每次现读，避免同路径不同查询参数时读到过期缓存
	let 已清理路径 = (清理后的路径缓存[location.pathname] ??= 清理路径(location.pathname));
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
/**
 * 从 localStorage 读取主题色设置并尽快应用到页面
 */
function 尽快设置主题色() {
	if (localStorage.getItem("主题色h")) {
		const 主题色 = localStorage.getItem("主题色") || "";
		gd("主题色", true)?.setAttribute("content", 主题色);
		document.documentElement.style.setProperty("--theme-color", 主题色);
		document.documentElement.style.setProperty(
			"--theme-color-h",
			localStorage.getItem("主题色h")
		);
		document.documentElement.style.setProperty(
			"--theme-color-s",
			localStorage.getItem("主题色s")
		);
		document.documentElement.style.setProperty(
			"--theme-color-l",
			localStorage.getItem("主题色l")
		);
		document.documentElement.style.setProperty(
			"--theme-color-transparent",
			localStorage.getItem("透明色")
		);
		document.documentElement.style.setProperty("--text-color", localStorage.getItem("字体色"));
	}
}

let URL发生变化事件 = new CustomEvent("URL发生变化"),
	/** 在内容准备好后设为 true */
	可以滚动到视图中 = false;

// 方便暴露到全局变量
let _global = {};
addEventListener("storage", 尽快设置主题色);
尽快设置主题色();

let DOMContentLoaded = false,
	loaded = false;
addEventListener("load", () => {
	loaded = true;
});
document.addEventListener("DOMContentLoaded", async () => {
	DOMContentLoaded = true;
});
//#endregion

//#region 域名迁移
// 域名迁移：非 .icu 域名自动跳转到新域名 dsy4567.icu
// 流程：
//   1. 爬虫 / 本地环境 / 已在新域名 → 不做任何处理
//   2. 用户选择过「不跳转」（URL 参数或 localStorage 的 no-redirect）→ 仅弹横幅提示新域名
//   3. 其余情况 → 自动跳转并在 URL 携带来源参数，供新域名页面弹「回原域名」横幅
try {
	(() => {
		const 网页访问者不为爬虫 = !navigator.userAgent.match(/bot|spider/gi);
		// 所有改写先在 URL 副本上进行，最后统一生效
		let U = new URL(location.href);
		// 删除迁移流程专用的 URL 参数：
		// from-hostname（来源域名）、from-non-icu-tld（来自非 .icu 域名）、no-redirect（用户选择不跳转）
		const 删除url参数 = () => {
			U.searchParams.delete("from-hostname");
			U.searchParams.delete("from-non-icu-tld");
			U.searchParams.delete("no-redirect");
		};
		const 本地域名 = ["dev.dsy4567.icu", "localhost", "127.0.0.1"];
		const f = () => {
			// 已在 dsy4567.icu（含子域名）或黑名单域名上则无需处理
			if (location.hostname.endsWith("dsy4567.icu") || 本地域名.includes(location.hostname))
				return;

			// 情况 A：用户已选择「不跳转」→ 仅弹横幅提示，不强制跳转
			if (
				网页访问者不为爬虫 &&
				(JSON.parse(U.searchParams.get("no-redirect") || "false") ||
					JSON.parse(localStorage.getItem("no-redirect") || "false"))
			) {
				// 持久化选择，之后即使 URL 不带 no-redirect 也不再自动跳转
				localStorage.setItem("no-redirect", "true");
				// 弹横幅，并把横幅内链接指向新域名的同路径页面
				let 横幅 = 添加横幅(
						'本站已迁移至新域名 dsy4567.icu，您可以<a href="#">访问新域名</a>'
					),
					a = 横幅.querySelector("a");
				删除url参数();
				if (a?.href && a?.hostname) {
					a.href = U.href;
					a.hostname = "dsy4567.icu";
				}
			} else {
				// 情况 B：默认自动跳转到新域名
				if (网页访问者不为爬虫) {
					// 在 URL 上记录来源信息，供新域名页面弹「回原域名」横幅使用
					U.searchParams.set("from-non-icu-tld", "true");
					U.searchParams.set("from-hostname", location.hostname);
				} else 删除url参数();

				U.hostname = "dsy4567.icu";
				location.href = U.href;
			}

			// 情况 C：刚从旧域名跳来（URL 带 from-hostname）→ 在新域名上弹「回原域名」横幅
			let 原域名 = U.searchParams.get("from-hostname");
			if (
				网页访问者不为爬虫 &&
				JSON.parse(U.searchParams.get("from-non-icu-tld") || "false")
			) {
				let 横幅 = 添加横幅('本站已迁移至新域名，您也可以<a href="#">访问原域名</a>'),
					a = 横幅.querySelector("a");
				删除url参数();
				// 给回跳链接带上 no-redirect=true，用户点回原域名后不会再被自动跳回，避免两个域名互相重定向
				U.searchParams.set("no-redirect", "true");
				if (原域名 && a?.href && a?.hostname) {
					a.href = U.href;
					a.hostname = 原域名;
				}
			}
			// 清理辅助参数并同步到地址栏（replaceState 不会新增历史记录）
			删除url参数();
			history.replaceState(history.state, "", U.href);
		};
		DOMContentLoaded ? f() : addEventListener("DOMContentLoaded", f);
	})();
} catch (e) {
	console.error(e);
}
//#endregion

//#region SW管理
try {
	// "serviceWorker" in navigator && navigator.serviceWorker.register("/sw.js");

	// 移除 Service Worker 并清理缓存
	async function removeServiceWorker() {
		if ("serviceWorker" in navigator) {
			// 1. 获取所有注册
			const registrations = await navigator.serviceWorker.getRegistrations();

			// 2. 逐个注销
			for (let registration of registrations) await registration.unregister();

			// 3. 清理所有缓存
			const cacheNames = await caches.keys();
			await Promise.all(cacheNames.map(name => caches.delete(name)));
			console.log("Service Worker 已移除，缓存已清空");
		}
	}

	removeServiceWorker().catch(e => console.error(e));
} catch (e) {
	console.error(e);
}
//#endregion
