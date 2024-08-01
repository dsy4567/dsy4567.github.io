# 使用 CloudFlare Workers 免费搭建 Virtual Judge 反代

最近闲的没事干，受 [如何科学地制作一个镜像反代站点](https://blog.immccn123.xyz/archives/362) 这篇文章的启发，我一个买不起服务器的穷逼准备用 CF Workers 搭一个 Virtual Judge 反代，以缓解 VJ 在大陆经常断网的情况。而且 CF Workers 有更高的 SLA 保证，如果运气好，访问速度还会嘎嘎快。

<!-- more -->

> 千万不要反代<spoiler>反 D、色情、赌博等</spoiler>违规网站，小心你家水表坏了。

## 注册 CF

这个就不用我浪费口水了，传送门 -> <https://dash.cloudflare.com/>

## 创建 CF Worker

> 这一步需要先把域名绑到 CF 里面，因为 `*.workers.dev` 有墙。

> 可以到 Freenom 那里搞一个免费域名.

登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)，点击右边的 Workers，再点右边的创建服务。

![s:1680x878 Workers 面板](https://dsy4567.icu/blog/cf-workers-ip/img/workers.webp)

服务名称随便，点击创建服务。

![s:935x821 创建服务](https://dsy4567.icu/blog/cf-workers-ip/img/%E5%88%9B%E5%BB%BA%E6%9C%8D%E5%8A%A1.webp)

绑定自定义域。

触发器 > 自定义域，在这里输入 Worker 要绑的域名。

![s:1294x722 自定义域](https://dsy4567.icu/blog/cf-workers-ip/img/%E8%87%AA%E5%AE%9A%E4%B9%89%E5%9F%9F.webp)

点击快速编辑。

![s:1304x393 管理面板](https://dsy4567.icu/blog/cf-workers-ip/img/%E7%AE%A1%E7%90%86%E9%9D%A2%E6%9D%BF.webp)

粘贴以下代码，然后保存并部署：

```js
export default {
	async fetch(request, env, ctx) {
		let u = new URL(request.url);
		const originHost = "vjudge.net",
			mirrorHost = u.hostname;
		u.hostname = originHost;

		Object.defineProperty(request, "url", {
			value: u,
			writable: true,
		});
		let resp = await fetch(u, request);

		if (resp.headers.get("content-type").includes("text/")) {
			let body = await resp.text();
			body.replace(new RegExp(originHost, "g"), mirrorHost);
			return new Response(body, resp);
		}
		return resp;
	},
};
```

接下来，访问你绑定的域名。

## 登录镜像站

由于 CF Workers 不让改 `set-cookie` 请求头，你需要花很大力气登录 `vjudge.net`，然后把 cookies 复制到镜像站里。

打开 <https://vjudge.net>，登录后打开开发者工具 > 应用 > cookie > `https://vjudge.net`。

再打开 <https://你绑定的域名>，登录后打开开发者工具 > 应用 > cookie > `https://你绑定的域名`，将两个 `JSESSIONID` 复制粘贴过去，然后刷新镜像站，就可以完成登录。

![s:997x285 开发者工具](/blog/cf-vjmirror/img/devtools.webp)

---

最后，尽情享受吧~

Demo（已失效）：~~<https://vjmirror.workers.dsy4567.cf/>~~
