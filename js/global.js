/* Copyright (c) 2023 dsy4567, view license at <https://github.com/dsy4567/dsy4567.github.io/blob/main/LICENSE.md> */

"use strict";

// if (location.hostname === "dsy4567.github.io") location.hostname = "dsy4567.cf";

let gd缓存 = {};
/**
 * document.getElementById
 * @param {string} s
 * @param {boolean} 缓存
 * @returns {HTMLElement}
 */
function gd(s, 缓存) {
    if (缓存) {
        let r = gd缓存[s];
        return r || (gd缓存[s] = document.getElementById(s));
    }
    return document.getElementById(s);
}
let qs缓存 = {};
/**
 * document.querySelector
 * @param {keyof HTMLElementTagNameMap} s
 * @param {boolean} 缓存
 * @returns {HTMLElement}
 */
function qs(s, 缓存) {
    if (缓存) {
        let r = qs缓存[s];
        return r || (qs缓存[s] = document.querySelector(s));
    }
    return document.querySelector(s);
}
/**
 * document.querySelectorAll
 * @param {keyof HTMLElementTagNameMap} s
 * @returns {HTMLElement[]}
 */
function qsa(s) {
    return document.querySelectorAll(s);
}
/**
 * document.getElementsByTagName
 * @param {keyof HTMLElementTagNameMap} s
 * @returns {HTMLElement[]}
 */
function ge(s) {
    return [...(document.getElementsByTagName(s) || [])];
}
/**
 * document.createElement
 * @param {keyof HTMLElementTagNameMap} s
 * @returns {HTMLElement}
 */
function ce(s) {
    return document.createElement(s);
}
function 显示或隐藏进度条(状态) {
    状态
        ? qs(".进度条外面", true)?.classList.add("显示")
        : qs(".进度条外面", true)?.classList.remove("显示");
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
            (gd("主题色", true).content = localStorage.getItem("主题色"))
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
    gd("robots", true).content = "noindex";
}
let 清理后的路径缓存 = {};
function 获取清理后的路径(包含search = false) {
    let l = 清理后的路径缓存[location.pathname];
    return l
        ? l + (包含search ? location.search : "")
        : (清理后的路径缓存[location.pathname] = location.pathname
              .replace(/(index|\.html)/g, "")
              .replace(/\/\//g, "")) + (包含search ? location.search : "");
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

let URL发生变化事件 = new CustomEvent("URL发生变化"),
    可以滚动到视图中 = false;

// 方便暴露到全局变量
let _global = {};
addEventListener("storage", 尽快设置主题色);
尽快设置主题色();

let DOMContentLoaded = false,
    loaded = false;
addEventListener("load", () => {
    loaded = true;
});
document.addEventListener("DOMContentLoaded", async () => {
    DOMContentLoaded = true;
});

"serviceWorker" in navigator &&
    //     location.hostname !== "dsy4567.github.io" &&
    //     navigator.serviceWorker.register("/sw.js");
    navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(sw => sw.unregister());
    });

caches.keys().then(t => {
    return Promise.all(
        t.map(n => {
            return caches.delete(n);
        })
    );
});
