# 使用 Cloudflare Workers 获取别人的 IP 地址

本文将教你怎么顺着网线找到别人（

<!-- more -->

## 准备工作

- 一个 CF 账号
- 一个域名(*.workers.dev 有墙)

## 绑定域名到 CF

略

## 创建 Worker

(多图警告)

登录 [Cloudflare Dashboard](https://dash.cloudflare.com/), 点击右边的 Workers, 再点右边的创建服务

![Workers 面板](/blog-md/cf-workers-ip/img/workers.png)

服务名称随便, 点击创建服务

![创建服务](/blog-md/cf-workers-ip/img/%E5%88%9B%E5%BB%BA%E6%9C%8D%E5%8A%A1.png)

点击快速编辑

![管理面板](/blog-md/cf-workers-ip/img/%E7%AE%A1%E7%90%86%E9%9D%A2%E6%9D%BF.png)

粘贴以下代码

```JavaScript
export default {
    async fetch(request, env) {
        let namespace = env.ip,
            u = new URL(request.url),
            ip = request.headers.get("CF-Connecting-IP");
        u.pathname == "/114514" && // 免费版每天只有一千次读写, 防滥用
            (await namespace.put(new Date().toUTCString(), ip));
        return new Response(ip);
    },
};

```

点击保存并部署

## 创建和绑定 KV 命名空间

返回, 展开右边的 Workers > KV, 创建命名空间, 添加

![KV](/blog-md/cf-workers-ip/img/kv.png)

回到 Worker 详情页, 设置 > 变量 > KV 命名空间绑定

变量名称填 `ip`, KV 命名空间选刚才创建的那个, 保存并部署

![设置页](/blog-md/cf-workers-ip/img/%E8%AE%BE%E7%BD%AE.png)

## 绑定自定义域

触发器 > 自定义域

![自定义域](/blog-md/cf-workers-ip/img/%E8%87%AA%E5%AE%9A%E4%B9%89%E5%9F%9F.png)

访问 https://\<你的自定义域\>/114514 一段时间后, 回到之前创建的 KV 命名空间, 你的 IP 就出来了

把这个网址发给别人, 只要 TA 打开, 嘿嘿(

![KV 命名空间管理面板](/blog-md/cf-workers-ip/img/ip.png)

## 其他有用的东西

站长之家 IP 查询: <https://ip.tool.chinaz.com/>

公安版数据可以精确到访客真实地理位置附近三公里左右

## 参考资料

Cloudflare Workers 文档 <https://developers.cloudflare.com/workers/>

恢复原始访问者 IP - Cloudflare帮助中心 <https://support.cloudflare.com/hc/zh-cn/articles/200170786-恢复原始访问者-IP>
