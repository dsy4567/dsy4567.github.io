/**
 * @fileoverview 定义一些全局类型
 * @author dsy4567
 * @license
 * Copyright (c) 2022-2026 dsy4567
 * SPDX-License-Identifier: MIT
 */

type 延迟执行状态类型 = Record<
	"DOMContentLoaded" | "关键任务完成",
	{
		/** 事件未触发时按优先级暂存的回调队列 */
		回调: Map<number, (() => any)[]>;
		/** 事件是否已触发 */
		已触发: boolean;
		/** 事件已触发后，低优先级回调的等待池 */
		低优池: Map<number, (() => any)[]>;
		/** 低优池的检查定时器句柄 */
		池定时器: ReturnType<typeof setTimeout> | null;
		/** 低优池是否正在执行中 */
		池执行中: boolean;
		/** 上次高优任务（优先级 <= 1）注册的时间戳，安静窗口的计时起点 */
		上次高优时间: number;
	}
>;

type 音乐信息 = {
	/** 歌名 */ name: string;
	/** 歌手 */ ar: { name: string }[];
	/** 专辑 */ al: { name: string; picUrl: string };
	mv: number;
	id: number;
};
type 歌单 = {
	完整歌名: string;
	歌名: string;
	歌手: string;
	专辑: string;
	封面: string;
	id: number;
	mv: number;
};
type 最近在听项 = {
	/** 排行依据（非播放次数），越大越靠前 */
	score: number;
	song: {
		id: number;
		name: string;
		ar: { id: number; name: string }[];
		al: { name: string; picUrl: string };
		mv: number;
	};
};
type 最近在听响应 = {
	code?: number;
	weekData?: 最近在听项[];
};
type 副歌信息 = {
	id: number;
	/** 毫秒 */ startTime: number;
	/** 毫秒 */ endTime: number;
	ugcLocked: number;
};
type 最近在听缓存 = {
	/** 缓存过期时间戳（东八区当天 23:59:59.999） */
	过期时间: number;
	/** 已按 score 降序排列并截断的排行项 */
	排行项: 最近在听项[];
	/** 第 1 名歌曲的原始歌词接口响应 */
	歌词原始?: { lrc?: { lyric?: string } } | null;
	/** 第 1 名歌曲的原始副歌接口响应 */
	副歌原始?: { code?: number; chorus?: 副歌信息[] } | null;
};
type 精选歌词 = {
	行: string[];
	歌手: string;
	歌名: string;
};
type 文章信息 = {
	updated: string;
	date: string;
	issue?: number;
	tags?: string[];
	id: string;
	title: string;
	desc?: string;
	desc_text?: string;
	cover?: string;
	url?: string;
	hidden?: boolean;
};
type 渲染图标选项 = {
	要渲染图标的元素?: SVGSVGElement[] | HTMLCollectionOf<SVGSVGElement>;
};

type 一言句子 = {
	hitokoto: string;
	uuid: string;
	type: string;
	from: string;
	from_who: string | null;
};

declare class Hljs {
	highlightAll();
	highlightElement(元素: Element);
	getLanguage(语言: string);
}
declare class Recaptcha {
	/** 脚本加载完成时调用回调；脚本尚未加载时由垫片把回调排入队列等待执行 */
	ready(callback: () => void): void;
	render(
		id: string | HTMLElement,
		options: {
			sitekey: string;
			theme: "light" | "dark";
			/** 人机验证完成时由 reCAPTCHA 调用，参数为验证回复 */
			callback?: (回复: string) => void;
			/** 验证过期时调用 */
			"expired-callback"?: () => void;
			/** 验证出错时调用 */
			"error-callback"?: () => void;
		}
	): number;
	getResponse(widgetId?: number): string;
}

interface Window {
	/** reCAPTCHA 内部配置对象；脚本加载完成前，ready 回调会被排入 fns 等待执行 */
	___grecaptcha_cfg?: {
		/** 待 reCAPTCHA 加载完成后执行的回调队列 */
		fns?: (() => void)[];
	};
}

var dataLayer: any[];
var grecaptcha = new Recaptcha();
var hljs = new Hljs();
var lrcParser: (s: string) => {
	scripts: {
		start: number;
		end: number;
		text: string;
	}[];
};
var marked = new Marked();
