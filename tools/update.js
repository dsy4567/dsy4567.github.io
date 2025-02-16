/* Copyright (c) 2023 dsy4567, view license at <https://github.com/dsy4567/dsy4567.github.io/blob/main/LICENSE.md> */

const axios = require("axios").default;
const cheerio = require("cheerio");
const fs = require("fs");
const jsonfile = require("jsonfile");
const marked = require("marked");
const hostname = "dsy4567.github.io";

function html2Escape(/** @type {string} */ sHtml) {
	return sHtml.replace(/[<>&"]/g, function (c) {
		return { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c];
	});
}

const template = fs.readFileSync("./blog.html").toString();

let /** @type {{ article: any, html: string }[]} */ O = [];
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
	blog_index_html = `<!DOCTYPE html>
<html lang="zh-CN">
	<head>
		<meta charset="UTF-8" />
		<!-- for noscript -->
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<script>
			location.pathname = "/blog.html";
		</script>
	</head>
	<body>
`;

let f = fs.readdirSync("./blog/");
f.forEach((file, i) => {
	if (file && fs.statSync("./blog/" + file).isDirectory()) {
		console.log(file);
		const md = fs
			.readFileSync("./blog/" + file + "/index.md")
			.toString()
			.replaceAll("\r", "");
		let o = {},
			parsedHtml = (o.html = marked.marked(md));

		const $ = cheerio.load(parsedHtml);
		let j = jsonfile.readFileSync("./blog/" + file + "/article.json");
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
		$("img").each((i, el) => {
			const img = $(el);
			const alt = img.attr("alt") || "";
			let m = alt.match(/^s:[0-9]+(\.[0-9]+)?x[0-9]+(\.[0-9]+)?/gi);
			if (!m) return;
			img.attr("alt", alt.replace(m[0] + " ", ""));
			m = m[0]
				.replace(/s:/g, "")
				.split("x")
				.map(s => +s);
			img.attr("width", m[0]);
			img.attr("height", m[1]);
		});
		$("img").attr("loading", "lazy");
		parsedHtml = $("body").html();

		let html = template;
		html = html.replace(/<!-- BEGIN NOSCRIPT -->.+<!-- END NOSCRIPT -->/s, "");
		// prettier-ignore
		html = html.replace(/<!-- BEGIN META -->.+<!-- END META -->/s, `<!-- BEGIN META -->
		<meta name="description" content="${html2Escape(j.desc_text || "dsy4567 的博客 - 记录 dsy4567 的折腾经验、技术分享、编程笔记")}" />
		<title>${html2Escape(j.title || "无标题")} | 博客 | dsy4567 的小站</title>
		<!-- END META -->`);

		// prettier-ignore
		html = html.replace(/<!-- BEGIN OG -->.+<!-- END OG -->/s, `<!-- BEGIN OG -->
		<meta property="og:url" content="https://dsy4567.icu/blog/${j.id}/" />
		<meta property="og:type" content="article" />
		<meta property="og:title" content="${html2Escape(j.title || "无标题")} | 博客 | dsy4567 的小站" />
		<meta property="og:description" content="${html2Escape(j.desc_text || "记录 dsy4567 的折腾经验、技术分享、编程笔记")}" />
		<meta property="og:image" content="${j.cover || "https://dsy4567.icu/img/bg.jpg"}" />
		<!-- END OG -->`);

		html = html.replace(
			/<!-- BEGIN MAIN -->.+<!-- END MAIN -->/s,
			`<!-- BEGIN MAIN -->
${
	j.url
		? `
				<section id="正在加载文章提示">
					正在加载文章
						<noscript>在<a href="https://github.com/dsy4567/dsy4567.github.io/tree/main/blog">GitHub</a>上阅读文章</noscript>`
		: "				<section>" +
		  parsedHtml +
		  (parsedHtml.includes('<nocopyright value="true"></nocopyright>')
				? ""
				: '<hr /><a rel="license" href="https://www.creativecommons.org/licenses/by-sa/4.0/"><img width="88" height="31" alt="知识共享许可协议" style="border-width:0;width:inherit;height:inherit;border-radius:unset;" src="/img/cc-by-sa-4.0.png" /></a><br />如无特别说明，本作品采用<a rel="license" href="https://www.creativecommons.org/licenses/by-sa/4.0/">CC BY-NC-SA 4.0</a>进行许可。<br />') +
		  `<span class="淡化">发表于: ${new Date(j.date).toLocaleString("zh-CN", {
				timeZone: "Asia/Shanghai",
		  })}, 更新于: ${new Date(j.updated).toLocaleString("zh-CN", {
				timeZone: "Asia/Shanghai",
		  })}</br>标签: ${(() => {
				let html = "";
				for (const tag of j.tags) html += `<a href="/blog.html?tag=${tag}">${tag}</a> `;
				return html;
		  })()}</span>`
}
				</section>
				<script id="当前文章信息" type="application/json">${JSON.stringify(j)}</script>
				<!-- END MAIN -->`
		);
		fs.writeFileSync(`./blog/${j.id}/index.html`, html);

		o.article = j;
		O.push(o);
	}
});

O.sort((a, b) => +new Date(b.article.date) - +new Date(a.article.date));
let articles = [];
O.forEach(o => {
	articles.push(o.article);
});
jsonfile.writeFileSync("./json/blog.json", articles, { spaces: 4 });

console.log("rss, sitemap, readme");
O.forEach((aa, i) => {
	const a = aa.article,
		h = aa.html;
	rss += `
<entry>
    <title>${a.title}</title>
    <link rel="alternate" type="text/html" href="https://${hostname}/blog/${a.id}/" />
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
${h}
        ]]>
    </content>
</entry>`;
	sitemap += `
<url>
    <loc>https://${hostname}/blog/${a.id}/</loc>
    <lastmod>${a.updated}</lastmod>
</url>`;
	blog_index_html += `<p><a href="./${a.id}/">${a.title}</a></p>`;
});

rss += "</feed>";
sitemap += "</urlset>";
blog_index_html += `

<hr /><a rel="license" href="https://www.creativecommons.org/licenses/by-sa/4.0/"><img width="88" height="31" alt="知识共享许可协议" style="border-width:0;width:inherit;height:inherit;border-radius:unset;" src="/img/cc-by-sa-4.0.png" /></a><br />如无特别说明，以上作品采用<a rel="license" href="https://www.creativecommons.org/licenses/by-sa/4.0/">知识共享署名</a>进行许可。

</body>
</html>

`;

fs.writeFileSync("./rss.xml", rss);
fs.writeFileSync("./sitemap.xml", sitemap);
fs.writeFileSync("./blog/index.html", blog_index_html);

console.log("ncm");
// axios
// 	.get("https://ncm.vercel.dsy4567.icu/playlist/track/all?id=9123680760", {
// 		responseType: "json",
// 	})
// 	.then(res => {
// 		let j = res.data;
// 		delete j.privileges;
// 		jsonfile.writeFileSync("./json/ncm.json", j);
// 	});
require("NeteaseCloudMusicApi")
	.playlist_track_all({ id: 9123680760 })
	.then(res => {
		let j = res.body;
		delete j.privileges;
		jsonfile.writeFileSync("./json/ncm.json", j);
	});
