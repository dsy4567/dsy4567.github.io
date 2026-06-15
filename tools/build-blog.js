/* Copyright (c) 2023 dsy4567, view license at <https://github.com/dsy4567/dsy4567.github.io/blob/main/LICENSE.md> */

const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const jsonfile = require("jsonfile");
const { marked } = require("marked");

// ==================== 配置 ====================
const CONFIG = {
	// 面子工程：对外展示、SEO、社交分享
	primaryDomain: "dsy4567.icu",
	// 兜底工程：GitHub Pages 原生域名，续费保险
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

// 统一域名入口
function getDomain(type = "public") {
	if (type === "public") return CONFIG.primaryDomain;
	if (type === "infra") return CONFIG.fallbackDomain;
	return CONFIG.fallbackDomain;
}

// ==================== 工具函数 ====================

function escapeHtml(str) {
	const map = { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" };
	return str.replace(/[<>&"]/g, c => map[c]);
}

function loadTemplate() {
	return fs.readFileSync(CONFIG.templatePath, "utf-8");
}

function parseImageSize(altText) {
	const match = altText.match(/^s:[0-9]+(?:\.[0-9]+)?x[0-9]+(?:\.[0-9]+)?/i);
	if (!match) return null;
	const [w, h] = match[0].replace("s:", "").split("x").map(Number);
	return { width: w, height: h, cleanAlt: altText.replace(match[0] + " ", "") };
}

function processArticleImages(html) {
	const $ = cheerio.load(html);
	$("img").each((_, el) => {
		const img = $(el);
		const alt = img.attr("alt") || "";
		const sizeInfo = parseImageSize(alt);
		if (sizeInfo) {
			img.attr("alt", sizeInfo.cleanAlt);
			img.attr("width", sizeInfo.width);
			img.attr("height", sizeInfo.height);
		}
		img.attr("loading", "lazy");
	});
	return $("body").html();
}

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

function formatDate(date) {
	return new Date(date).toLocaleString("zh-CN", { timeZone: CONFIG.timezone });
}

function replaceTemplateBlock(template, blockName, content) {
	const regex = new RegExp(`<!-- BEGIN ${blockName} -->.+<!-- END ${blockName} -->`, "s");
	return template.replace(
		regex,
		`<!-- BEGIN ${blockName} -->\n${content}\n<!-- END ${blockName} -->`
	);
}

// ==================== 文章处理器 ====================

class ArticleBuilder {
	constructor(template) {
		this.template = template;
	}

	build(articleDir) {
		const dirPath = path.join(CONFIG.blogDir, articleDir);
		if (!fs.statSync(dirPath).isDirectory()) return null;

		const mdPath = path.join(dirPath, "index.md");
		const metaPath = path.join(dirPath, "article.json");
		if (!fs.existsSync(mdPath) || !fs.existsSync(metaPath)) return null;

		const rawMd = fs.readFileSync(mdPath, "utf-8").replaceAll("\r", "");
		const parsedHtml = marked(rawMd);
		const $ = cheerio.load(parsedHtml);

		const meta = jsonfile.readFileSync(metaPath);
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

		return { meta, processedHtml };
	}

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
			`<meta name="description" content="${metaDesc}" />\n\t\t` +
				`<title>${metaTitle}</title>\n\t\t` +
				`<link rel="canonical" href="https://${getDomain("public")}/blog/${meta.id}/" />`
		);

		// Open Graph
		html = replaceTemplateBlock(
			html,
			"OG",
			`<meta property="og:url" content="https://${getDomain("public")}/blog/${meta.id}/" />\n\t\t` +
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
			? `<section id="正在加载文章提示">\n\t\t\t\t\t正在加载文章\n\t\t\t\t\t\t<noscript>在<a href="https://github.com/dsy4567/dsy4567.github.io/tree/main/blog">GitHub</a>上阅读文章</noscript>\n\t\t\t\t</section>`
			: `<section>\n${processedHtml}\n${licenseHtml}\n\t\t\t\t\t<span class="淡化">发表于: ${formatDate(meta.date)}, 更新于: ${formatDate(meta.updated)}</br>标签: ${tagsHtml}</span>\n\t\t\t\t</section>`;

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

class SiteGenerator {
	constructor(articles) {
		this.articles = articles.sort((a, b) => +new Date(b.date) - +new Date(a.date));
	}

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

	generateSitemap() {
		let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">\n`;
		const staticPages = [
			{ loc: `https://${getDomain("infra")}/`, lastmod: "2023-08-23T15:11:58.607Z" },
			{ loc: `https://${getDomain("infra")}/blog.html`, lastmod: "2023-08-23T15:11:58.607Z" },
			{
				loc: `https://${getDomain("infra")}/friends.html`,
				lastmod: "2023-08-23T15:11:58.607Z",
			},
			{ loc: `https://${getDomain("infra")}/game.html`, lastmod: "2023-08-23T15:11:58.607Z" },
		];
		for (const p of staticPages) {
			xml += `    <url>\n        <loc>${p.loc}</loc>\n        <lastmod>${p.lastmod}</lastmod>\n    </url>\n`;
		}
		for (const a of this.articles) {
			xml += `    <url>\n        <loc>https://${getDomain("infra")}/blog/${a.id}/</loc>\n        <lastmod>${a.updated}</lastmod>\n    </url>\n`;
		}
		xml += "</urlset>";
		fs.writeFileSync(CONFIG.sitemapPath, xml);
	}

	generateBlogIndex() {
		let html = `<!DOCTYPE html>\n<html lang="zh-CN">\n\t<head>\n\t\t<meta charset="UTF-8" />\n\t\t<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n\t\t<script>location.pathname = "/blog.html";</script>\n\t</head>\n\t<body>\n`;
		for (const a of this.articles) {
			html += `\t\t<p><a href="./${a.id}/">${a.title}</a></p>\n`;
		}
		html += `\n\t\t<hr /><a rel="license" href="https://www.creativecommons.org/licenses/by-sa/4.0/"><img width="88" height="31" alt="知识共享许可协议" style="border-width:0;width:inherit;height:inherit;border-radius:unset;" src="/img/cc-by-sa-4.0.png" /></a><br />如无特别说明，以上作品采用<a rel="license" href="https://www.creativecommons.org/licenses/by-sa/4.0/">知识共享署名</a>进行许可。\n\t</body>\n</html>\n`;
		fs.writeFileSync(CONFIG.blogIndexPath, html);
	}

	generateJson() {
		const cleanArticles = this.articles.map(({ html, ...meta }) => meta);
		jsonfile.writeFileSync(CONFIG.outputJsonPath, cleanArticles, { spaces: 4 });
	}
}

// ==================== 网易云歌单任务（带错误处理）====================

async function fetchNeteasePlaylist() {
	console.log("Fetching Netease playlist...");
	try {
		const { body } = await require("NeteaseCloudMusicApi")
			.playlist_track_all({ id: CONFIG.ncmPlaylistId })
			.catch(err => {
				console.error("Netease API failed:", err.message);
				return null;
			});

		if (!body) {
			console.log("Skipping NCM file write due to API failure.");
			return;
		}

		delete body.privileges;
		jsonfile.writeFileSync(CONFIG.ncmOutputPath, body);
		console.log("Netease playlist saved.");
	} catch (err) {
		console.error("Unexpected error in NCM task:", err.message);
		// 不写入文件，保留旧缓存
	}
}

// ==================== 主流程 ====================

async function main() {
	const template = loadTemplate();
	const builder = new ArticleBuilder(template);

	const entries = fs.readdirSync(CONFIG.blogDir);
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
