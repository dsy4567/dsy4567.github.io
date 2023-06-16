export async function main(/** @type {String} */ 路径) {
    qsa("#友链 > div > section")?.forEach(元素 => {
        let a = 元素.querySelector("a"),
            img = 元素.querySelector("img");
        img.src =
            img.src ||
            `https://t1.gstatic.cn/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${a.host}&size=16`;
        img.alt = img.title = a.innerText;
    });
}
