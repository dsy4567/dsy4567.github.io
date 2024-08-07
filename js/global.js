/* Copyright (c) 2023 dsy4567, view license at <https://github.com/dsy4567/dsy4567.github.io/blob/main/LICENSE.md> */

// @ts-check
"use strict";

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
function 随机数(/** @type {number} */ 最大) {
	let r = Math.floor(Math.random() * (最大 + 1));
	if (r < 0) r = 0;
	return r;
}
/**
 * @param {number} r
 * @param {number} g
 * @param {number} b
 */
function rgb转hsl(r, g, b) {
	r /= 255;
	g /= 255;
	b /= 255;
	let 最大 = Math.max(r, g, b),
		最小 = Math.min(r, g, b);
	let h,
		s,
		l = (最大 + 最小) / 2;

	if (最大 === 最小) h = s = 0;
	else {
		let d = 最大 - 最小;
		s = l > 0.5 ? d / (2 - 最大 - 最小) : d / (最大 + 最小);
		switch (最大) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}
		// @ts-ignore
		h /= 6;
	}

	return [h, s, l];
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

let URL发生变化事件 = new CustomEvent("URL发生变化"),
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

(() => {
	const 网页访问者不为爬虫 = !navigator.userAgent.match(/bot|spider/gi);
	let U = new URL(location.href);
	const 删除url参数 = () => {
		U.searchParams.delete("from-hostname");
		U.searchParams.delete("from-non-icu-tld");
		U.searchParams.delete("no-redirect");
	};
	const f = () => {
		if (!location.hostname.endsWith("dsy4567.icu"))
			if (
				网页访问者不为爬虫 &&
				(JSON.parse(U.searchParams.get("no-redirect") || "false") ||
					JSON.parse(localStorage.getItem("no-redirect") || "false"))
			) {
				localStorage.setItem("no-redirect", "true");
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
				if (网页访问者不为爬虫) {
					U.searchParams.set("from-non-icu-tld", "true");
					U.searchParams.set("from-hostname", location.hostname);
				} else 删除url参数();

				U.hostname = "dsy4567.icu";
				location.href = U.href;
			}

		let 原域名 = U.searchParams.get("from-hostname");
		if (网页访问者不为爬虫 && JSON.parse(U.searchParams.get("from-non-icu-tld") || "false")) {
			let 横幅 = 添加横幅('本站已迁移至新域名，您也可以<a href="#">访问原域名</a>'),
				a = 横幅.querySelector("a");
			删除url参数();
			U.searchParams.set("no-redirect", "true");
			if (原域名 && a?.href && a?.hostname) {
				a.href = U.href;
				a.hostname = 原域名;
			}
		}
		删除url参数();
		history.replaceState(history.state, "", U.href);
	};
	DOMContentLoaded ? f() : addEventListener("DOMContentLoaded", f);
})();

try {
	"serviceWorker" in navigator && navigator.serviceWorker.register("/sw.js");
} catch (e) {
	console.error(e);
}
