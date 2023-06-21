/* Copyright (c) 2023 dsy4567, view license at <https://github.com/dsy4567/dsy4567.github.io/blob/main/LICENSE.md> */

const 资源清单 = [
    "/",
    "/blog.html",
    "/js/blog.js",
    "/js/global.js",
    "/js/main.js",
    "/js/highlight.min.js",
    "/js/lrc-parser.js",
    "/js/marked.min.js",
    "/js/ncm.js",
    "/css/global.css",
    "/css/hl.min.css",
    "/img/avatar.jpg",
    "/img/bg.jpg",
    "/json/blog.json",
    "/json/icon.json",
    "/json/theme.json",
];

const 添加资源至缓存 = async 资源 => {
    const 缓存 = await caches.open("offline");
    await 缓存.addAll(资源);
};

const 更新缓存 = async (请求, 响应) => {
    const 缓存 = await caches.open("offline");
    await 缓存.put(请求, 响应);
};

self.addEventListener("activate", 事件 => {
    // 事件.waitUntil(self.registration.navigationPreload.enable());
    console.log("SW 已激活");
});

self.addEventListener("install", 事件 => {
    // 事件.waitUntil(添加资源至缓存(资源清单));
    console.log("SW 已安装");
});

self.addEventListener("fetch", 事件 => {
    let u = new URL(事件.request.url);
    if (u.hostname !== location.hostname || u.pathname.includes("/_")) return;
    u.search = "";
    事件.url = u;

    事件.respondWith(
        (async () =>
            new Promise(async (resolve, reject) => {
                let resolved = false;
                const 预加载的响应 = await 事件.preloadResponse;
                if (预加载的响应) {
                    更新缓存(u, 预加载的响应.clone());
                    resolve(预加载的响应);
                    return;
                } else {
                    const 来自缓存的响应 = await caches.match(u);
                    if (来自缓存的响应) {
                        resolve(来自缓存的响应);
                        resolved = true;
                    }
                }

                try {
                    const 来自网络的请求 = await fetch(u);
                    更新缓存(u, 来自网络的请求.clone());
                    !resolved && resolve(来自网络的请求);
                } catch (e) {
                    !resolved &&
                        resolve(
                            new Response(
                                new Blob(
                                    [
                                        "无法获取资源，您的网络可能存在问题，或该资源不存在。",
                                    ],
                                    { type: "text/plain;charset=utf8" }
                                ),
                                {
                                    status: 408,
                                    headers: {
                                        "Content-Type":
                                            "text/plain;charset=utf8",
                                    },
                                }
                            )
                        );
                }
            }))()
    );
});
