"use strict";

window.onerror = () => {
    try {
        qs("div#加载界面").remove();
        qs("div#main").style.animationName = "显示";
    } catch (e) {}
};

const 加载清单 = {
    "/": ["index"],
};
let 已加载的脚本 = {},
    应加载的脚本数量 = 0,
    路径 = "",
    DOMContentLoaded = false,
    loaded = false,
    启用雪花特效 = JSON.parse(localStorage.getItem("启用雪花特效") ?? true),
    ctrl,
    鸡,
    你,
    太,
    美;
let 网抑云阴乐 = {
    设置: { 音量: 0.2 },
    歌单: { 歌名: [], id: [], json: {} },
    正在播放: {
        索引: 0,
        Audio: null,
    },
    播放暂停() {
        网抑云阴乐.正在播放.Audio.paused
            ? 网抑云阴乐.正在播放.Audio.play()
            : 网抑云阴乐.正在播放.Audio.pause();
    },
    上一首() {
        网抑云阴乐.正在播放.Audio.pause();
        网抑云阴乐.正在播放.Audio.currentTime = 0;
        if (--网抑云阴乐.正在播放.索引 < 0)
            网抑云阴乐.正在播放.索引 = 网抑云阴乐.歌单.id.length - 1;
        网抑云阴乐.正在播放.Audio.src = `http://music.163.com/song/media/outer/url?id=${
            网抑云阴乐.歌单.id[网抑云阴乐.正在播放.索引]
        }.mp3`;
        网抑云阴乐.正在播放.Audio.play();
        qs("#网抑云阴乐").title =
            "网抑云阴乐 - 正在播放: " +
            网抑云阴乐.歌单.歌名[网抑云阴乐.正在播放.索引];
    },
    下一首() {
        网抑云阴乐.正在播放.Audio.pause();
        网抑云阴乐.正在播放.Audio.currentTime = 0;
        if (++网抑云阴乐.正在播放.索引 > 网抑云阴乐.歌单.id.length - 1)
            网抑云阴乐.正在播放.索引 = 0;
        网抑云阴乐.正在播放.Audio.src = `http://music.163.com/song/media/outer/url?id=${
            网抑云阴乐.歌单.id[网抑云阴乐.正在播放.索引]
        }.mp3`;
        网抑云阴乐.正在播放.Audio.play();
        qs("#网抑云阴乐").title =
            "网抑云阴乐 - 正在播放: " +
            网抑云阴乐.歌单.歌名[网抑云阴乐.正在播放.索引];
    },
    初始化() {
        网抑云阴乐.歌单.歌名 = Object.keys(网抑云阴乐.歌单.json);
        网抑云阴乐.歌单.id = Object.values(网抑云阴乐.歌单.json);
        网抑云阴乐.正在播放.Audio = new Audio(
            `http://music.163.com/song/media/outer/url?id=${
                网抑云阴乐.歌单.id[网抑云阴乐.正在播放.索引]
            }.mp3`
        );
        网抑云阴乐.正在播放.Audio.autoplay = true;
        网抑云阴乐.正在播放.Audio.volume = 网抑云阴乐.设置.音量;
        网抑云阴乐.正在播放.Audio.preload = "auto";
        网抑云阴乐.正在播放.Audio.onended = 网抑云阴乐.下一首;
        网抑云阴乐.正在播放.Audio.onplay = () => {
            alert(
                "正在播放: " + 网抑云阴乐.歌单.歌名[网抑云阴乐.正在播放.索引]
            );
        };
        网抑云阴乐.正在播放.Audio.onerror = e => {
            alert(
                "无法播放: " +
                    网抑云阴乐.歌单.歌名[网抑云阴乐.正在播放.索引] +
                    ": " +
                    e
            );
        };
        qs("#网抑云阴乐").title =
            "网抑云阴乐 - 正在播放: " +
            网抑云阴乐.歌单.歌名[网抑云阴乐.正在播放.索引];
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
function 添加脚本(url, 回调 = () => {}) {
    if (qs(`script[src*="${url}"]`)) return 全部完成加载();
    let s = document.createElement("script");
    s.onload = (...p) => {
        回调(...p);
        全部完成加载();
    };
    s.src = "/js/" + url + ".js";
    document.head.append(s);
}
function 开始加载() {
    路径 = location.pathname
        .replace(/[(index)(\.html)]/g, "")
        .replace(/\/\//g, "");
    let /** @type {String[]} */ 清单 = 加载清单[路径];
    if (!清单) return;
    应加载的脚本数量 = 清单.length;
    清单.forEach(s => 添加脚本(s));
}
async function 全部完成加载() {
    已加载的脚本 = {};
    for (let i = 0; i < 完成加载.length; i++) {
        await 完成加载[i]("...准备加载...");
    }
    if (Object.keys(已加载的脚本).length == 应加载的脚本数量) {
        for (let i = 0; i < 完成加载.length; i++) {
            await 完成加载[i](路径);
        }
        qsa("a").forEach(el => {
            if (el.host != location.host && !el.className.includes("外链")) {
                el.className += " 外链";
                el.target = "_blank";
            }
        });
        qs("div#加载界面").style.animationName = "隐藏";
        qs("div#main").style.animationName = "显示";
    }
}

window.完成加载 = [];
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
fetch("/json/cloudmusic.json")
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
            网抑云阴乐.初始化();
        }
        if (DOMContentLoaded) 初始化();
        else addEventListener("DOMContentLoaded", 初始化);
    });
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
document.addEventListener("DOMContentLoaded", () => {
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
            qs("div#加载界面").style.animationName = "隐藏";
            qs("div#main").style.animationName = "显示";
        }
    }, 5000);

    // 雪花特效
    // return;
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
});
addEventListener("load", () => {
    loaded = true;
    开始加载();
});
