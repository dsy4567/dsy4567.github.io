/**
 * @fileoverview 定义一些全局类型
 * @author dsy4567
 * @license
 * Copyright (c) 2026 dsy4567
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
type 文章信息 = {
	updated: string;
	date: string;
	issue?: number;
	tags: string[];
	id: string;
	title: string;
	desc: string;
	desc_text?: string;
	cover: string;
	url?: string;
	hidden?: boolean;
};
type 渲染图标选项 = {
	要渲染图标的元素?: SVGSVGElement[] | HTMLCollectionOf<SVGSVGElement>;
};

declare class Hljs {
	highlightAll();
	highlightElement(元素: Element);
	getLanguage(语言: string);
}
declare class Recaptcha {
	getResponse(): string;
	render(
		id: string,
		options: {
			sitekey: string;
			theme: "light" | "dark";
		}
	);
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
