"use strict";

export async function main(/** @type {String} */ 路径) {
    await import("/js/marked.min.js");
    if (路径.startsWith("/blog?")) {
        let u = new URL(location.href);
        let id = u.searchParams.get("id");
        fetch(`/blog-md/${id}/index.md`)
            .then(res => res.text())
            .then(t => {
                let sect = ce("section");
                sect.innerHTML = marked.parse(t);
                qs("#main .右").append(sect);
                qs("#正在加载文章提示").remove();
                document.title =
                    qs("#main > .右 > section > h1").innerText +
                    " | " +
                    document.title;
                _global["global.js"]().添加链接点击事件();
                qs("#main .右").scrollIntoView({ behavior: "smooth" });
            })
            .catch(e => {
                console.error(e);
                qs("#正在加载文章提示").innerText = "加载失败";
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
                        sect = ce("section");
                    a.href = "/blog.html?id=" + 文章.id;
                    a.innerText = 文章.name;
                    p.innerText = 文章.desc;
                    if (文章.img) {
                        img.src = `/blog-md/${文章.id}/img/` + 文章.img;
                        img.alt = img.title = "封面图";
                        img.style.width = "100%";
                        img.style.height = "auto";
                    } else img = "";
                    h2.append(a);
                    sect.append(h2, img, p);
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
