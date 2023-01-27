"use strict";

let 所有文章信息 = [];

export async function main(/** @type {String} */ 路径) {
    if (路径.startsWith("/blog?")) {
        await import("/js/marked.min.js");
        if (!所有文章信息[0])
            所有文章信息 = await (await fetch("/json/blog.json")).json();
        let u = new URL(location.href);
        let id = u.searchParams.get("id");
        let 当前文章信息 = {};
        fetch(`/blog-md/${id}/index.md`)
            .then(res => res.text())
            .then(t => {
                let sect = ce("section"),
                    html = marked.parse(t),
                    span = ce("span");
                qs("#main .右").append(sect);
                qs("#正在加载文章提示").remove();
                sect.innerHTML =
                    html +
                    (html.includes('<nocopyright value="true"></nocopyright>')
                        ? ""
                        : '<hr /><a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/"><img alt="知识共享许可协议" style="border-width:0;width:inherit;height:inherit;border-radius:unset;" src="https://i.creativecommons.org/l/by-sa/4.0/88x31.png" /></a><br />如无特别说明，本作品采用<a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/">知识共享署名-相同方式共享 4.0 国际许可协议</a>进行许可。');

                span.innerText = `发表于: ${new Date(
                    当前文章信息.date
                ).toLocaleString()}, 更新于: ${new Date(
                    当前文章信息.updated
                ).toLocaleString()}`;
                span.className = "date";
                sect.append(span);

                document.title =
                    qs("#main > .右 > section > h1").innerText +
                    " | " +
                    document.title;
                qs("#main .右")
                    .querySelectorAll("h1, h2, h3, h4, h5, h6")
                    ?.forEach(el => {
                        if (
                            el.id &&
                            !el.className.includes("可固定") &&
                            !el.querySelector("a")
                        ) {
                            el.innerHTML = `<a href="#${el.id}">${el.innerHTML}</a>`;
                            el.className += " 可固定";
                        }
                    });
                _global["global.js"]().添加链接点击事件();
                if (location.href.includes("#")) {
                    try {
                        qs(
                            `[id="${decodeURI(
                                location.hash.substring(1)
                            )}"] + *`
                        ).className += " 标记";
                    } catch (e) {}
                    let h = location.hash;
                    location.hash = "";
                    location.hash = h;
                } else qs("#main .右").scrollIntoView({ behavior: "smooth" });

                fetch(
                    `https://api.github.com/repos/dsy4567/dsy4567.github.io/issues/${当前文章信息.issue}/comments`
                )
                    .then(res => res.json())
                    .then(j => {
                        if (typeof j !== "object") j = [];
                        let html = `
<h2>
    <svg
        aria-hidden="true"
        class="小尺寸 stroke"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M44 6H4V36H13V41L23 36H44V6Z"
            fill="none"
            stroke-width="4"
            stroke-linecap="round"
            stroke-linejoin="round"
        ></path>
        <path
            d="M14 19.5V22.5"
            stroke-width="4"
            stroke-linecap="round"
            stroke-linejoin="round"
        ></path>
        <path
            d="M24 19.5V22.5"
            stroke-width="4"
            stroke-linecap="round"
            stroke-linejoin="round"
        ></path>
        <path
            d="M34 19.5V22.5"
            stroke-width="4"
            stroke-linecap="round"
            stroke-linejoin="round"
        ></path>
    </svg>
    <span>评论</span>
</h2>
<section>
    <a id="评论链接" href="https://github.com/dsy4567/dsy4567.github.io/issues/${
        当前文章信息.issue
    }#issue-comment-box">在 GitHub 上发表评论</a>
</section>
${(() => {
    let h = "";
    j?.forEach(评论 => {
        h += `
<section class="评论">
    <div class="用户信息">
        <a href="${评论.user.html_url}"><img
            class="头像 小尺寸"
            src="${评论.user.avatar_url}"
            alt="的头像"
        /></a>
        <span class="用户名"><a href="${评论.user.html_url}">${
            评论.user.login
        }</a></span>
    </div>
    <div class="评论正文">${marked.parse(评论.body)}</div>
    <span class="date">发表于: ${new Date(
        评论.created_at
    ).toLocaleString()} 更新于: ${new Date(
            评论.updated_at
        ).toLocaleString()}</span><br />
        <span class="date">${(() => {
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
                    s += emojis[k] + ": " + 评论.reactions[k] + " ";
            });
            return s;
        })()}</span>
</section>`;
    });
    return h;
})()}
`;
                        let sect = ce("section");
                        sect.id = "评论区";
                        sect.innerHTML = html;
                        qs("#main .右").append(sect);
                        _global["global.js"]().添加链接点击事件();
                    });
            })
            .catch(e => {
                console.error(e);
                qs("#正在加载文章提示").innerText =
                    "加载失败, 加载时可能遇到了错误, 或此文章不存在";
            });
        for (let i = 0; i < 所有文章信息.length; i++) {
            const 文章信息 = 所有文章信息[i];
            if (文章信息.id == id) {
                当前文章信息 = 文章信息;
                break;
            }
        }
    } else if (路径 == "/blog") {
        fetch("/json/blog.json")
            .then(res => res.json())
            .then((/** @type {Array} */ j) => {
                所有文章信息 = j;
                j.forEach(文章 => {
                    let a = ce("a"),
                        h2 = ce("h2"),
                        p = ce("p"),
                        img = ce("img"),
                        span = ce("span"),
                        sect = ce("section");
                    a.href = "/blog.html?id=" + 文章.id;
                    a.innerText = 文章.name;
                    p.innerText = 文章.desc;
                    span.innerText = `发表于: ${new Date(
                        文章.date
                    ).toLocaleString()}, 更新于: ${new Date(
                        文章.updated
                    ).toLocaleString()}`;
                    span.className = "date";
                    if (文章.img) {
                        img.src = `/blog-md/${文章.id}/img/` + 文章.img;
                        img.alt = img.title = "封面图";
                    } else img = "";
                    h2.append(a);
                    sect.append(h2, img, p, span);
                    qs("#main .右").append(sect);
                });
                qs("#正在加载文章提示").remove();
                _global["global.js"]().添加链接点击事件();
            })
            .catch(e => {
                console.error(e);
                qs("#正在加载文章提示").innerText = "加载失败";
            });
    }
}
