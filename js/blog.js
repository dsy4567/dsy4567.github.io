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

	if (当前文章信息)
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
				span.classList.add("淡化");
				sect.append(span);
				// 设置大小和懒加载
				for (const img of sect.getElementsByTagName("img")) {
					const m = img.alt.match(/^s:[0-9]+(\.[0-9]+)?x[0-9]+(\.[0-9]+)?/gi);
					if (!m) continue;
					img.alt = img.alt.replace(m[0], "");
					img.loading = "lazy";
					[img.width, img.height] = m[0]
						.replace(/s:/g, "")
						.split("x")
						.map(s => +s);
				}
				右.append(sect);

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
			let ul = ce("ul"),
				目录 = ce("section");
			let t1 = [0, 0, 0, 0, 0, 0],
				t2 = 0,
				t3 = 0;
			for (const 元素 of 右.querySelectorAll("h1, h2, h3, h4, h5, h6") || []) {
				if (元素.id && !元素.className.includes("可固定") && !元素.querySelector("a")) {
					元素.innerHTML = `<a href="#${元素.id}">${元素.innerHTML}</a>`;
					元素.classList.add("可固定");
				}
				t3 = { H1: 0, H2: 1, H3: 2, H4: 3, H5: 4, H6: 5 }[元素.tagName] || 0;
				if (t2 < t3) t2 = t3;
				else if (t2 > t3) {
					t1[t2] = 0;
					t2 = t3;
				}
				t1[t2]++;
				let li = ce("li"),
					a = ce("a");
				a.innerText =
					// @ts-ignore
					t1.join(".").replace(/\.0/g, "") + " " + 元素.innerText;
				a.href = "#" + 元素.id;
				li.append(a);
				ul.append(li);
			}
			目录.insertAdjacentHTML(
				"afterbegin",
				'<h2><svg class="小尺寸" data-icon="目录"></svg><span>目录</span></h2>'
			);
			目录.append(ul);
			目录.classList.add("目录");
			qs("main > .左", true)?.append(目录);
			//#endregion

			//#region 高亮
			添加脚本("/js/lib/highlight.min.js").then(() =>
				右.querySelectorAll("pre > code").forEach(元素 => {
					hljs.highlightElement(元素);
					const s = 元素.classList[0]?.split("-")[1];
					元素.setAttribute("data-lang", hljs.getLanguage(s)?.name || "未知");
				})
			);
			//#endregion

			//#region 收尾
			gd("正在加载文章提示")?.remove();
			显示或隐藏进度条(false);
			_global["main.js"]().添加点击事件和设置图标();
			if (location.hash) {
				// 滚动到hash位置
				try {
					qs(`[id="${decodeURI(location.hash.substring(1))}"] + *`)?.classList.add(
						"标记"
					);
				} catch (e) {}
				let h = location.hash;
				location.hash = "";
				location.hash = h;
			} else if (可以滚动到视图中)
				右.scrollIntoView({
					behavior: "smooth",
				});
			//#endregion

			//#region 评论区
			当前文章信息.issue &&
				fetch(
					`https://api.github.com/repos/dsy4567/dsy4567.github.io/issues/${当前文章信息.issue}/comments`
				)
					.then(res => res.json())
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
	<span class="淡化">发表于: ${new Date(评论.created_at).toLocaleString()} 更新于: ${new Date(评论.updated_at).toLocaleString()}</span><br />
	<span class="淡化">${(() => {
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
						添加脚本("/js/lib/highlight.min.js").then(() =>
							sect.querySelectorAll("pre > code").forEach(元素 => {
								hljs.highlightElement(元素);
								const s = 元素.classList[0]?.split("-")[1];
								元素.setAttribute("data-lang", hljs.getLanguage(s)?.name || "未知");
							})
						);
						右.append(sect);
						_global["main.js"]().添加点击事件和设置图标();
					});
			//#endregion
		} catch (e) {
			console.error(e);
			阻止搜索引擎收录();
			显示或隐藏进度条(false);
			const 正在加载文章提示 = gd("正在加载文章提示");
			if (正在加载文章提示)
				正在加载文章提示.innerText = "加载失败, 加载时可能遇到了错误, 或此文章不存在";
		}
	else if (获取清理后的路径() === "/blog")
		// /blog.html
		fetch("/json/blog.json")
			.then(res => {
				if (!res.ok) throw new Error("状态码异常");
				return res.json();
			})
			.then((/** @type {Array<文章信息>} */ j) => {
				const 右 = qs("main .右", true);
				if (!右) return;

				所有文章信息 = j;
				let 所有标签 = new Set(),
					限定标签 = u.searchParams.get("tag");
				for (const 文章 of j) {
					//#region 渲染文章列表
					文章.tags?.forEach(标签 => 所有标签.add(标签));
					if (文章.hidden || (限定标签 && !文章.tags.includes(限定标签))) continue;
					let a = ce("a"),
						br = ce("br"),
						p = ce("p"),
						span = ce("span"),
						sect = ce("section"),
						鼠标已移动 = false;
					a.href = `/blog/${文章.id}/`;
					a.innerText = "阅读更多";
					p.innerHTML = marked.parse(文章.desc);
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
					span.classList.add("淡化");
					sect.append(p, a, br, span);
					//#endregion

					//#region 设置大小和懒加载、文字选中优化
					for (const img of sect.getElementsByTagName("img")) {
						const m = img.alt.match(/^s:[0-9]+(\.[0-9]+)?x[0-9]+(\.[0-9]+)?/gi);
						if (!m) continue;
						img.alt = img.alt.replace(m[0], "");
						img.loading = "lazy";
						[img.width, img.height] = m[0]
							.replace(/s:/g, "")
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

					右.append(sect);
				}

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
				//#endregion

				//#region 收尾、滚动视图、高亮
				显示或隐藏进度条(false);
				gd("正在加载文章提示")?.remove();
				_global["main.js"]().添加点击事件和设置图标();
				if (!location.hash && 可以滚动到视图中)
					右.scrollIntoView({
						behavior: "smooth",
					});

				添加脚本("/js/lib/highlight.min.js").then(() => hljs.highlightAll());
				document.querySelectorAll("pre > code").forEach(元素 => {
					const s = 元素.classList[0]?.split("-")[1];
					元素.setAttribute("data-lang", hljs.getLanguage(s)?.name || "未知");
				});
				//#endregion
			})
			.catch(e => {
				console.error(e);
				阻止搜索引擎收录();
				显示或隐藏进度条(false);
				const 正在加载文章提示 = gd("正在加载文章提示");
				if (正在加载文章提示) 正在加载文章提示.innerText = "加载失败";
			});
}

// 判断是否仅hash变化，如果是则移除目录和标签元素
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
