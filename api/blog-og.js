function html2Escape(/** @type {string} */ sHtml) {
	return sHtml.replace(/[<>&"]/g, function (c) {
		return { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c];
	});
}
async function f(/** @type {Request} */ req) {
	const /** @type {文章信息[]} */ 所有文章信息 = await (
			await fetch("https://dsy4567.cf/json/blog.json")
		).json();
	let /** @type {文章信息} */ 当前文章信息;
	for (const 文章信息 of 所有文章信息)
		if (文章信息.id === new URL(req.url).searchParams.get("id")) {
			当前文章信息 = 文章信息;
			break;
		}
	if (!当前文章信息) return new Response("", { status: 404 });
	return new Response(
		`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta property="og:url" content="https://dsy4567.cf/b/${当前文章信息.id}" />
<meta property="og:type" content="article" />
<meta property="og:title" content="${html2Escape(
			当前文章信息.title || "无标题"
		)} | 博客 | dsy4567 的小站" />
<meta property="og:description" content="${html2Escape(
			当前文章信息.desc_text || "记录 dsy4567 的折腾经验、技术分享、编程笔记"
		)}" />
<meta property="og:image" content="${当前文章信息.cover || "https://dsy4567.cf/img/bg.jpg"}" />
<script>location.href = "/blog.html?id=${当前文章信息.id}"</script>
</head>
</html>`,
		{
			headers: { "content-type": "text/html;charset=utf-8" },
		}
	);
}
export const config = {
	runtime: "edge",
};
export default f;
