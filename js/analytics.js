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
	if (!启用统计的域名.includes(location.hostname)) return;

	// 自定义事件统一由 js/global.js 的 埋点() 上报，本文件只负责加载脚本并在就绪后补发队列
	const s1 = document.createElement("script");
	s1.async = true;
	s1.src = "https://cloud.umami.is/script.js";
	s1.setAttribute("data-website-id", umami_website_id);
	s1.addEventListener("load", 刷新埋点队列);
	s1.addEventListener("error", 清空埋点队列);
	document.body.append(s1);

	const /** @type {HTMLScriptElement} */ s2 = document.createElement("script");
	s2.async = true;
	s2.setAttribute("data-cf-beacon", `{"token": "${cfBeaconToken}"}`);
	s2.src = "https://static.cloudflareinsights.com/beacon.min.js";
	document.body.append(s2);
})();
