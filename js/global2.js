/* Copyright (c) 2023 dsy4567, view license at <https://github.com/dsy4567/dsy4567.github.io/blob/main/LICENSE.md> */

"use strict";

window.onerror = function () {
    try {
        qs("div#加载界面").style.display = "none";
        qs("div#main").style.display = "flex";
    } catch (e) {}
};

String.prototype.rp = String.prototype.replace;

/**
 * document.querySelector
 * @param {keyof HTMLElementTagNameMap} arg
 * @returns {HTMLElement}
 */
function qs(arg) {
    return document.querySelector(arg);
}
/**
 * document.querySelectorAll
 * @param {keyof HTMLElementTagNameMap} arg
 * @returns {HTMLElement[]}
 */
function qsa(arg) {
    return document.querySelectorAll(arg);
}
/**
 * document.createElement
 * @param {keyof HTMLElementTagNameMap} arg
 * @returns {HTMLElement}
 */
function ce(arg) {
    return document.createElement(arg);
}
function 隐藏加载页面() {
    qs("div#加载界面").style.display = "none";
    qs("#main").style.display = "flex";
    qs("#main").style.animationName = "显示";
    qs("#main").ariaBusy = "false";
}
/**
 * @param {string} url
 */
function 添加样式(url) {
    return new Promise(resolve => {
        if (qs("link[href*='" + url + "']")) return resolve({});
        let l = ce("link");
        l.onload = ev => {
            resolve(ev);
        };
        l.href = url;
        l.rel = "stylesheet";
        document.head.append(l);
    });
}
/**
 * @param {string} url
 */
async function 添加脚本(url) {
    return new Promise(resolve => {
        if (qs("script[src*='" + url + "']")) return resolve({});
        let s = ce("script");
        s.onload = ev => {
            resolve(ev);
        };
        s.src = url;
        document.head.append(s);
    });
}
/**
 * @param {string} m
 */
function 提示(m) {
    let el = ce("div");
    el.innerHTML = m;
    el.className = "通知";
    el.ariaLive = "assertive";
    document.body.append(el);
    setTimeout(function () {
        el.style.animationName = "隐藏";
        setTimeout(function () {
            el.remove();
        }, 500);
    }, 3000);
}
function 尽快设置主题色() {
    if (localStorage.getItem("主题色h")) {
        document.documentElement.style.setProperty(
            "--theme-color",
            (qs("#主题色").content = localStorage.getItem("主题色"))
        );
        document.documentElement.style.setProperty(
            "--theme-color-h",
            localStorage.getItem("主题色h")
        );
        document.documentElement.style.setProperty(
            "--theme-color-s",
            localStorage.getItem("主题色s")
        );
        document.documentElement.style.setProperty(
            "--theme-color-l",
            localStorage.getItem("主题色l")
        );
        document.documentElement.style.setProperty(
            "--theme-color-transparent",
            localStorage.getItem("透明色")
        );
        document.documentElement.style.setProperty(
            "--text-color",
            localStorage.getItem("字体色")
        );
    }
}
function 阻止搜索引擎收录() {
    qs("meta[name='robots']").content = "noindex";
}

// 方便暴露到全局变量
var _global = {};
addEventListener("storage", 尽快设置主题色);
尽快设置主题色();

// 谷歌统计代码
let s = ce("script");
s.async = true;
s.src = "https://www.googletagmanager.com/gtag/js?id=G-060YCRMSSH";
document.head.append(s);

window.dataLayer = window.dataLayer || [];
function gtag() {
    dataLayer.push(arguments);
}
gtag("js", new Date());
gtag("config", "G-060YCRMSSH");
