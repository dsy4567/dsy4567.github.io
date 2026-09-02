/**
 * @fileoverview 定义一些全局类型
 * @author dsy4567
 * @license
 * Copyright (c) 2026 dsy4567
 * SPDX-License-Identifier: MIT
 */

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
