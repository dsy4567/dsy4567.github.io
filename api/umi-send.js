/**
 * @fileoverview Umami 上报代理：rewrite 只能改路径、不能改请求头，改由函数补上真实访客 IP，
 * 并为 page-engaged 事件补充 ip-api 解析的国家与省/州（Umami 与 Vercel 的 IP 库对中国信息不详/不准）
 * @author dsy4567
 * @license
 * Copyright (c) 2022-2026 dsy4567
 * SPDX-License-Identifier: MIT
 */

// @ts-check

import { ipAddress } from "@vercel/functions";

/** Umami Cloud 上报接口 */
const 上报接口 = "https://cloud.umami.is/api/send";

/** ip-api 地理查询接口：免费版只走 http，且不支持 IPv6 */
const 地理接口 = "http://ip-api.com/json/";

/** 地理查询超时（毫秒）：查不到就留空，不能拖慢上报 */
const 地理查询超时 = 2000;

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

/**
 * 用 ip-api 查询 IP 的国家与省/州，查不到（超时、限流、保留地址等）时留空
 * @param {string | undefined} ip
 * @returns {Promise<{ country: string, regionName: string }>}
 */
async function 查询地理位置(ip) {
	const 空结果 = { country: "", regionName: "" };
	if (!ip) return 空结果;

	// 用 AbortController 而非 AbortSignal.timeout：前者在各运行时都可用
	const 控制器 = new AbortController();
	const 超时定时器 = setTimeout(() => 控制器.abort(), 地理查询超时);
	try {
		const 响应 = await fetch(
			`${地理接口}${encodeURIComponent(ip)}?fields=status,country,regionName`,
			{ signal: 控制器.signal }
		);
		const 数据 = await 响应.json();
		if (数据.status !== "success") return 空结果;
		return { country: 数据.country || "", regionName: 数据.regionName || "" };
	} catch {
		return 空结果;
	} finally {
		clearTimeout(超时定时器);
	}
}

/**
 * 响应头值必须是 Latin-1，含其他字符（如中文地名）时按 URL 编码，避免构造 Response 抛错
 * @param {string} 值
 */
const 响应头值 = 值 => (/^[\x00-\xff]*$/.test(值) ? 值 : encodeURIComponent(值));

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
	/** @type {{ country: string, regionName: string } | undefined} */
	let 地理位置;
	try {
		const 载荷 = JSON.parse(请求体);
		// Umami 自带 IP 库对中国的信息不详，Vercel 的也不够准确，page-engaged 事件改用 ip-api 查询：
		// 写进事件自定义数据（Umami 只透传 data 里的字段）供后台查看，同时回写响应头便于排查
		if (载荷?.type === "event" && 载荷.payload?.name === "page-engaged") {
			地理位置 = await 查询地理位置(真实ip);
			载荷.payload.data = {
				...载荷.payload.data,
				country: 地理位置.country,
				regionName: 地理位置.regionName,
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
		...(地理位置
			? {
					"x-umami-country": 响应头值(地理位置.country),
					"x-umami-region": 响应头值(地理位置.regionName),
				}
			: {}),
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
