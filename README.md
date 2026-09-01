# dsy4567 的小站

一个 90% 自己造轮子做的个人网站

## 📁 目录结构

```text
.
├── 404.html                    # 404 页面
├── blog.html                   # 博客列表页
├── favicon.ico                 # 网站图标
├── index.html                  # 首页
├── LICENSE.CC-BY-NC-SA-4.0.txt # CC BY-NC-SA 4.0 许可证全文
├── LICENSE.md                  # 许可证说明
├── LICENSE.MIT.txt             # MIT 许可证全文
├── README.md                   # 项目说明
├── robots.txt                  # 爬虫规则
├── rss.xml                     # RSS 订阅源
├── sitemap.xml                 # 站点地图
├── sw.js                       # Service Worker
├── .prettierignore             # Prettier 忽略配置
├── .gitignore                  # Git 忽略配置
├── .eslintrc.json              # ESLint 配置
├── jsconfig.json               # JS/TS 智能提示配置
├── package.json                # npm 包信息与脚本
├── pnpm-lock.yaml              # pnpm 依赖锁定文件
├── vercel.json                 # Vercel 配置
├── _vercel/                    # Vercel 自动生成的资源（弃用）
├── api/                        # Vercel Serverless 函数
├── blog/                       # 博客文章
├── css/                        # 样式表
├── img/                        # 图片资源
├── js/                         # js脚本
    ├── lib/                    # 第三方库
    ├── main.js                 # 核心脚本
    ├── global.js               # 工具函数和变量，还负责域名迁移、SW管理等任务
    ├── blog.js                 # 博客页
    ├── friends.js              # 友链页
    ├── analytics.js            # 第三方统计
    ├── ncm.js                  # 网易云音乐
    ├── index.d.ts              # 类型定义
├── json/                       # JSON 数据
├── tools/                      # 构建/开发脚本
└── .github/workflows/          # GitHub Actions 工作流
```

> Note: 未提及的文件不是网站的一部分, 它们曾因为无处安放而存储于此

## 🔨 功能和特色

-   对 IE /老旧 Chrome 有着高达 -114514% 的兼容性(最低兼容到 360 只因速浏览器)
-   网易云音乐
-   博客(前端渲染+评论)
-   8 种主题 + 自定义主题
-   RSS 订阅
-   一丢丢无障碍适配

## 👖 第三方库/接口

-   [ByteDance IconPark](https://github.com/bytedance/IconPark)
-   <https://api.github.com>
-   [highlight.js](https://github.com/highlightjs/highlight.js/)
-   [Marked](https://github.com/markedjs/marked)
-   [NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi)
-   [自托管一言接口](https://github.com/dsy4567/hitokoto-api)

## ⚖️ 许可证

MIT & CC BY-NC-SA 4.0

欢迎在遵守许可证的前提下使用/贡献代码 🎉

> 修改代码时必须保留页脚最后一行的仓库链接和原作者信息, 以及代码顶部的版权信息,
> 可以添加修改后代码的仓库链接及作者信息
>
> ```html
> Powered by <a href="https://github.com/dsy4567/dsy4567.github.io">dsy4567/dsy4567.github.io</a>
> ```
>
> ```js
> /* Copyright (c) 2023 dsy4567, view license at <https://github.com/dsy4567/dsy4567.github.io/blob/main/LICENSE.md> */
> ```
