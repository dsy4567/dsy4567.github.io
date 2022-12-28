// @ts-check
const 加载清单 = {
    "/": ["index"],
};
let 已加载的脚本数量 = 0,
    应加载的脚本数量 = 0;

function 添加脚本(url, 回调 = () => {}) {
    let s = document.createElement("script");
    s.onload = () => {
        if (++已加载的脚本数量 == 应加载的脚本数量) {
            完成加载.forEach((f) => {
                f();
            });
        }
        回调();
        // @ts-ignore
        document.querySelector("div#加载界面").style.animationName = "隐藏";
        // @ts-ignore
        document.querySelector("div#main").style.animationName = "显示";
    };
    s.src = url;
    document.head.append(s);
}
function 开始加载() {
    let /** @type {String[]} */ 清单 =
            加载清单[
                location.pathname
                    .replace(/[(index)(\.html)]/g, "")
                    .replace(/\/\//g, "")
            ];
    if (!清单) return;
    应加载的脚本数量 = 清单.length;
    清单.forEach((s) => {
        if (document.querySelector(`script[src*="${s}"]`)) return;
        添加脚本(s);
    });
}

window.完成加载 = window.完成加载 || [];
开始加载();
