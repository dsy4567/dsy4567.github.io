"use strict";

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
 * @param {{href: string, popstate:boolean}} el
 */
alert = m => {
    let el = ce("div");
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

// 方便暴露到全局变量
var _global = {};

// 尽快设置主题色
localStorage.getItem("主题色") &&
    document.documentElement.style.setProperty(
        "--theme-color",
        localStorage.getItem("主题色")
    );

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
