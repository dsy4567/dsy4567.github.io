/* Copyright (c) 2023 dsy4567, view license at <https://github.com/dsy4567/dsy4567.github.io/blob/main/LICENSE.md> */

const axios = require("axios").default;
const cheerio = require("cheerio");
const fs = require("fs");
const jsonfile = require("jsonfile");
const marked = require("marked");
const hostname = "dsy4567.github.io";

let articles = [],
	htmls = {};
let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
<url>
    <loc>https://${hostname}/</loc>
    <lastmod>2023-08-23T15:11:58.607Z</lastmod>
</url>
<url>
    <loc>https://${hostname}/blog.html</loc>
    <lastmod>2023-08-23T15:11:58.607Z</lastmod>
</url>
<url>
    <loc>https://${hostname}/friends.html</loc>
    <lastmod>2023-08-23T15:11:58.607Z</lastmod>
</url>
<url>
    <loc>https://${hostname}/game.html</loc>
    <lastmod>2023-08-23T15:11:58.607Z</lastmod>
</url>`,
	rss = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="https://www.w3.org/2005/Atom">
    <title>博客 | dsy4567 的小站</title>
    <link rel="alternate" type="text/html" href="https://${hostname}/blog.html" />
    <link rel="self" type="application/atom+xml" href="https://${hostname}/rss.xml" />
    <updated>2023-01-22T12:48:59.719Z</updated>
    <generator uri="https://github.com/dsy4567/dsy4567.github.io/">dsy4567/dsy4567.github.io</generator>
`,
	readme = `## 📚 文章列表

> **Note**: 在 <https://dsy4567.cf/blog.html> 上阅读体验更佳

`;

let f = fs.readdirSync("./blog-md/");
f.forEach(file => {
	if (file && fs.statSync("./blog-md/" + file).isDirectory()) {
		const md = fs
				.readFileSync("./blog-md/" + file + "/index.md")
				.toString()
				.replaceAll("\r", ""),
			parsedHtml = marked.marked(md);

		const $ = cheerio.load(parsedHtml);
		let j = jsonfile.readFileSync("./blog-md/" + file + "/article.json");
		j.id = file;
		j.title = $("h1").text();
		j.desc = md.split("<!-- more -->")[0];
		const $2 = cheerio.load(marked.marked(j.desc));
		$2("h1").remove();
		j.desc_text =
			($2
				.text()
				.replaceAll("\n", " ")
				.replaceAll(/(^[ ]|[ ]$)/g, "") || "此文章无法提供描述") + "...";
		j.updated = j.updated || new Date();
		j.date = j.date || new Date();
		j.cover =
			j.cover ||
			new URL(
				$("img").attr("src") || "https://dsy4567.github.io/img/bg.jpg",
				"https://dsy4567.github.io/"
			);
		j.issue = j.issue || null;
		htmls[j.id] = parsedHtml;
		articles.push(j);
	}
});

articles.sort((a, b) => +new Date(b.date) - +new Date(a.date));
jsonfile.writeFileSync("./json/blog.json", articles, { spaces: 4 });

articles.forEach(a => {
	rss += `
<entry>
    <title>${a.title}</title>
    <link rel="alternate" type="text/html" href="https://${hostname}/blog.html?id=${a.id}" />
    <id>${a.id}</id>
    <published>${a.date}</published>
    <updated>${a.updated}</updated>
    <summary>${cheerio.load(marked.marked(a.desc)).text()}</summary>
    <author>
        <name>dsy4567</name>
        <uri>https://${hostname}/</uri>
    </author>
    <category term="Default" />
    <content type="html" xml:lang="zh-cn">
        <![CDATA[
${htmls[a.id]}
        ]]>
    </content>
</entry>`;
	sitemap += `
<url>
    <loc>https://${hostname}/blog.html?id=${a.id}</loc>
    <lastmod>${a.updated}</lastmod>
</url>`;
	readme += `[${a.title}](./${a.id}/index.md)\n\n`;
});

rss += "</feed>";
sitemap += "</urlset>";
readme += `
## ⚖️ 许可证

[知识共享署名-相同方式共享 4.0 国际许可协议](./LICENSE.txt)
`;

fs.writeFileSync("./rss.xml", rss);
fs.writeFileSync("./sitemap.xml", sitemap);
fs.writeFileSync("./blog-md/README.md", readme);

axios
	.get("https://ncm.vercel.dsy4567.cf/playlist/track/all?id=8219428260", {
		responseType: "json",
	})
	.then(res => {
		let j = res.data;
		delete j.privileges;
		jsonfile.writeFileSync("./json/ncm.json", j);
	});
