> Warning: 除了避坑指南，此文件其他部分未经授权不得修改。

## 项目描述

## 📁 目录结构

```text
.
├── 404.html                    # 404 页面
├── blog.html                   # 博客列表页
├── favicon.ico                 # 网站图标
├── friends.html                # 友链页
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
├── todo.txt                    # 待办事项 (不入库)
├── _vercel/                    # Vercel 自动生成的资源（弃用）
├── api/                        # Vercel Serverless 函数
├── blog/*/                     # 博客文章
    ├── index.md                # markdown 源文件
    ├── article.json            # json 元数据
    ├── index.html              # 构建产物
├── css/                        # 样式表
    ├── global-fp.css           # 首屏样式表
    ├── global-nfp.css          # 非首屏样式表
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

> Note: 未提及的文件不是网站的一部分, 它们曾因为无处安放而存储于此。

## 编码规范

### `_global` 对象

`_global` 是 `js/global.js` 中的全局模块注册表（[global.js](js/global.js)）。

背景：`global.js` 以经典脚本加载，顶层声明天然全局；`main.js`、`blog.js`、`ncm.js` 等是 ES 模块，顶层声明互相隔离，且子模块由 `main.js` 动态 `import()` 加载，彼此没有静态 import 通道。

1. 用途
    - 跨模块调用：子模块通过 `_global["foo.js"]().bar(arg)` 调用 foo.js 的函数
    - 控制台调试：ES 模块顶层变量在 DevTools 控制台不可见，通过 `_global["foo.js"]()` 可查看模块私有变量
    - 注意区分：`global.js` 顶层声明的函数（如 `渲染图标`）本身就对所有页面和子模块可见，直接调用即可，不要绕道 `_global` 间接访问

2. 注册规范
    - 各模块在自身末尾以工厂函数注册：`_global["<文件名>"] = () => ({ 变量, 函数 })`
    - 必须使用工厂函数而非一次性对象：模块级变量（如 `路径`、`正在动态加载`）会被重新赋值，每次调用工厂重新求值才能读到当前值，一次性导出只是注册时的快照
    - key 与文件名一致（如 `"main.js"`、`"blog.js"`），重命名文件时必须同步修改
    - `_global` 是只读句柄：只用于读取和调用，外部不应通过它修改变量值

3. 时序保证
    - 各页面子模块的加载由 `main.js` 全权负责（`加载清单` + 动态 `import()`）
    - 子模块内 `main` 入口函数调用 `_global["main.js"]()` 不会失败
    - 如需绕过 main.js 直接加载子模块，应该谨慎使用 `_global` 对象，因为此时上述时序保证失效
        - `global.js` 顶层声明的函数（如 `渲染图标`）不受此限制：`global.js` 是 `defer` 经典脚本，先于所有模块脚本执行，子模块可直接调用
        - 示例：`blog.html` 为尽快渲染文章内容，绕过 `main.js` 直接以 `<script src="/js/blog.js" type="module" defer></script>` 加载 `blog.js`，并在模块顶层自调 `_main()`。此时模块求值可能早于 `main.js` 注册 `_global["main.js"]`（`main.js` 同为 defer 脚本，注册发生在其模块求值时），跨模块调用必须写成可选调用，接受降级而非抛错：

            ```javascript
            // blog.js: 用 ?.() 防御性调用, main.js 未注册时静默跳过, 不会抛错
            _global["main.js"]?.()?.动态加载(a);

            // 反例: 模块求值早于 main.js 注册时会直接抛出 TypeError
            // _global["main.js"]().动态加载(a);
            ```

### 浏览器兼容基线

- 最低支持 Chrome 109（Windows 7 可用的最后一个 Chromium 大版本），JavaScript 语法基线为 ES2022（与 `jsconfig.json` 的 `lib` 一致）
- CSS 可放心使用：自定义属性、`calc()`、`min()` / `max()` / `clamp()`、`hsl()` / `rgb()` / `rgba()` 逗号语法、`#rrggbbaa` 十六进制透明度、`color-scheme`、`prefers-color-scheme`、`@property`、`:has()`、`:not()` 选择器列表、`Mark` / `MarkText` 系统色
- CSS 禁止使用（均为 Chrome 111+ 至 123+ 特性，109 不支持）：`color-mix()`、`oklch()` / `oklab()`、相对颜色语法（如 `hsl(from var(--x) ...)`）、`light-dark()`、CSS 嵌套
- 颜色需要「按明暗选方向」的逻辑（叠层色、选区色、`color-scheme`、代码高亮主题等）一律由 JS 在写入主题变量时计算好，CSS 只做与方向无关的派生，不得依赖上述禁用特性

#### 例外

- 如果可接受功能降级并做好兼容性测试，则允许有限使用新特性
- JavaScript 可通过实现简单 polyfill，有限使用新特性

### 变量名

> Note: 本准则仅适用于 `js/*` `css/*` `**/*.html` 内的 JavaScript/TypeScript 标识符、HTML class/id 等。

编写代码时必须严格遵守以下命名规范，除非触发第 2 条例外，否则必须使用中文命名。

1. 默认优先使用中文命名
    - 变量、函数、参数、常量、类名、接口名、属性名等，一律优先使用中文。
    - 命名应清晰表达含义，例如：用户列表、获取用户信息、计算平均分。
    - 中文命名可包含数字，但不能以数字开头。
    - 所有命名以可读性为最高优先级。

2. 允许使用英文驼峰命名的例外情况
   仅在以下场景才允许使用英文驼峰：
    - 文件内大多数命名已经使用英语
    - 国际通用技术缩写或协议词：id、url、uri、json、xml、http、https、api、sql、dom、html、css 等，可单独或与中文组合使用
    - 与第三方接口、库、数据库字段完全一致时，为保持一致可使用英文驼峰，如 responseData、createdAt、userName。
    - 目标语言或运行环境不支持中文标识符时，全部使用英文驼峰。

3. 英文驼峰命名规则
    - 变量、函数、参数、属性：小驼峰，如 getUserList、apiBaseUrl。
    - 类、构造函数、组件、接口：大驼峰，如 UserService、OrderDetail。
    - 常量：可使用 UPPER_SNAKE_CASE，如 MAX_RETRY_COUNT；也允许中文全大写，如 最大重试次数。

4. 禁止事项
    - 禁止使用拼音、拼音缩写或中英混用：如 shuJu、yongHuList、用户Info。
    - 禁止无意义命名：如 a、b、temp1、data2、foo。
    - 禁止同一含义在代码库内中英文混用，例如同时出现 用户列表 和 userList 表示同一概念。

5. 注释与文档
    - 注释、文档字符串、提交说明等一律使用中文。
    - 若变量使用英文驼峰，必要时应通过中文注释说明含义。

示例（JavaScript/TypeScript）：

```javascript
// 推荐
const 用户列表 = await 获取用户列表();

function 计算平均分(分数数组) {
	const 总分 = 分数数组.reduce((累加, 当前) => 累加 + 当前, 0);
	return 总分 / 分数数组.length;
}

// 外部接口字段保持一致，允许英文驼峰
const { userId, createdAt } = 响应数据;

// 不推荐
const shuJu = [];
function get用户() {}
const a1 = 计算();
```

## Agents 行为约束

### 询问用户

- 调用 `AskUserQuestion` 或类似工具时
  - 始终追加问题：
    - 正文：还有什么要补充的吗
    - 输入类型：文本框
  - 尽量避免在选项中展示大量文字，请在调用工具前输出详细方案

### Git 提交规范

- 完成用户的编码任务后，第一步主动编写 git 提交信息，第二步询问用户是否需要直接提交，提交信息格式参考如下：

    ```text
    <符合 gitmoji 规范的 emoji 字符> <简要描述>

    - <对更改的详细说明>
    - ...
    ```

    - emoji 和简要描述间隔一个空格
    - 如果更改非常简单，允许不编写详细说明
    - 如果选择编写详细说明，注意包含空行和 markdown 无序列表
    - 使用简体中文

### 全局工具函数

- 本项目频繁使用 `js/global.js` 中的工具函数，任务涉及 `js/` 下的文件时，应当首先读取 `js/global.js`。

### 执行构建脚本

未经允许，不得运行构建命令，可在完成任务后询问用户是否需要运行。

### 编辑 html 文件

`blog/` 下的 html 文件由构建脚本，基于 `blog.html` 模板自动生成，仅可用于参考渲染效果，不得直接编辑。

没有明确授权，仅可查看和编辑 `目录结构` 部分列出的 html 文件。

`目录结构` 部分未列出的 html 文件不依赖本项目的任何代码，也不需要编辑。

## 避坑指南

> Note: 允许随时编辑`AGENTS.md`文件的此部分，以完善避坑指南。

### 页面子模块：不要在 `main()` 外随便执行函数

**场景**：在页面子模块（`home.js`、`blog.js`、`friends.js` 等）的模块顶层直接执行任务注册、DOM 操作、fetch 等有副作用的逻辑，而不是放进 `main()`。

**现象**：

- 首次进入页面看似正常，但经动态加载换页再回到该页时模块行为异常——正文（`main .右`）已被整体重建，而模块顶层的逻辑只在 import 时执行过一次，不会重跑。
- 模块求值时机早于 `main()`，顶层直接操作页面元素可能拿到 null 或踩到未就绪的全局状态，问题偶发、难复现。
- 若顶层注册过延迟任务、`main()` 里又注册一次，会重复执行。

**根本原因**：`main.js` 通过 `加载清单` + 动态 `import()` 加载子模块，模块求值只发生一次；而 `main()` 在每次进入页面（含动态加载换页）时都会被重新调用，且换页会重建正文。模块顶层代码的生命周期是「整个会话一次」，`main()` 的生命周期是「每次进入页面一次」，二者不匹配。

**错误示例**：

```javascript
// home.js 模块顶层直接注册延迟任务
延迟执行("关键任务完成", 获取并渲染最近在听, 3);

export function main() {
	// 只处理滚动等每次进入页面都要做的事
}
```

**正确做法**：

```javascript
let 已注册排行加载 = false; // main() 会被反复调用，延迟任务只在首次 main() 注册一次

export function main() {
	if (!已注册排行加载) {
		已注册排行加载 = true;
		延迟执行("关键任务完成", 获取并渲染最近在听, 3);
	}
	// 每次进入页面都要执行的逻辑（如用缓存重渲染）直接放在这里
	渲染最近在听();
}
```

例外：

- 幂等的静态资源预载（如 `blog.js` 顶部的 `添加脚本` / `添加样式`）允许放在模块顶层。
