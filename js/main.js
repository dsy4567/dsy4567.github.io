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
			document.title = mt ? mt[0].replace(/<\/?title>/g, "") : "dsy4567 的小站";
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
				延迟执行("关键任务完成", () => resolve(res.json()), 2);
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
				主题容器.append(btn);
			});
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
					"关键任务完成",
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
			let scrollTop = 0,
				状态 = -1;
			const f = () => {
				if (document.documentElement.scrollTop === 0 && 状态 !== 0) {
					document.body.classList.add("顶部");
					document.body.classList.remove("隐藏导航栏");
					状态 = 0;
				} else if (document.documentElement.scrollTop > scrollTop && 状态 !== 1) {
					document.body.classList.remove("顶部");
					document.body.classList.add("隐藏导航栏");
					状态 = 1;
				} else if (document.documentElement.scrollTop < scrollTop && 状态 !== 2) {
					document.body.classList.remove("顶部");
					document.body.classList.remove("隐藏导航栏");
					状态 = 2;
				}
				scrollTop = document.documentElement.scrollTop;
			};
			addEventListener("scroll", f);
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
	2
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

export {};
