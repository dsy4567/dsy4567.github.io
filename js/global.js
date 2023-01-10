"use strict";

window.onerror = () => {
    try {
        qs("div#加载界面").style.display = "none";
        qs("div#main").style.display = "flex";
    } catch (e) {}
};

const /** @type {Record<string, string[]>} */ 加载清单 = {
        "/": ["index"],
        "/blog": ["index", "blog"],
    };
let 模块 = {
        index: null,
        blog: null,
    },
    路径 = location.pathname
        .replace(/(index|\.html)/g, "")
        .replace(/\/\//g, ""),
    DOMContentLoaded = false,
    loaded = false,
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
                ),
                artist: 网抑云阴乐.歌单.歌名[网抑云阴乐.正在播放.索引].split(
                    " - "
                )[0],
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
                ),
                artist: 网抑云阴乐.歌单.歌名[网抑云阴乐.正在播放.索引].split(
                    " - "
                )[0],
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
                        ),
                        artist: 网抑云阴乐.歌单.歌名[
                            网抑云阴乐.正在播放.索引
                        ].split(" - ")[0],
                    });
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

/**
 * @param {string} arg
 * @returns {HTMLElement}
 */
function qs(arg) {
    return document.querySelector(arg);
}
/**
 * @param {string} arg
 * @returns {HTMLElement[]}
 */
function qsa(arg) {
    return document.querySelectorAll(arg);
}
async function 加载脚本() {
    路径 = location.pathname
        .replace(/(index|\.html)/g, "")
        .replace(/\/\//g, "");
    for (let i = 0; i < 加载清单[路径].length; i++) {
        let s = 加载清单[路径][i];
        (模块[s] || (模块[s] = await import(`/js/${s}.js`))).main(路径);
    }
}
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
            history.pushState(null, "", el.href);
            try {
                qs("#main .右").innerHTML = m[0];
                await 加载脚本();
                qs("div#加载界面").style.display = "none";
                qs("#main").style.display = "flex";
                qs("#main").style.animationName = "显示";
                正在动态加载 = false;
                qsa("a").forEach(el => {
                    if (el.host != location.host && !el.className.includes("外链")) {
                        el.className += " 外链";
                        el.target = "_blank";
                    } else if (!el.className.includes("动态加载")) {
                        el.className += " 动态加载";
                        el.addEventListener("click", ev => {
                            ev.preventDefault();
                            动态加载(el);
                        });
                    }
                });
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

alert = m => {
    let el = document.createElement("div");
    el.innerHTML = m;
    el.className = "通知";
    document.body.append(el);
    setTimeout(() => {
        el.style.animationName = "隐藏";
        setTimeout(() => {
            el.remove();
        }, 500);
    }, 3000);
};
fetch("/json/ncm.json")
    .then(res => res.json())
    .then(j => {
        网抑云阴乐.歌单.json = j;
        function svg(html, onclick, title) {
            let s = document.createElement("button");
            s.innerHTML = html;
            s.onclick = onclick;
            s.type = "button";
            s.title = title;
            qs("#阴乐控件").append(s);
        }
        function 初始化() {
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
        }
        if (DOMContentLoaded) 初始化();
        else addEventListener("DOMContentLoaded", 初始化);
    });
localStorage.getItem("主题色") &&
    document.documentElement.style.setProperty(
        "--theme-color",
        localStorage.getItem("主题色")
    );
fetch("/json/theme.json")
    .then(res => res.json())
    .then(theme => {
        document.documentElement.style.setProperty(
            "--number-of-themes",
            Object.keys(theme).length
        );
        Object.keys(theme).forEach(t => {
            let btn = document.createElement("button");
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
            DOMContentLoaded
                ? qs("#所有主题").append(btn)
                : addEventListener("DOMContentLoaded", () =>
                      qs("#所有主题").append(btn)
                  );
        });
    });
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
    setTimeout(() => {
        if (!loaded) {
            qs("div#加载界面").style.display = "none";
            qs("div#main").style.display = "flex";
            qs("div#main").style.animationName = "显示";
            setTimeout(() => {
                let s = document.createElement("style");
                s.innerHTML = `
                a, button, div, section {
                    transition: 0.5s backdrop-filter, 0.5s transform, 0.5s box-shadow, 0.5s filter, 0s background-color, 0s color;
                }`;
                document.head.append(s);
            }, 2000);
        }
    }, 5000);
    加载脚本();
});
addEventListener("load", () => {
    loaded = true;
    if (navigator?.connection?.saveData ?? true) 网抑云阴乐.初始化();
    // 雪花特效
    setInterval(() => {
        if (!启用雪花特效) return;
        let s = document.createElement("div");
        s.innerText = "❄️";
        s.className = "雪花";
        s.style.left = Math.ceil(Math.random() * 100) + "%";
        document.body.append(s);
        setTimeout(() => {
            s.remove();
        }, 10000);
    }, 500);
    qs("div#加载界面").style.display = "none";
    qs("div#main").style.display = "flex";
    qs("div#main").style.animationName = "显示";
    setTimeout(() => {
        let s = document.createElement("style");
        s.innerHTML = `
        a, button, div, section {
           transition: 0.5s backdrop-filter, 0.5s transform, 0.5s box-shadow, 0.5s filter, 0s background-color, 0s color;
        }`;
        document.head.append(s);
        addEventListener("click", 网抑云阴乐.初始化);
        qsa("a").forEach(el => {
            if (el.host != location.host && !el.className.includes("外链")) {
                el.className += " 外链";
                el.target = "_blank";
            } else if (!el.className.includes("动态加载")) {
                el.className += " 动态加载";
                el.addEventListener("click", ev => {
                    ev.preventDefault();
                    动态加载(el);
                });
            }
        });
    }, 2000);
});
addEventListener("popstate", () => {
    动态加载({href: location.pathname});
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
