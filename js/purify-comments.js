/**
 * @fileoverview 净化博客评论区 HTML：按白名单过滤 GitHub Issue 评论正文，剔除危险标签、属性与白名单外的外部媒体
 * @author dsy4567
 * @license
 * Copyright (c) 2022-2026 dsy4567
 * SPDX-License-Identifier: MIT
 */

// @ts-check
"use strict";

/** 媒体地址白名单域名：githubusercontent 为 GitHub 用户内容域；icu、eu.org 放行子域名 */
const 媒体地址白名单 = ["dsy4567.icu", "dsy4567.eu.org", "githubusercontent.com"];
/**
 * 判断主机名是否命中媒体地址白名单
 * @param {string} 主机名
 * @returns {boolean}
 */
function 命中媒体地址白名单(主机名) {
	// dsy4567.github.io 严格匹配，不含子域名
	return (
		主机名 === "dsy4567.github.io" ||
		媒体地址白名单.some(域名 => 主机名 === 域名 || 主机名.endsWith("." + 域名))
	);
}
/**
 * 校验 img / audio / video 的地址：仅放行 https 且域名在白名单内的地址，相对地址解析到本站后再判断
 * @param {string} 地址
 * @returns {boolean}
 */
function 验证媒体地址(地址) {
	try {
		const u = new URL(地址, location.origin);
		return u.protocol === "https:" && 命中媒体地址白名单(u.hostname);
	} catch (e) {
		return false;
	}
}
/** 普通链接允许的协议 */
const 允许的链接协议 = ["http:", "https:", "ftp:", "mailto:"];
/**
 * 校验普通链接地址，避免 javascript: / data: 等协议被写入 href
 * @param {string} 地址
 * @returns {boolean}
 */
function 验证链接地址(地址) {
	try {
		return 允许的链接协议.includes(new URL(地址, location.origin).protocol);
	} catch (e) {
		return false;
	}
}
/** 评论正文允许的标签：iframe、style 已整体剔除；audio 与 GFM 任务列表的复选框 input 单独放行 */
const 评论允许的标签 = [
	"div",
	"span",
	"p",
	"blockquote",
	"pre",
	"center",
	"hr",
	"br",
	"b",
	"strong",
	"i",
	"em",
	"u",
	"s",
	"strike",
	"mark",
	"small",
	"sub",
	"sup",
	"code",
	"samp",
	"kbd",
	"var",
	"tt",
	"del",
	"ins",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"ul",
	"ol",
	"li",
	"dl",
	"dt",
	"dd",
	"table",
	"thead",
	"tbody",
	"tfoot",
	"tr",
	"th",
	"td",
	"a",
	"cite",
	"abbr",
	"dfn",
	"q",
	"ruby",
	"rt",
	"rp",
	"img",
	"video",
	"audio",
	"details",
	"summary",
	"time",
	"input",
];
/** 评论正文允许的属性；loading、controls、preload 由本站写入，故不在此列 */
const 评论允许的属性 = [
	"href",
	"name",
	"src",
	"alt",
	"height",
	"width",
	"poster",
	"cite",
	"title",
	"datetime",
	"pubdate",
	"open",
	"type",
	"checked",
	"disabled",
];
/** 媒体标签名到中文类型名的映射 */
const 媒体类型名 = new Map([
	["IMG", "图片"],
	["VIDEO", "视频"],
	["AUDIO", "音频"],
]);
/**
 * 把白名单外的媒体降级为链接：保留描述，点击在新标签页打开原地址；
 * 地址不能作为链接、或媒体已处于 <a> 内（避免嵌套 <a>）时，退化为纯文本
 * @param {Element} 媒体
 */
function 降级媒体为链接(媒体) {
	const 类型 = 媒体类型名.get(媒体.tagName) || "媒体";
	const 描述 = (媒体.getAttribute("alt") || "").trim();
	const 文案 =
		类型 === "图片" && 描述 ? `图片：${描述}（在新标签页打开）` : `${类型}（在新标签页打开）`;
	const 地址 = 媒体.getAttribute("src") || "";

	if (!验证链接地址(地址) || 媒体.parentElement?.tagName === "A") {
		媒体.replaceWith(document.createTextNode(文案));
		return;
	}
	const 链接 = document.createElement("a");
	链接.href = 地址;
	链接.target = "_blank";
	链接.rel = "noopener noreferrer";
	链接.textContent = 文案;
	媒体.replaceWith(链接);
}
/**
 * 净化 GitHub Issue 评论正文
 * 评论数据来自 GitHub API，属不可信输入：先交由调用方传入的 DOMPurify 按白名单净化
 * （自动剥离 on* 事件、style 属性、危险协议等），
 * 再在净化后的安全 DOM 上执行更严的媒体域名校验、域名降级与懒加载
 * @param {any} DOMPurify 已加载的 DOMPurify 实例，由调用方传入
 * @param {string} markdown 评论正文 Markdown
 * @returns {DocumentFragment}
 */
export function 净化评论HTML(DOMPurify, markdown) {
	const 片段 = /** @type {DocumentFragment} */ (
		DOMPurify.sanitize(marked.parse(markdown), {
			RETURN_DOM_FRAGMENT: true,
			ALLOWED_TAGS: 评论允许的标签,
			ALLOWED_ATTR: 评论允许的属性,
		})
	);

	for (const 媒体 of [...片段.querySelectorAll("img, video, audio")]) {
		const 地址 = 媒体.getAttribute("src") || "";
		if (!验证媒体地址(地址)) {
			降级媒体为链接(媒体);
			continue;
		}
		if (媒体.tagName === "IMG") {
			媒体.setAttribute("loading", "lazy");
			continue;
		}
		媒体.setAttribute("controls", "");
		媒体.setAttribute("preload", "metadata");
		if (媒体.tagName === "VIDEO") {
			const 封面 = 媒体.getAttribute("poster");
			if (封面 && !验证媒体地址(封面)) 媒体.removeAttribute("poster");
		}
	}

	// GFM 任务列表会生成 <input type="checkbox">，其余控件类型一律移除
	for (const 控件 of [...片段.querySelectorAll("input")])
		if (控件.getAttribute("type") !== "checkbox") 控件.remove();

	return 片段;
}

_global["purify-comments.js"] = () => ({ 净化评论HTML });
