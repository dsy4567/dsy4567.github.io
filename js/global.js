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
 * document.getElementById
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
 * document.querySelector
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
 * document.querySelectorAll
 * @type {typeof document.querySelectorAll}
 */
const qsa = (/** @type {keyof HTMLElementTagNameMap} */ s) => {
	return document.querySelectorAll(s);
};
/**
 * document.getElementsByTagName
 * @type {typeof document.getElementsByTagName}
 */
const ge = (/** @type {keyof HTMLElementTagNameMap} */ s) => {
	return document.getElementsByTagName(s);
};
/**
 * document.createElement
 * @type {typeof document.createElement}
 */
const ce = (/** @type {keyof HTMLElementTagNameMap} */ s) => {
	return document.createElement(s);
};
function 显示或隐藏进度条(/** @type {boolean} */ 状态) {
	状态
		? qs(".进度条外面", true)?.classList.add("显示")
		: qs(".进度条外面", true)?.classList.remove("显示");
}
/**
 * @param {string} url
 * @param {"anonymous" | "use-credentials" | null} crossOrigin
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
 * @param {string} url
 * @param {"anonymous" | "use-credentials" | null} crossOrigin
 * @returns {Promise<any>}
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
 * @param {string} m
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

function 阻止搜索引擎收录() {
	gd("robots", true)?.setAttribute("content", "noindex");
}
let /** @type {Record<string, string>} */ 清理后的路径缓存 = {},
	/** @type {Record<string, string>} */ 清理后的路径缓存_包含search = {};
function 获取清理后的路径(包含search = false) {
	let l = 包含search
		? 清理后的路径缓存_包含search[location.pathname]
		: 清理后的路径缓存[location.pathname];
	return l
		? l
		: 包含search
			? (清理后的路径缓存_包含search[location.pathname] =
					location.pathname.replace(/(index|\.html)/g, "").replace(/\/\//g, "") +
					location.search)
			: (清理后的路径缓存[location.pathname] =
					"/" +
					location.pathname
						.replace(/(index|\.html)/g, "")
						.replace(/\/\//g, "")
						.split("/")[1]);
}
function 随机含零自然数(/** @type {number} */ 最大) {
	if (!Number.isInteger(最大) || 最大 < 0) throw new RangeError("最大必须是非负整数");
	return Math.floor(Math.random() * (最大 + 1));
}
/**
 * @param {number} r
 * @param {number} g
 * @param {number} b
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
}
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
