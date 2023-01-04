window.onerror = () => {
    try {
        document.querySelector("div#加载界面").remove();
        document.querySelector("div#main").style.animationName = "显示";
    } catch (e) {}
};

const 加载清单 = {
    "/": ["index"],
};
let 已加载的脚本 = {},
    应加载的脚本数量 = 0,
    路径 = "",
    DOMContentLoaded = false;

function 添加脚本(url, 回调 = () => {}) {
    if (document.querySelector(`script[src*="${url}"]`)) return 全部完成加载();
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
        document.querySelectorAll("a").forEach(el => {
            if (el.host != location.host && !el.className.includes("外链")) {
                el.className += " 外链";
                el.target = "_blank";
            }
        });
        document.querySelector("div#加载界面").style.animationName = "隐藏";
        document.querySelector("div#main").style.animationName = "显示";
    }
}

window.完成加载 = [];
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
            btn.onclick = () => {
                [
                    "--theme-color",
                    "--theme-color-brighter",
                    "--theme-color-darker",
                    "--theme-color-transparent",
                    "--text-color",
                ].forEach(n => {
                    document.documentElement.style.setProperty(n, theme[t][n]);
                });
                localStorage.setItem("theme", t);
            };
            if (t === localStorage.getItem("theme")) btn.onclick();
            DOMContentLoaded
                ? document.querySelector("#所有主题").append(btn)
                : addEventListener("DOMContentLoaded", () =>
                      document.querySelector("#所有主题").append(btn)
                  );
        });
    });
document.addEventListener("DOMContentLoaded", () => {
    DOMContentLoaded = true;
    document
        .querySelector("#回到顶部")
        .addEventListener("click", () =>
            document.body.scrollIntoView({ behavior: "smooth" })
        );

    // 雪花特效
    return;
    setInterval(() => {
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
    开始加载();
});
