/**
            MODIFIED WTFPL LICENSE WITH DISCLAIMER
   Based on: DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
                    Version 2, December 2004
 Copyright (C) 2004 Sam Hocevar <sam@hocevar.net>

 Everyone is permitted to copy and distribute verbatim or modified
 copies of this license document, and changing it is allowed as long
 as the name is changed.

            MODIFIED WTFPL LICENSE WITH DISCLAIMER
   TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION

  0. You just DO WHAT THE FUCK YOU WANT.

  1. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY FUCKING KIND,
     EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
     MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
     IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE FUCKING LIABLE
     FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
     CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
     WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * @fileoverview LRC 歌词解析器-重构版：把带时间标签的歌词文本解析为按时间升序、首尾衔接的语句列表
 * @author dsy4567
 */

// @ts-check

/**
 * 全局接口（沿用旧版形状，向下兼容）：
 *   lrcParser(歌词文本) => { scripts: { start, end, text }[] }
 *   lrcParser(歌词文本, 总时长) => 同上，末行结束时间取总时长
 *
 * 行为保证（旧版的缺陷曾由调用方逐一规避，现由解析器自身保证，调用方无需再兜底）：
 * - 任何输入都单遍有界解析，不抛错、不死循环（旧版遇到整段没有歌词行的输入会卡死主线程）
 * - 原生支持一行多时间标签（旧版每行只取第一个且不重排，多时间标签行的时间区间会错位倒序）
 * - 输出按开始时间升序，start 与 end 有限且 start < end（旧版会产出永不激活甚至非法的 cue）
 * - 末行结束时间：总时长 有效且晚于末行时取总时长，否则用哨兵时间兜底
 *   （旧版不产生末行结束时间，调用方需手工追加 "[999:59.99]" 哨兵行）
 * - 容忍 BOM、行首空白与 \r\n 换行（\s 覆盖 \uFEFF，第三方歌词常见其前缀）
 */
(function () {
	"use strict";

	/** 末行结束时间的兜底值（秒），与调用方曾手工追加的 "[999:59.99]" 哨兵行~~等价~~ 将时间改为 114514:59.99 */
	const 哨兵结束时间 = 114514 * 60 + 59.99;

	/**
	 * 时间标签（粘性正则，仅在 lastIndex 处匹配）：形如 [分:秒.毫秒]，
	 * 分 1~3 位、秒 1~2 位、毫秒 1~3 位，毫秒分隔符兼容「.」与「:」
	 */
	const 时间标签 = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/y;
	/** 行首及标签之间可能夹杂的空白 */
	const 标签间空白 = /\s+/y;

	/**
	 * 时间标签的捕获组转秒数；毫秒按实际位数折算（".5" 为 0.5s，".05" 为 0.05s），
	 * 与把「秒.毫秒」整体按小数解析等价
	 * @param {string} 分
	 * @param {string} 秒
	 * @param {string | undefined} 毫秒
	 * @returns {number}
	 */
	function 标签转秒(分, 秒, 毫秒) {
		const 毫秒折算 = 毫秒 === undefined ? 0 : Number(毫秒) / 10 ** 毫秒.length;
		return Number(分) * 60 + Number(秒) + 毫秒折算;
	}

	/**
	 * 解析 LRC 歌词文本
	 * @param {string} 歌词文本
	 * @param {number} [总时长] 歌曲总时长（秒），用于推算末行结束时间；缺省时用哨兵时间兜底
	 * @returns {{ scripts: { start: number; end: number; text: string }[] }}
	 */
	function 解析(歌词文本, 总时长) {
		/** @type {{ start: number; end: number; text: string }[]} */
		const 语句 = [];
		if (typeof 歌词文本 !== "string") return { scripts: 语句 };

		for (const 行 of 歌词文本.split(/\r\n|\r|\n/)) {
			/** @type {number[]} */
			const 时间们 = [];
			// 从行首起连续摘出时间标签：先跳过空白（含 BOM），再匹配标签，循环推进直至不再是标签
			let 位置 = 0;
			while (true) {
				标签间空白.lastIndex = 位置;
				if (标签间空白.exec(行) !== null) 位置 = 标签间空白.lastIndex;
				时间标签.lastIndex = 位置;
				const 匹配 = 时间标签.exec(行);
				if (!匹配) break;
				时间们.push(标签转秒(匹配[1], 匹配[2], 匹配[3]));
				位置 = 时间标签.lastIndex;
			}
			// 没有标签（元信息行、纯文本行）或没有正文（裸时间戳行）的都不算歌词行；正文去首尾空白
			if (时间们.length === 0) continue;
			const 文本 = 行.slice(位置).trim();
			if (文本 === "") continue;
			for (const 开始时间 of 时间们) 语句.push({ start: 开始时间, end: 0, text: 文本 });
		}

		if (语句.length === 0) return { scripts: 语句 };
		// 按开始时间升序（sort 稳定，相同开始时间保持出现顺序）；每行结束时间取下一行开始时间，
		// 相同开始时间的重叠行折叠后只保留最后一行（end === start 的行不产出）
		语句.sort((甲, 乙) => 甲.start - 乙.start);
		const 末行 = 语句[语句.length - 1];
		const 末行结束 =
			typeof 总时长 === "number" && Number.isFinite(总时长) && 总时长 > 末行.start
				? 总时长
				: 哨兵结束时间;
		/** @type {{ start: number; end: number; text: string }[]} */
		const 结果 = [];
		for (let 索引 = 0; 索引 < 语句.length; 索引++) {
			const 结束时间 = 索引 === 语句.length - 1 ? 末行结束 : 语句[索引 + 1].start;
			if (结束时间 > 语句[索引].start)
				结果.push({
					start: 语句[索引].start,
					end: 结束时间,
					text: 语句[索引].text,
				});
		}
		return { scripts: 结果 };
	}

	// 兼容旧全局接口：window.lrcParser(文本).scripts
	window.lrcParser = 解析;
})();
