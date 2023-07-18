/* Copyright (c) 2023 dsy4567, view license at <https://github.com/dsy4567/dsy4567.github.io/blob/main/LICENSE.md> */

// @ts-check
"use strict";

let /** @type {文章信息[]} */ 所有文章信息 = [],
    路径 = 获取清理后的路径(true);

export async function main(/** @type {String} */ 路径) {
    // @ts-ignore
    await import("/js/marked.min.js");
    let u = new URL(location.href);
    if (u.searchParams.get("id")) {
        if (!所有文章信息[0])
            所有文章信息 = await (await fetch("/json/blog.json")).json();
        let id = u.searchParams.get("id");
        let /** @type {文章信息} */ 当前文章信息 = {
                updated: "",
                date: "",
                issue: -1,
                tags: [],
                id: "",
                title: "",
                desc: "",
                url: "",
                hidden: false,
            };
        for (const 文章信息 of 所有文章信息)
            if (文章信息.id === id) {
                当前文章信息 = 文章信息;
                break;
            }
        fetch(当前文章信息.url ? 当前文章信息.url : `/blog-md/${id}/index.md`)
            .then(res => res.text())
            .then(async t => {
                const 右 = qs("main .右", true);
                if (!右) return;
                let sect = ce("section"),
                    html = marked.parse(t),
                    span = ce("span");
                右.append(sect);
                sect.innerHTML =
                    html +
                    (html.includes('<nocopyright value="true"></nocopyright>')
                        ? ""
                        : '<hr /><a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/"><img alt="知识共享许可协议" style="border-width:0;width:inherit;height:inherit;border-radius:unset;" src="/img/cc-by-sa-4.0.png" /></a><br />如无特别说明，本作品采用<a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/">知识共享署名-相同方式共享 4.0 国际许可协议</a>进行许可。<br />');

                span.innerHTML = `发表于: ${new Date(
                    当前文章信息.date
                ).toLocaleString()}, 更新于: ${new Date(
                    当前文章信息.updated
                ).toLocaleString()}</br>标签: ${(() => {
                    let html = "";
                    for (const 标签 of 当前文章信息.tags)
                        html += `<a href="/blog.html?tag=${标签}">${标签}</a> `;
                    return html;
                })()}`;
                span.classList.add("淡化");
                sect.append(span);

                document.title =
                    (qs("main > .右 > section > h1")?.innerText || "无标题") +
                    " | " +
                    document.title;

                let ul = ce("ul"),
                    目录 = ce("section");
                let t1 = [0, 0, 0, 0, 0, 0],
                    t2 = 0,
                    t3 = 0;
                for (const 元素 of 右.querySelectorAll(
                    "h1, h2, h3, h4, h5, h6"
                ) || []) {
                    if (
                        元素.id &&
                        !元素.className.includes("可固定") &&
                        !元素.querySelector("a")
                    ) {
                        元素.innerHTML = `<a href="#${元素.id}">${元素.innerHTML}</a>`;
                        元素.classList.add("可固定");
                    }
                    t3 =
                        { H1: 0, H2: 1, H3: 2, H4: 3, H5: 4, H6: 5 }[
                            元素.tagName
                        ] || 0;
                    if (t2 < t3) t2 = t3;
                    else if (t2 > t3) {
                        t1[t2] = 0;
                        t2 = t3;
                    }
                    t1[t2]++;
                    let li = ce("li"),
                        a = ce("a");
                    a.innerText =
                        // @ts-ignore
                        t1.join(".").replace(/.0/g, "") + " " + 元素.innerText;
                    a.href = "#" + 元素.id;
                    li.append(a);
                    ul.append(li);
                }
                目录.insertAdjacentHTML(
                    "afterbegin",
                    '<h2><svg class="小尺寸" data-icon="目录"></svg><span>目录</span></h2>'
                );
                目录.append(ul);
                目录.classList.add("目录");
                qs("main > .左", true)?.append(目录);

                gd("正在加载文章提示")?.remove();
                显示或隐藏进度条(false);
                _global["main.js"]().添加点击事件和设置图标();
                if (location.hash) {
                    try {
                        qs(
                            `[id="${decodeURI(
                                location.hash.substring(1)
                            )}"] + *`
                        )?.classList.add("标记");
                    } catch (e) {}
                    let h = location.hash;
                    location.hash = "";
                    location.hash = h;
                } else if (可以滚动到视图中)
                    右.scrollIntoView({
                        behavior: "smooth",
                    });

                await 添加脚本("/js/highlight.min.js");
                添加样式("/css/hl.min.css");
                hljs.highlightAll();

                当前文章信息.issue &&
                    fetch(
                        `https://api.github.com/repos/dsy4567/dsy4567.github.io/issues/${当前文章信息.issue}/comments`
                    )
                        .then(res => res.json())
                        .then(async j => {
                            if (typeof j !== "object") j = [];
                            // prettier-ignore
                            let html = `
<h2>
    <svg data-icon="评论" class="小尺寸"></svg>
    <span>评论</span>
</h2>
<section>
    <a
        id="评论链接"
        href="https://github.com/dsy4567/dsy4567.github.io/issues/${当前文章信息.issue}#issue-comment-box"
    >在 GitHub 上发表评论</a>
</section>
${(() => {
    let h = "";
    for (const 评论 of j || [])
        h += `
<section class="评论">
    <div class="用户信息">
        <a href="${评论.user.html_url}"><img
            class="头像 小尺寸"
            src="${评论.user.avatar_url}"
            alt="的头像"
        /></a>
        <span class="用户名"><a href="${评论.user.html_url}">${评论.user.login}</a></span>
    </div>
    <div class="评论正文">${marked.parse(评论.body)}</div>
    <span class="淡化">发表于: ${new Date(评论.created_at).toLocaleString()} 更新于: ${new Date(评论.updated_at).toLocaleString()}</span><br />
    <span class="淡化">${(() => {
            let emojis = {
                    "+1": "👍",
                    "-1": "👎",
                    laugh: "😀",
                    hooray: "🎉",
                    confused: "😕",
                    heart: "❤️",
                    rocket: "🚀",
                    eyes: "👀",
                },
                s = "";
            Object.keys(emojis).forEach(k => {
                if (评论.reactions[k])
                    // @ts-ignore
                    s += emojis[k] + ": " + 评论.reactions[k] + " ";
            });
            return s;
        })()}
    </span>
</section>`;
    return h;
})()}
`;
                            let sect = ce("section");
                            sect.id = "评论区";
                            sect.innerHTML = html;
                            右.append(sect);
                            _global["main.js"]().添加点击事件和设置图标();
                            hljs.highlightAll();
                        });
            })
            .catch(e => {
                console.error(e);
                阻止搜索引擎收录();
                显示或隐藏进度条(false);
                const 正在加载文章提示 = gd("正在加载文章提示");
                if (正在加载文章提示)
                    正在加载文章提示.innerText =
                        "加载失败, 加载时可能遇到了错误, 或此文章不存在";
            });
    } else if (获取清理后的路径() === "/blog")
        fetch("/json/blog.json")
            .then(res => res.json())
            .then((/** @type {Array<文章信息>} */ j) => {
                const 右 = qs("main .右", true);
                if (!右) return;

                所有文章信息 = j;
                let 所有标签 = new Set(),
                    限定标签 = u.searchParams.get("tag");
                for (const 文章 of j) {
                    文章.tags?.forEach(标签 => 所有标签.add(标签));
                    if (
                        文章.hidden ||
                        (限定标签 && !文章.tags.includes(限定标签))
                    )
                        continue;
                    let a = ce("a"),
                        br = ce("br"),
                        p = ce("p"),
                        span = ce("span"),
                        sect = ce("section"),
                        鼠标已移动 = false;
                    a.href = "/blog.html?id=" + 文章.id;
                    a.innerText = "阅读更多";
                    p.innerHTML = marked.parse(文章.desc);
                    span.innerHTML = `发表于: ${new Date(
                        文章.date
                    ).toLocaleString()}, 更新于: ${new Date(
                        文章.updated
                    ).toLocaleString()}</br>标签: ${(() => {
                        let html = "";
                        文章.tags.forEach(标签 => {
                            html += `<a href="/blog.html?tag=${标签}">${标签}</a> `;
                        });
                        return html;
                    })()}`;
                    span.classList.add("淡化");
                    sect.append(p, a, br, span);
                    sect.addEventListener("mousedown", 事件 => {
                        鼠标已移动 = false;
                    });
                    sect.addEventListener("mousemove", 事件 => {
                        鼠标已移动 = true;
                    });
                    sect.addEventListener("click", 事件 => {
                        if (
                            // @ts-ignore
                            事件.target?.tagName !== "A" &&
                            // @ts-ignore
                            事件.target?.parentElement?.tagName !== "A" &&
                            !鼠标已移动
                        )
                            _global["main.js"]().动态加载(a);
                    });
                    右.append(sect);
                }
                let 标签元素 = ce("section"),
                    div = ce("div");
                所有标签.forEach(标签 => {
                    let a = ce("a");
                    a.innerText = 标签;
                    a.href = "?tag=" + 标签;
                    if (标签 === 限定标签) {
                        a.style.border = "1px solid var(--text-color)";
                        document.title =
                            "标签：" + 标签 + " | " + document.title;
                    }
                    div.append(a);
                });
                标签元素.insertAdjacentHTML(
                    "afterbegin",
                    '<h2><svg class="小尺寸" data-icon="标签"></svg><span>标签</span></h2>'
                );
                [...(document.getElementsByClassName("标签") || [])]?.forEach(
                    元素 => {
                        元素.remove();
                    }
                );
                标签元素.classList.add("标签");
                标签元素.append(div);
                qs("main > .左", true)?.append(标签元素);

                显示或隐藏进度条(false);
                gd("正在加载文章提示")?.remove();
                _global["main.js"]().添加点击事件和设置图标();
                if (!location.hash && 可以滚动到视图中)
                    右.scrollIntoView({
                        behavior: "smooth",
                    });
            })
            .catch(e => {
                console.error(e);
                阻止搜索引擎收录();
                显示或隐藏进度条(false);
                const 正在加载文章提示 = gd("正在加载文章提示");
                if (正在加载文章提示) 正在加载文章提示.innerText = "加载失败";
            });
}

addEventListener("URL发生变化", () => {
    if (路径 !== 获取清理后的路径(true)) {
        路径 = 获取清理后的路径(true);
        [
            ...(document.getElementsByClassName("目录") || []),
            ...(document.getElementsByClassName("标签") || []),
        ]?.forEach(元素 => {
            元素.remove();
        });
    }
});

_global["blog.js"] = () => ({ 所有文章信息, 路径, main });
