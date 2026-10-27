/**
 * @fileoverview Umami 上报代理：rewrite 只能改路径、不能改请求头，改由函数补上真实访客 IP，
 * 并为 page-engaged 事件补充 Vercel 解析的国家与城市（Umami 的 IP 库对中国城市信息不详）
 * @author dsy4567
 * @license
 * Copyright (c) 2022-2026 dsy4567
 * SPDX-License-Identifier: MIT
 */

// @ts-check

import { geolocation, ipAddress } from "@vercel/functions";

/** Umami Cloud 上报接口 */
const 上报接口 = "https://cloud.umami.is/api/send";

/** 逐跳头、由 fetch 重新生成的头，以及客户端自带因而不可信的 IP 头 */
const 丢弃的请求头 = [
	"host",
	"content-length",
	"connection",
	"keep-alive",
	"transfer-encoding",
	"accept-encoding",
	"x-umami-client-ip",
	"x-real-ip",
	"x-forwarded-for",
];

async function f(/** @type {Request} */ req) {
	if (req.method !== "POST") return new Response("", { status: 405 });

	const 请求头 = new Headers(req.headers);
	for (const 名称 of 丢弃的请求头) 请求头.delete(名称);

	// Umami 按 x-umami-client-ip → true-client-ip → cf-connecting-ip → … → x-forwarded-for 取 IP。
	// 请求经 Cloudflare 到达 Umami Cloud 时 cf-connecting-ip 会被覆写为 Vercel 出口 IP，
	// 只有这个仅在 cloud 模式生效的头能保住真实访客 IP
	const 真实ip = ipAddress(req);
	if (真实ip) 请求头.set("x-umami-client-ip", 真实ip);

	let 请求体 = await req.text();
	/** @type {import("@vercel/functions").Geo | undefined} */
	let 地理位置;
	try {
		const 载荷 = JSON.parse(请求体);
		// Umami 的 IP 库对中国的城市信息不详，page-engaged 事件额外带上 Vercel 解析出的国家与城市：
		// 写进事件自定义数据（Umami 只透传 data 里的字段）供后台查看，同时回写响应头便于排查
		if (载荷?.type === "event" && 载荷.payload?.name === "page-engaged") {
			地理位置 = geolocation(req);
			载荷.payload.data = {
				...载荷.payload.data,
				...(地理位置.country ? { country: 地理位置.country } : {}),
				...(地理位置.city ? { city: 地理位置.city } : {}),
			};
			请求体 = JSON.stringify(载荷);
		}
	} catch {
		// 请求体不是 JSON 时按原样转发
	}

	const 响应 = await fetch(上报接口, {
		method: "POST",
		headers: 请求头,
		body: 请求体,
	});

	const 响应头 = {
		"content-type": 响应.headers.get("content-type") || "application/json;charset=utf-8",
		"cache-control": "no-store",
		...(地理位置?.country ? { "x-umami-country": 地理位置.country } : {}),
		// 城市名可能含非 ASCII 字符，而响应头只能放 ASCII，按 Vercel 的原始做法编码
		...(地理位置?.city ? { "x-umami-city": encodeURIComponent(地理位置.city) } : {}),
	};

	return new Response(响应.body, {
		status: 响应.status,
		headers: 响应头,
	});
}

f.fetch = f;

export const config = {
	runtime: "edge",
};

export default f;
