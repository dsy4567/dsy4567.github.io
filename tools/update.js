/* Copyright (c) 2023 dsy4567, view license at <https://github.com/dsy4567/dsy4567.github.io/blob/main/LICENSE.md> */

const cheerio = require("cheerio");
const fs = require("fs");
const marked = require("marked");
const jsonfile = require("jsonfile");
const hostname = "dsy4567.github.io";

let articles = [];

let f = fs.readdirSync("./blog-md/");
f.forEach(file => {
    if (file && fs.statSync("./blog-md/" + file).isDirectory()) {
        const md = fs
            .readFileSync("./blog-md/" + file + "/index.md")
            .toString();

        const $ = cheerio.load(marked.marked(md));
        let j = jsonfile.readFileSync("./blog-md/" + file + "/article.json");
        j.id = file;
        j.title = $("h1").text();
        j.desc = md.split("<!-- more -->")[0];
        j.updated = j.updated || new Date();
        j.date = j.date || new Date();
        j.issue = j.issue || null;
        articles.push(j);
    }
});

articles.sort((a, b) => +new Date(b.date) - +new Date(a.date));
jsonfile.writeFileSync("./json/blog.json", articles, { spaces: 4 });

let rss = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
    <title>博客 | dsy4567 的小站</title>
    <link rel="alternate" type="text/html" href="https://${hostname}/blog.html" />
    <link rel="self" type="application/atom+xml" href="https://${hostname}/rss.xml" />
    <updated>2023-01-22T12:48:59.719Z</updated>
    <generator uri="https://github.com/dsy4567/dsy4567.github.io/">dsy4567/dsy4567.github.io</generator>
`;
let sitemap=`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url>
    <loc>https://${hostname}/</loc>
    <lastmod>2023-06-22T05:02:50.783Z</lastmod>
</url>
<url>
    <loc>https://${hostname}/blog.html</loc>
    <lastmod>2023-06-22T05:02:50.783Z</lastmod>
</url>
<url>
    <loc>https://${hostname}/friends.html</loc>
    <lastmod>2023-06-22T05:02:50.783Z</lastmod>
</url>
<url>
    <loc>https://${hostname}/game.html</loc>
    <lastmod>2023-06-22T05:02:50.783Z</lastmod>
</url>`

articles.forEach(a => {
    rss += `
<entry>
    <title>${a.title}</title>
    <link rel="alternate" type="text/html" href="https://${hostname}/blog.html?id=${
        a.id
    }" />
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
${marked.marked(fs.readFileSync("./blog-md/" + a.id + "/index.md").toString())}
        ]]>
    </content>
</entry>`;
    sitemap += `
<url>
    <loc>https://${hostname}/blog.html?id=${
        a.id
    }</loc>
    <lastmod>${a.updated}</lastmod>
</url>`;
});

rss += "</feed>";
sitemap += "</urlset>"
fs.writeFileSync("./rss.xml", rss);
fs.writeFileSync("./sitemap.xml", sitemap);
