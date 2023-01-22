"use strict";

export async function main(/** @type {String} */ 路径) {
    if (路径.startsWith("/blog?")) {
        await import("/js/marked.min.js");
        let u = new URL(location.href);
        let id = u.searchParams.get("id");
        fetch(`/blog-md/${id}/index.md`)
            .then(res => res.text())
            .then(t => {
                let sect = ce("section"),
                    html = marked.parse(t);
                qs("#main .右").append(sect);
                qs("#正在加载文章提示").remove();
                sect.innerHTML =
                    html +
                    (html.includes('<nocopyright value="true"></nocopyright>')
                        ? ""
                        : '<hr /><a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/"><img alt="知识共享许可协议" style="border-width:0;width:inherit;height:inherit;border-radius:unset;" src="https://i.creativecommons.org/l/by-sa/4.0/88x31.png" /></a><br />如无特别说明，本作品采用<a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/">知识共享署名-相同方式共享 4.0 国际许可协议</a>进行许可。');
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
            })
            .catch(e => {
                console.error(e);
                qs("#正在加载文章提示").innerText =
                    "加载失败, 加载时可能遇到了错误, 或此文章不存在";
            });
    } else if (路径 == "/blog") {
        fetch("/json/blog.json")
            .then(res => res.json())
            .then((/** @type {Array} */ j) => {
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
                    span.innerText =
                        "发表于: " + new Date(文章.date).toLocaleString();
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
