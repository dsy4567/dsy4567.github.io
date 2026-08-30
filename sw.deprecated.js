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

/**
 * @returns {Promise<Response>}
 */
async function 回退(请求) {
	return new Promise(async (resolve, reject) => {
		try {
			return resolve(
				await fetch(请求.url, {
					headers: 请求.headers,
				}).then(响应 => {
					if (!响应.ok) throw Error("非 2xx 响应");
					return 响应;
				})
			);
		} catch (e) {
			console.error(e);
		}

		let 所有错误 = [],
			重试次数 = 0;
		while (1) {
			let u = new URL(请求.url),
				将要回退的域名 = "";
			for (const 子域名 of Object.keys(可回退子域名)) {
				if (
					!!子域名
						? u.hostname.startsWith(子域名)
						: 可回退子域名[子域名].includes(u.hostname)
				) {
					将要回退的域名 = u.hostname = 可回退子域名[子域名][重试次数];
					break;
				}
			}
			if (!将要回退的域名) {
				console.error("回退失败", 请求, 所有错误);
				return reject();
			}
			try {
				let 响应 = await fetch(u, {
					headers: 请求.headers,
				});
				if (!响应.ok) throw Error("非 2xx 响应");
				return resolve(响应);
			} catch (e) {
				所有错误.push(e);
				重试次数++;
			}
		}
	});
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

self.addEventListener("fetch", async 事件 => {
	try {
		let 属于本站域名 = false,
			/** @type {Request} */ 请求 = 事件.request,
			u = new URL(请求.url);
		if (请求.method !== "GET" || 请求.destination === "document") return;
		if (本站域名.includes(u.hostname)) 属于本站域名 = true;
		else
			for (let i = 0; i < 本站域名.length; i++) {
				if (u.hostname.endsWith("." + 本站域名[i])) {
					属于本站域名 = true;
					break;
				}
			}

		if (属于本站域名) {
			// let 响应 = fetch(请求.url, {
			// 	headers: 请求.headers,
			// })
			// 	.then(响应 => {
			// //		if (!响应.ok) throw Error("非 2xx 响应");
			// 		return 响应;
			// 	})
			// 	.catch(e => 回退(请求, e));
			事件.respondWith(回退(请求));
		}
	} catch (e) {
		console.error(e);
	}
});
