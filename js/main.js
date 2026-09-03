/**
 * @fileoverview 核心脚本，负责加载其他模块、图标渲染、处理页面事件等任务
 * @author dsy4567
 * @license
 * Copyright (c) 2026 dsy4567
 * SPDX-License-Identifier: MIT
 */

// @ts-check
"use strict";

const /** @type {Record<string, string[]>} */ 加载清单 = {
		"/": [],
		"/blog": ["blog"],
		"/friends": ["friends"],
	},
	gr_sitekey = "6Ldo1dIkAAAAAM_2VtEneT3l7AE25HdWU45x03ng";
let 路径 = 获取清理后的路径(true),
	正在动态加载 = false,
	/** @type {Record<string, string | undefined>} */ 图标 = {};

//#region 加载模块、动态加载、渲染图标
function 加载模块() {
	路径 = 获取清理后的路径();
	let 路径2 = 获取清理后的路径(true);
	for (const s of 加载清单[路径] || []) {
		const i = import(`/js/${s}.js`);
		延迟执行(
			"DOMContentLoaded",
			async () => {
				(await i).main(路径2);
			},
			0
		);
	}
	路径 = 路径2;
}
/** @param {{ href: string; popstate?: boolean }} 元素 */
function 动态加载(元素) {
	if (正在动态加载) {
		open(元素.href, "_self");
		return 显示或隐藏进度条(false);
	}
	正在动态加载 = true;
	显示或隐藏进度条(true);
	gd("robots", true)?.setAttribute("content", "");
	fetch(元素.href)
		.then(res => res.text())
		.then(async html => {
			let m = html.match(/<!-- BEGIN MAIN -->.+<!-- END MAIN -->/s),
				mt = html.match(/<title>.+<\/title>/s);
			if (!m) throw new Error("动态加载失败: 匹配结果为空");
			let u = new URL(元素.href, location.href);
			!元素.popstate &&
				history.pushState(
					{
						路径: 清理路径(u.pathname) + u.search,
					},
					"",
					元素.href
				);
			document.title = mt
				? mt[0].replaceAll("<title>", "").replaceAll("</title>", "")
				: "dsy4567 的小站";
			dispatchEvent(URL发生变化事件);
			try {
				let 右 = qs("main .右", true);
				if (!右) return;
				右.innerHTML = m[0];
				加载模块();

				if (清理路径(u.pathname) === "/") {
					显示或隐藏进度条(false);
					if (!location.hash)
						右.scrollIntoView({
							behavior: "smooth",
						});
				}
				正在动态加载 = false;
				渲染图标();
			} catch (e) {
				console.error(e);
				open(元素.href, "_self");
				显示或隐藏进度条(false);
			}
		})
		.catch(e => {
			console.error(e);
			open(元素.href, "_self");
			显示或隐藏进度条(false);
		});
}
/** 在新增元素时调用，以确保图标正常显示、点击事件正常触发 @param {渲染图标选项} 选项 */
function 渲染图标(选项 = {}) {
	const re = /特?小尺寸/;
	for (const 元素 of 选项.要渲染图标的元素?.[0] ? 选项.要渲染图标的元素 : qsa("svg[data-icon]")) {
		// @ts-ignore
		if (!元素.dataset.icon) continue;
		let c = 元素.getAttribute("class");
		let h = c
			? // @ts-ignore
				图标[元素.dataset.icon]?.replace(re, c)
			: // @ts-ignore
				图标[元素.dataset.icon];
		h && (元素.outerHTML = h);
	}
}
//#endregion

//#region 导出和加载模块
_global["main.js"] = () => ({
	loaded,
	DOMContentLoaded,
	路径,
	图标,
	正在动态加载,
	加载模块,
	动态加载,
	渲染图标,
});

加载模块();
//#endregion

//#region 网易云音乐
!navigator.userAgent.match(/bot|spider/gi) && import("./ncm.js");
//#endregion

//#region 主题
fetch("/json/theme.json")
	.then(
		res =>
			new Promise((resolve, reject) => {
				延迟执行("关键任务完成", () => resolve(res.json()), 3);
			})
	)
	.then(
		/** @type {Record<string, string>} */ 主题表 => {
			const 控件容器 = gd("主题控件", true),
				主题容器 = gd("所有主题", true);
			if (!控件容器 || !主题容器) return;

			//#region 第一行：背景模式切换、自定义强调色调色盘
			/** @type {HTMLButtonElement} */
			let 模式按钮 = ce("button");
			模式按钮.id = "背景模式";
			const 更新模式按钮 = () => {
				const 模式 = 读取背景模式();
				模式按钮.title = "背景: " + 模式 + (模式 === "自动" ? "（跟随系统）" : "");
			};
			模式按钮.onclick = () => {
				// 自动 → 浅色 → 深色 循环
				const 列表 = /** @type {("自动" | "浅色" | "深色")[]} */ (["自动", "浅色", "深色"]);
				const 下一个 = 列表[(列表.indexOf(读取背景模式()) + 1) % 列表.length];
				应用背景模式(下一个);
				更新模式按钮();
				提示("背景模式: " + 下一个);
			};
			更新模式按钮();
			控件容器.append(模式按钮);

			/** @type {HTMLButtonElement} */
			let 调色盘按钮 = ce("button");
			调色盘按钮.title = "自定义强调色";
			调色盘按钮.role = "radio";
			调色盘按钮.ariaChecked = "false";
			调色盘按钮.innerHTML =
				"<svg class='特小尺寸' data-icon='调色盘'></svg><input aria-label='自定义强调色调色盘' style='opacity:0;pointer-events:none;position:absolute;top:0;width:0;height:0' tabindex='-1' id='自定义强调色' type='color' />";
			调色盘按钮.onclick = () => {
				let 输入 = /** @type {HTMLInputElement} */ (gd("自定义强调色", true));
				if (!输入) return;
				输入.value = 读取强调色().toLowerCase();
				输入.click();
				输入.onchange = () => {
					应用强调色(输入.value);
					同步选中态();
					提示("已切换自定义强调色");
				};
			};
			控件容器.append(调色盘按钮);
			//#endregion

			//#region 下方：预设强调色色板
			/** 根据当前强调色高亮对应色板，为自定义色时高亮调色盘 */
			const 同步选中态 = () => {
				const 当前 = 读取强调色();
				let 命中预设 = false;
				主题容器.querySelectorAll("button").forEach(元素 => {
					const 命中 = 元素.dataset.hex === 当前;
					元素.ariaChecked = "" + 命中;
					if (命中) 命中预设 = true;
				});
				调色盘按钮.ariaChecked = "" + !命中预设;
			};
			/** @type {HTMLButtonElement[]} */
			let 待添加元素 = [];
			Object.entries(主题表).forEach(([名字, hex]) => {
				/** @type {HTMLButtonElement} */
				let btn = ce("button");
				btn.dataset.hex = hex;
				btn.style.backgroundColor = hex;
				btn.title = "强调色: " + 名字;
				btn.role = "radio";
				btn.ariaChecked = "false";
				btn.onclick = () => {
					应用强调色(hex);
					同步选中态();
					提示("已切换强调色: " + 名字);
				};
				待添加元素.push(btn);
			});
			主题容器.append(...待添加元素);
			同步选中态();
			//#endregion

			渲染图标({
				要渲染图标的元素: 调色盘按钮.getElementsByTagName("svg"),
			});
		}
	)
	.catch(e => console.error(e));
//#endregion

//#region 一言
fetch("https://dsy4567.icu/api/hitokoto")
	.then(
		res =>
			new Promise((resolve, reject) => {
				延迟执行(
					"关键任务完成",
					() => {
						resolve(res.json());
					},
					2
				);
			})
	)
	.then(j => {
		let 一言 = gd("一言", true),
			// @ts-ignore
			/** @type {HTMLAnchorElement} */ 链接 = qs("#一言+a");
		if (!一言 || !链接) return;
		一言.innerText = j.hitokoto;
		链接.href = "https://hitokoto.cn/?uuid=" + j.uuid;
	})
	.catch(e => console.error(e));
//#endregion

//#region 图标
fetch("/json/icon.json")
	.then(
		res =>
			new Promise((resolve, reject) => {
				延迟执行(
					"DOMContentLoaded",
					() => {
						resolve(res.json());
					},
					1
				);
			})
	)
	.then(j => {
		图标 = j;
		渲染图标();
	})
	.catch(e => console.error(e));
//#endregion

//#region 关注被关注码龄
fetch("https://api.github.com/users/dsy4567")
	.then(
		res =>
			new Promise((resolve, reject) => {
				延迟执行(
					"关键任务完成",
					() => {
						resolve(res.json());
					},
					2
				);
			})
	)
	.then(个人信息 => {
		const 关注被关注码龄 = gd("关注被关注码龄");
		if (!关注被关注码龄) return;
		关注被关注码龄.innerHTML = ` 关注: ${个人信息.following} | 被关注: ${
			个人信息.followers
		} | 码龄: ${new Date().getFullYear() - new Date(个人信息.created_at).getFullYear()}年 `;
	})
	.catch(e => console.error(e));
//#endregion

延迟执行(
	"关键任务完成",
	() => {
		try {
			//#region 核心元素、事件、字体css等
			gd("回到顶部")?.addEventListener("click", () =>
				document.body.scrollIntoView({ behavior: "smooth" })
			);
			gd("分界线")?.addEventListener("click", () => {
				document.body.classList.toggle("宽屏");
			});
			qsa("link[disabled]").forEach(元素 => 元素.removeAttribute("disabled"));
			//#endregion

			//#region reCAPTCHA 获取邮箱/tg
			[gd("电子邮箱"), gd("tg")].forEach(元素 => {
				元素?.addEventListener("click", 事件 => {
					事件.preventDefault();
					if (gd("recaptcha")) return;
					let div = 添加悬浮卡片(
						`
            <div id="g-recaptcha"></div><br />
            <button id="recaptcha">开始人机验证/提交</button>
            <button id="close_recaptcha">关闭</button>
            <a href="https://qwq.dsy4567.icu/api/getemail">在新标签页验证</a><br/>
            要查看 dsy4567 的电子邮箱地址/TG 用户名，请通过 reCAPTCHA 人机验证。<br />
            继续查看电子邮箱地址即代表您同意不向 dsy4567<br />
            发送广告/要饭/雇童工/炒币等垃圾邮件。`,
						// @ts-ignore
						事件.pageX,
						// @ts-ignore
						事件.pageY,
						false
					);
					添加脚本("https://www.recaptcha.net/recaptcha/api.js?render=explicit", null)
						.then(() => {
							gd("close_recaptcha")?.addEventListener("click", () => {
								div.remove();
							});
							// @ts-ignore
							gd("recaptcha")?.addEventListener("click", async 事件 => {
								const gr = gd("g-recaptcha");
								if (!gr) return;
								try {
									const 回复 = grecaptcha.getResponse();
									if (!回复) throw new Error();
									gr.innerHTML = await (
										await fetch(
											"https://qwq.dsy4567.icu/api/getemail?g-recaptcha-response=" +
												回复
										)
									).text();
									gr.focus();
								} catch (e) {
									gr.tabIndex = 0;
									gr.focus();
									grecaptcha.render("g-recaptcha", {
										sitekey: gr_sitekey,
										theme: matchMedia("(prefers-color-scheme: dark)").matches
											? "dark"
											: "light",
									});
								}
							});
						})
						.catch(() => {
							console.error("无法加载 reCAPTCHA");
							open("https://qwq.dsy4567.icu/api/getemail", "_blank");
							div.remove();
						});
				});
			});
			//#endregion

			//#region 备案
			let fuck = gd("fuck");
			if (fuck)
				fuck.innerText =
					["\u4f60\u5988", "\u5c3c\u739b", "\u4f60\u5927\u7237", "\u5bc4\u5427"][
						随机含零自然数(3)
					] || "\u4f60\u5988";
			//#endregion

			//#region 导航栏

			/** 记录上一次滚动条距离文档顶部的位置（用于判断滚动方向） */
			let scrollTop = 0,
				/**
				 * 当前导航栏的显示模式
				 *  - -1：初始状态（尚未判断过）
				 *  -  0：页面位于顶部（显示顶部样式）
				 *  -  1：向下滚动（隐藏导航栏）
				 *  -  2：向上滚动（显示导航栏，但不含顶部样式）
				 */
				状态 = -1;

			const 类列表 = document.body.classList;

			// 监听页面滚动事件（passive: 声明不调用 preventDefault，浏览器无需等待本监听器即可滚动）
			addEventListener(
				"scroll",
				() => {
					const 当前滚动位置 = scrollY;

					// 情况一：滚动到页面最顶部（scrollTop 为 0）且当前状态不是“顶部”
					if (当前滚动位置 === 0 && 状态 !== 0) {
						类列表.add("顶部");
						类列表.remove("隐藏导航栏");
						状态 = 0;
					}
					// 情况二：向下滚动（当前滚动位置比上次大）且状态不是“隐藏导航栏”
					else if (当前滚动位置 > scrollTop && 状态 !== 1) {
						类列表.remove("顶部");
						类列表.add("隐藏导航栏");
						状态 = 1;
					}
					// 情况三：向上滚动（当前滚动位置比上次小）且状态不是“显示导航栏”
					else if (当前滚动位置 < scrollTop && 状态 !== 2) {
						类列表.remove("顶部", "隐藏导航栏");
						状态 = 2;
					}

					// 更新 scrollTop 为当前滚动位置，供下一次事件判断方向
					scrollTop = 当前滚动位置;
				},
				{ passive: true }
			);
			//#endregion

			//#region 双击打开图片/复制代码
			addEventListener("dblclick", 事件 => {
				// 双击打开图片
				const /** @type {HTMLImageElement | undefined} */ t1 =
						// @ts-ignore
						事件.target?.tagName === "IMG"
							? 事件.target
							: // @ts-ignore
								事件.target?.parentElement.tagName === "IMG"
								? // @ts-ignore
									事件?.target.parentElement
								: undefined;
				if (t1) return open(t1.src, "_blank");

				// 复制代码
				const /** @type {HTMLImageElement | undefined} */ t2 =
						// @ts-ignore
						事件.target?.classList.contains("hljs")
							? 事件.target
							: // @ts-ignore
								事件.target?.parentElement.classList.contains("hljs")
								? // @ts-ignore
									事件?.target.parentElement
								: undefined;
				if (t2) {
					t2.classList.add("已复制");
					setTimeout(() => {
						t2?.classList.remove("已复制");
					}, 3000);
					navigator.clipboard.writeText(t2.innerText);
					事件.preventDefault();
				}
			});
			//#endregion

			//#region 初始化图标、事件，延后启用动画
			let style = ce("style");
			style.innerHTML = `a,
    button,
    div,
    section,
    img,
    nav,
    li,
	.更多选项 {
        transition: 0.3s border-radius, 0.3s backdrop-filter, 0.3s background-image,
		0.3s transform, 0.3s box-shadow, 0.3s filter, 0.3s background-color,
		0.3s opacity, 0.3s max-height;
    }`;
			document.head.append(style);
			//#endregion

			//#region 引入统计脚本
			import("./analytics.js");
			//#endregion
		} catch (e) {
			console.error(e);
		}
	},
	0
);

addEventListener("copy", () => {
	提示("复制成功");
});
addEventListener("popstate", 事件 => {
	// hash 变化执行默认行为
	if (获取清理后的路径(true) === 路径 || 事件.state?.路径 === 路径) return 事件.preventDefault();
	动态加载({
		href: location.pathname,
		popstate: true,
	});
});
/** 用事件委托统一处理动态加载链接的点击，避免给每个链接单独绑定监听器和闭包 */
addEventListener("click", 事件 => {
	const 目标 = 事件.target;
	if (!(目标 instanceof Element)) return;
	const a = 目标.closest("a");
	if (!a) return;

	const 本站 = location.host,
		当前路径 = location.pathname;

	if (a.pathname === 当前路径 && a.hash) return;
	else if (a.host === 本站) {
		事件.preventDefault();
		动态加载(a);
	} else a.target = "_blank";
});

//#region 域名迁移
// 域名迁移：非 .icu 域名自动跳转到新域名 dsy4567.icu
// 流程：
//   1. 爬虫 / 本地环境 / 已在新域名 → 不做任何处理
//   2. 用户选择过「不跳转」（URL 参数或 localStorage 的 no-redirect）→ 仅弹横幅提示新域名
//   3. 其余情况 → 自动跳转并在 URL 携带来源参数，供新域名页面弹「回原域名」横幅
延迟执行(
	"关键任务完成",
	() => {
		try {
			const 网页访问者不为爬虫 =
				!navigator.userAgent.includes("bot") && !navigator.userAgent.includes("spider");
			// 所有改写先在 URL 副本上进行，最后统一生效
			let U = new URL(location.href);
			// 删除迁移流程专用的 URL 参数：
			// from-hostname（来源域名）、from-non-icu-tld（来自非 .icu 域名）、no-redirect（用户选择不跳转）
			const 删除url参数 = () => {
				U.searchParams.delete("from-hostname");
				U.searchParams.delete("from-non-icu-tld");
				U.searchParams.delete("no-redirect");
			};
			const 本地域名 = ["dev.dsy4567.icu", "localhost", "127.0.0.1"];

			// 已在 dsy4567.icu（含子域名）或黑名单域名上则无需处理
			if (location.hostname.endsWith("dsy4567.icu") || 本地域名.includes(location.hostname))
				return;

			// 情况 A：用户已选择「不跳转」→ 仅弹横幅提示，不强制跳转
			if (
				网页访问者不为爬虫 &&
				(JSON.parse(U.searchParams.get("no-redirect") || "false") ||
					JSON.parse(localStorage.getItem("no-redirect") || "false"))
			) {
				// 持久化选择，之后即使 URL 不带 no-redirect 也不再自动跳转
				localStorage.setItem("no-redirect", "true");
				// 弹横幅，并把横幅内链接指向新域名的同路径页面
				let 横幅 = 添加横幅(
						'本站已迁移至新域名 dsy4567.icu，您可以<a href="#">访问新域名</a>'
					),
					a = 横幅.querySelector("a");
				删除url参数();
				if (a?.href && a?.hostname) {
					a.href = U.href;
					a.hostname = "dsy4567.icu";
				}
			} else {
				// 情况 B：默认自动跳转到新域名
				if (网页访问者不为爬虫) {
					// 在 URL 上记录来源信息，供新域名页面弹「回原域名」横幅使用
					U.searchParams.set("from-non-icu-tld", "true");
					U.searchParams.set("from-hostname", location.hostname);
				} else 删除url参数();

				U.hostname = "dsy4567.icu";
				location.href = U.href;
			}

			// 情况 C：刚从旧域名跳来（URL 带 from-hostname）→ 在新域名上弹「回原域名」横幅
			let 原域名 = U.searchParams.get("from-hostname");
			if (
				网页访问者不为爬虫 &&
				JSON.parse(U.searchParams.get("from-non-icu-tld") || "false")
			) {
				let 横幅 = 添加横幅('本站已迁移至新域名，您也可以<a href="#">访问原域名</a>'),
					a = 横幅.querySelector("a");
				删除url参数();
				// 给回跳链接带上 no-redirect=true，用户点回原域名后不会再被自动跳回，避免两个域名互相重定向
				U.searchParams.set("no-redirect", "true");
				if (原域名 && a?.href && a?.hostname) {
					a.href = U.href;
					a.hostname = 原域名;
				}
			}
			// 清理辅助参数并同步到地址栏（replaceState 不会新增历史记录）
			删除url参数();
			history.replaceState(history.state, "", U.href);
		} catch (e) {
			console.error(e);
		}
	},
	0
);
//#endregion

//#region localStorage、SW管理
延迟执行(
	"关键任务完成",
	() => {
		try {
			// 清理旧版主题键（旧模型为多键存储，已被两级模型取代）
			["theme", "主题色", "主题色h", "主题色s", "主题色l", "透明色", "字体色"].forEach(键 =>
				localStorage.removeItem(键)
			);

			// "serviceWorker" in navigator && navigator.serviceWorker.register("/sw.js");

			// 移除 Service Worker 并清理缓存
			async function removeServiceWorker() {
				if ("serviceWorker" in navigator) {
					// 1. 获取所有注册
					const registrations = await navigator.serviceWorker.getRegistrations();

					// 2. 逐个注销
					for (let registration of registrations) await registration.unregister();

					// 3. 清理所有缓存
					const cacheNames = await caches.keys();
					await Promise.all(cacheNames.map(name => caches.delete(name)));
					console.log("Service Worker 已移除，缓存已清空");
				}
			}

			removeServiceWorker().catch(e => console.error(e));
		} catch (e) {
			console.error(e);
		}
	},
	3
);
//#endregion

export {};
