/** 一言句子 */

/** 句子数据源根地址（jsDelivr 上的官方句子仓库，句子文件按 sentences/{分类代号}.json 组织） */
const 数据源 = "https://cdn.jsdelivr.net/gh/hitokoto-osc/sentences-bundle@latest/";

/** 全部分类代号（来自官方 categories.json，分类固定；官方新增分类时需手动同步） */
const 分类代号列表 = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"];

/**
 * 从数组中随机取一项
 * @template T
 * @param {T[]} 数组
 * @returns {T}
 */
function 随机取(数组) {
	return 数组[Math.floor(Math.random() * 数组.length)];
}

async function f(/** @type {Request} */ req) {
	const 查询参数 = new URL(req.url).searchParams,
		/** 请求的分类代号，支持 ?c=a&c=b 传入多个 */
		请求分类 = 查询参数.getAll("c"),
		/** 未传 c 时随机取一个分类，与旧版行为一致 */
		命中分类 = 请求分类.length
			? 请求分类.filter(代号 => 分类代号列表.includes(代号))
			: [随机取(分类代号列表)];
	if (!命中分类.length)
		return new Response(JSON.stringify({ status: 400, message: "分类代号无效", data: [] }), {
			status: 400,
			headers: { "content-type": "application/json;charset=utf-8" },
		});

	// 并行请求命中分类的句子文件后合并，使各分类的句子都有机会被抽中
	/** @type {一言句子[]} */
	const 句子列表 = (
		await Promise.all(
			命中分类.map(代号 =>
				fetch(数据源 + "sentences/" + 代号 + ".json").then(resp => resp.json())
			)
		)
	).flat();
	const 句子 = 随机取(句子列表);

	// encode=text 返回纯文本，其余（含默认的 json）返回完整的句子对象
	if (查询参数.get("encode") === "text")
		return new Response(句子.hitokoto, {
			headers: { "content-type": "text/plain;charset=utf-8" },
		});
	return new Response(JSON.stringify(句子), {
		headers: { "content-type": "application/json;charset=utf-8" },
	});
}
f.fetch = f;
export const config = {
	runtime: "edge",
};
export default f;
