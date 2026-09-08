/**
 * @fileoverview 为 /blog.html 渲染博客相关元素
 * @author dsy4567
 * @license
 * Copyright (c) 2026 dsy4567
 * SPDX-License-Identifier: MIT
 */
// @ts-check
"use strict";

let /** @type {文章信息[]} */ 所有文章信息 = [],
	路径 = 获取清理后的路径(true);

添加脚本("/js/lib/highlight.min.js");
添加样式("/css/hl.min.css");

/**
 * 高亮目标元素中的代码
 * @param {Element} 目标 目标元素
 */
async function 高亮代码(目标) {
	return 添加脚本("/js/lib/highlight.min.js").then(() => {
		批量低阻塞操作(目标.querySelectorAll("pre > code"), (元素, 索引) => {
			hljs.highlightElement(元素);
			const s = 元素.classList[0]?.split("-")[1];
			元素.setAttribute("data-lang", hljs.getLanguage(s)?.name || "未知");
		});
	});
}
/**
 *
 * @param {文章信息} 当前文章信息
 */
async function 渲染文章(当前文章信息) {
	// /blog/<id>/
	try {
		if (!location.pathname.endsWith("/")) location.href = `/blog/${当前文章信息.id}/`;
		const 右 = qs("main .右", true);
		if (!右) return;

		//#region 渲染文章正文
		if (当前文章信息.url) {
			let t = await (await fetch(当前文章信息.url)).text();

			// 解析 Markdown、追加许可与元信息
			let sect = ce("section"),
				html = t && marked.parse(t),
				span = ce("span");
			sect.innerHTML =
				html +
				(html.includes('<nocopyright value="true"></nocopyright>')
					? ""
					: '<hr />如无特别说明，本作品采用<a rel="license" href="https://www.creativecommons.org/licenses/by-sa/4.0/">CC BY-NC-SA 4.0</a>进行许可。<br />');

			span.innerHTML = `发表于: ${new Date(
				当前文章信息.date
			).toLocaleString()}, 更新于: ${new Date(
				当前文章信息.updated
			).toLocaleString()}</br>标签: ${(() => {
				let html = "";
				for (const 标签 of 当前文章信息.tags)
					html += `<a href="/blog.html?tag=${标签}">${标签}</a> `;
				return html;
			})()}`;
			span.classList.add("元数据");
			sect.append(span);
			// 设置大小和懒加载
			for (const img of sect.getElementsByTagName("img")) {
				const m = img.alt.match(/^s:[0-9]+(\.[0-9]+)?x[0-9]+(\.[0-9]+)?/gi);
				if (!m) continue;
				img.alt = img.alt.replace(m[0], "");
				img.loading = "lazy";
				[img.width, img.height] = m[0]
					.replaceAll("s:", "")
					.split("x")
					.map(s => +s);
			}
			gd("正在加载文章提示")?.replaceWith(sect);

			// 更新标题和 SEO 元数据
			document.title =
				(sect.querySelector("h1")?.innerText || "无标题") + " | " + document.title;
			qs("meta[name='description']")?.setAttribute(
				"content",
				sect.querySelector("p")?.innerText || "此文章无法提供描述"
			);
			qs('meta[property="og:description"]')?.setAttribute(
				"content",
				sect.querySelector("p")?.innerText || "此文章无法提供描述"
			);
			qs('meta[property="og:title"]')?.setAttribute(
				"content",
				(sect.querySelector("h1")?.innerText || "无标题") + " | " + document.title
			);
			qs('meta[property="og:url"]')?.setAttribute(
				"content",
				`https://dsy4567.github.io/blog/${当前文章信息.id}/`
			);
			qs('meta[property="og:image"]')?.setAttribute("content", 当前文章信息.cover);
		}
		//#endregion

		//#region 目录
		let 目录 = ce("section"),
			根列表 = ce("ul"),
			// 列表栈: 列表栈[i] 为第 i+1 级的 ul, 栈顶为当前条目的插入位置
			列表栈 = [根列表],
			上一级别 = 1;
		const 标题元素们 = 右.querySelectorAll("h1, h2, h3, h4, h5, h6"),
			最小级别 = Math.min(...[...标题元素们].map(元素 => +元素.tagName[1]), 6);
		for (const 元素 of 标题元素们) {
			if (元素.id && !元素.className.includes("可固定") && !元素.querySelector("a")) {
				元素.addEventListener("click", () => {
					location.hash = 元素.id;
				});
				元素.classList.add("可固定");
			}
			// 以最小的标题级别为第 1 级, 换算当前标题的相对层级
			const 级别 = +元素.tagName[1] - 最小级别 + 1;
			if (级别 > 上一级别)
				// 下潜: 为每一级创建子列表, 挂到上一层最后一个条目下
				for (let i = 上一级别; i < 级别; i++) {
					const 父列表 = 列表栈[列表栈.length - 1],
						子列表 = ce("ul");
					(父列表.lastElementChild || 父列表).append(子列表);
					列表栈.push(子列表);
				}
			else if (级别 < 上一级别)
				// 回退: 裁掉栈中更深层的列表
				列表栈.length = 级别 + 1;
			let li = ce("li"),
				a = ce("a");
			a.innerText = /** @type {HTMLElement} */ (元素).innerText;
			a.href = "#" + 元素.id;
			li.append(a);
			列表栈[列表栈.length - 1].append(li);
			上一级别 = 级别;
		}
		目录.insertAdjacentHTML(
			"afterbegin",
			'<h2><svg class="小尺寸" data-icon="目录"></svg><span>目录</span></h2>'
		);
		目录.classList.add("目录");
		目录.append(根列表);
		qs("main > .左", true)?.append(目录);
		_global["main.js"]().渲染图标();
		//#endregion

		//#region 高亮
		高亮代码(右);
		//#endregion

		//#region 收尾
		显示或隐藏进度条(false);

		if (location.hash)
			// 滚动到hash位置
			// 不能通过赋值 location.hash（置空再恢复）触发滚动：赋值 hash 属于 fragment 导航，
			// 会 push 新历史条目，既污染后退栈，也会清空前进栈（导致后退后前进按钮变灰）
			try {
				let 目标 = qs(`[id="${decodeURI(location.hash.substring(1))}"]`);
				目标?.nextElementSibling?.classList.add("标记");
				目标?.scrollIntoView({
					behavior: "smooth",
				});
			} catch (e) {}
		else if (已触发动态加载)
			右.scrollIntoView({
				behavior: "smooth",
			});
		//#endregion

		//#region 评论区
		当前文章信息.issue &&
			fetch(
				`https://api.github.com/repos/dsy4567/dsy4567.github.io/issues/${当前文章信息.issue}/comments`
			)
				.then(
					res =>
						new Promise((resolve, reject) => {
							延迟执行(
								"关键任务完成",
								() => {
									resolve(res.json());
								},
								3
							);
						})
				)
				.then(async j => {
					if (typeof j !== "object") j = [];
					// prettier-ignore
					let html = `
<h2>
	<svg data-icon="评论" class="小尺寸"></svg>
	<span>评论</span>
</h2>
<section>
	<a
		id="评论链接"
		href="https://github.com/dsy4567/dsy4567.github.io/issues/${当前文章信息.issue}#issue-comment-box"
	>在 GitHub 上发表评论</a>
</section>
${(() => {
	let h = "";
	for (const 评论 of (j || []))
		h += `
<section class="评论">
	<div class="用户信息">
		<a href="${评论.user.html_url}"><img
			class="头像 小尺寸"
			src="${评论.user.avatar_url}"
			alt="的头像"
		/></a>
		<span class="用户名"><a href="${评论.user.html_url}">${评论.user.login}</a></span>
	</div>
	<div class="评论正文">${marked.parse(评论.body)}</div>
	<span class="元数据">发表于: ${new Date(评论.created_at).toLocaleString()} 更新于: ${new Date(评论.updated_at).toLocaleString()}</span><br />
	<span class="元数据">${(() => {
			let emojis = {
					"+1": "👍",
					"-1": "👎",
					laugh: "😀",
					hooray: "🎉",
					confused: "😕",
					heart: "❤️",
					rocket: "🚀",
					eyes: "👀",
				},
				s = "";
			Object.keys(emojis).forEach(k => {
				if (评论.reactions[k])
					// @ts-ignore
					s += emojis[k] + ": " + 评论.reactions[k] + " ";
			});
			return s;
		})()}
	</span>
</section>`;
	return h;
})()}
`;
					let sect = ce("section");
					sect.id = "评论区";
					sect.innerHTML = html;

					// 高亮
					高亮代码(sect);
					右.append(sect);
					_global["main.js"]().渲染图标();
				});
		//#endregion
	} catch (e) {
		console.error(e);
		阻止搜索引擎收录();
		显示或隐藏进度条(false);
		const 正在加载文章提示 = gd("正在加载文章提示");
		if (正在加载文章提示)
			正在加载文章提示.innerHTML =
				"加载失败, 加载时可能遇到了错误, 或此文章不存在。<a href=''>点击重试</a>";
	}
}

/**
 * @param {URL} u
 */
async function 渲染文章列表(u) {
	// /blog.html
	fetch("/json/blog.json")
		.then(res => {
			if (!res.ok) throw new Error("状态码异常");
			return res.json();
		})
		.then(async (/** @type {Array<文章信息>} */ j) => {
			const 右 = qs("main .右", true);
			if (!右) return;

			所有文章信息 = j;
			let 所有标签 = new Set(),
				限定标签 = u.searchParams.get("tag"),
				待添加 = [];
			for (let i = 0; i < j.length; i++) {
				const 文章 = j[i];
				//#region 渲染文章列表
				文章.tags?.forEach(标签 => 所有标签.add(标签));
				if (文章.hidden || (限定标签 && !文章.tags.includes(限定标签))) continue;
				let a = ce("a"),
					br = ce("br"),
					预览 = ce("div"),
					span = ce("span"),
					sect = ce("section"),
					鼠标已移动 = false;
				a.href = `/blog/${文章.id}/`;
				a.innerText = "阅读更多";
				预览.innerHTML = marked.parse(文章.desc);
				span.innerHTML = `发表于: ${new Date(
					文章.date
				).toLocaleString()}, 更新于: ${new Date(
					文章.updated
				).toLocaleString()}</br>标签: ${(() => {
					let html = "";
					文章.tags.forEach(标签 => {
						html += `<a href="/blog.html?tag=${标签}">${标签}</a> `;
					});
					return html;
				})()}`;
				span.classList.add("元数据");
				sect.append(预览, a, br, span);
				//#endregion

				//#region 设置大小和懒加载、文字选中优化
				for (const img of sect.getElementsByTagName("img")) {
					const m = img.alt.match(/^s:[0-9]+(\.[0-9]+)?x[0-9]+(\.[0-9]+)?/gi);
					if (!m) continue;
					img.alt = img.alt.replace(m[0], "");
					img.loading = "lazy";
					[img.width, img.height] = m[0]
						.replaceAll("s:", "")
						.split("x")
						.map(s => +s);
				}

				sect.addEventListener("mousedown", 事件 => {
					鼠标已移动 = false;
				});
				sect.addEventListener("mousemove", 事件 => {
					鼠标已移动 = true;
				});
				sect.addEventListener("click", 事件 => {
					if (
						// @ts-ignore
						事件.target?.tagName !== "A" &&
						// @ts-ignore
						事件.target?.parentElement?.tagName !== "A" &&
						!鼠标已移动
					)
						_global["main.js"]().动态加载(a);
				});
				//#endregion

				待添加.push(sect);
			}
			await schedulerYield();
			gd("正在加载文章提示")?.replaceWith(...待添加);

			//#region 渲染标签列表
			let 标签元素 = ce("section"),
				div = ce("div");
			所有标签.forEach(标签 => {
				let a = ce("a");
				a.innerText = 标签;
				a.href = "?tag=" + 标签;
				if (标签 === 限定标签) {
					a.style.border = "1px solid var(--text-color)";
					document.title = "标签：" + 标签 + " | " + document.title;
				}
				div.append(a);
			});
			标签元素.insertAdjacentHTML(
				"afterbegin",
				'<h2><svg class="小尺寸" data-icon="标签"></svg><span>标签</span></h2>'
			);
			[...(document.getElementsByClassName("标签") || [])]?.forEach(元素 => {
				元素.remove();
			});

			标签元素.classList.add("标签");
			标签元素.append(div);
			qs("main > .左", true)?.append(标签元素);
			_global["main.js"]().渲染图标();
			//#endregion

			//#region 收尾、滚动视图、高亮
			显示或隐藏进度条(false);
			if (!location.hash && 已触发动态加载)
				右.scrollIntoView({
					behavior: "smooth",
				});

			高亮代码(右);
			//#endregion
		})
		.catch(e => {
			console.error(e);
			阻止搜索引擎收录();
			显示或隐藏进度条(false);
			const 正在加载文章提示 = gd("正在加载文章提示");
			if (正在加载文章提示) 正在加载文章提示.innerHTML = "加载失败，<a href=''>点击重试</a>";
		});
}

export async function main(/** @type {String} */ 路径) {
	// @ts-ignore
	await import("/js/lib/marked.min.js");

	//#region 初始化: 解析地址参数与文章信息, 旧版 ?id= 参数重定向到新路径
	const u = new URL(location.href),
		id = u.searchParams.get("id"),
		/** @type {文章信息 | null} */ 当前文章信息 = gd("当前文章信息")
			? // @ts-ignore
				JSON.parse(gd("当前文章信息")?.text)
			: null;
	gd("当前文章信息")?.remove();
	if (id) location.href = `/blog/${id}/`;
	//#endregion

	if (当前文章信息) 渲染文章(当前文章信息);
	else if (获取清理后的路径() === "/blog") 渲染文章列表(u);
}

// 判断是否仅hash变化，如果不是则移除目录和标签元素
addEventListener("URL发生变化", () => {
	if (路径 !== 获取清理后的路径(true)) {
		路径 = 获取清理后的路径(true);
		[
			...(document.getElementsByClassName("目录") || []),
			...(document.getElementsByClassName("标签") || []),
		]?.forEach(元素 => {
			元素.remove();
		});
	}
});

_global["blog.js"] = () => ({ 所有文章信息, 路径, main });
