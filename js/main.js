/* Copyright (c) 2023 dsy4567, view license at <https://github.com/dsy4567/dsy4567.github.io/blob/main/LICENSE.md> */

"use strict";

import 网抑云阴乐 from "./ncm.js";

const /** @type {Record<string, string[]>} */ 加载清单 = {
        "/": [],
        "/blog": ["blog"],
        "/friends": ["friends"],
    },
    歌单id = localStorage.getItem("歌单id") || 8219428260,
    gr_sitekey = "6Ldo1dIkAAAAAM_2VtEneT3l7AE25HdWU45x03ng";
let 路径 = (location.pathname + location.search)
        .rp(/(index|\.html)/g, "")
        .rp(/\/\//g, ""),
    正在动态加载 = false,
    图标 = {};

async function 加载模块() {
    路径 = 获取清理后的路径();
    let 路径2 = 获取清理后的路径(true);
    for (let i = 0; i < 加载清单[路径].length; i++) {
        let s = 加载清单[路径][i];
        (await import(`/js/${s}.js`)).main(路径2);
    }
    路径 = 路径2;
}
/** @param {{href: string, popstate:boolean}} el */
function 动态加载(元素) {
    if (正在动态加载) {
        open(元素.href, "_self");
        return 显示或隐藏进度条(false);
    }
    正在动态加载 = true;
    显示或隐藏进度条(true);
    qs("meta[name='robots']").content = "";
    fetch(元素.href)
        .then(res => res.text())
        .then(async html => {
            let m = html.match(/<!-- START MAIN -->.+<!-- END MAIN -->/s),
                mt = html.match(/<title>.+<\/title>/s);
            if (!m) throw new Error("动态加载失败: 匹配结果为空");
            let u = new URL(元素.href, location.href);
            !元素.popstate &&
                history.pushState(
                    {
                        路径: (u.pathname + u.search)
                            .rp(/(index|\.html)/g, "")
                            .rp(/\/\//g, ""),
                    },
                    "",
                    元素.href
                );
            document.title = mt[0].rp(/<\/?title>/g, "");
            dispatchEvent(URL发生变化事件);
            try {
                qs("main .右").innerHTML = m[0];
                await 加载模块();

                u.pathname.rp(/(index|\.html)/g, "").rp(/\/\//g, "") === "/" &&
                    显示或隐藏进度条(false);
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
    添加点击事件和设置图标();
}
async function 添加点击事件和设置图标() {
    qsa("svg[data-icon]").forEach(元素 => {
        图标[元素.dataset.icon] && (元素.outerHTML = 图标[元素.dataset.icon]);
    });
    qsa("a").forEach(元素 => {
        if (元素.pathname === location.pathname && 元素.href.includes("#"))
            return;
        if (元素.host !== location.host && !元素.className.includes("外链")) {
            if (!元素.querySelector("img, svg")) 元素.classList.add("外链");
            元素.target = "_blank";
        } else if (
            元素.host === location.host &&
            !元素.className.includes("动态加载")
        ) {
            元素.classList.add("动态加载");
            元素.addEventListener("click", 事件 => {
                事件.preventDefault();
                动态加载(元素);
            });
        }
        if (元素.querySelector("img") && !元素.className.includes("无滤镜"))
            元素.classList.add("无滤镜");
    });
    qsa("img").forEach(元素 => {
        元素.ondblclick = () => open(元素.src, "_blank");
    });
}
// 网抑云阴乐歌单+控件
!navigator.userAgent.toLowerCase().match(/bot|spider/g) &&
    fetch("https://ncm.vercel.dsy4567.cf/playlist/track/all?id=" + 歌单id)
        .then(res => res.json())
        .then(j => {
            for (let i = 0; i < j.songs.length; i++) {
                const 音乐信息 = j.songs[i];
                let 所有歌手 = [];
                音乐信息.ar.forEach(歌手 => 所有歌手.push(歌手.name));
                网抑云阴乐.歌单[i] = {
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
            async function svg(
                html,
                /** @type {(元素:HTMLButtonElement)=>void} */ onclick,
                title,
                role = "button"
            ) {
                let btn = ce("button");
                btn.innerHTML = html;
                btn.onclick = () => {
                    onclick(btn);
                };
                btn.type = "button";
                btn.title = title;
                btn.role = role;
                btn.ariaChecked = role === "checkbox" ? false : null;
                qs("#阴乐控件").append(btn);
            }
            let f = () => {
                svg(
                    `<svg class="特小尺寸" data-icon="上一首"></svg>`,
                    网抑云阴乐.上一首,
                    "上一首"
                );
                svg(
                    `<svg class="特小尺寸" data-icon="播放暂停"></svg>`,
                    网抑云阴乐.播放暂停,
                    "播放/暂停"
                );
                svg(
                    `<svg class="特小尺寸" data-icon="下一首"></svg>`,
                    网抑云阴乐.下一首,
                    "下一首"
                );
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
                svg(
                    `<svg class="特小尺寸" data-icon="音量"></svg>`,
                    网抑云阴乐.更改音量,
                    "音量"
                );
                qs("#阴乐控件").insertAdjacentHTML(
                    "beforeend",
                    `<a style="background:#000;color:#fff;" href="#切换主题" class="隐藏链接">跳过播放列表</a><ol id="播放列表"></ol>`
                );
                网抑云阴乐.歌单.forEach(async 音乐信息 => {
                    let li = ce("li");
                    li.innerHTML = `${音乐信息.歌名} <span class="淡化">${音乐信息.歌手}</span>`;
                    li.onclick = li.onkeyup = 事件 => {
                        if (事件?.key === "Enter" || !事件?.key)
                            网抑云阴乐.切换音乐(音乐信息.id, true);
                    };
                    li.tabIndex = 0;
                    li.title = 音乐信息.完整歌名;
                    li.dataset.id = 音乐信息.id;
                    qs("#播放列表").append(li);
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
            let /** @type {HTMLButtonElement} */ btn = ce("button");
            btn.style.backgroundColor = 主题[t]["--theme-color"];
            btn.title = t;
            btn.role = "radio";
            btn.ariaChecked = false;
            btn.onclick = 提示用户 => {
                qsa("#所有主题 > button").forEach(
                    元素 => (元素.ariaChecked = false)
                );
                btn.ariaChecked = true;
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
                qs("#主题色").content = 主题[t]["--theme-color"];
                localStorage.setItem("theme", t);
                localStorage.setItem("主题色", 主题[t]["--theme-color"]);
                localStorage.setItem("主题色h", 主题[t]["--theme-color-h"]);
                localStorage.setItem("主题色s", 主题[t]["--theme-color-s"]);
                localStorage.setItem("主题色l", 主题[t]["--theme-color-l"]);
                localStorage.setItem(
                    "透明色",
                    主题[t]["--theme-color-transparent"]
                );
                localStorage.setItem("字体色", 主题[t]["--text-color"]);
                提示用户 !== false && 提示("已切换主题: " + t);
            };
            if (t === localStorage.getItem("theme")) btn.onclick(false);
            let f = () => qs("#所有主题").append(btn);
            DOMContentLoaded ? f() : addEventListener("DOMContentLoaded", f);
        });
    })
    .catch(e => console.error(e));
fetch("https://v1.hitokoto.cn/")
    .then(res => res.json())
    .then(j => {
        let f = () => {
            qs("#一言").innerText = j.hitokoto;
            qsa("#一言, .一言 .date").forEach(
                元素 =>
                    (元素.ondblclick = () =>
                        open("https://hitokoto.cn/?uuid=" + j.uuid, "_blank"))
            );
        };
        DOMContentLoaded ? f() : addEventListener("DOMContentLoaded", f);
    })
    .catch(e => console.error(e));
fetch("/json/icon.json")
    .then(res => res.json())
    .then(j => {
        let f = () => {
            图标 = j;
            添加点击事件和设置图标();
        };
        DOMContentLoaded ? f() : addEventListener("DOMContentLoaded", f);
    })
    .catch(e => console.error(e));
fetch("https://api.github.com/users/dsy4567")
    .then(res => res.json())
    .then(个人信息 => {
        let f = () => {
            qs("#关注粉丝码龄").innerHTML = ` 关注: ${
                个人信息.following
            } | 粉丝: ${个人信息.followers} | 码龄: ${
                new Date().getFullYear() -
                new Date(个人信息.created_at).getFullYear()
            }年 `;

            // qs("#个性签名").innerText = "";
            // let arr = [...String(个人信息.bio)],
            //     interval = setInterval(() => {
            //         let t = arr.shift();
            //         t || clearInterval(interval);
            //         qs("#个性签名").innerText += t || "";
            //     }, 3000 / arr.length);
        };
        DOMContentLoaded ? f() : addEventListener("DOMContentLoaded", f);
    })
    .catch(e => console.error(e));

addEventListener("copy", () => {
    提示("复制成功");
});
(() => {
    let f = async () => {
        qs("#回到顶部").addEventListener("click", () =>
            document.body.scrollIntoView({ behavior: "smooth" })
        );
        qs("#分界线").addEventListener("click", () => {
            document.body.classList.toggle("宽屏");
            qs("#分界线 > svg").style.transform =
                document.body.classList.contains("宽屏")
                    ? "rotate(180deg)"
                    : "";
        });
        qsa("#电子邮箱, #tg").forEach(元素 => {
            元素.addEventListener("click", 事件 => {
                事件.preventDefault();
                if (qs("#recaptcha")) return;
                let div = 添加悬浮卡片(
                    `
            <div id="g-recaptcha"></div><br />
            <button id="recaptcha">开始人机验证/提交</button>
            <button id="close_recaptcha">关闭</button>
            <a href="https://qwq.dsy4567.cf/api/getemail">在新标签页验证</a><br/>
            要查看 dsy4567 的电子邮箱地址/TG 用户名，请通过 reCAPTCHA 人机验证。<br />
            继续查看电子邮箱地址即代表您同意不向 dsy4567<br />
            发送广告/要饭/雇童工/炒币等垃圾邮件。`,
                    事件.pageX,
                    事件.pageY
                );
                添加点击事件和设置图标();
                添加脚本(
                    "https://www.recaptcha.net/recaptcha/api.js?render=explicit"
                ).then(() => {
                    qs("#close_recaptcha").addEventListener("click", () => {
                        div.remove();
                    });
                    qs("#recaptcha").addEventListener("click", async 事件 => {
                        try {
                            const 回复 = grecaptcha.getResponse();
                            if (!回复) throw new Error();
                            qs("#g-recaptcha").innerHTML = await (
                                await fetch(
                                    "https://qwq.dsy4567.cf/api/getemail?g-recaptcha-response=" +
                                        回复
                                )
                            ).text();
                            添加点击事件和设置图标();
                            qs("#g-recaptcha").focus();
                        } catch (e) {
                            qs("#g-recaptcha").tabIndex = "0";
                            qs("#g-recaptcha").focus();
                            grecaptcha.render("g-recaptcha", {
                                sitekey: gr_sitekey,
                                theme: matchMedia(
                                    "(prefers-color-scheme: dark)"
                                ).matches
                                    ? "dark"
                                    : "light",
                            });
                        }
                    });
                });
            });
        });
        加载模块();
        完成加载();
    };
    DOMContentLoaded ? f() : document.addEventListener("DOMContentLoaded", f);
})();
addEventListener("popstate", 事件 => {
    if (
        (获取清理后的路径(true) === 路径 && location.href.includes("#")) ||
        事件.state?.路径 === 路径
    )
        return 事件.preventDefault();
    动态加载({
        href: location.pathname,
        popstate: true,
    });
});

_global["main.js"] = () => ({
    loaded,
    DOMContentLoaded,
    路径,
    图标,
    正在动态加载,
    网抑云阴乐,
    加载模块,
    动态加载,
    完成加载,
    添加点击事件和设置图标,
    图标,
});

console.log(`
               +----------------------------------------------------------+              —————————————————————————————————
              /                                                         / |             ｜ | ｜ 永 ｜ 限 ｜ 由 ｜ 三 ｜ 一 ｜
              +--------------------------------------------------------+  |             ｜ | ｜ 垂 ｜ 制 ｜ 此 ｜ 年 ｜ 年 ｜
              |                                                        |  |             ｜ d ｜ 不 ｜ ， ｜ 上 ｜ 以 ｜ 以 ｜
              |                                                        |  |             ｜ s ｜ 朽 ｜ 争 ｜ 溯 ｜ 来 ｜ 来 ｜
              |    +---------         ---+---          +---------      |  |             ｜ y ｜ 　 ｜ 取 ｜ 到 ｜ ， ｜ ， ｜
              |    |         )           |             |         )     |  |             ｜ 4 ｜ 　 ｜ 游 ｜ 二 ｜ 为 ｜ 为 ｜
              |    +---------            |             +---------      |  |             ｜ 5 ｜ 　 ｜ 戏 ｜ 千 ｜ 保 ｜ 人 ｜
              |    | \\                   |             |               |  |             ｜ 6 ｜ 　 ｜ 自 ｜ 零 ｜ 护 ｜ 们 ｜
              |    |   \\                 |             |               |  |             ｜ 7 ｜ 　 ｜ 由 ｜ 七 ｜ 孩 ｜ 争 ｜
              |    |     \\               |             |               |  |             ｜   ｜ 　 ｜ ， ｜ 年 ｜ 子 ｜ 取 ｜
              |    |       \\       o  ---+---       o  |            o  |  |             ｜   ｜ 　 ｜ 在 ｜ ， ｜ 们 ｜ 游 ｜
              |                                                        |  |             ｜   ｜ 　 ｜ 历 ｜ 从 ｜ 游 ｜ 戏 ｜
              |                                                        |  |             ｜   ｜ 　 ｜ 次 ｜ 那 ｜ 自 ｜ 自 ｜
              |                                                        |  |             ｜   ｜ 　 ｜ 斗 ｜ 时 ｜ 自 ｜ 由 ｜
              |                                                        |  |             ｜   ｜ 　 ｜ 争 ｜ 起 ｜ 由 ｜ 的 ｜
              |    A tombstone of the MOTHERFUCKING anti indulgence.   |  |             ｜   ｜ 　 ｜ 后 ｜ ， ｜ 的 ｜ 程 ｜
              |                                                        |  |             ｜ 2 ｜ 　 ｜ 不 ｜ 为 ｜ 家 ｜ 序 ｜
              |                                                        |  |             ｜ 0 ｜ 　 ｜ 见 ｜ 了 ｜ 长 ｜ 员 ｜
              |                                                        |  |             ｜ 2 ｜ 　 ｜ 天 ｜ 反 ｜ 们 ｜ 们 ｜
              |                                                        |  |             ｜ 2 ｜ 　 ｜ 日 ｜ 对 ｜ 永 ｜ 永 ｜
              |                Established by dsy4567.                 |  |             ｜ . ｜ 　 ｜ 的 ｜ 防 ｜ 垂 ｜ 垂 ｜
              |                                                        |  |             ｜ 1 ｜ 　 ｜ 人 ｜ 沉 ｜ 不 ｜ 不 ｜
              |                                                        |  |             ｜ 1 ｜ 　 ｜ 们 ｜ 迷 ｜ 朽 ｜ 朽 ｜
              |                                                        |  |              —————————————————————————————————
              |           No anti indulgence, no unhappiness.          |  |
              |               May it NEVER rest in peace.              |  |
              |                                                        |  |
              |                                                        |  |
              |                        FUCK IT↓                        |  |
              |    +----------------------------------------------+    |  |
              |    |       MINOR LOGIN RESTRICTION REMINDER       |    |  |
              |    |  You are using a minor's account...          |    |  |
              |    |                                              |    |  |
              |    |          OK           SWITCH ACCOUNT         |    |  |
        +-----|    |                                              |    |  |------------+
       /      |    +----------------------------------------------+    |  |           /|
      /       |                                                        | /           / |
     /        |                                                        |/           /  |
    /         +--------------------------------------------------------+           /  /
   /                                                                              /  /
  +------------------------------------------------------------------------------+  /
  |                                                                              | /
  +------------------------------------------------------------------------------+
`);
