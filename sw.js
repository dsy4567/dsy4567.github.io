/* Copyright (c) 2023 dsy4567, view license at <https://github.com/dsy4567/dsy4567.github.io/blob/main/LICENSE.md> */

"use strict";

// const 要缓存的资源 = [
//     "https://ncm.vercel.dsy4567.cf/playlist/track/all?id=",
//     "https://ncm.vercel.dsy4567.cf/mv/detail?mvid=",
//     "https://ncm.vercel.dsy4567.cf/lyric?id=",
//     "https://api.github.com/users/dsy4567",
//     "https://dsy4567.cf/api/hitokoto",
//     "https://camo.githubusercontent.com/",
//     "/css/hl.min.css",
//     "/img/avatar.jpg",
//     "/js/highlight.min.js",
//     "/js/lrc-parser.js",
//     "/js/marked.min.js",
// ];
// const 要临时缓存的资源 = [
//     "/index.html",
//     "/blog.html",
//     "/friends.html",
//     "//",
//     "/css/",
//     "/js/",
//     "/json/",
// ];
// let /** @type {Record<string, Cache>} */ 缓存 = {},
//     /** @type {Cache} */ 临时缓存;

// for (let i = 0; i < 要缓存的资源.length; i++)
//     要缓存的资源[i] = new URL(要缓存的资源[i], location.href);
// for (let i = 0; i < 要临时缓存的资源.length; i++)
//     要临时缓存的资源[i] = new URL(要临时缓存的资源[i], location.href);

// const 更新缓存 = async (
//     /** @type {URL} */ 请求,
//     /** @type {Response} */ 响应
// ) => {
//     if (!缓存[请求.hostname])
//         缓存[请求.hostname] = await caches.open(请求.hostname);
//     return await 缓存[请求.hostname].put(请求, 响应);
// };
// const 更新临时缓存 = async (
//     /** @type {URL} */ 请求,
//     /** @type {Response} */ 响应
// ) => {
//     if (!临时缓存) 临时缓存 = await caches.open("temp");
//     return await 临时缓存.put(请求, 响应);
// };
// const 读取缓存 = async (/** @type {URL} */ 请求) => {
//     if (!缓存[请求.hostname])
//         缓存[请求.hostname] = await caches.open(请求.hostname);
//     return await 缓存[请求.hostname].match(请求);
// };
// const 读取临时缓存 = async (/** @type {URL} */ 请求) => {
//     if (!临时缓存) 临时缓存 = await caches.open("temp");
//     return await 临时缓存.match(请求, { ignoreSearch: true });
// };

self.addEventListener("activate", 事件 => {
	console.log("SW 已激活");
	事件.waitUntil(clients.claim());
	// 事件.waitUntil(caches.delete("temp"));
	事件.waitUntil(
		caches.keys().then(t => {
			return Promise.all(
				t.map(n => {
					return caches.delete(n);
				})
			);
		})
	);
});

self.addEventListener("install", 事件 => {
	console.log("SW 已安装");
	self.skipWaiting();
});

self.addEventListener("fetch", 事件 => {
	return; // NOTE: 破代码改完了再删掉这行

	let u = new URL(事件.request.url),
		从缓存读取 = false,
		从临时缓存读取 = false;
	for (let i = 0; i < 要缓存的资源.length; i++) {
		let u2 = 要缓存的资源[i];
		if (u.host + u.pathname === u2.host + u2.pathname) {
			从缓存读取 = true;
			break;
		}
	}
	if (u.hostname === location.hostname) {
		u.search = "";
		if (!从缓存读取)
			if (u.pathname === "/") 从临时缓存读取 = true;
			else
				for (let i = 0; i < 要临时缓存的资源.length; i++) {
					let u2 = 要临时缓存的资源[i];
					if (u.pathname.startsWith(u2.pathname)) {
						从临时缓存读取 = true;
						break;
					}
				}
	}

	if (!从缓存读取 && !从临时缓存读取) return;

	事件.respondWith(
		(async () =>
			new Promise(async (resolve, reject) => {
				let resolved = false;

				let 来自缓存的响应, 来自临时缓存的响应;
				if (从缓存读取) 来自缓存的响应 = await 读取缓存(u);
				else if (从临时缓存读取) 来自临时缓存的响应 = await 读取临时缓存(u);
				if (来自缓存的响应 || 来自临时缓存的响应) {
					resolve(来自缓存的响应 || 来自临时缓存的响应);
					resolved = true;
				}

				try {
					const 来自网络的请求 = await fetch(u);
					从缓存读取 && 更新缓存(u, 来自网络的请求.clone());
					从临时缓存读取 && 更新临时缓存(u, 来自网络的请求.clone());
					!resolved && resolve(来自网络的请求);
				} catch (e) {
					!resolved &&
						resolve(
							new Response(
								new Blob(["无法获取资源\n" + e], {
									type: "text/plain;charset=utf8",
								}),
								{
									status: 408,
									headers: {
										"Content-Type": "text/plain;charset=utf8",
									},
								}
							)
						);
				}
			}))()
	);
});
