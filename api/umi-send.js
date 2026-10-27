/**
 * @fileoverview Umami 上报代理：rewrite 只能改路径、不能改请求头，改由函数补上真实访客 IP
 * @author dsy4567
 * @license
 * Copyright (c) 2022-2026 dsy4567
 * SPDX-License-Identifier: MIT
 */

// @ts-check

import { ipAddress } from "@vercel/functions";

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

	const 响应 = await fetch(上报接口, {
		method: "POST",
		headers: 请求头,
		body: await req.text(),
	});

	return new Response(响应.body, {
		status: 响应.status,
		headers: {
			"content-type": 响应.headers.get("content-type") || "application/json;charset=utf-8",
			"cache-control": "no-store",
		},
	});
}

f.fetch = f;

export const config = {
	runtime: "edge",
};

export default f;
