/**
 * @fileoverview 文档开始时执行的代码，负责初始化主题、事件状态等
 * @author dsy4567
 * @license
 * Copyright (c) 2026 dsy4567
 * SPDX-License-Identifier: MIT
 */

// @ts-check
"use strict";

//#region 前期准备
//#region 主题（两级模型：背景模式 + 强调色）

/** 默认强调色（天依蓝） */
const 默认强调色 = "#66ccff";

/**
 * 将 RGB 颜色转换为 HSL 颜色
 * @param {number} 红 - 红色分量，范围 0-255
 * @param {number} 绿 - 绿色分量，范围 0-255
 * @param {number} 蓝 - 蓝色分量，范围 0-255
 * @returns {[number, number, number]} [色相(0-1), 饱和度(0-1), 亮度(0-1)]
 */
function rgb转hsl(红, 绿, 蓝) {
	红 /= 255;
	绿 /= 255;
	蓝 /= 255;

	const 最大 = Math.max(红, 绿, 蓝);
	const 最小 = Math.min(红, 绿, 蓝);
	const 亮度 = (最大 + 最小) / 2;
	const 差值 = 最大 - 最小;

	// 非彩色：灰、白、黑
	if (差值 === 0) return [0, 0, 亮度];

	const 饱和度 = 亮度 > 0.5 ? 差值 / (2 - 最大 - 最小) : 差值 / (最大 + 最小);

	let 色相;
	if (最大 === 红) 色相 = (绿 - 蓝) / 差值 + (绿 < 蓝 ? 6 : 0);
	else if (最大 === 绿) 色相 = (蓝 - 红) / 差值 + 2;
	else 色相 = (红 - 绿) / 差值 + 4;

	色相 /= 6;

	return [色相, 饱和度, 亮度];
}
/**
 * 将十六进制颜色拆为 RGB 分量
 * @param {string} hex - 形如 "#66ccff" 的颜色
 * @returns {[number, number, number]} [红, 绿, 蓝]，范围 0-255
 */
function hex转rgb(hex) {
	return [
		parseInt(hex.slice(1, 3), 16),
		parseInt(hex.slice(3, 5), 16),
		parseInt(hex.slice(5, 7), 16),
	];
}
/**
 * 将 HSL 颜色转换为十六进制颜色
 * @param {number} 色相 - 0-1
 * @param {number} 饱和度 - 0-1
 * @param {number} 亮度 - 0-1
 * @returns {string} 形如 "#66ccff" 的颜色
 */
function hsl转hex(色相, 饱和度, 亮度) {
	const 分量 = (/** @type {number} */ n) => {
		const k = (n + 色相 * 12) % 12;
		const a = 饱和度 * Math.min(亮度, 1 - 亮度);
		return Math.round((亮度 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255)
			.toString(16)
			.padStart(2, "0");
	};
	return "#" + 分量(0) + 分量(8) + 分量(4);
}
/**
 * 将 hex 颜色转换为 WCAG 相对亮度（0~1）
 * @param {string} hex - 形如 "#66ccff"
 * @returns {number} 相对亮度
 */
function 相对亮度(hex) {
	const [r, g, b] = hex转rgb(hex).map(v => {
		v /= 255;
		return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
/**
 * 计算两个颜色之间的 WCAG 对比度（1~21）
 * @param {string} 颜色1
 * @param {string} 颜色2
 * @returns {number} 对比度
 */
function 对比度(颜色1, 颜色2) {
	const L1 = 相对亮度(颜色1);
	const L2 = 相对亮度(颜色2);
	const 亮 = Math.max(L1, L2);
	const 暗 = Math.min(L1, L2);
	return (亮 + 0.05) / (暗 + 0.05);
}
/**
 * 保持色相和饱和度不变，调整亮度使前景色与背景色达到目标对比度。
 * 若原始颜色已满足对比度，则原样返回；否则沿正确方向微调，直至刚好达标。
 * @param {string} 前景hex - 原始强调色
 * @param {string} 背景hex - 背景色
 * @param {number} 目标对比度 - 默认 4.5（WCAG AA 文字）
 * @returns {string} 调整后的 hex
 */
function 调整亮度以满足对比度(前景hex, 背景hex, 目标对比度 = 4.5) {
	const [h, s, l原始] = rgb转hsl(...hex转rgb(前景hex));

	// 当前对比度
	const 当前对比度 = 对比度(前景hex, 背景hex);
	if (当前对比度 >= 目标对比度) return 前景hex;

	// 背景亮度决定调整方向：亮背景需变暗，暗背景需变亮
	const 背景相对亮度 = 相对亮度(背景hex);
	const 需要变暗 = 背景相对亮度 > 0.5; // 浅色背景

	// 二分查找临界亮度（在保证对比度达标的前提下，最小化与原亮度的差异）
	let 低 = 需要变暗 ? 0 : l原始;
	let 高 = 需要变暗 ? l原始 : 1;

	for (let i = 0; i < 20; i++) {
		const 中 = (低 + 高) / 2;
		const 候选hex = hsl转hex(h, s, 中);
		const 候选对比度 = 对比度(候选hex, 背景hex);
		if (候选对比度 >= 目标对比度)
			if (需要变暗)
				低 = 中; // 达标，尝试更接近原始亮度
			else 高 = 中;
		else if (需要变暗)
			高 = 中; // 未达标，需要更极端的亮度
		else 低 = 中;
	}

	// 取满足条件且最接近原始亮度的值（取高侧或低侧边界）
	const 最终亮度 = 需要变暗 ? 低 : 高;
	return hsl转hex(h, s, 最终亮度);
}
/**
 * 读取背景模式设置
 * @returns {"自动" | "浅色" | "深色"}
 */
function 读取背景模式() {
	const 模式 = localStorage.getItem("主题背景");
	return 模式 === "浅色" || 模式 === "深色" ? 模式 : "自动";
}
/**
 * 读取强调色设置
 * @returns {string} 强调色的 hex 值，如 "#66ccff"
 */
function 读取强调色() {
	return localStorage.getItem("强调色") || 默认强调色;
}
/**
 * 判断当前生效的背景是否为深色（自动模式跟随系统偏好）
 * @returns {boolean}
 */
function 当前是否深色() {
	const 模式 = 读取背景模式();
	if (模式 === "深色") return true;
	if (模式 === "浅色") return false;
	return matchMedia("(prefers-color-scheme: dark)").matches;
}
/**
 * 按背景深浅对强调色做方向调整（浅色背景上加深、深色背景上提亮），
 * 连同衍生色一起写入 CSS 变量
 * @param {string} hex - 强调色原色，如 "#66ccff"
 */
function 写入强调色变量(hex, 深 = 当前是否深色()) {
	const 背景hex = 深 ? "#18171c" : "#eeeeee";

	// 主色用作链接/图标等前景文字
	const 主色 = 调整亮度以满足对比度(hex, 背景hex, 4.5);

	const 根 = document.documentElement.style;
	根.setProperty("--accent-color", 主色);
	// 原色低透明度，用作高亮底色（保持原色不变，因为透明度会降低对比度要求）
	根.setProperty("--accent-color-transparent", hex + "2e");
	// 强调色块上的文字色：深色模式的主色偏亮、浅色模式的主色偏暗，故方向相反
	根.setProperty("--accent-text-color", 深 ? "#222" : "#eee");
	根.setProperty("--link-color", 主色);
}
/**
 * 依据 localStorage 重算背景类、meta 主题色和强调色变量
 */
function 刷新主题() {
	console.time("刷新主题");
	const 深 = 当前是否深色();
	// 自动模式也解析为具体类，保证 hljs 等只认类的地方能跟随
	document.documentElement.classList.toggle("深色", 深);
	document.documentElement.classList.toggle("浅色", !深);
	document.getElementById("主题色")?.setAttribute("content", 深 ? "#18171c" : "#eeeeee");
	写入强调色变量(读取强调色(), 深);
	console.timeEnd("刷新主题");
}

// 尽早应用主题，避免加载闪烁
刷新主题();
//#endregion

let DOMContentLoaded = false,
	loaded = false;
addEventListener("load", () => {
	loaded = true;
});
document.addEventListener("DOMContentLoaded", () => {
	DOMContentLoaded = true;
});
//#endregion
