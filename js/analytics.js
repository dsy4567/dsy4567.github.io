/**
 * @fileoverview 适用于所有页面的统计脚本，包含 Umami、Cloudflare 统计服务
 * @author dsy4567
 * @license
 * Copyright (c) 2022-2026 dsy4567
 * SPDX-License-Identifier: MIT
 */

// @ts-check
"use strict";

const cfBeaconToken = "6bd41e62cf0c4baeac654d7a09dfdfff";
const umami_website_id = "0594568b-2cd6-49f0-ab68-ee7893595cb2";

const 启用统计的域名 = ["dsy4567.icu"];

export default (() => {
	// 站长自查时在控制台 localStorage.setItem("测试-不插入统计脚本", "")，即可不把自己计入统计（刷新生效）
	if (
		localStorage.getItem("测试-不插入统计脚本") !== null ||
		!启用统计的域名.includes(location.hostname)
	)
		return;

	// 自定义事件统一由 js/global.js 的 埋点() 上报，本文件只负责加载脚本并在就绪后补发队列
	// 本文件也可能被未加载 global.js 的非核心页面直接引用，此时队列函数不存在，补发与清空直接跳过
	const s1 = document.createElement("script");
	s1.async = true;
	// 经 vercel.json 的 rewrite 反代，避免直连第三方域名被广告拦截器拦截
	// s1.src = "https://cloud.umami.is/script.js";
	s1.src = "/umi/script.js";
	s1.setAttribute("data-website-id", umami_website_id);
	s1.setAttribute("data-host-url", "/umi");
	// 用 typeof 而不是可选调用：未声明的全局标识符即使写成 ?.() 也会在求值时抛出 ReferenceError
	s1.addEventListener("load", () => {
		if (typeof 刷新埋点队列 === "function") 刷新埋点队列();
	});
	s1.addEventListener("error", () => {
		if (typeof 清空埋点队列 === "function") 清空埋点队列();
	});
	document.body.append(s1);

	const /** @type {HTMLScriptElement} */ s2 = document.createElement("script");
	s2.async = true;
	s2.setAttribute("data-cf-beacon", `{"token": "${cfBeaconToken}"}`);
	s2.src = "https://static.cloudflareinsights.com/beacon.min.js";
	document.body.append(s2);
})();
