/* Copyright (c) 2026 dsy4567, view license at <https://github.com/dsy4567/dsy4567.github.io/blob/main/LICENSE.md> */
// @ts-check

/**
 * 交互式新建博文：询问标题、目录名、简介、标签与关联 Issue 编号后，
 * 生成 blog/<目录名>/index.md 与 blog/<目录名>/article.json 两个源文件。
 * 其余元数据（id、desc、desc_text、cover）由 build.js 构建时自动补全。
 */

const fs = require("fs");
const path = require("path");
const jsonfile = require("jsonfile");
const readline = require("node:readline");
const { stdin, stdout } = require("node:process");

/** 博客文章目录（相对项目根目录） */
const 博客目录 = path.resolve(__dirname, "../blog");

/**
 * 创建提问器：写入提示文本并等待一行输入
 * 不使用 readline/promises 的 question：它在非 TTY（管道）输入下会丢失首行之后的输入，
 * 且在输入结束时既不解决也不拒绝，会让脚本静默退出
 * @param {readline.Interface} 接口 - 已创建的 readline 接口
 * @returns {(提示文本: string) => Promise<string>} 提问函数
 */
function 创建提问器(接口) {
	/** @type {{ 解决: (行: string) => void, 拒绝: (错误: Error) => void }|null} */
	let 等待中 = null;
	/** @type {string[]} 提前到达的输入行（管道输入可能一次性全部到达） */
	const 已到达行 = [];

	接口.on("line", 行 => {
		if (!等待中) {
			已到达行.push(行);
			return;
		}
		const { 解决 } = 等待中;
		等待中 = null;
		解决(行);
	});

	接口.on("close", () => {
		if (!等待中) return;
		const { 拒绝 } = 等待中;
		等待中 = null;
		拒绝(new Error("输入已结束"));
	});

	return 提示文本 => {
		stdout.write(提示文本);
		if (已到达行.length) return Promise.resolve(已到达行.shift() || "");
		return new Promise((解决, 拒绝) => {
			等待中 = { 解决, 拒绝 };
		});
	};
}

/**
 * 询问一个问题的答案，支持默认值、必填与校验
 * @param {(提示文本: string) => Promise<string>} 提问 - 提问函数
 * @param {string} 提示文本 - 问题文本
 * @param {object} [选项] - 选项
 * @param {string} [选项.默认值] - 用户直接回车时采用的默认值
 * @param {boolean} [选项.必填] - 是否必填（必填时空输入会重新询问）
 * @param {(输入: string) => string} [选项.校验] - 校验函数，返回空串表示通过，否则返回错误提示
 * @param {string} [选项.示例] - 提示中展示的输入示例
 * @returns {Promise<string>} 去首尾空白后的答案
 */
async function 询问(提问, 提示文本, 选项 = {}) {
	const { 默认值 = "", 必填 = false, 校验, 示例 = "" } = 选项;
	for (;;) {
		let 提示 = 提示文本;
		if (示例) 提示 += `（如 ${示例}）`;
		if (默认值) 提示 += `（默认 ${默认值}）`;
		提示 += 必填 ? ": " : "（可留空）: ";

		const 输入 = (await 提问(提示)).trim() || 默认值;
		if (!输入) {
			if (!必填) return "";
			console.log("  此项不能为空，请重新输入");
			continue;
		}

		const 错误 = 校验 ? 校验(输入) : "";
		if (错误) {
			console.log(`  ${错误}`);
			continue;
		}
		return 输入;
	}
}

/**
 * 校验文章目录名：仅允许字母、数字、-、_、.，且不能以符号开头，不能与已有目录重名
 * @param {string} 目录名 - 待校验的目录名
 * @returns {string} 错误提示；空串表示通过
 */
function 校验目录名(目录名) {
	if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(目录名))
		return "目录名只能由字母、数字、-、_、. 组成，且必须以字母或数字开头";
	if (fs.existsSync(path.join(博客目录, 目录名))) return `blog/${目录名} 已存在，请换一个目录名`;
	return "";
}

/**
 * 拆分标签输入：支持空格、半角逗号与全角逗号
 * @param {string} 输入 - 用户输入的标签串
 * @returns {string[]} 标签数组；无标签时为空数组
 */
function 解析标签(输入) {
	return 输入.split(/[\s,，]+/).filter(Boolean);
}

/**
 * 生成文章 Markdown 骨架：h1 标题 + 简介 + more 标记
 * （more 标记之前的内容会被 build.js 提取为列表与 RSS 用的描述）
 * @param {string} 标题 - 文章标题
 * @param {string} 简介 - 一句话简介，可为空
 * @returns {string} Markdown 文件内容
 */
function 生成Markdown(标题, 简介) {
	return 简介 ? `# ${标题}\n\n${简介}\n\n<!-- more -->\n` : `# ${标题}\n\n<!-- more -->\n`;
}

/**
 * 主流程：收集文章信息并写入源文件
 * @param {(提示文本: string) => Promise<string>} 提问 - 提问函数
 * @returns {Promise<void>}
 */
async function main(提问) {
	console.log("新建博文：可选项直接回车跳过，Ctrl+C 取消\n");

	const 标题 = await 询问(提问, "文章标题", { 必填: true });
	const 目录名 = await 询问(提问, "文章目录名（同时作为 URL 标识）", {
		必填: true,
		示例: "cf-workers-ip",
		校验: 校验目录名,
	});
	const 简介 = await 询问(提问, "一句话简介（用于博客列表与 RSS 摘要）");
	const 标签 = 解析标签(
		await 询问(提问, "标签（多个标签用空格或逗号分隔）", { 示例: "技术 Vercel" })
	);
	const 编号 = await 询问(提问, "关联的 GitHub Issue 编号", {
		示例: "22",
		校验: 输入 => (/^\d+$/.test(输入) ? "" : "Issue 编号只能是数字"),
	});

	const 文章目录 = path.join(博客目录, 目录名);
	fs.mkdirSync(文章目录, { recursive: true });

	// 首次构建时 syncFileStates 会以 article.json 的 date 作为初始 updated
	const 时间 = new Date().toISOString();
	fs.writeFileSync(path.join(文章目录, "index.md"), 生成Markdown(标题, 简介), "utf-8");
	jsonfile.writeFileSync(
		path.join(文章目录, "article.json"),
		{
			$schema: "../../schema/article.schema.json",
			updated: 时间,
			date: 时间,
			issue: 编号 ? Number(编号) : null,
			tags: 标签,
		},
		{ spaces: 4 }
	);

	console.log(`\n已创建 blog/${目录名}/index.md 与 blog/${目录名}/article.json`);
	console.log(`执行 pnpm run blog 构建后，可访问 /blog/${目录名}/ 查看文章`);
}

const 接口 = readline.createInterface({ input: stdin, output: stdout });
main(创建提问器(接口))
	.catch(错误 => {
		console.error("新建博文失败:", 错误 instanceof Error ? 错误.message : 错误);
		process.exitCode = 1;
	})
	.finally(() => 接口.close());
