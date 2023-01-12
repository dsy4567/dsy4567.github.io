"use strict";

window.onerror = () => {
    try {
        qs("div#加载界面").style.display = "none";
        qs("div#main").style.display = "flex";
    } catch (e) {}
};

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
    /** @type {boolean} */ 启用雪花特效 = JSON.parse(
        localStorage.getItem("启用雪花特效") ?? true
    ),
    /** @type {HTMLAudioElement} */ ctrl,
    /** @type {HTMLAudioElement} */ 鸡,
    /** @type {HTMLAudioElement} */ 你,
    /** @type {HTMLAudioElement} */ 太,
    /** @type {HTMLAudioElement} */ 美;
let 网抑云阴乐 = {
    已初始化: false,
    立即播放: false,
    设置: { 音量: 0.5 },
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
                localStorage.setItem("自动播放", true);
            } else {
                网抑云阴乐.正在播放.Audio.pause();
                localStorage.setItem("自动播放", false);
            }
        } catch (e) {
            alert("播放失败");
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
            navigator.mediaSession.metadata = new MediaMetadata({
                title: 网抑云阴乐.歌单.歌名[网抑云阴乐.正在播放.索引].replace(
                    网抑云阴乐.歌单.歌名[网抑云阴乐.正在播放.索引].split(
                        " - "
                    )[0] + " - ",
                    ""
                ), // 歌名
                artist: 网抑云阴乐.歌单.歌名[网抑云阴乐.正在播放.索引].split(
                    " - "
                )[0], // 歌手
            });
        } catch (e) {
            alert("播放失败");
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
            navigator.mediaSession.metadata = new MediaMetadata({
                title: 网抑云阴乐.歌单.歌名[网抑云阴乐.正在播放.索引].replace(
                    网抑云阴乐.歌单.歌名[网抑云阴乐.正在播放.索引].split(
                        " - "
                    )[0] + " - ",
                    ""
                ), // 歌名
                artist: 网抑云阴乐.歌单.歌名[网抑云阴乐.正在播放.索引].split(
                    " - "
                )[0], // 歌手
            });
        } catch (e) {
            alert("播放失败");
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
                        ].split(" - ")[0],
                    }); // 歌手
                };
            }
            网抑云阴乐.正在播放.Audio.onplay = () => {
                alert(
                    "正在播放: " +
                        网抑云阴乐.歌单.歌名[网抑云阴乐.正在播放.索引]
                );
                // 鬼知道这代码有啥用
                try {
                    if (
                        网抑云阴乐.歌单.歌名[网抑云阴乐.正在播放.索引].includes(
                            "普通disco"
                        )
                    )
                        qs("#羊了个羊").style.display = "none";
                    else qs("#羊了个羊").style.display = "";
                } catch (e) {}
            };
            网抑云阴乐.正在播放.Audio.onerror = e => {
                alert(
                    "无法播放: " +
                        网抑云阴乐.歌单.歌名[网抑云阴乐.正在播放.索引]
                );
                console.error(e);
            };
            qs("#网抑云阴乐").title =
                "网抑云阴乐 - 正在播放: " +
                网抑云阴乐.歌单.歌名[网抑云阴乐.正在播放.索引];
        } catch (e) {
            alert("播放失败");
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
    qs("div#加载界面").style.display = "";
    fetch(el.href)
        .then(res => res.text())
        .then(async html => {
            let m = html.match(/<!-- START MAIN -->.+<!-- END MAIN -->/s),
                mt = html.match(/<title>.+<\/title>/s);
            if (!m) throw new Error("动态加载失败: 匹配结果为空");
            document.title = mt[0].replace(/<\/?title>/g, "");
            !el.popstate && history.pushState(null, "", el.href);
            try {
                qs("#main .右").innerHTML = m[0];
                await 加载模块();
                qs("div#加载界面").style.display = "none";
                qs("#main").style.display = "flex";
                qs("#main").style.animationName = "显示";
                !location.search.includes("id=") &&
                    document.body.scrollIntoView({ behavior: "smooth" });
                正在动态加载 = false;
                添加链接点击事件();
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
    a, button, div, section {
       transition: 0.5s border-radius, 0.5s backdrop-filter, 0.5s transform, 0.5s box-shadow, 0.5s filter, 0s background-color, 0s color;
    }`;
        document.head.append(s);
        addEventListener("click", 网抑云阴乐.初始化);
        添加链接点击事件();
    }, 2000);
}
function 添加链接点击事件() {
    qsa("a").forEach(el => {
        if (el.host != location.host && !el.className.includes("外链")) {
            el.className += " 外链";
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
                `<svg
                    class="特小尺寸 stroke"
                    viewBox="0 0 48 48"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M34 36L22 24L34 12"
                        stroke-width="4"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                    <path
                        d="M14 12V36"
                        stroke-width="4"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>`,
                网抑云阴乐.上一首,
                "上一首"
            );
            svg(
                `<svg
                    class="特小尺寸 stroke"
                    viewBox="0 0 48 48"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M16 12V36"
                        stroke-width="4"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                    <path
                        d="M32 12V36"
                        stroke-width="4"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>`,
                网抑云阴乐.播放暂停,
                "播放/暂停"
            );
            svg(
                `<svg
                    class="特小尺寸 stroke"
                    viewBox="0 0 48 48"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M14 12L26 24L14 36"
                        stroke-width="4"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                    <path
                        d="M34 12V36"
                        stroke-width="4"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>`,
                网抑云阴乐.下一首,
                "下一首"
            );
            svg(
                `<svg
                    class="特小尺寸 stroke"
                    viewBox="0 0 48 48"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z"
                        stroke-width="4"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                    <path
                        d="M4 24H44"
                        stroke-width="4"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                    <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M24 44C28.4183 44 32 35.0457 32 24C32 12.9543 28.4183 4 24 4C19.5817 4 16 12.9543 16 24C16 35.0457 19.5817 44 24 44Z"
                        stroke-width="4"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                    <path
                        d="M9.85791 10.1421C13.4772 13.7614 18.4772 16 24 16C29.5229 16 34.5229 13.7614 38.1422 10.1421"
                        stroke-width="4"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                    <path
                        d="M38.1422 37.8579C34.5229 34.2386 29.5229 32 24 32C18.4772 32 13.4772 34.2386 9.85791 37.8579"
                        stroke-width="4"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>`,
                () => {
                    open(
                        "https://music.163.com/#/song?id=" +
                            网抑云阴乐.歌单.id[网抑云阴乐.正在播放.索引]
                    );
                },
                "在网抑云阴乐中查看"
            );
        };
        DOMContentLoaded ? f() : addEventListener("DOMContentLoaded", f);
    });
// 主题
fetch("/json/theme.json")
    .then(res => res.json())
    .then(theme => {
        document.documentElement.style.setProperty(
            "--number-of-themes",
            Object.keys(theme).length
        );
        Object.keys(theme).forEach(t => {
            let btn = ce("button");
            btn.style.backgroundColor = theme[t]["--theme-color"];
            btn.title = t;
            btn.type = "button";
            btn.onclick = 提示用户 => {
                [
                    "--theme-color",
                    "--theme-color-transparent",
                    "--text-color",
                ].forEach(n => {
                    document.documentElement.style.setProperty(n, theme[t][n]);
                });
                localStorage.setItem("theme", t);
                localStorage.setItem("主题色", theme[t]["--theme-color"]);
                提示用户 !== false && alert("已切换主题: " + t);
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
    let k = ev.key.toLowerCase();
    if (k.includes("control"))
        (ctrl || (ctrl = new Audio("/audio/ctrl.mp3"))).play();
    else if (k == "j") (鸡 || (鸡 = new Audio("/audio/鸡.mp3"))).play();
    else if (k == "n") (你 || (你 = new Audio("/audio/你.mp3"))).play();
    else if (k == "t") (太 || (太 = new Audio("/audio/太.mp3"))).play();
    else if (k == "m") (美 || (美 = new Audio("/audio/美.mp3"))).play();
});
addEventListener("copy", () => {
    alert("复制成功");
});
document.addEventListener("DOMContentLoaded", async () => {
    DOMContentLoaded = true;
    document
        .querySelector("#回到顶部")
        .addEventListener("click", () =>
            document.body.scrollIntoView({ behavior: "smooth" })
        );
    qs("#雪花特效").addEventListener("click", () => {
        localStorage.setItem(
            "启用雪花特效",
            JSON.stringify((启用雪花特效 = !启用雪花特效))
        );
        qsa(".雪花")?.forEach(el => el.remove());
    });
    // 超时强制隐藏加载界面
    setTimeout(
        () => !loaded && (完成加载() || (已强制隐藏加载界面 = true)),
        5000
    );
    加载模块();
});
addEventListener("load", () => {
    loaded = true;
    // 省流
    if (navigator?.connection?.saveData ?? true) 网抑云阴乐.初始化();
    // 雪花特效
    setInterval(() => {
        if (!启用雪花特效) return;
        let s = ce("div");
        s.innerText = "❄️";
        s.className = "雪花";
        s.style.left = Math.ceil(Math.random() * 100) + "%";
        document.body.append(s);
        setTimeout(() => {
            s.remove();
        }, 10000);
    }, 500);
    !已强制隐藏加载界面 && 完成加载();
});
addEventListener("popstate", () => {
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
    启用雪花特效,
    ctrl,
    鸡,
    你,
    太,
    美,
    网抑云阴乐,
    加载模块,
    动态加载,
    完成加载,
    添加链接点击事件,
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
