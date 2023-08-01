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
	url?: string;
	hidden?: boolean;
};
type 添加点击事件和设置图标选项 = {
	设置图标?: boolean;
	要设置图标的元素?: SVGSVGElement[] | HTMLCollectionOf<SVGSVGElement>;
	添加链接点击事件?: boolean;
	要添加链接点击事件的元素?:
		| HTMLAnchorElement[]
		| HTMLCollectionOf<HTMLAnchorElement>;
	添加图片点击事件?: boolean;
	要添加图片点击事件的元素?:
		| HTMLImageElement[]
		| HTMLCollectionOf<HTMLImageElement>;
};

declare class Hljs {
	highlightAll();
	highlightElement(元素: Element);
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
