/**
 * @fileoverview 为 /friends.html 自动填充好友链图片
 * @author dsy4567
 * @license
 * Copyright (c) 2026 dsy4567
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
	});
	if (!location.hash && 可以滚动到视图中)
		qs("main .右", true)?.scrollIntoView({
			behavior: "smooth",
		});
}
