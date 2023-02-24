/* Copyright (c) 2023 dsy4567, view license at <https://github.com/dsy4567/dsy4567.github.io/blob/main/LICENSE.md> */

"use strict";

const /** @type {Record<string, string[]>} */ 加载清单 = {
        "/": [],
        "/blog": ["blog"],
    };
let 路径 = (location.pathname + location.search)
        .replace(/(index|\.html)/g, "")
        .replace(/\/\//g, ""),
    DOMContentLoaded = false,
    loaded = false,
    已强制隐藏加载界面 = false,
    正在动态加载 = false,
    图标 = {},
    /** @type {string} */ ctrl,
    /** @type {string} */ 鸡1,
    /** @type {string} */ 鸡2,
    /** @type {string} */ 鸡3,
    /** @type {string} */ 鸡4,
    /** @type {string} */ 鸡5,
    /** @type {string} */ 鸡6,
    /** @type {string} */ 鸡7,
    /** @type {string} */ 鸡8,
    /** @type {string} */ 鸡9,
    /** @type {string} */ 鸡0,
    /** @type {string} */ 鸡,
    /** @type {string} */ 你,
    /** @type {string} */ 太,
    /** @type {string} */ 美;
let 网抑云阴乐 = {
    已初始化: false,
    立即播放: false,
    设置: { 音量: 0x66ccff / 10000000 },
    歌单: {
        /** @type {string[]} */ 歌名: [],
        /** @type {number[]} */ id: [],
        /** @type {Record<string, number>} */ json: {},
    },
    正在播放: {
        索引: 0,
        /** @type {HTMLAudioElement} */ Audio: null,
    },
    播放暂停() {
        try {
            网抑云阴乐.初始化();
            if (网抑云阴乐.正在播放.Audio.paused) {
                网抑云阴乐.正在播放.Audio.play();
            } else {
                网抑云阴乐.正在播放.Audio.pause();
            }
        } catch (e) {
            提示("播放失败");
            console.error(e);
        }
    },
    上一首() {
        try {
            网抑云阴乐.初始化();
            网抑云阴乐.正在播放.Audio.pause();
            网抑云阴乐.正在播放.Audio.currentTime = 0;
            if (--网抑云阴乐.正在播放.索引 < 0)
                网抑云阴乐.正在播放.索引 = 网抑云阴乐.歌单.id.length - 1;
            网抑云阴乐.正在播放.Audio.src = `http://music.163.com/song/media/outer/url?id=${
                网抑云阴乐.歌单.id[网抑云阴乐.正在播放.索引]
            }.mp3`;
            网抑云阴乐.正在播放.Audio.autoplay = true;
            qs("#网抑云阴乐").title =
                "网抑云阴乐 - 正在播放: " +
                网抑云阴乐.歌单.歌名[网抑云阴乐.正在播放.索引];
            localStorage.setItem(
                "上次播放",
                网抑云阴乐.歌单.id[网抑云阴乐.正在播放.索引]
            );
            // navigator.mediaSession.metadata = new MediaMetadata({
            //     title: 网抑云阴乐.歌单.歌名[网抑云阴乐.正在播放.索引].replace(
            //         网抑云阴乐.歌单.歌名[网抑云阴乐.正在播放.索引].split(
            //             " - "
            //         )[0] + " - ",
            //         ""
            //     ), // 歌名
            //     artist: 网抑云阴乐.歌单.歌名[网抑云阴乐.正在播放.索引].split(
            //         " - "
            //     )[0], // 歌手
            //     artwork: [
            //         {
            //             src:
            //                 "https://ncmimg.workers.dsy4567.cf/" +
            //                 网抑云阴乐.歌单.id[网抑云阴乐.正在播放.索引],
            //         },
            //     ], // 封面
            // });
        } catch (e) {
            提示("播放失败");
            console.error(e);
        }
    },
    下一首() {
        try {
            网抑云阴乐.初始化();
            网抑云阴乐.正在播放.Audio.pause();
            网抑云阴乐.正在播放.Audio.currentTime = 0;
            if (++网抑云阴乐.正在播放.索引 > 网抑云阴乐.歌单.id.length - 1)
                网抑云阴乐.正在播放.索引 = 0;
            网抑云阴乐.正在播放.Audio.src = `http://music.163.com/song/media/outer/url?id=${
                网抑云阴乐.歌单.id[网抑云阴乐.正在播放.索引]
            }.mp3`;
            网抑云阴乐.正在播放.Audio.autoplay = true;
            qs("#网抑云阴乐").title =
                "网抑云阴乐 - 正在播放: " +
                网抑云阴乐.歌单.歌名[网抑云阴乐.正在播放.索引];
            localStorage.setItem(
                "上次播放",
                网抑云阴乐.歌单.id[网抑云阴乐.正在播放.索引]
            );
            // navigator.mediaSession.metadata = new MediaMetadata({
            //     title: 网抑云阴乐.歌单.歌名[网抑云阴乐.正在播放.索引].replace(
            //         网抑云阴乐.歌单.歌名[网抑云阴乐.正在播放.索引].split(
            //             " - "
            //         )[0] + " - ",
            //         ""
            //     ), // 歌名
            //     artist: 网抑云阴乐.歌单.歌名[网抑云阴乐.正在播放.索引].split(
            //         " - "
            //     )[0], // 歌手
            //     artwork: [
            //         {
            //             src:
            //                 "https://ncmimg.workers.dsy4567.cf/" +
            //                 网抑云阴乐.歌单.id[网抑云阴乐.正在播放.索引],
            //         },
            //     ], // 封面
            // });
        } catch (e) {
            提示("播放失败");
            console.error(e);
        }
    },
    初始化() {
        try {
            if (网抑云阴乐.已初始化) return;
            网抑云阴乐.已初始化 = true;
            网抑云阴乐.歌单.歌名 = Object.keys(网抑云阴乐.歌单.json);
            网抑云阴乐.歌单.id = Object.values(网抑云阴乐.歌单.json);
            // 根据 id 定位上次播放的音乐
            if (localStorage.getItem("上次播放")) {
                let 上次播放 = localStorage.getItem("上次播放");
                for (let i = 0; i < 网抑云阴乐.歌单.id.length; i++) {
                    const id = 网抑云阴乐.歌单.id[i];
                    if (id == 上次播放) {
                        网抑云阴乐.正在播放.索引 = i;
                        break;
                    }
                }
            }
            网抑云阴乐.正在播放.Audio = new Audio(
                `http://music.163.com/song/media/outer/url?id=${
                    网抑云阴乐.歌单.id[网抑云阴乐.正在播放.索引]
                }.mp3`
            );
            网抑云阴乐.正在播放.Audio.preload = "none";
            网抑云阴乐.正在播放.Audio.autoplay =
                (localStorage.getItem("自动播放") &&
                    JSON.parse(localStorage.getItem("自动播放"))) ??
                true;
            网抑云阴乐.正在播放.Audio.volume = 网抑云阴乐.设置.音量;
            网抑云阴乐.正在播放.Audio.onended = 网抑云阴乐.下一首;
            if (navigator.mediaSession) {
                // 使用浏览器/系统提供的控件控制音乐播放
                navigator.mediaSession.setActionHandler("play", function () {
                    网抑云阴乐.正在播放.Audio.play();
                    navigator.mediaSession.playbackState = "playing";
                });
                navigator.mediaSession.setActionHandler("pause", function () {
                    网抑云阴乐.正在播放.Audio.pause();
                    navigator.mediaSession.playbackState = "paused";
                });
                navigator.mediaSession.setActionHandler(
                    "previoustrack",
                    网抑云阴乐.上一首
                );
                navigator.mediaSession.setActionHandler(
                    "nexttrack",
                    网抑云阴乐.下一首
                );
                网抑云阴乐.正在播放.Audio.oncanplay = () => {
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: 网抑云阴乐.歌单.歌名[
                            网抑云阴乐.正在播放.索引
                        ].replace(
                            网抑云阴乐.歌单.歌名[
                                网抑云阴乐.正在播放.索引
                            ].split(" - ")[0] + " - ",
                            ""
                        ), // 歌名
                        artist: 网抑云阴乐.歌单.歌名[
                            网抑云阴乐.正在播放.索引
                        ].split(" - ")[0], // 歌手
                        artwork: [
                            {
                                src:
                                    "https://ncmimg.workers.dsy4567.cf/" +
                                    网抑云阴乐.歌单.id[
                                        网抑云阴乐.正在播放.索引
                                    ],
                            },
                        ], // 封面
                    });
                    qs("#网抑云阴乐封面").onerror = () => {
                        qs("#网抑云阴乐封面").src = "";
                    };
                    qs("#网抑云阴乐封面").src =
                        "https://ncmimg.workers.dsy4567.cf/" +
                        网抑云阴乐.歌单.id[网抑云阴乐.正在播放.索引];
                };
            }
            网抑云阴乐.正在播放.Audio.onplay = () => {
                提示(
                    "正在播放: " +
                        网抑云阴乐.歌单.歌名[网抑云阴乐.正在播放.索引]
                );
                localStorage.setItem("自动播放", true);
                qs("#网抑云阴乐封面").style.animationName = "匀速转";
            };
            网抑云阴乐.正在播放.Audio.onpause = () => {
                localStorage.setItem("自动播放", false);
                qs("#网抑云阴乐封面").style.animationName = "unset";
            };
            网抑云阴乐.正在播放.Audio.onerror = e => {
                提示(
                    "无法播放: " +
                        网抑云阴乐.歌单.歌名[网抑云阴乐.正在播放.索引] +
                        ", 将在 3 秒后切换下一首"
                );
                console.error(e);
                setTimeout(网抑云阴乐.下一首(), 3000);
            };
            qs("#网抑云阴乐").title =
                "网抑云阴乐 - 正在播放: " +
                网抑云阴乐.歌单.歌名[网抑云阴乐.正在播放.索引];
        } catch (e) {
            提示("播放失败");
            console.error(e);
        }
    },
};

async function 加载模块() {
    路径 = location.pathname
        .replace(/(index|\.html)/g, "")
        .replace(/\/\//g, "");
    let 路径2 = (location.pathname + location.search)
        .replace(/(index|\.html)/g, "")
        .replace(/\/\//g, "");
    for (let i = 0; i < 加载清单[路径].length; i++) {
        let s = 加载清单[路径][i];
        (await import(`/js/${s}.js`)).main(路径2);
    }
    路径 = 路径2;
}
/** @param {{href: string, popstate:boolean}} el */
function 动态加载(el) {
    if (正在动态加载) return open(el.href, "_self");
    正在动态加载 = true;
    qs("#main").style.display = "none";
    qs("#main").ariaBusy = "true";
    qs("div#加载界面").style.display = "";
    fetch(el.href)
        .then(res => res.text())
        .then(async html => {
            let m = html.match(/<!-- START MAIN -->.+<!-- END MAIN -->/s),
                mt = html.match(/<title>.+<\/title>/s);
            if (!m) throw new Error("动态加载失败: 匹配结果为空");
            document.title = mt[0].replace(/<\/?title>/g, "");
            let u = new URL(el.href, location.href);
            !el.popstate &&
                history.pushState(
                    {
                        路径: (u.pathname + u.search)
                            .replace(/(index|\.html)/g, "")
                            .replace(/\/\//g, ""),
                    },
                    "",
                    el.href
                );
            try {
                qs("#main .右").innerHTML = m[0];
                await 加载模块();
                qs("div#加载界面").style.display = "none";
                qs("#main").style.display = "flex";
                qs("#main").style.animationName = "显示";
                qs("#main").ariaBusy = "false";

                正在动态加载 = false;
                添加点击事件和设置图标();
            } catch (e) {
                console.error(e);
                open(el.href, "_self");
            }
        })
        .catch(e => {
            console.error(e);
            open(el.href, "_self");
        });
}
function 完成加载() {
    qs("div#加载界面").style.display = "none";
    qs("div#main").style.display = "flex";
    qs("div#main").style.animationName = "显示";
    setTimeout(() => {
        let s = ce("style");
        s.innerHTML = `
    a, button, div, section, img {
       transition: 0.5s border-radius, 0.5s backdrop-filter, 0.5s transform, 0.5s box-shadow, 0.5s filter, 0.5s text-decoration, 0s background-color, 0s color;
    }`;
        document.head.append(s);
        addEventListener("click", 网抑云阴乐.初始化);
        添加点击事件和设置图标();
    }, 2000);
}
function 添加点击事件和设置图标() {
    qsa("svg[data-icon]").forEach(el => {
        图标[el.dataset.icon] && (el.outerHTML = 图标[el.dataset.icon]);
    });
    qsa("a").forEach(el => {
        if (el.pathname == location.pathname && el.href.includes("#")) return;
        if (el.host != location.host && !el.className.includes("外链")) {
            if (!el.querySelector("img, svg")) el.className += " 外链";
            el.target = "_blank";
        } else if (
            el.host == location.host &&
            !el.className.includes("动态加载")
        ) {
            el.className += " 动态加载";
            el.addEventListener("click", ev => {
                ev.preventDefault();
                动态加载(el);
            });
        }
        if (el.querySelector("img") && !el.className.includes("无滤镜"))
            el.className += " 无滤镜";
    });
    qsa("img").forEach(el => {
        el.ondblclick = () => open(el.src, "_blank");
    });
}
// 网抑云阴乐歌单+控件
fetch("/json/ncm.json")
    .then(res => res.json())
    .then(j => {
        网抑云阴乐.歌单.json = j;
        function svg(html, onclick, title) {
            let s = ce("button");
            s.innerHTML = html;
            s.onclick = onclick;
            s.type = "button";
            s.title = title;
            qs("#阴乐控件").append(s);
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
                    网抑云阴乐.歌单.id[网抑云阴乐.正在播放.索引] &&
                        open(
                            "https://music.163.com/#/song?id=" +
                                网抑云阴乐.歌单.id[网抑云阴乐.正在播放.索引]
                        );
                },
                "在网抑云阴乐中查看"
            );
            qsa("svg[data-icon]").forEach(el => {
                图标[el.dataset.icon] && (el.outerHTML = 图标[el.dataset.icon]);
            });
        };
        DOMContentLoaded ? f() : addEventListener("DOMContentLoaded", f);
    });
// 主题
fetch("/json/theme.json")
    .then(res => res.json())
    .then(theme => {
        Object.keys(theme).forEach(t => {
            let btn = ce("button");
            btn.style.backgroundColor = theme[t]["--theme-color"];
            btn.title = t;
            btn.type = "button";
            btn.role = "radio";
            btn.ariaChecked = false;
            btn.onclick = 提示用户 => {
                qsa("#所有主题 > button").forEach(
                    el => (el.ariaChecked = false)
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
                    document.documentElement.style.setProperty(n, theme[t][n]);
                });
                qs("#主题色").content = theme[t]["--theme-color"];
                localStorage.setItem("theme", t);
                localStorage.setItem("主题色", theme[t]["--theme-color"]);
                localStorage.setItem("主题色h", theme[t]["--theme-color-h"]);
                localStorage.setItem("主题色s", theme[t]["--theme-color-s"]);
                localStorage.setItem("主题色l", theme[t]["--theme-color-l"]);
                localStorage.setItem(
                    "透明色",
                    theme[t]["--theme-color-transparent"]
                );
                localStorage.setItem("字体色", theme[t]["--text-color"]);
                提示用户 !== false && 提示("已切换主题: " + t);
            };
            if (t === localStorage.getItem("theme")) btn.onclick(false);
            let f = () => qs("#所有主题").append(btn);
            DOMContentLoaded ? f() : addEventListener("DOMContentLoaded", f);
        });
    });
fetch("/json/saying.json")
    .then(res => res.json())
    .then(j => {
        let f = () =>
            (qs("#随机金句").innerHTML =
                "&emsp;&emsp;" +
                (j[Math.ceil(Math.random() * Number(j?.length))] || j[0]));
        DOMContentLoaded ? f() : addEventListener("DOMContentLoaded", f);
    })
    .catch(e => console.error(e));
fetch("/json/icon.json")
    .then(res => res.json())
    .then(j => {
        let f = () => {
            图标 = j;
            qsa("svg[data-icon]").forEach(el => {
                图标[el.dataset.icon] && (el.outerHTML = 图标[el.dataset.icon]);
            });
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

            qs("#个性签名").innerText = "";
            let arr = [...String(个人信息.bio)],
                interval = setInterval(() => {
                    let t = arr.shift();
                    t || clearInterval(interval);
                    qs("#个性签名").innerText += t || "";
                }, 3000 / arr.length);
        };
        DOMContentLoaded ? f() : addEventListener("DOMContentLoaded", f);
    })
    .catch(e => console.error(e));

// 🏀🏀🏀
addEventListener("keydown", ev => {
    if (!ctrl) {
        ctrl = "jntm";
        fetch("/audio/ctrl.mp3")
            .then(res => res.blob())
            .then(b => (ctrl = URL.createObjectURL(b)));
        fetch("/audio/鸡1.mp3")
            .then(res => res.blob())
            .then(b => (鸡1 = URL.createObjectURL(b)));
        fetch("/audio/鸡2.mp3")
            .then(res => res.blob())
            .then(b => (鸡2 = URL.createObjectURL(b)));
        fetch("/audio/鸡3.mp3")
            .then(res => res.blob())
            .then(b => (鸡3 = URL.createObjectURL(b)));
        fetch("/audio/鸡4.mp3")
            .then(res => res.blob())
            .then(b => (鸡4 = URL.createObjectURL(b)));
        fetch("/audio/鸡5.mp3")
            .then(res => res.blob())
            .then(b => (鸡5 = URL.createObjectURL(b)));
        fetch("/audio/鸡6.mp3")
            .then(res => res.blob())
            .then(b => (鸡6 = URL.createObjectURL(b)));
        fetch("/audio/鸡7.mp3")
            .then(res => res.blob())
            .then(b => (鸡7 = URL.createObjectURL(b)));
        fetch("/audio/鸡8.mp3")
            .then(res => res.blob())
            .then(b => (鸡8 = URL.createObjectURL(b)));
        fetch("/audio/鸡9.mp3")
            .then(res => res.blob())
            .then(b => (鸡9 = URL.createObjectURL(b)));
        fetch("/audio/鸡0.mp3")
            .then(res => res.blob())
            .then(b => (鸡0 = URL.createObjectURL(b)));
        fetch("/audio/鸡.mp3")
            .then(res => res.blob())
            .then(b => (鸡 = URL.createObjectURL(b)));
        fetch("/audio/你.mp3")
            .then(res => res.blob())
            .then(b => (你 = URL.createObjectURL(b)));
        fetch("/audio/太.mp3")
            .then(res => res.blob())
            .then(b => (太 = URL.createObjectURL(b)));
        fetch("/audio/美.mp3")
            .then(res => res.blob())
            .then(b => (美 = URL.createObjectURL(b)));
        return;
    }
    let k = ev.key.toLowerCase();
    if (k.includes("control")) new Audio(ctrl).play();
    else if (k == "1") new Audio(鸡1).play();
    else if (k == "2") new Audio(鸡2).play();
    else if (k == "3") new Audio(鸡3).play();
    else if (k == "4") new Audio(鸡4).play();
    else if (k == "5") new Audio(鸡5).play();
    else if (k == "6") new Audio(鸡6).play();
    else if (k == "7") new Audio(鸡7).play();
    else if (k == "8") new Audio(鸡8).play();
    else if (k == "9") new Audio(鸡9).play();
    else if (k == "0") new Audio(鸡0).play();
    else if (k == "j") new Audio(鸡).play();
    else if (k == "n") new Audio(你).play();
    else if (k == "t") new Audio(太).play();
    else if (k == "m") new Audio(美).play();
});
addEventListener("copy", () => {
    提示("复制成功");
});
document.addEventListener("DOMContentLoaded", async () => {
    DOMContentLoaded = true;
    document
        .querySelector("#回到顶部")
        .addEventListener("click", () =>
            document.body.scrollIntoView({ behavior: "smooth" })
        );
    // 超时强制隐藏加载界面
    setTimeout(() => {
        if (!loaded) {
            完成加载();
            已强制隐藏加载界面 = true;
        }
    }, 5000);
    加载模块();
});
addEventListener("load", () => {
    loaded = true;
    !已强制隐藏加载界面 && 完成加载();
    // 省流
    if (navigator?.connection?.saveData ?? true) 网抑云阴乐.初始化();
});
addEventListener("popstate", ev => {
    if (
        ((location.pathname + location.search)
            .replace(/(index|\.html)/g, "")
            .replace(/\/\//g, "") == 路径 &&
            location.href.includes("#")) ||
        ev.state?.路径 == 路径
    )
        return ev.preventDefault();
    动态加载({
        href: location.pathname,
        popstate: true,
    });
});

_global["global.js"] = () => ({
    loaded,
    路径,
    已强制隐藏加载界面,
    正在动态加载,
    ctrl,
    鸡1,
    鸡2,
    鸡3,
    鸡4,
    鸡5,
    鸡6,
    鸡7,
    鸡8,
    鸡9,
    鸡0,
    鸡,
    你,
    太,
    美,
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
