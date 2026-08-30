/* Copyright (c) 2023 dsy4567, view license at <https://github.com/dsy4567/dsy4567.github.io/blob/main/LICENSE.md> */

"use strict";

const 可回退子域名 = {
		qwq: ["qwq.dsy4567.icu", "qwq.dsy4567.eu.org", "ipv6-qwq.dsy4567.icu"],
		"ncm.vercel": [
			"ncm.vercel.dsy4567.icu",
			"ncm.vercel.dsy4567.eu.org",
			"ipv6-ncm-vercel.dsy4567.icu",
		],
		"": [
			"dsy4567.icu",
			"dsy4567.eu.org",
			"dsy4567.github.io",
			"ipv6.dsy4567.icu",
			"dev.dsy4567.icu",
		],
	},
	本站域名 = ["dsy4567.icu", "dsy4567.eu.org", "dsy4567.github.io", "dev.dsy4567.icu"];

/** 单次请求的超时时间（毫秒） */
const 请求超时毫秒数 = 8000;

/**
 * 带超时的 fetch, 避免单个域名长时间挂起拖垮整个回退流程
 * @param {string | URL} url - 请求地址
 * @param {Headers} headers - 请求头
 * @returns {Promise<Response>}
 */
async function 带超时请求(url, headers) {
	const 控制器 = new AbortController();
	const 定时器 = setTimeout(() => 控制器.abort(), 请求超时毫秒数);
	try {
		return await fetch(url, { headers, signal: 控制器.signal });
	} finally {
		clearTimeout(定时器);
	}
}

/**
 * 查找主机名所属的回退分组
 * 先精确匹配（当前域名已在某分组列表中），再按前缀匹配（长度降序且带 "." 分隔符，避免 qwq 误匹配 qwq2.xxx）
 * @param {string} 主机名
 * @returns {string[] | null} 备用域名列表，无法回退时返回 null
 */
function 查找回退分组(主机名) {
	for (const 子域名 of Object.keys(可回退子域名)) {
		if (可回退子域名[子域名].includes(主机名)) return 可回退子域名[子域名];
	}
	const 前缀列表 = Object.keys(可回退子域名)
		.filter(子域名 => !!子域名)
		.sort((a, b) => b.length - a.length);
	for (const 前缀 of 前缀列表) {
		if (主机名.startsWith(前缀 + ".")) return 可回退子域名[前缀];
	}
	return null;
}

/**
 * 多域名容灾回退：先请求原地址，失败后依次尝试同分组的备用域名
 * @param {Request} 请求 - 原始请求
 * @param {string[]} 备用域名列表 - 当前主机名所属分组的全部域名
 * @returns {Promise<Response>}
 */
async function 回退(请求, 备用域名列表) {
	// 先尝试请求原地址
	try {
		const 响应 = await 带超时请求(请求.url, 请求.headers);
		if (响应.ok) return 响应;
	} catch (e) {
		console.error(e);
	}

	// 依次尝试备用域名，跳过当前域名避免重复请求刚失败过的地址
	const 当前主机名 = new URL(请求.url).hostname;
	const 所有错误 = [];
	for (const 域名 of 备用域名列表) {
		if (域名 === 当前主机名) continue;
		const 备用url = new URL(请求.url);
		备用url.hostname = 域名;
		try {
			const 响应 = await 带超时请求(备用url, 请求.headers);
			if (响应.ok) return 响应;
			所有错误.push(Error(域名 + ": 非 2xx 响应"));
		} catch (e) {
			所有错误.push(Error(域名 + ": " + e.message));
		}
	}

	throw Error("所有域名均不可用: " + 所有错误.map(e => e.message).join("; "));
}

// 开发环境
if (location.hostname === "dev.dsy4567.icu") {
}

self.addEventListener("activate", 事件 => {
	console.log("SW 已激活");
	事件.waitUntil(clients.claim());
});

self.addEventListener("install", 事件 => {
	console.log("SW 已安装");
	self.skipWaiting();
});

self.addEventListener("fetch", 事件 => {
	try {
		/** @type {Request} */
		const 请求 = 事件.request;
		if (请求.method !== "GET" || 请求.destination === "document") return;

		const u = new URL(请求.url);
		let 属于本站域名 = 本站域名.includes(u.hostname);
		if (!属于本站域名)
			for (const 域名 of 本站域名) {
				if (u.hostname.endsWith("." + 域名)) {
					属于本站域名 = true;
					break;
				}
			}
		if (!属于本站域名) return;

		// 不在回退分组内的域名不接管，交给浏览器直接请求
		const 备用域名列表 = 查找回退分组(u.hostname);
		if (!备用域名列表) return;

		事件.respondWith(
			回退(请求, 备用域名列表).catch(e => {
				console.error("回退失败", 请求, e);
				return new Response("回退失败: " + e.message, {
					status: 502,
					statusText: "Bad Gateway",
					headers: { "Content-Type": "text/plain; charset=utf-8" },
				});
			})
		);
	} catch (e) {
		console.error(e);
	}
});
