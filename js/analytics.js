/**
 * @fileoverview 适用于所有页面的统计脚本，负责加载 Umami、Cloudflare 统计服务，并上报页面参与度里程碑事件（page-engaged）
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

	// 除本文件的 page-engaged 外，自定义事件统一由 js/global.js 的 埋点() 上报，
	// 本文件负责加载统计脚本、在就绪后补发队列，并上报页面参与度里程碑事件
	// 本文件也可能被未加载 global.js 的非核心页面直接引用，此时队列函数不存在，补发与清空直接跳过
	/** page-engaged 的计时起点：模块执行即开始计时，elapsed 以此为零点 */
	const 计时起点 = performance.now();

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

	// 非核心页面（未加载 global.js，如 game.html）不参与页面参与度统计
	if (typeof 埋点 !== "function") return;

	//#region 页面参与度里程碑
	// 入口页在模块执行时快照：模块随文档加载只求值一次，SPA 换页不会重新求值，
	// 因此此刻的路径就是整份文档（含后续动态换页）的入口页
	const 入口页路径 = 清理路径(location.pathname);
	let 入口页referrer = "";
	try {
		// 只记域名，去掉路径与查询字符串
		入口页referrer = document.referrer ? new URL(document.referrer).origin : "";
	} catch {}

	/** 交互类型记录：最近→较早，同一类型历史只记一次，最多 3 个 */
	const /** @type {string[]} */ 交互类型 = [];
	/** @param {string} 类型 */
	const 记录交互 = 类型 => {
		if (!交互类型.includes(类型)) {
			交互类型.unshift(类型);
			if (交互类型.length > 3) 交互类型.length = 3;
		}
		标记关键事件();
		// scroll 已记入 interaction1~3 后，后续滚动只会被去重，解除这个最高频的监听
		if (类型 === "scroll") 解除滚动监听();
	};

	/** @param {PointerEvent} 事件 */
	const 指针按下监听 = 事件 =>
		事件.isTrusted &&
		记录交互(
			事件.pointerType === "touch"
				? "touchdown"
				: 事件.pointerType === "pen"
					? "pendown"
					: "mousedown"
		);
	// 鼠标会同时派发 mousedown 与 pointerdown，这里只用 pointerdown 并按 pointerType 归类，避免重复记录
	addEventListener("pointerdown", 指针按下监听, { capture: true, passive: true });

	/** @param {KeyboardEvent} 事件 */
	const 键盘按下监听 = 事件 => 事件.isTrusted && 记录交互("keyboarddown");
	addEventListener("keydown", 键盘按下监听, true);

	/** @param {Event} 事件 */
	const 滚动监听 = 事件 => 事件.isTrusted && 记录交互("scroll");
	// scroll 延迟 500ms 再监听：首屏 CLS 期间的布局变动会触发滚动，等页面稳定后再记录；
	// 程序化滚动同样会产生 isTrusted 的 scroll，此处接受该噪音
	const 滚动监听定时器 = setTimeout(() => {
		addEventListener("scroll", 滚动监听, { capture: true, passive: true });
	}, 500);

	/** 里程碑（秒）：页面可见累计时长达到、且本轮文档已发生关键事件时各上报一次 */
	const 里程碑 = [7, 25, 60];
	/** 已累计的可见毫秒数，跨 SPA 换页持续累计 */
	let 已累计可见 = 0;
	/** 本次可见起点（performance.now()）；页面隐藏时为 null */
	let /** @type {number | null} */ 可见开始 =
			document.visibilityState === "visible" ? performance.now() : null;
	/** 下一个待结算的里程碑下标 */
	let 里程碑下标 = 0;
	/**
	 * 已到达但缺少关键事件的挂起里程碑下标；至多一个。
	 * 下一个里程碑到达时若仍在挂起，即被顶替（超时抛弃，永不上报）
	 * @type {number | null}
	 */
	let 挂起下标 = null;
	/** 本轮文档是否已发生过关键事件（任一已记录交互），跨 SPA 换页保留 */
	let 已发生关键事件 = false;
	let /** @type {ReturnType<typeof setTimeout> | undefined} */ 里程碑定时器;

	/** 把当前这段可见时间结算进 已累计可见 */
	function 结算可见() {
		if (可见开始 === null) return;
		已累计可见 += performance.now() - 可见开始;
		可见开始 = null;
	}

	/**
	 * 上报一个里程碑
	 * @param {number} 里程碑秒 - 正常到达时为名义值，挂起补报时为实际可见累计秒
	 */
	function 上报里程碑(里程碑秒) {
		埋点("page-engaged", {
			milestone: 里程碑秒,
			// 计时起点到触发时刻的秒数，减去里程碑秒数即挂后台的秒数
			elapsed: Math.round((performance.now() - 计时起点) / 1000),
			interaction1: 交互类型[0] || "",
			interaction2: 交互类型[1] || "",
			interaction3: 交互类型[2] || "",
			entryPath: 入口页路径,
			entryReferrer: 入口页referrer,
		});
	}

	/**
	 * 结算当前可见时间，并按「时间到达 + 已发生关键事件」推进一步。
	 * 定时器被延迟时可能一次跨过多个里程碑，此时只保留最新一条：
	 * 未发生关键事件则最新一条挂起、更早的视为超时抛弃；已发生则只按名义值上报最新一条
	 */
	function 结算并推进() {
		if (document.visibilityState === "visible") {
			结算可见();
			可见开始 = performance.now();
		}
		/** 本次结算中最后到达的里程碑下标；-1 表示没有新到达 */
		let 最新到达下标 = -1;
		while (里程碑下标 < 里程碑.length && 已累计可见 >= 里程碑[里程碑下标] * 1000) {
			最新到达下标 = 里程碑下标;
			里程碑下标++;
		}
		if (最新到达下标 < 0) return;
		if (已发生关键事件) 上报里程碑(里程碑[最新到达下标]);
		else 挂起下标 = 最新到达下标;
	}

	/**
	 * 记录本轮文档首次发生关键事件。
	 * 若此前已有到达但未上报的挂起里程碑，立即按实际可见累计秒补报；
	 * 必须先用「尚未发生关键事件」的状态推进，再置位并补报，顺序不能反
	 */
	function 标记关键事件() {
		if (已发生关键事件) return;
		结算并推进();
		已发生关键事件 = true;
		if (挂起下标 !== null) {
			const 实际秒 = Math.floor(已累计可见 / 1000);
			// 先清空再上报：单条上报抛错也不会让挂起项在关键事件已置位后残留
			挂起下标 = null;
			上报里程碑(实际秒);
		}
		检查是否结束();
		安排里程碑();
	}

	function 检查里程碑() {
		结算并推进();
		检查是否结束();
		安排里程碑();
	}

	/** 为下一个未到达的里程碑排定时器；页面隐藏时不排，等恢复可见后重排 */
	function 安排里程碑() {
		clearTimeout(里程碑定时器);
		里程碑定时器 = undefined;
		if (里程碑下标 >= 里程碑.length || 可见开始 === null) return;
		const 剩余 = 里程碑[里程碑下标] * 1000 - (已累计可见 + performance.now() - 可见开始);
		里程碑定时器 = setTimeout(检查里程碑, Math.max(剩余, 0));
	}

	const 可见性变更监听 = () => {
		if (document.visibilityState === "visible") {
			可见开始 = performance.now();
			安排里程碑();
		} else {
			结算可见();
			clearTimeout(里程碑定时器);
			里程碑定时器 = undefined;
		}
	};
	document.addEventListener("visibilitychange", 可见性变更监听);

	// bfcache 期间脚本被冻结，冻结时长不计入可见时长
	const 页面隐藏监听 = () => {
		结算可见();
		clearTimeout(里程碑定时器);
		里程碑定时器 = undefined;
	};
	addEventListener("pagehide", 页面隐藏监听);
	/** @param {PageTransitionEvent} 事件 */
	const 页面显示监听 = 事件 => {
		if (!事件.persisted) return;
		可见开始 = document.visibilityState === "visible" ? performance.now() : null;
		安排里程碑();
	};
	addEventListener("pageshow", 页面显示监听);

	/** 已记录 scroll 类型后，后续滚动不会再改变 interaction1~3，解除这个高频监听 */
	function 解除滚动监听() {
		removeEventListener("scroll", 滚动监听, true);
		clearTimeout(滚动监听定时器);
	}

	/**
	 * 所有里程碑都已结算（最后一个也不再挂起）后解除全部监听，避免继续为空转的事件回调消耗性能。
	 * 交互监听在此之前一直保留，因为 interaction1~3 仍需随每次上报采样
	 */
	function 解除监听() {
		removeEventListener("pointerdown", 指针按下监听, true);
		removeEventListener("keydown", 键盘按下监听, true);
		解除滚动监听();
		document.removeEventListener("visibilitychange", 可见性变更监听);
		removeEventListener("pagehide", 页面隐藏监听);
		removeEventListener("pageshow", 页面显示监听);
		clearTimeout(里程碑定时器);
		里程碑定时器 = undefined;
	}

	/** 所有里程碑都已结算（已上报或抛弃）时解除监听 */
	function 检查是否结束() {
		if (里程碑下标 >= 里程碑.length && 挂起下标 === null) 解除监听();
	}

	安排里程碑();
	//#endregion
})();
