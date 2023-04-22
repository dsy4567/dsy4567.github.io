/* Copyright (c) 2023 dsy4567, view license at <https://github.com/dsy4567/dsy4567.github.io/blob/main/LICENSE.md> */

"use strict";

const /** @type {Record<string, string[]>} */ 加载清单 = {
        "/": [],
        "/blog": ["blog"],
    },
    歌单id = localStorage.getItem("歌单id") || 8219428260;
let 路径 = (location.pathname + location.search)
        .replace(/(index|\.html)/g, "")
        .replace(/\/\//g, ""),
    DOMContentLoaded = false,
    loaded = false,
    已强制隐藏加载界面 = false,
    正在动态加载 = false,
    歌词interval = -1,
    图标 = {};
let 网抑云阴乐 = {
    重试timeout: -1,
    已初始化: false,
    立即播放: false,
    设置: { 音量: 25 / 100 },
    /** @type {{完整歌名:string, 歌名:string, 歌手:string, 专辑:string, 封面:string, id:number, mv:number}[]} */ 歌单: [],
    /** @type {Record<number, number>} */ 歌单索引: {},
    正在播放: {
        索引: 0,
        /** @type {HTMLAudioElement} */ Audio: new Audio(),
        所有歌词: [],
        所有歌词翻译: [],
    },
    更改音量() {
        网抑云阴乐.正在播放.Audio.volume = 网抑云阴乐.设置.音量 =
            ((网抑云阴乐.设置.音量 * 100 + 25) % 125) / 100;
    },
    恢复歌词() {
        clearInterval(歌词interval);
        歌词interval = setInterval(() => {
            const 时间 = 网抑云阴乐.正在播放.Audio.currentTime + 0.2;
            for (
                let 索引 = 网抑云阴乐.正在播放.所有歌词.length - 1;
                索引 >= 0;
                索引--
            ) {
                const 歌词 = 网抑云阴乐.正在播放.所有歌词[索引];

                if (歌词.start <= 时间) {
                    !qs("#歌词").innerText.startsWith(歌词.text) &&
                        (qs("#歌词").innerText = 歌词.text);
                    break;
                }
            }
            if (网抑云阴乐.正在播放.所有歌词翻译[0])
                for (
                    let 索引 = 网抑云阴乐.正在播放.所有歌词翻译.length - 1;
                    索引 >= 0;
                    索引--
                ) {
                    const 歌词翻译 = 网抑云阴乐.正在播放.所有歌词翻译[索引];

                    if (歌词翻译.start <= 时间) {
                        !qs("#歌词").innerText.endsWith(")") &&
                            (qs("#歌词").innerText += ` (${歌词翻译.text})`);
                        break;
                    }
                }
        }, 200);
    },
    async 获取音乐地址(id) {
        let 数据 = (
            await (
                await fetch("https://ncm.vercel.dsy4567.cf/song/url?id=" + id)
            ).json()
        )?.data[0];
        if (数据?.fee === 0 || 数据?.fee === 8)
            return 数据?.url.replace("http://", "https://");
        else
            return (
                await (
                    await fetch(
                        "https://ncm.vercel.dsy4567.cf/mv/url?id=" +
                            网抑云阴乐.歌单[网抑云阴乐.歌单索引[id]].mv
                    )
                ).json()
            ).data.url;
    },
    async 切换音乐(欲播放的音乐id, 立即播放 = false) {
        if (typeof 网抑云阴乐.歌单索引[欲播放的音乐id] !== "undefined") {
            网抑云阴乐.正在播放.索引 = 网抑云阴乐.歌单索引[欲播放的音乐id];
        }
        if (立即播放) {
            try {
                clearTimeout(网抑云阴乐.重试timeout);
                await 网抑云阴乐.初始化();
                网抑云阴乐.正在播放.Audio.pause();
                网抑云阴乐.正在播放.Audio.currentTime = 0;
                网抑云阴乐.正在播放.Audio.src = await 网抑云阴乐.获取音乐地址(
                    网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].id
                );
                网抑云阴乐.正在播放.Audio.autoplay = true;
                qs("#网抑云阴乐").title =
                    "网抑云阴乐 - 正在播放: " +
                    网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].完整歌名;
                localStorage.setItem(
                    "上次播放",
                    网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].id
                );
            } catch (e) {
                提示("播放失败");
                console.error(e);
            }
        }
    },
    async 播放暂停() {
        try {
            clearTimeout(网抑云阴乐.重试timeout);
            await 网抑云阴乐.初始化();
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
    async 上一首() {
        try {
            clearTimeout(网抑云阴乐.重试timeout);
            qs("#歌词").innerText = "";
            clearInterval(歌词interval);
            await 网抑云阴乐.初始化();
            网抑云阴乐.正在播放.Audio.pause();
            网抑云阴乐.正在播放.Audio.currentTime = 0;
            if (--网抑云阴乐.正在播放.索引 < 0)
                网抑云阴乐.正在播放.索引 = 网抑云阴乐.歌单.length - 1;
            网抑云阴乐.正在播放.Audio.src = await 网抑云阴乐.获取音乐地址(
                网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].id
            );
            网抑云阴乐.正在播放.Audio.autoplay = true;
            qs("#网抑云阴乐").title =
                "网抑云阴乐 - 正在播放: " +
                网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].完整歌名;
            localStorage.setItem(
                "上次播放",
                网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].id
            );
        } catch (e) {
            提示("播放失败");
            console.error(e);
        }
    },
    async 下一首() {
        try {
            clearTimeout(网抑云阴乐.重试timeout);
            qs("#歌词").innerText = "";
            clearInterval(歌词interval);
            await 网抑云阴乐.初始化();
            网抑云阴乐.正在播放.Audio.pause();
            网抑云阴乐.正在播放.Audio.currentTime = 0;
            if (++网抑云阴乐.正在播放.索引 > 网抑云阴乐.歌单.length - 1)
                网抑云阴乐.正在播放.索引 = 0;
            网抑云阴乐.正在播放.Audio.src = await 网抑云阴乐.获取音乐地址(
                网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].id
            );
            网抑云阴乐.正在播放.Audio.autoplay = true;
            qs("#网抑云阴乐").title =
                "网抑云阴乐 - 正在播放: " +
                网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].完整歌名;
            localStorage.setItem(
                "上次播放",
                网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].id
            );
        } catch (e) {
            提示("播放失败");
            console.error(e);
        }
    },
    async 初始化() {
        try {
            if (网抑云阴乐.已初始化) return;
            网抑云阴乐.已初始化 = true;
            // 根据 id 定位上次播放的音乐
            if (localStorage.getItem("上次播放")) {
                let 上次播放 = localStorage.getItem("上次播放");
                网抑云阴乐.切换音乐(上次播放);
                qs("#播放列表").scrollTop = qs(
                    "li[data-id='" + 上次播放 + "']"
                )?.offsetTop;
            }
            网抑云阴乐.正在播放.Audio.src = await 网抑云阴乐.获取音乐地址(
                网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].id
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
                网抑云阴乐.正在播放.Audio.onloadedmetadata = async () => {
                    qs("#歌词").innerText = "";
                    clearInterval(歌词interval);
                    网抑云阴乐.正在播放.所有歌词 = [];
                    网抑云阴乐.正在播放.所有歌词翻译 = [];
                    fetch(
                        `https://ncm.vercel.dsy4567.cf/lyric?id=${
                            网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].id
                        }&realIP=111.18.65.162`
                    )
                        .then(res => res.json())
                        .then(async j => {
                            let 待解析歌词,
                                待解析歌词翻译 = j.tlyric?.lyric;
                            if (
                                (!(待解析歌词 = j.lrc.lyric) &&
                                    j.lrc.version != 6) ||
                                !j.lrc.lyric.includes("[")
                            ) {
                                qs("#歌词").innerText = "";
                                clearInterval(歌词interval);
                                网抑云阴乐.正在播放.所有歌词 = [];
                                return;
                            }
                            await 添加脚本("/js/lrc-parser.js");
                            网抑云阴乐.正在播放.所有歌词 = lrcParser(
                                待解析歌词 + "[99:59.59]\n"
                            ).scripts;
                            待解析歌词翻译?.includes("[") &&
                                (网抑云阴乐.正在播放.所有歌词翻译 = lrcParser(
                                    待解析歌词翻译 + "[99:59.99]\n"
                                ).scripts);

                            网抑云阴乐.恢复歌词();
                        });

                    qs("#播放列表").scrollTop = qs(
                        "li[data-id='" +
                            网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].id +
                            "']"
                    )?.offsetTop;

                    let 封面;
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: 网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].歌名,
                        artist: 网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].歌手,
                        artwork: [
                            {
                                src: (封面 =
                                    网抑云阴乐.歌单[网抑云阴乐.正在播放.索引]
                                        .封面),
                            },
                        ],
                    });
                    qs("#网抑云阴乐封面").onerror = () => {
                        qs("#网抑云阴乐封面").src = "";
                    };
                    qs("#网抑云阴乐封面").src = 封面;
                };
            }
            网抑云阴乐.正在播放.Audio.onplay = () => {
                localStorage.setItem("自动播放", true);
                qs("#网抑云阴乐封面").style.animationName = "匀速转";
                qsa("li.正在播放")?.forEach(元素 => {
                    元素.classList.remove("正在播放");
                });
                qs(
                    "li[data-id='" +
                        网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].id +
                        "']"
                )?.classList.add("正在播放");
                网抑云阴乐.恢复歌词();
            };
            网抑云阴乐.正在播放.Audio.onpause = () => {
                localStorage.setItem("自动播放", false);
                qs("#网抑云阴乐封面").style.animationName = "unset";
                clearInterval(歌词interval);
            };
            网抑云阴乐.正在播放.Audio.onerror = e => {
                提示(
                    "无法播放: " +
                        网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].完整歌名 +
                        ", 将在 3 秒后切换下一首"
                );
                console.error(e);
                clearTimeout(网抑云阴乐.重试timeout);
                网抑云阴乐.重试timeout = setTimeout(网抑云阴乐.下一首, 3000);
            };
            qs("#网抑云阴乐").title =
                "网抑云阴乐 - 正在播放: " +
                网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].完整歌名;
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
    if (正在动态加载) {
        open(el.href, "_self");
        return 隐藏加载页面();
    }
    正在动态加载 = true;
    qs("#main").style.display = "none";
    qs("#main").ariaBusy = "true";
    qs("div#加载界面").style.display = "";
    qs("meta[name='robots']").content = "";
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

                u.pathname
                    .replace(/(index|\.html)/g, "")
                    .replace(/\/\//g, "") == "/" && 隐藏加载页面();
                正在动态加载 = false;
                添加点击事件和设置图标();
            } catch (e) {
                console.error(e);
                open(el.href, "_self");
                隐藏加载页面();
            }
        })
        .catch(e => {
            console.error(e);
            open(el.href, "_self");
            隐藏加载页面();
        });
}
function 完成加载() {
    隐藏加载页面();
    setTimeout(() => {
        let s = ce("style");
        s.innerHTML = `
    a, button, div, section, img, li {
       transition: 0.5s border-radius, 0.5s backdrop-filter, 0.5s transform, 0.5s box-shadow, 0.5s filter, 0.5s text-decoration, 0.5s background-color, 0.5s color;
    }`;
        document.head.append(s);
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
                        网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].id &&
                            open(
                                "https://music.163.com/#/song?id=" +
                                    网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].id
                            );
                    },
                    "在网抑云阴乐中查看"
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
                网抑云阴乐.歌单.forEach(音乐信息 => {
                    let li = ce("li");
                    li.innerText = 音乐信息.完整歌名;
                    li.onclick = li.onkeyup = ev => {
                        if (ev?.key == "Enter" || !ev?.key)
                            网抑云阴乐.切换音乐(音乐信息.id, true);
                    };
                    li.tabIndex = 0;
                    li.title = 音乐信息.完整歌名;
                    li.dataset.id = 音乐信息.id;
                    qs("#播放列表").append(li);
                });
                qsa("svg[data-icon]").forEach(el => {
                    图标[el.dataset.icon] &&
                        (el.outerHTML = 图标[el.dataset.icon]);
                });

                网抑云阴乐.初始化();
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
fetch("https://v1.hitokoto.cn/")
    .then(res => res.json())
    .then(j => {
        let f = () => {
            qs("#一言").innerText = j.hitokoto;
            qsa("#一言, .一言 .date").forEach(
                el =>
                    (el.ondblclick = () =>
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
