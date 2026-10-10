/**
 * @fileoverview 核心脚本，负责加载子模块与动态换页、拉取图标数据并触发渲染、主题控件与一言渲染，以及域名迁移、SW 移除等任务
 * @author dsy4567
 * @license
 * Copyright (c) 2022-2026 dsy4567
 * SPDX-License-Identifier: MIT
 */

// @ts-check
"use strict";

const /** @type {Record<string, string[]>} */ 加载清单 = {
		"/": ["home"],
		"/blog": ["blog"],
		"/friends": ["friends"],
	},
	gr_sitekey = "6Ldo1dIkAAAAAM_2VtEneT3l7AE25HdWU45x03ng",
	移动端界面最大宽度 = 1080;
let 路径 = 获取清理后当前路径(),
	正在动态加载 = false;

//#region 加载模块、动态加载
async function 加载模块() {
	路径 = 获取清理后一级路径();
	let 路径2 = 获取清理后当前路径();
	for (const s of 加载清单[路径] || []) {
		const i = import(`/js/${s}.js`);
		await schedulerYield();
		(await i).main(路径2);
	}
	路径 = 路径2;
}
/** 动态加载内容缓存：键为「清理后的路径不含查询字符串」，值为匹配到的正文与标题；仅存于内存，页面关闭时随会话销毁 */
const 动态加载缓存 = /** @type {Map<string, { 正文: string, 标题: string }>} */ (new Map());
/** @param {{ href: string; popstate?: boolean, replaceState?: boolean }} 元素 */
function 动态加载(元素) {
	if (正在动态加载) {
		open(元素.href, "_self");
		return 显示或隐藏进度条(false);
	}
	const 目标url = new URL(元素.href, location.href),
		键 = 清理路径(目标url.pathname);
	正在动态加载 = true;
	已触发动态加载 = true;
	显示或隐藏进度条(true);

	gd("robots", true)?.setAttribute("content", "");

	/** 将取得的页面正文应用到当前页面：更新历史状态、标题、正文并加载模块 @param {string} 正文 @param {string} 标题 */
	const 应用正文 = (正文, 标题) => {
		if (元素.replaceState) history.replaceState({ 路径: 键 }, "", 元素.href);
		else if (!元素.popstate) history.pushState({ 路径: 键 }, "", 元素.href);
		document.title = 标题 || "dsy4567 的小站";
		dispatchEvent(URL发生变化事件);
		try {
			let 右 = qs("main > .右", true);
			if (!右) return;
			// 前进/后退导航时，滚动位置由浏览器按历史条目自行恢复，这里不再干预，否则会把已恢复的位置顶回顶部；
			// 但带 hash 时浏览器无法定位动态换入后才出现的锚点，仍需自行处理
			if (!元素.popstate && !location.hash) 回到顶部();
			动态加载自增计数器++;
			右.innerHTML = 正文;
			加载模块().finally(() => {
				正在动态加载 = false;

				if (location.hash) {
					schedulerYield();

					let /** @type {Element | null} */ 目标 = null,
						选择器 = `[id="${decodeURI(location.hash.substring(1))}"]`;
					// 滚动到hash位置
					// 不能通过赋值 location.hash（置空再恢复）触发滚动：赋值 hash 属于 fragment 导航，
					// 会 push 新历史条目，既污染后退栈，也会清空前进栈（导致后退后前进按钮变灰）
					try {
						目标 = 右.querySelector(选择器);
						目标?.nextElementSibling?.classList.add("标记");
						目标?.scrollIntoView({
							behavior: "smooth",
						});
					} catch (e) {
						console.error(e);
					}
					if (!目标) console.warn("找不到元素", 选择器);
				}

				渲染图标();
			});
		} catch (e) {
			console.error(e);
			open(元素.href, "_self");
			显示或隐藏进度条(false);
		}
	};

	// 命中缓存则不再发起请求
	const 缓存 = 动态加载缓存.get(键);
	if (缓存) return 应用正文(缓存.正文, 缓存.标题);

	fetch(元素.href)
		.then(res => {
			// 校验响应类型：请求失败、或并非 HTML 文档（如内链图片、静态资源等）时应拒绝，
			// 避免将非 HTML 内容当作页面正文动态加载
			if (!res.ok || !res.headers.get("content-type")?.toLowerCase().includes("html")) {
				// 此时只收到了响应头，正文还没下载完；对大文件（压缩包、视频等）立即取消响应体，
				// 避免明知不是 HTML 还把整个文件拉下来
				res.body?.cancel().catch(() => {});
				throw new Error("动态加载失败: 响应类型非 HTML");
			}
			return res.text();
		})
		.then(html => {
			let m = html.match(/<!-- BEGIN MAIN -->.+<!-- END MAIN -->/s),
				mt = html.match(/<title>.+<\/title>/s);
			if (!m) throw new Error("动态加载失败: 匹配结果为空");
			const 条目 = {
				正文: m[0],
				标题: mt ? mt[0].replaceAll("<title>", "").replaceAll("</title>", "") : "",
			};
			动态加载缓存.set(键, 条目);
			应用正文(条目.正文, 条目.标题);
		})
		.catch(e => {
			console.error(e);
			// 目标可能是浏览器直接下载的文件（页面不会跳走），需复位状态，
			// 否则后续所有站内链接点击都会退化成整页跳转
			正在动态加载 = false;
			显示或隐藏进度条(false);
			open(元素.href, "_self");
		});
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
});

加载模块();
//#endregion

//#region 网易云音乐
网页访问者不为爬虫 && import("./ncm.js");
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

			const f = () => {
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
					const 列表 = /** @type {("自动" | "浅色" | "深色")[]} */ ([
						"自动",
						"浅色",
						"深色",
					]);
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

				// 渲染图标();
				// 此前指定元素渲染报“没有父节点”，根因是多个“渲染图标”调用并发时，
				// 异步分批处理会处理到已被替换而脱离文档的元素，现已在“渲染图标”内跳过
				渲染图标({
					要渲染图标的元素: 调色盘按钮.getElementsByTagName("svg"),
				});
			};
			gd("切换主题")?.addEventListener("mousemove", f, { once: true });
		}
	)
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

(async () => {
	//#region 一言
	const 获取一言 = (/** @type {"text" | "json"} */ json类型) =>
		fetch("https://dsy4567.icu/api/hitokoto?c=a&c=b&encode=json").then(
			res =>
				new Promise((resolve, reject) => {
					延迟执行(
						"关键任务完成",
						() => {
							resolve(/** @type {一言句子} */ res[json类型]());
						},
						2
					);
				})
		);

	try {
		let 一言元素 = gd("一言", true),
			语句 = ce("span"),
			作者 = ce("span"),
			// @ts-ignore
			/** @type {HTMLAnchorElement | null} */ 链接 = qs("#一言+a"),
			缓存一言 = localStorage.getItem("缓存一言"),
			/** @type {一言句子} */ 一言json;
		if (!一言元素 || !链接) return;
		try {
			if (缓存一言) 缓存一言 = JSON.parse(缓存一言);
		} catch (e) {
			缓存一言 = null;
		}

		await schedulerYield();
		一言json = 缓存一言 || (await 获取一言("json"));
		await schedulerYield();
		语句.innerText = 一言json.hitokoto;
		语句.classList.add("语句");
		作者.innerText = `—— ${一言json.from_who || ""} 「${一言json.from || "未知"}」`;
		作者.classList.add("作者");
		一言元素.innerHTML = "";
		一言元素.append(语句, 作者);
		链接.href = "https://hitokoto.cn/?uuid=" + 一言json.uuid;

		setTimeout(async () => {
			try {
				localStorage.setItem("缓存一言", await 获取一言("text"));
			} catch (e) {
				console.error(e);
			}
		}, 3000);
	} catch (e) {
		console.error(e);
	}
	//#endregion
})();

//#region 关注被关注码龄
/** 将 GitHub 个人信息渲染到「关注被关注码龄」元素 @param {{ following: number, followers: number, created_at: string }} 个人信息 */
const 渲染个人信息 = 个人信息 => {
	const 关注被关注码龄 = gd("关注被关注码龄");
	if (
		!关注被关注码龄 ||
		typeof 个人信息.following !== "number" ||
		typeof 个人信息.followers !== "number" ||
		typeof 个人信息.created_at !== "string"
	)
		return;
	关注被关注码龄.innerText = ` 关注: ${个人信息.following} | 被关注: ${
		个人信息.followers
	} | 码龄: ${new Date().getFullYear() - new Date(个人信息.created_at).getFullYear()}年 `;
};

// 缓存键：GitHub 个人信息，命中时先立即渲染，再后台静默拉取最新数据覆盖
const 个人信息缓存键 = "缓存个人信息";
try {
	const 缓存个人信息 = JSON.parse(localStorage.getItem(个人信息缓存键) || "null");
	if (缓存个人信息) 渲染个人信息(缓存个人信息);
} catch (e) {
	// 缓存损坏（如手动改坏）时忽略，等待下面的拉取结果
	console.error(e);
}

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
		// 拉取成功即写入缓存并立即更新页面；拉取失败时保留缓存内容，继续展示旧数据
		try {
			localStorage.setItem(个人信息缓存键, JSON.stringify(个人信息));
		} catch (e) {
			console.error(e);
		}
		渲染个人信息(个人信息);
	})
	.catch(e => console.error(e));
//#endregion

延迟执行(
	"关键任务完成",
	() => {
		try {
			//#region 核心元素、事件、字体css等
			gd("回到顶部")?.addEventListener("click", 回到顶部);
			gd("分界线")?.addEventListener("click", () => {
				document.body.classList.toggle("宽屏");
			});
			//#endregion

			//#region reCAPTCHA 获取邮箱/tg
			[gd("电子邮箱"), gd("tg")].forEach(元素 => {
				元素?.addEventListener("click", 事件 => {
					事件.preventDefault();
					if (gd("recaptcha")) return;
					const div = 添加悬浮卡片(
						`
            <div id="g-recaptcha"></div>
            <button disabled id="recaptcha">提交</button>
            <button id="close_recaptcha">关闭</button>
            <a href="https://qwq.dsy4567.icu/api/getemail">在新标签页验证</a><br/>
            <p id="recaptcha_tips">要查看 dsy4567 的电子邮箱地址/TG 用户名，请通过 reCAPTCHA 人机验证。<br />
            继续查看电子邮箱地址即代表您同意不向 dsy4567<br />
            发送广告/要饭/雇童工/炒币等垃圾邮件。</p>
            <p class="悬浮卡片提示" id="recaptcha_status">正在加载人机验证…</p>
            <div id="recaptcha_result" tabindex="0"></div>
            <p class="悬浮卡片错误" id="recaptcha_error" hidden></p>`,
						0,
						事件.clientY,
						false
					);
					const 提交按钮 = /** @type {HTMLButtonElement} */ (
							qs("#recaptcha", false, div)
						),
						关闭按钮 = qs("#close_recaptcha", false, div),
						提示区 = qs("#recaptcha_tips", false, div),
						状态行 = qs("#recaptcha_status", false, div),
						结果区 = qs("#recaptcha_result", false, div),
						错误提示 = qs("#recaptcha_error", false, div),
						验证容器 = qs("#g-recaptcha", false, div);
					if (
						!提交按钮 ||
						!关闭按钮 ||
						!提示区 ||
						!状态行 ||
						!结果区 ||
						!错误提示 ||
						!验证容器
					)
						return;
					// 关闭按钮立即绑定，避免脚本加载期间卡片无法关闭
					关闭按钮.addEventListener("click", () => div.remove());
					/** 在错误行展示失败原因 @param {string} 原因 */
					const 显示验证错误 = 原因 => {
						错误提示.textContent = `recaptcha验证出现问题，原因：${原因}，请尝试关闭卡片并重试，或点击在新标签页验证`;
						错误提示.hidden = false;
					};
					/** reCAPTCHA 挂件 ID，脚本加载完毕渲染后才有值 */
					let /** @type {number | null} */ 挂件id = null,
						/** 是否正在提交，避免验证回调与按钮点击重复触发并发请求 */
						提交中 = false;
					/** 把验证回复发给接口并展示结果 @param {string} 回复 */
					const 提交回复 = async 回复 => {
						if (提交中) return;
						提交中 = true;
						状态行.hidden = true;
						提交按钮.disabled = true;
						try {
							const 响应 = await fetch(
								"https://qwq.dsy4567.icu/api/getemail?g-recaptcha-response=" + 回复
							);
							if (!响应.ok) throw new Error(`接口返回 HTTP ${响应.status}`);
							结果区.innerHTML = `<hr>${await 响应.text()}`;
							提示区.style.display = "none";
							验证容器.style.display = "none";
							提交按钮.disabled = true;
							结果区.focus();
						} catch (e) {
							console.error(e);
							提交按钮.disabled = false;
							显示验证错误(e instanceof Error ? e.message : String(e));
						} finally {
							提交中 = false;
						}
					};
					// reCAPTCHA 垫片：api.js 加载完成前先提供 grecaptcha.ready，
					// 回调会被排入 ___grecaptcha_cfg.fns，待脚本加载后由 reCAPTCHA 自动取出执行
					if (typeof grecaptcha === "undefined")
						/** @type {any} */ (window).grecaptcha = {
							ready: /** @param {() => void} 回调 */ 回调 => {
								const /** @type {any} */ 配置 = (window.___grecaptcha_cfg =
										window.___grecaptcha_cfg || {});
								(配置.fns = 配置.fns || []).push(回调);
							},
						};
					添加脚本(
						"https://www.recaptcha.net/recaptcha/api.js?render=explicit",
						null
					).catch(e => {
						console.error("无法加载 reCAPTCHA", e);
						状态行.hidden = true;
						显示验证错误("无法加载 reCAPTCHA 脚本");
					});
					grecaptcha.ready(() => {
						// 人机验证通过时由 grecaptcha 调用并传入回复，收到回复即自动提交
						/** @param {string} 回复 */
						const 验证完成 = 回复 => 提交回复(回复);
						try {
							// reCAPTCHA 就绪后立即渲染验证组件
							挂件id = grecaptcha.render(验证容器, {
								sitekey: gr_sitekey,
								theme: 当前是否深色() ? "dark" : "light",
								callback: 验证完成,
								"expired-callback": () => 显示验证错误("人机验证已过期"),
								"error-callback": () => 显示验证错误("人机验证执行出错"),
							});
						} catch (e) {
							console.error(e);
							显示验证错误(e instanceof Error ? e.message : String(e));
							return;
						}
						提交按钮.addEventListener("click", () => {
							if (挂件id === null) return;
							const 回复 = grecaptcha.getResponse(挂件id);
							if (!回复) {
								状态行.textContent = "请先完成上方的人机验证";
								return;
							}
							提交回复(回复);
						});
						状态行.textContent = "请勾选上方复选框完成人机验证";
						提交按钮.disabled = false;
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

			//#region 导航栏、标题高亮

			/** 记录上一次触发样式切换时的滚动位置，作为累计滚动幅度的基准（不在每次滚动时更新） */
			let scrollTop = 0,
				/**
				 * 当前导航栏的显示模式
				 *  - -1：初始状态（尚未判断过）
				 *  -  0：页面位于顶部（显示顶部样式）
				 *  -  1：向下滚动（隐藏导航栏）
				 *  -  2：向上滚动（显示导航栏，但不含顶部样式）
				 */
				状态 = -1;
			let 顶部一定范围不隐藏阈值 = 518;

			/** 触发样式切换所需的最小滚动幅度（px），避免小幅滚动频繁切换导致导航栏抖动 */
			const 滚动阈值 = 25;
			/**
			 * 两次更新之间的最小间隔（毫秒）：高亮只在标题顶端越过判定线时才变化，
			 * 导航栏同样不需要逐帧跟手，故不再逐帧（rAF）更新，改为按最小间隔时间节流
			 */
			const 更新最小间隔 = 100;
			const 类列表 = document.body.classList;

			/**
			 * 首次监听滚动前的延迟时长（毫秒）：首屏（含动态换页重建正文）期间浏览器可能派发滚动事件，
			 * 此时读取 scrollY 会强制同步布局而引发重排，故延迟注册监听器，期间的滚动事件一律忽略
			 */
			const 滚动监听延迟 = 3000;

			/**
			 * 标题高亮判定线所在的视口高度百分比：标题顶端超过该线即视为“已滚过”，
			 * 取最后一个已滚过的标题作为当前阅读位置（可视需要调整）
			 */
			const 滚动高亮视口百分比 = 0.65;
			/** 参与高亮的标题选择器，与 global-nfp.css 中 ::before 的样式规则保持一致 */
			const 标题选择器 = 支持has选择器
				? ":is(h1, h2, h3, h4, h5, h6):not(:has(svg))"
				: "h1, h2, h3, h4, h5, h6";

			// 滚动与鼠标各自维护一个高亮类，互不干扰，因此无需在两者之间做竞争仲裁
			/** 上一次被滚动逻辑高亮的标题 @type {Element | null} */
			let 上次滚动高亮标题 = null;
			/** 上一次被鼠标逻辑高亮的标题 @type {Element | null} */
			let 上次鼠标高亮标题 = null;
			/** 参与高亮的标题元素列表缓存 @type {Element[]} */
			let 标题元素列表 = [];
			/** 标题元素列表是否仍与正文一致，正文子节点变化后置否 */
			let 标题列表有效 = false;

			/**
			 * 当前正文内参与高亮的标题元素列表，正文变化后自动重新获取
			 * 正文常由其他模块异步写入（如 blog.js 拉取完文章后才替换加载提示），
			 * 换页计数器无法预知这种迟到写入，故由观察正文子节点变化的 MutationObserver 置否
			 * @returns {Element[]}
			 */
			const 取标题元素列表 = () => {
				if (标题列表有效) return 标题元素列表;
				标题列表有效 = true;
				const 匹配到的标题 = Array.from(
					qs("main > .右", true)?.querySelectorAll(标题选择器) || []
				);
				// 不支持 :has() 时选择器退化为纯标签列表，需在 JS 侧剔除含 svg 图标的标题，保证两端集合一致
				标题元素列表 = 支持has选择器
					? 匹配到的标题
					: 匹配到的标题.filter(元素 => !元素.querySelector("svg"));
				// 不重置 上次滚动高亮标题/上次鼠标高亮标题：正文局部增删时旧高亮节点可能仍在文档中，
				// 保留引用才能让 切换标题高亮 从它身上移除高亮类
				return 标题元素列表;
			};

			/**
			 * 把某个高亮类从旧目标迁移到新目标，新旧相同时不做任何事
			 * @param {"高亮-滚动" | "高亮-鼠标"} 类名
			 * @param {Element | null} 旧目标
			 * @param {Element | null} 新目标
			 * @returns {Element | null} 新目标
			 */
			const 切换标题高亮 = (类名, 旧目标, 新目标) => {
				if (旧目标 === 新目标) return 新目标;
				旧目标?.classList.remove(类名);
				新目标?.classList.add(类名);
				return 新目标;
			};

			setTimeout(() => {
				const 窗口尺寸变化 = () => {
					if (document.body.clientWidth <= 移动端界面最大宽度)
						顶部一定范围不隐藏阈值 =
							qs("main > .右")?.offsetTop || 顶部一定范围不隐藏阈值;
				};
				addEventListener("resize", 窗口尺寸变化);
				窗口尺寸变化();

				/** 根据当前滚动位置更新导航栏的显示模式 */
				const 更新导航栏 = () => {
					const 当前滚动位置 = scrollY;

					// 情况一：滚动到页面顶部（scrollTop <= 顶部一定范围不隐藏阈值 - 64）且当前状态不是“顶部”
					if (当前滚动位置 <= 顶部一定范围不隐藏阈值 - 64) {
						if (状态 !== 0) {
							类列表.add("顶部");
							类列表.remove("隐藏导航栏");
							状态 = 0;
						}
						scrollTop = 0;
					}
					// 情况二：向下滚动且累计幅度超过阈值，状态不是“隐藏导航栏”
					else if (当前滚动位置 - scrollTop > 滚动阈值) {
						if (状态 !== 1) {
							类列表.remove("顶部");
							类列表.add("隐藏导航栏");
							状态 = 1;
						}
						scrollTop = 当前滚动位置;
					}
					// 情况三：向上滚动且累计幅度超过阈值，状态不是“显示导航栏”
					else if (scrollTop - 当前滚动位置 > 滚动阈值) {
						if (状态 !== 2) {
							类列表.remove("顶部", "隐藏导航栏");
							状态 = 2;
						}
						scrollTop = 当前滚动位置;
					}
				};

				/** 高亮判定线上方最后一个标题，作为当前阅读位置 */
				const 更新滚动高亮 = () => {
					const 判定线 = innerHeight * 滚动高亮视口百分比;
					/** @type {Element | null} */
					let 命中 = null;
					// 标题在文档中自上而下排列，顺序读取坐标即可；getBoundingClientRect 只读不写，
					// 统一读完再改类名，避免逐元素读写交替造成的布局抖动
					for (const 标题 of 取标题元素列表()) {
						if (标题.getBoundingClientRect().top > 判定线) break;
						命中 = 标题;
					}
					上次滚动高亮标题 = 切换标题高亮("高亮-滚动", 上次滚动高亮标题, 命中);
				};

				/** 高亮光标上方最近的标题；光标位于所有标题之上时清除高亮 @param {number} 光标Y */
				const 更新鼠标高亮 = 光标Y => {
					/** @type {Element | null} */
					let 命中 = null;
					for (const 标题 of 取标题元素列表()) {
						if (标题.getBoundingClientRect().top > 光标Y) break;
						命中 = 标题;
					}
					// 命中为 null（光标在所有标题之上）时，切换标题高亮 会顺带移除旧目标的高亮
					上次鼠标高亮标题 = 切换标题高亮("高亮-鼠标", 上次鼠标高亮标题, 命中);
				};

				/**
				 * 「立即执行 + 尾随合并」的时间节流器：首次调用立即执行，
				 * 间隔内的后续调用只登记一次尾随执行，保证停下后的最终状态也能被应用
				 * @param {() => void} 任务
				 */
				const 创建节流器 = 任务 => {
					/** @type {ReturnType<typeof setTimeout> | null} */
					let 定时器 = null;
					let 上次执行 = Number.NEGATIVE_INFINITY;
					const 执行 = () => {
						上次执行 = performance.now();
						任务();
					};
					return () => {
						if (定时器 !== null) return; // 已有尾随执行在等待，本次触发合并进去即可
						const 剩余 = 更新最小间隔 - (performance.now() - 上次执行);
						if (剩余 <= 0) {
							执行();
							return;
						}
						定时器 = setTimeout(() => {
							定时器 = null;
							执行();
						}, 剩余);
					};
				};

				/** 把导航栏与滚动高亮的更新合并到同一次节流执行中（滚动、正文变化共用） */
				const 排队更新 = 创建节流器(() => {
					更新导航栏();
					更新滚动高亮();
				});
				addEventListener("scroll", 排队更新, { passive: true });

				// 观察正文子节点增删，覆盖换页以外的写入（含其他模块的异步写入与局部追加）；
				// 正文元素自身不随换页替换（动态换页只替换其 innerHTML），故可长期观察，
				// 且只观察子节点、不观察属性，避免高亮类名的增删反过来触发观察器
				const 正文元素 = qs("main > .右", true);
				if (正文元素)
					new MutationObserver(() => {
						标题列表有效 = false;
						// 正文写入时用户未必会滚动或移动鼠标，这里补一次更新，避免高亮长时间缺席
						排队更新();
					}).observe(正文元素, { childList: true, subtree: true });

				let 光标Y = 0;
				/** 把鼠标高亮的更新合并到同一次节流执行中（每次读取最新的 光标Y） */
				const 排队鼠标更新 = 创建节流器(() => 更新鼠标高亮(光标Y));
				// 用 pointermove 而非 mousemove：除鼠标外还能覆盖手写笔的悬浮；
				// 过滤 pointerType 排除触摸，触摸拖动不参与高亮（触摸也没有真正的「悬浮」）
				addEventListener(
					"pointermove",
					事件 => {
						if (事件.pointerType !== "mouse" && 事件.pointerType !== "pen") return;
						光标Y = 事件.clientY;
						排队鼠标更新();
					},
					{ passive: true }
				);
			}, 滚动监听延迟);
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

			//#region 引入统计脚本
			import("./analytics.js");
			//#endregion
		} catch (e) {
			console.error(e);
		}
	},
	3
);

addEventListener("copy", () => {
	提示("复制成功");
});
addEventListener("popstate", 事件 => {
	// hash 变化执行默认行为
	if (获取清理后当前路径() === 路径 || 事件.state?.路径 === 路径) return 事件.preventDefault();
	动态加载({
		href: location.href,
		popstate: true,
	});
});
/** 用事件委托统一处理动态加载链接的点击，避免给每个链接单独绑定监听器和闭包 */
addEventListener("click", 事件 => {
	const 目标 = 事件.target;
	if (!(目标 instanceof Element)) return;
	const a = 目标.closest("a");
	if (!a) return;
	// 下载链接、以及指定了非 _self 打开方式的链接交给浏览器自行处理，不发起动态加载请求
	if (a.hasAttribute("download") || (a.target && a.target !== "_self")) return;

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
//   1. 爬虫 / 本地环境 / 已在新域名（且非刚从旧域名跳来）→ 不做任何处理
//   2. 刚从旧域名跳来（URL 带 from-non-icu-tld）→ 在新域名上弹「回原域名」横幅
//   3. 用户选择过「不跳转」（URL 参数或 localStorage 的 no-redirect）→ 仅弹横幅提示新域名
//   4. 其余情况 → 自动跳转并在 URL 携带来源参数，供新域名页面弹「回原域名」横幅
延迟执行(
	"关键任务完成",
	() => {
		try {
			// 所有改写先在 URL 副本上进行，最后统一生效
			let U = new URL(location.href);
			// 删除迁移流程专用的 URL 参数：
			// from-hostname（来源域名）、from-non-icu-tld（来自非 .icu 域名）、no-redirect（用户选择不跳转）
			const 删除url参数 = () => {
				U.searchParams.delete("from-hostname");
				U.searchParams.delete("from-non-icu-tld");
				U.searchParams.delete("no-redirect");
			};
			const 本地域名 = ["dev.dsy4567.icu", "localhost"];
			const 是否为纯ip = /** @param {string} hostname */ hostname => {
				return hostname.split(".").every(p => {
					const n = Number(p);
					return Number.isInteger(n) && n >= 0 && n <= 255 && String(n) === p;
				});
			};

			// 是否刚从旧域名跳来（URL 带 from-non-icu-tld 标记）
			const 来自旧域名 = JSON.parse(U.searchParams.get("from-non-icu-tld") || "false");

			// 已在 dsy4567.icu（含子域名）或黑名单域名上则无需处理；
			// 例外：刚从旧域名跳来的请求需放行，否则下方情况 C 永远不会执行
			if (
				(location.hostname.endsWith("dsy4567.icu") && !来自旧域名) ||
				location.hostname.endsWith(".ts.net") || // Tailscale
				本地域名.includes(location.hostname) ||
				是否为纯ip(location.hostname)
			)
				return;

			// 情况 A：用户已选择「不跳转」→ 仅弹横幅提示，不强制跳转
			// 来自旧域名时不适用：此时已在新域名上，弹「迁移至新域名」横幅没有意义
			if (
				!来自旧域名 &&
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
			} else if (!来自旧域名) {
				// 情况 B：默认自动跳转到新域名
				if (网页访问者不为爬虫) {
					// 在 URL 上记录来源信息，供新域名页面弹「回原域名」横幅使用
					U.searchParams.set("from-non-icu-tld", "true");
					U.searchParams.set("from-hostname", location.hostname);
				} else 删除url参数();

				U.hostname = "dsy4567.icu";
				location.href = U.href;
			}

			// 情况 C：刚从旧域名跳来（URL 带 from-non-icu-tld、from-hostname）→ 在新域名上弹「回原域名」横幅
			let 原域名 = U.searchParams.get("from-hostname");
			if (网页访问者不为爬虫 && 来自旧域名) {
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
	3
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
