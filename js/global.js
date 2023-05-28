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
function 显示或隐藏进度条(状态) {
    状态
        ? qs(".进度条外面")?.classList.add("显示")
        : qs(".进度条外面")?.classList.remove("显示");
}
/**
 * @param {string} url
 */
function 添加样式(url) {
    return new Promise(resolve => {
        if (qs("link[href*='" + url + "']")) return resolve({});
        let l = ce("link");
        l.onload = 事件 => {
            resolve(事件);
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
        s.onload = 事件 => {
            resolve(事件);
        };
        s.src = url;
        document.head.append(s);
    });
}
/**
 * @param {string} m
 */
function 提示(m) {
    let 元素 = ce("div");
    元素.innerHTML = m;
    元素.classList.add("通知");
    元素.ariaLive = "assertive";
    document.body.append(元素);
    setTimeout(function () {
        元素.style.animationName = "隐藏";
        setTimeout(function () {
            元素.remove();
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
function 获取清理后的路径(包含query = false) {
    return (location.pathname + (包含query ? location.search : ""))
        .rp(/(index|\.html)/g, "")
        .rp(/\/\//g, "");
}
function 随机数(最大) {
    return Math.floor(Math.random() * 最大 + 1);
}
function 添加悬浮卡片(html, x, y, 失去焦点时隐藏) {
    let div = ce("div");
    div.className = "悬浮卡片";
    div.innerHTML = html;
    div.style.left = x + "px";
    div.style.top = y + "px";
    div.tabIndex = 0;
    document.body.append(div);
    div.focus();
    // 失去焦点时隐藏 && div.addEventListener("focusout", () => div.remove());
    return div;
}

var URL发生变化事件 = new CustomEvent("URL发生变化");

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

"serviceWorker" in navigator && navigator.serviceWorker.register("/sw.js");
