/* Copyright (c) 2023 dsy4567, view license at <https://github.com/dsy4567/dsy4567.github.io/blob/main/LICENSE.md> */

"use strict";

window.onerror = () => {
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
/**
 * 更美观的 alert
 * @param {string} m
 */
alert = m => {
    let el = ce("div");
    el.innerHTML = m;
    el.className = "通知";
    el.ariaLive = "assertive";
    document.body.append(el);
    setTimeout(() => {
        el.style.animationName = "隐藏";
        setTimeout(() => {
            el.remove();
        }, 500);
    }, 3000);
};

// 方便暴露到全局变量
var _global = {},
    尽快设置主题色 = () => {
        if (localStorage.getItem("主题色")) {
            document.documentElement.style.setProperty(
                "--theme-color",
                (qs("#主题色").content = localStorage.getItem("主题色"))
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
    };
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
