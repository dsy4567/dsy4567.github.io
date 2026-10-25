/**
 * @fileoverview 为 /friends.html 自动填充好友链图片
 * @author dsy4567
 * @license
 * Copyright (c) 2022-2026 dsy4567
 * SPDX-License-Identifier: MIT
 */

// @ts-check
"use strict";

export async function main(/** @type {String} */ 路径) {
	显示或隐藏进度条(false);
	qsa("#友链 ~ section")?.forEach(元素 => {
		let a = 元素.querySelector("a"),
			img = 元素.querySelector("img");
		if (!a || !img) return;
		img.src =
			img.src ||
			`https://t1.gstatic.cn/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${a.host}&size=16`;
		img.alt = img.title = a.innerText;
		// 友链点击用 JS 埋点（记录链接文字与完整地址），避免 data-umami-event 属性干扰外链的新标签页行为
		// 标记后 main.js 的通用外链埋点会跳过该链接，避免重复上报
		a.dataset.已埋点 = "";
		a.addEventListener("click", () => {
			埋点("friend-link-click", { text: a.innerText, url: a.href });
		});
	});
	// if (!location.hash && 已触发动态加载)
	// 	qs("main .右", true)?.scrollIntoView({
	// 		behavior: "smooth",
	// 	});
}

_global["friends.js"] = () => ({});
