/* Copyright (c) 2023 dsy4567, view license at <https://github.com/dsy4567/dsy4567.github.io/blob/main/LICENSE.md> */

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

function 加载模块() {
	路径 = 获取清理后的路径();
	let 路径2 = 获取清理后的路径(true);
	for (const s of 加载清单[路径] || []) {
		const i = import(`/js/${s}.js`),
			f = async () => {
				(await i).main(路径2);
			};
		DOMContentLoaded ? f() : addEventListener("DOMContentLoaded", f);
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
						路径:
							u.pathname.replace(/(index|\.html)/g, "").replace(/\/\//g, "") +
							u.search,
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

				if (u.pathname.replace(/(index|\.html)/g, "").replace(/\/\//g, "") === "/") {
					显示或隐藏进度条(false);
					可以滚动到视图中 = true;
					if (!location.hash)
						右.scrollIntoView({
							behavior: "smooth",
						});
				}
				正在动态加载 = false;
				添加点击事件和设置图标();
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
function 完成加载() {
	添加点击事件和设置图标({
		设置图标: false,
	});
}
function 添加点击事件和设置图标(/** @type {添加点击事件和设置图标选项} */ 选项 = {}) {
	if (typeof 选项.设置图标 === "undefined" ? true : 选项.设置图标)
		for (const 元素 of 选项.要设置图标的元素?.[0]
			? 选项.要设置图标的元素
			: qsa("svg[data-icon]")) {
			// @ts-ignore
			if (!元素.dataset.icon) break;
			let c = 元素.getAttribute("class");
			let h = c
				? // @ts-ignore
				  图标[元素.dataset.icon]?.replace(/特?小尺寸/, c)
				: // @ts-ignore
				  图标[元素.dataset.icon];
			h && (元素.outerHTML = h);
		}
	if (typeof 选项.添加链接点击事件 === "undefined" ? true : 选项.添加链接点击事件) {
		const a = 选项.要添加链接点击事件的元素?.[0] ? 选项.要添加链接点击事件的元素 : ge("a");
		for (const 元素 of a) {
			if (元素.pathname === location.pathname && 元素.hash) {
				if (!元素.classList.contains("hash链接")) 元素.classList.add("hash链接");
				continue;
			}
			if (!元素.classList.contains("内链") && 元素.host === location.host) {
				元素.classList.add("内链");
				元素.classList.remove("外链");
				元素.href = new URL(元素.href, location.href).href;
			}
			if (元素.host !== location.host && !元素.classList.contains("外链")) {
				元素.classList.add("外链");
				元素.classList.remove("内链");
				元素.classList.remove("动态加载");
				元素.target = "_blank";
			} else if (元素.host === location.host && !元素.classList.contains("动态加载")) {
				元素.classList.add("动态加载");
				元素.addEventListener("click", 事件 => {
					if (!元素.classList.contains("动态加载")) return;
					事件.preventDefault();
					动态加载(元素);
				});
			}
			if (元素.querySelector("img, svg") && !元素.classList.contains("无滤镜"))
				元素.classList.add("无滤镜");
		}
	}
	if (typeof 选项.添加图片点击事件 === "undefined" ? true : 选项.添加图片点击事件) {
		const img = 选项.要添加图片点击事件的元素?.[0] ? 选项.要添加图片点击事件的元素 : ge("img");
		for (const 元素 of img) 元素.ondblclick = () => open(元素.src, "_blank");
	}
}
// 网抑云阴乐歌单+控件
!navigator.userAgent.match(/bot|spider/gi) &&
	fetch("/json/ncm.json")
		.then(res => res.json())
		.then(async j => {
			const 网抑云阴乐 = (await import("./ncm.js")).default;

			for (let i = 0; i < j.songs.length; i++) {
				const /** @type {音乐信息} */ 音乐信息 = j.songs[i];

				let /** @type {string[]} */ 所有歌手 = [];
				音乐信息.ar.forEach(歌手 => 所有歌手.push(歌手.name));
				网抑云阴乐.歌单[i] = {
					完整歌名: "",
					歌名: 音乐信息.name,
					歌手: 所有歌手.join(" / "),
					专辑: 音乐信息.al.name,
					封面: 音乐信息.al.picUrl,
					mv: 音乐信息.mv,
					id: 音乐信息.id,
				};
				网抑云阴乐.歌单[i].完整歌名 =
					网抑云阴乐.歌单[i].歌手 + " - " + 网抑云阴乐.歌单[i].歌名;
				网抑云阴乐.歌单索引[音乐信息.id] = i;
			}
			function svg(
				/** @type {string} */ html,
				/** @type {( 元素: HTMLButtonElement ) => void} */ onclick,
				/** @type {string} */ title,
				role = "button"
			) {
				// @ts-ignore
				let /** @type {HTMLButtonElement} */ btn = ce("button");
				btn.innerHTML = html;
				btn.onclick = async () => {
					await 网抑云阴乐.初始化();
					onclick(btn);
				};
				btn.type = "button";
				btn.title = title;
				btn.role = role;
				btn.ariaChecked = role === "checkbox" ? "false" : null;
				gd("阴乐控件", true)?.append(btn);
			}
			const f = () => {
				svg(`<svg class="特小尺寸" data-icon="上一首"></svg>`, 网抑云阴乐.上一首, "上一首");
				svg(
					`<svg class="特小尺寸" data-icon="播放暂停"></svg>`,
					网抑云阴乐.播放暂停,
					"播放/暂停"
				);
				svg(`<svg class="特小尺寸" data-icon="下一首"></svg>`, 网抑云阴乐.下一首, "下一首");
				svg(
					`<svg class="特小尺寸" data-icon="在网抑云阴乐中查看"></svg>`,
					() => {
						网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].id &&
							open(
								"https://music.163.com/#/song?id=" +
									网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].id
							);
					},
					"在网抑云阴乐中查看"
				);
				svg(
					`<svg class="特小尺寸" data-icon="随机播放"></svg>`,
					网抑云阴乐.启用或禁用随机播放,
					"随机播放",
					"checkbox"
				);
				svg(`<svg class="特小尺寸" data-icon="音量"></svg>`, 网抑云阴乐.更改音量, "音量");
				gd("阴乐控件", true)?.insertAdjacentHTML(
					"beforeend",
					`<a style="background:#000;color:#fff;" href="#切换主题" class="隐藏链接">跳过播放列表</a><ol id="播放列表"></ol>`
				);
				let 元素 = [];
				网抑云阴乐.歌单.forEach(音乐信息 => {
					let li = ce("li");
					li.innerHTML = `${音乐信息.歌名} <span class="淡化">${音乐信息.歌手}</span>`;
					// @ts-ignore
					li.onclick = li.onkeyup = 事件 => {
						if (事件?.key === "Enter" || !事件?.key)
							网抑云阴乐.切换音乐(音乐信息.id, true);
					};
					li.tabIndex = 0;
					li.title = 音乐信息.完整歌名;
					li.dataset.id = "" + 音乐信息.id;
					gd("播放列表", true)?.append(li);
				});
				添加点击事件和设置图标();

				网抑云阴乐.初始化();
			};
			DOMContentLoaded ? f() : addEventListener("DOMContentLoaded", f);
		})
		.catch(e => console.error(e));
// 主题
fetch("/json/theme.json")
	.then(res => res.json())
	.then(主题 => {
		Object.keys(主题).forEach(t => {
			// @ts-ignore
			let /** @type {HTMLButtonElement} */ btn = ce("button");
			btn.style.backgroundColor = 主题[t]["--theme-color"];
			btn.title = t;
			btn.role = "radio";
			btn.ariaChecked = "false";
			btn.onclick = 提示用户 => {
				// @ts-ignore
				if (提示用户 !== false) {
					[
						"--theme-color",
						"--theme-color-h",
						"--theme-color-s",
						"--theme-color-l",
						"--theme-color-transparent",
						"--text-color",
					].forEach(n => {
						document.documentElement.style.setProperty(n, 主题[t][n]);
					});
					localStorage.setItem("theme", t);
					localStorage.setItem(
						"主题色",
						// @ts-ignore
						(gd("自定义主题色", true).value = 主题[t]["--theme-color"])
					);
					localStorage.setItem("主题色h", 主题[t]["--theme-color-h"]);
					localStorage.setItem("主题色s", 主题[t]["--theme-color-s"]);
					localStorage.setItem("主题色l", 主题[t]["--theme-color-l"]);
					localStorage.setItem("透明色", 主题[t]["--theme-color-transparent"]);
					localStorage.setItem("字体色", 主题[t]["--text-color"]);
					提示("已切换主题: " + t);
				}

				gd("主题色")?.setAttribute("content", 主题[t]["--theme-color"]);
				qsa("#所有主题 > button").forEach(元素 => (元素.ariaChecked = "false"));
				btn.ariaChecked = "true";
			};
			// @ts-ignore
			if (t === localStorage.getItem("theme")) btn.onclick(false);
			const f = () => gd("所有主题", true)?.append(btn);
			DOMContentLoaded ? f() : addEventListener("DOMContentLoaded", f);
		});

		// @ts-ignore
		let /** @type {HTMLButtonElement} */ btn = ce("button");
		btn.title = "自定义主题色";
		btn.role = "radio";
		btn.ariaChecked = "false";
		btn.innerHTML =
			"<svg class='特小尺寸' data-icon='调色盘'></svg></svg><input aria-label='自定义主题色调色盘' style='opacity:0;pointer-events:none;position:absolute;top:0;width:0;height:0' tabindex='-1' id='自定义主题色' type='color' />";
		btn.onclick = 提示用户 => {
			let 自定义主题色 = gd("自定义主题色", true);
			if (!自定义主题色) return;
			自定义主题色.click();
			自定义主题色.onchange = () => {
				let rgb, r, g, b, hsl;
				// @ts-ignore
				if (提示用户 !== false) {
					rgb =
						// @ts-ignore
						gd("自定义主题色", true)?.value || "#000000";
					r = parseInt("0x" + rgb.substring(1, 3));
					g = parseInt("0x" + rgb.substring(3, 5));
					b = parseInt("0x" + rgb.substring(5, 7));
					hsl = rgb转hsl(r, g, b);
					let 字体色 =
						(r * 0.2126 + g * 0.7152 + b * 0.0722) / 255 >= 0.5 ? "#222" : "#ccc";
					btn.ariaChecked = "true";
					Object.entries({
						"--theme-color": rgb,
						"--theme-color-h": hsl[0],
						"--theme-color-s": hsl[1],
						"--theme-color-l": hsl[2],
						"--theme-color-transparent": "#8888",
						"--text-color": 字体色,
					}).forEach(a => {
						document.documentElement.style.setProperty(a[0], "" + a[1]);
					});
					localStorage.setItem("theme", "自定义主题");
					localStorage.setItem("主题色", rgb);
					localStorage.setItem("主题色h", "" + hsl[0]);
					localStorage.setItem("主题色s", "" + hsl[1]);
					localStorage.setItem("主题色l", "" + hsl[2]);
					localStorage.setItem("透明色", "#8888");
					localStorage.setItem("字体色", 字体色);
				}
				gd("主题色")?.setAttribute("content", localStorage.getItem("主题色") || "");

				// @ts-ignore
				提示用户 !== false && 提示("已切换自定义主题");
			};
			gd("主题色")?.setAttribute("content", localStorage.getItem("主题色") || "");
			qsa("#所有主题 > button").forEach(元素 => (元素.ariaChecked = "false"));
			btn.ariaChecked = "true";
		};
		const f = () => {
			gd("所有主题", true)?.append(btn);
			添加点击事件和设置图标({
				添加图片点击事件: false,
				添加链接点击事件: false,
				设置图标: true,
				要设置图标的元素: btn.getElementsByTagName("svg"),
			});
		};
		// @ts-ignore
		if (localStorage.getItem("theme") === "自定义主题") btn.onclick(false);
		DOMContentLoaded ? f() : addEventListener("DOMContentLoaded", f);
	})
	.catch(e => console.error(e));
fetch("https://dsy4567.cf/api/hitokoto")
	.then(res => res.json())
	.then(j => {
		const f = () => {
			let 一言 = gd("一言", true),
				// @ts-ignore
				/** @type {HTMLAnchorElement} */ 链接 = qs("#一言+a");
			if (!一言 || !链接) return;
			一言.innerText = j.hitokoto;
			链接.href = "https://hitokoto.cn/?uuid=" + j.uuid;
			添加点击事件和设置图标({
				添加图片点击事件: false,
				添加链接点击事件: true,
				设置图标: false,
				要添加链接点击事件的元素: [链接],
			});
		};
		DOMContentLoaded ? f() : addEventListener("DOMContentLoaded", f);
	})
	.catch(e => console.error(e));
fetch("/json/icon.json")
	.then(res => res.json())
	.then(j => {
		const f = () => {
			图标 = j;
			添加点击事件和设置图标({
				添加图片点击事件: false,
				添加链接点击事件: false,
				设置图标: true,
			});
		};
		DOMContentLoaded ? f() : addEventListener("DOMContentLoaded", f);
	})
	.catch(e => console.error(e));
fetch("https://api.github.com/users/dsy4567")
	.then(res => res.json())
	.then(个人信息 => {
		const f = () => {
			const 关注粉丝码龄 = gd("关注粉丝码龄");
			if (!关注粉丝码龄) return;
			关注粉丝码龄.innerHTML = ` 关注: ${个人信息.following} | 粉丝: ${
				个人信息.followers
			} | 码龄: ${new Date().getFullYear() - new Date(个人信息.created_at).getFullYear()}年 `;
		};
		DOMContentLoaded ? f() : addEventListener("DOMContentLoaded", f);
	})
	.catch(e => console.error(e));

addEventListener("copy", () => {
	提示("复制成功");
});
(() => {
	const f = async () => {
		gd("回到顶部")?.addEventListener("click", () =>
			document.body.scrollIntoView({ behavior: "smooth" })
		);
		gd("分界线")?.addEventListener("click", () => {
			document.body.classList.toggle("宽屏");
		});
		qsa("#电子邮箱, #tg").forEach(元素 => {
			元素.addEventListener("click", 事件 => {
				事件.preventDefault();
				if (gd("recaptcha")) return;
				let div = 添加悬浮卡片(
					`
            <div id="g-recaptcha"></div><br />
            <button id="recaptcha">开始人机验证/提交</button>
            <button id="close_recaptcha">关闭</button>
            <a href="https://qwq.dsy4567.cf/api/getemail">在新标签页验证</a><br/>
            要查看 dsy4567 的电子邮箱地址/TG 用户名，请通过 reCAPTCHA 人机验证。<br />
            继续查看电子邮箱地址即代表您同意不向 dsy4567<br />
            发送广告/要饭/雇童工/炒币等垃圾邮件。`,
					// @ts-ignore
					事件.pageX,
					// @ts-ignore
					事件.pageY,
					false
				);
				添加点击事件和设置图标({
					设置图标: false,
					添加图片点击事件: false,
					添加链接点击事件: true,
					要添加链接点击事件的元素: div.getElementsByTagName("a"),
				});
				添加脚本("https://www.recaptcha.net/recaptcha/api.js?render=explicit").then(() => {
					gd("close_recaptcha")?.addEventListener("click", () => {
						div.remove();
					});
					gd("recaptcha")?.addEventListener("click", async 事件 => {
						const gr = gd("g-recaptcha");
						if (!gr) return;
						try {
							const 回复 = grecaptcha.getResponse();
							if (!回复) throw new Error();
							gr.innerHTML = await (
								await fetch(
									"https://qwq.dsy4567.cf/api/getemail?g-recaptcha-response=" +
										回复
								)
							).text();
							添加点击事件和设置图标({
								设置图标: false,
								添加图片点击事件: false,
								添加链接点击事件: true,
								要添加链接点击事件的元素: div.getElementsByTagName("a"),
							});
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
				});
			});
		});
		let fuck = gd("fuck");
		if (fuck)
			fuck.innerText =
				["\u4f60\u5988", "\u5c3c\u739b", "\u4f60\u5927\u7237", "\u5bc4\u5427"][随机数(3)] ||
				"\u4f60\u5988";
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
		完成加载();

		let style = ce("style");
		style.innerHTML = `a,
    button,
    div,
    section,
    img,
    nav,
    li {
        transition: 0.3s border-radius, 0.3s backdrop-filter, 0.3s background-image,
		0.3s transform, 0.3s box-shadow, 0.3s filter, 0.3s background-color,
		0.3s opacity, 0.3s max-height;
    }`;
		setTimeout(() => {
			document.head.append(style);
		}, 500);

		import("./analytics.js");
	};

	DOMContentLoaded ? f() : document.addEventListener("DOMContentLoaded", f);
})();
addEventListener("popstate", 事件 => {
	if (获取清理后的路径(true) === 路径 || 事件.state?.路径 === 路径) return 事件.preventDefault();
	动态加载({
		href: location.pathname,
		popstate: true,
	});
});

加载模块();

_global["main.js"] = () => ({
	loaded,
	DOMContentLoaded,
	路径,
	图标,
	正在动态加载,
	加载模块,
	动态加载,
	完成加载,
	添加点击事件和设置图标,
});
