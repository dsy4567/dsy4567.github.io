/* Copyright (c) 2026 dsy4567, view license at <https://github.com/dsy4567/dsy4567.github.io/blob/main/LICENSE.md> */
// @ts-check

const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const jsonfile = require("jsonfile");
const { marked } = require("marked");

// ==================== 配置 ====================

/**
 * 全局构建配置（路径均相对于项目根目录）
 */
const CONFIG = {
	// 面子工程：对外展示、SEO、社交分享
	primaryDomain: "dsy4567.icu",
	// 兜底工程：GitHub Pages 保险
	fallbackDomain: "dsy4567.github.io",

	blogDir: "./blog",
	templatePath: "./blog.html",
	outputJsonPath: "./json/blog.json",
	rssPath: "./rss.xml",
	sitemapPath: "./sitemap.xml",
	blogIndexPath: "./blog/index.html",
	ncmPlaylistId: 9123680760,
	ncmOutputPath: "./json/ncm.json",
	defaultCover: "https://dsy4567.github.io/img/bg.jpg",
	timezone: "Asia/Shanghai",
};

// ==================== 类型定义 ====================

/**
 * 文章元数据（article.json 原始字段 + 构建时补全的字段）
 * @typedef {object} 文章元数据
 * @property {string} id - 文章目录名，同时作为 URL 标识
 * @property {string} title - 文章标题（取自 Markdown 首个 h1）
 * @property {string} desc - 描述 Markdown 原文（`<!-- more -->` 之前的内容）
 * @property {string} desc_text - 描述纯文本（去除 HTML 标签后）
 * @property {Date|string} date - 发表时间
 * @property {Date|string} updated - 更新时间
 * @property {string} cover - 封面图 URL
 * @property {string|null} issue - 关联的 GitHub Issue 链接，无则为 null
 * @property {string[]} tags - 标签列表
 * @property {string} [url] - 外链文章地址（存在时页面仅显示加载提示）
 * @property {string} [html] - 渲染后的文章 HTML（仅存在于聚合数据中，输出 JSON 时剔除）
 */

/**
 * 单篇文章的构建结果
 * @typedef {object} 构建结果
 * @property {文章元数据} meta - 补全后的文章元数据
 * @property {string} processedHtml - 处理后的文章 HTML
 */

/**
 * 统一域名入口
 * @param {"public"|"infra"} [type="public"] - 域名类型："public" 主域名，"infra" 兜底域名
 * @returns {string} 对应域名
 */
function getDomain(type = "public") {
	if (type === "public") return CONFIG.primaryDomain;
	if (type === "infra") return CONFIG.fallbackDomain;
	return CONFIG.fallbackDomain;
}

// ==================== 工具函数 ====================

/**
 * 转义 HTML 特殊字符（< > & "）
 * @param {string} str - 待转义字符串
 * @returns {string} 转义后的字符串
 */
function escapeHtml(str) {
	/** @type {Record<string, string>} HTML 实体映射表 */
	const map = { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" };
	return str.replace(/[<>&"]/g, c => map[c]);
}

/**
 * 读取博客页面模板
 * @returns {string} 模板 HTML 内容
 */
function loadTemplate() {
	return fs.readFileSync(CONFIG.templatePath, "utf-8");
}

/**
 * 从图片 alt 文本解析尺寸信息（格式：s:宽x高，如 s:800x600）
 * @param {string} altText - 图片 alt 文本
 * @returns {{ width: number, height: number, cleanAlt: string }|null} 尺寸与清理后的 alt，无匹配时返回 null
 */
function parseImageSize(altText) {
	const match = altText.match(/^s:[0-9]+(?:\.[0-9]+)?x[0-9]+(?:\.[0-9]+)?/i);
	if (!match) return null;
	const [w, h] = match[0].replace("s:", "").split("x").map(Number);
	return { width: w, height: h, cleanAlt: altText.replace(match[0] + " ", "") };
}

/**
 * 处理文章内图片：解析 alt 中的尺寸写入 width/height 属性，并开启懒加载
 * @param {string} html - 文章 HTML
 * @returns {string} 处理后的 HTML
 */
function processArticleImages(html) {
	const $ = cheerio.load(html);
	$("img").each((_, el) => {
		const img = $(el);
		const alt = img.attr("alt") || "";
		const sizeInfo = parseImageSize(alt);
		if (sizeInfo) {
			img.attr("alt", sizeInfo.cleanAlt);
			img.attr("width", String(sizeInfo.width));
			img.attr("height", String(sizeInfo.height));
		}
		img.attr("loading", "lazy");
	});
	return /** @type {string} */ ($("body").html());
}

/**
 * 生成文章摘要：去除 h1 与 HTML 标签后的纯文本
 * @param {string} descMarkdown - 描述 Markdown 原文
 * @returns {string} 摘要文本（以 ... 结尾）
 */
function generateSummary(descMarkdown) {
	const html = marked(descMarkdown);
	const $ = cheerio.load(html);
	$("h1").remove();
	const text = $.text()
		.replace(/\n/g, " ")
		.replace(/(^ | $)/g, "")
		.trim();
	return (text || "此文章无法提供描述") + "...";
}

/**
 * 格式化日期为中文本地时间文本
 * @param {Date|string} date - 日期对象或可被 Date 解析的字符串
 * @returns {string} 格式化后的日期文本
 */
function formatDate(date) {
	return new Date(date).toLocaleString("zh-CN", { timeZone: CONFIG.timezone });
}

/**
 * 替换模板中 BEGIN/END 标记的区块内容
 * @param {string} template - 模板 HTML
 * @param {string} blockName - 区块名（对应 <!-- BEGIN xxx --> 与 <!-- END xxx -->）
 * @param {string} content - 新的区块内容
 * @returns {string} 替换后的模板
 */
function replaceTemplateBlock(template, blockName, content) {
	const regex = new RegExp(`<!-- BEGIN ${blockName} -->.+<!-- END ${blockName} -->`, "s");
	return template.replace(
		regex,
		`<!-- BEGIN ${blockName} -->\n${content}\n\t\t<!-- END ${blockName} -->`
	);
}

// ==================== 文章处理器 ====================

/**
 * 文章构建器：解析单篇文章的 Markdown 与元数据，并基于模板渲染最终页面
 */
class ArticleBuilder {
	/**
	 * @param {string} template - 博客页面模板 HTML
	 */
	constructor(template) {
		this.template = template;
	}

	/**
	 * 构建单篇文章：解析 Markdown 与元数据，补全缺失字段
	 * @param {string} articleDir - blog/ 下的文章目录名
	 * @returns {构建结果|null} 构建结果；目录或必需文件（index.md、article.json）缺失时返回 null
	 */
	build(articleDir) {
		const dirPath = path.join(CONFIG.blogDir, articleDir);
		if (!fs.statSync(dirPath).isDirectory()) return null;

		const mdPath = path.join(dirPath, "index.md");
		const metaPath = path.join(dirPath, "article.json");
		if (!fs.existsSync(mdPath) || !fs.existsSync(metaPath)) return null;

		const rawMd = fs.readFileSync(mdPath, "utf-8").replaceAll("\r", "");
		const parsedHtml = marked(rawMd);
		const $ = cheerio.load(parsedHtml);

		const meta = /** @type {Partial<文章元数据>} */ (jsonfile.readFileSync(metaPath));
		meta.id = articleDir;
		meta.title = $("h1").text() || "无标题";

		const descMarkdown = rawMd.split("<!-- more -->")[0] || "";
		meta.desc = descMarkdown;
		meta.desc_text = generateSummary(descMarkdown);

		meta.updated = meta.updated || new Date();
		meta.date = meta.date || new Date();

		const firstImg = $("img").attr("src");
		meta.cover =
			meta.cover ||
			new URL(firstImg || CONFIG.defaultCover, `https://${getDomain("infra")}/`).href;

		meta.issue = meta.issue || null;
		meta.tags = meta.tags || [];

		const processedHtml = processArticleImages(parsedHtml);

		return /** @type {构建结果} */ ({ meta, processedHtml });
	}

	/**
	 * 渲染文章页面（SEO/OG 标签、许可与标签信息）并写入 index.html
	 * @param {构建结果} article - 构建结果
	 * @returns {文章元数据} 补全后的文章元数据
	 */
	renderPage(article) {
		const { meta, processedHtml } = article;
		let html = this.template;

		// 移除 noscript 区块
		html = html.replace(/<!-- BEGIN NOSCRIPT -->.+<!-- END NOSCRIPT -->/s, "");

		const metaDesc = escapeHtml(
			meta.desc_text || "dsy4567 的博客 - 记录 dsy4567 的折腾经验、技术分享、编程笔记"
		);
		const metaTitle = escapeHtml(`${meta.title} | 博客 | dsy4567 的小站`);

		// SEO Meta + Canonical
		html = replaceTemplateBlock(
			html,
			"META",
			`\t\t<meta name="description" content="${metaDesc}" />\n\t\t` +
				`<title>${metaTitle}</title>\n\t\t` +
				`<link rel="canonical" href="https://${getDomain("public")}/blog/${meta.id}/" />`
		);

		// Open Graph
		html = replaceTemplateBlock(
			html,
			"OG",
			`\t\t<meta property="og:url" content="https://${getDomain("public")}/blog/${meta.id}/" />\n\t\t` +
				`<meta property="og:type" content="article" />\n\t\t` +
				`<meta property="og:title" content="${metaTitle}" />\n\t\t` +
				`<meta property="og:description" content="${escapeHtml(meta.desc_text || "记录 dsy4567 的折腾经验、技术分享、编程笔记")}" />\n\t\t` +
				`<meta property="og:image" content="${meta.cover || CONFIG.defaultCover}" />`
		);

		const hasNoCopyright = processedHtml.includes('<nocopyright value="true"></nocopyright>');
		const licenseHtml = hasNoCopyright
			? ""
			: `<hr />如无特别说明，本作品采用<a rel="license" href="https://www.creativecommons.org/licenses/by-sa/4.0/">CC BY-NC-SA 4.0</a>进行许可。<br />`;

		const tagsHtml = meta.tags
			.map(tag => `<a href="/blog.html?tag=${tag}">${tag}</a>`)
			.join(" ");

		const mainContent = meta.url
			? `\t\t\t\t<section id="正在加载文章提示">\n\t\t\t\t\t正在加载文章\n\t\t\t\t\t\t<noscript>在<a href="https://github.com/dsy4567/dsy4567.github.io/tree/main/blog">GitHub</a>上阅读文章</noscript>\n\t\t\t\t</section>`
			: `\t\t\t\t<section>\n${processedHtml}${licenseHtml}\n<span class="淡化">发表于: ${formatDate(meta.date)}, 更新于: ${formatDate(meta.updated)}</br>标签: ${tagsHtml}</span>\n\t\t\t\t</section>`;

		html = replaceTemplateBlock(
			html,
			"MAIN",
			`${mainContent}\n\t\t\t\t<script id="当前文章信息" type="application/json">${JSON.stringify(meta)}</script>`
		);

		const outputPath = path.join(CONFIG.blogDir, meta.id, "index.html");
		fs.writeFileSync(outputPath, html);
		return meta;
	}
}

// ==================== 聚合文件生成器 ====================

/**
 * 聚合文件生成器：生成博客 JSON、Atom RSS、站点地图与博客索引页
 */
class SiteGenerator {
	/**
	 * @param {文章元数据[]} articles - 文章元数据列表（构造时按更新时间倒序排序）
	 */
	constructor(articles) {
		this.articles = articles.sort((a, b) => +new Date(b.date) - +new Date(a.date));
	}

	/**
	 * 生成 Atom 格式的 RSS 订阅源，写入 rss.xml
	 * @returns {void}
	 */
	generateRss() {
		let xml =
			`<?xml version="1.0" encoding="UTF-8"?>\n<feed xmlns="https://www.w3.org/2005/Atom">\n` +
			`    <title>博客 | dsy4567 的小站</title>\n` +
			`    <link rel="alternate" type="text/html" href="https://${getDomain("infra")}/blog.html" />\n` +
			`    <link rel="self" type="application/atom+xml" href="https://${getDomain("infra")}/rss.xml" />\n` +
			`    <updated>2023-01-22T12:48:59.719Z</updated>\n` +
			`    <generator uri="https://github.com/dsy4567/dsy4567.github.io/">dsy4567/dsy4567.github.io</generator>\n`;

		for (const a of this.articles) {
			const summaryText = a.desc_text; // 复用缓存
			xml +=
				`    <entry>\n` +
				`        <title>${a.title}</title>\n` +
				`        <link rel="alternate" type="text/html" href="https://${getDomain("infra")}/blog/${a.id}/" />\n` +
				`        <id>${a.id}</id>\n` +
				`        <published>${a.date}</published>\n` +
				`        <updated>${a.updated}</updated>\n` +
				`        <summary>${summaryText}</summary>\n` +
				`        <author>\n` +
				`            <name>dsy4567</name>\n` +
				`            <uri>https://${getDomain("infra")}/</uri>\n` +
				`        </author>\n` +
				`        <category term="Default" />\n` +
				`        <content type="html" xml:lang="zh-cn">\n            <![CDATA[\n${a.html}\n            ]]>\n        </content>\n` +
				`    </entry>\n`;
		}
		xml += "</feed>";
		fs.writeFileSync(CONFIG.rssPath, xml);
	}

	/**
	 * 生成站点地图，写入 sitemap.xml
	 * @returns {void}
	 */
	generateSitemap() {
		let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">\n`;
		const staticPages = [
			{ loc: `https://${getDomain("public")}/`, lastmod: "2023-08-23T15:11:58.607Z" },
			{
				loc: `https://${getDomain("public")}/blog.html`,
				lastmod: "2023-08-23T15:11:58.607Z",
			},
			{
				loc: `https://${getDomain("public")}/friends.html`,
				lastmod: "2023-08-23T15:11:58.607Z",
			},
			{
				loc: `https://${getDomain("public")}/game.html`,
				lastmod: "2023-08-23T15:11:58.607Z",
			},
		];
		for (const p of staticPages)
			xml += `    <url>\n        <loc>${p.loc}</loc>\n        <lastmod>${p.lastmod}</lastmod>\n    </url>\n`;

		for (const a of this.articles)
			xml += `    <url>\n        <loc>https://${getDomain("public")}/blog/${a.id}/</loc>\n        <lastmod>${a.updated}</lastmod>\n    </url>\n`;

		xml += "</urlset>";
		fs.writeFileSync(CONFIG.sitemapPath, xml);
	}

	/**
	 * 生成博客索引页（静态文章目录列表），写入 blog/index.html
	 * @returns {void}
	 */
	generateBlogIndex() {
		let html = `<!DOCTYPE html>\n<html lang="zh-CN">\n\t<head>\n\t\t<meta charset="UTF-8" />\n\t\t<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n\t\t<script>location.pathname = "/blog.html";</script>\n\t</head>\n\t<body>\n`;
		for (const a of this.articles) html += `\t\t<p><a href="./${a.id}/">${a.title}</a></p>\n`;

		html += `\n\t\t<hr /><a rel="license" href="https://www.creativecommons.org/licenses/by-sa/4.0/"><img width="88" height="31" alt="知识共享许可协议" style="border-width:0;width:inherit;height:inherit;border-radius:unset;" src="/img/cc-by-sa-4.0.png" /></a><br />如无特别说明，以上作品采用<a rel="license" href="https://www.creativecommons.org/licenses/by-sa/4.0/">知识共享署名</a>进行许可。\n\t</body>\n</html>\n`;
		fs.writeFileSync(CONFIG.blogIndexPath, html);
	}

	/**
	 * 生成博客聚合 JSON（剔除文章 HTML），写入 json/blog.json
	 * @returns {void}
	 */
	generateJson() {
		const cleanArticles = this.articles.map(({ html, ...meta }) => meta);
		jsonfile.writeFileSync(CONFIG.outputJsonPath, cleanArticles, { spaces: 4 });
	}
}

// ==================== 网易云歌单任务（带错误处理）====================

/**
 * 拉取网易云歌单并写入 json/ncm.json；失败时不写入，保留旧缓存
 * @returns {Promise<void>}
 */
async function fetchNeteasePlaylist() {
	console.log("Fetching Netease playlist...");
	try {
		// NeteaseCloudMusicApi 的类型声明与实际响应结构差异较大，这里统一按 any 处理
		const { body } = await /** @type {any} */ (require("NeteaseCloudMusicApi"))
			.playlist_track_all({ id: CONFIG.ncmPlaylistId })
			.catch((/** @type {Error} */ err) => {
				console.error("Netease API failed:", err.message);
				return null;
			});

		if (!body) {
			console.warn("Skipping NCM file write due to API failure.");
			return;
		}

		delete body.privileges;
		jsonfile.writeFileSync(CONFIG.ncmOutputPath, body);
		console.log("Netease playlist saved.");
	} catch (err) {
		console.error("Unexpected error in NCM task:", /** @type {Error} */ (err).message);
		// 不写入文件，保留旧缓存
	}
}

// ==================== 主流程 ====================

/**
 * 构建主流程：逐篇构建文章页面并生成聚合文件，最后拉取网易云歌单
 * @returns {Promise<void>}
 */
async function main() {
	const template = loadTemplate();
	const builder = new ArticleBuilder(template);

	const entries = fs.readdirSync(CONFIG.blogDir);
	/** @type {文章元数据[]} 构建完成的文章列表 */
	const articles = [];

	for (const entry of entries) {
		const article = builder.build(entry);
		if (!article) continue;

		console.log(`Building: ${entry}`);
		const meta = builder.renderPage(article);
		articles.push({ ...meta, html: article.processedHtml });
	}

	console.log("Generating aggregate files...");
	const generator = new SiteGenerator(articles);
	generator.generateJson();
	generator.generateRss();
	generator.generateSitemap();
	generator.generateBlogIndex();

	await fetchNeteasePlaylist();
	console.log("Done!");
}

main().catch(console.error);
