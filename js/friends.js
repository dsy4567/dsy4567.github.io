/* Copyright (c) 2023 dsy4567, view license at <https://github.com/dsy4567/dsy4567.github.io/blob/main/LICENSE.md> */

"use strict";

export async function main(/** @type {String} */ 路径) {
	显示或隐藏进度条(false);
	qsa("#友链 ~ section")?.forEach(元素 => {
		let a = 元素.querySelector("a"),
			img = 元素.querySelector("img");
		img.src =
			img.src ||
			`https://t1.gstatic.cn/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${a.host}&size=16`;
		img.alt = img.title = a.innerText;
	});
	if (!location.hash && 可以滚动到视图中)
		qs("main .右", true).scrollIntoView({
			behavior: "smooth",
		});
}
