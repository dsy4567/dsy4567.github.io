const 资源清单 = [
    "/",
    "/js/blog.js",
    "/js/global.js",
    "/js/global2.js",
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
    事件.waitUntil(self.registration.navigationPreload.enable());
    console.log("SW 已激活");
});

self.addEventListener("install", 事件 => {
    事件.waitUntil(添加资源至缓存(资源清单));
    console.log("SW 已安装");
});

self.addEventListener("fetch", 事件 => {
    if (new URL(事件.request.url).hostname != location.hostname) return;

    事件.respondWith(
        (async (请求, 预加载的响应Promise, fallbackUrl) => {
            const 来自缓存的响应 = await caches.match(请求);
            if (来自缓存的响应) {
                return 来自缓存的响应;
            }

            try {
                const 预加载的响应 = await 预加载的响应Promise;
                if (预加载的响应) {
                    console.info("using preload response", 预加载的响应);
                    更新缓存(请求, 预加载的响应.clone());
                    return 预加载的响应;
                }
            } catch (e) {}

            try {
                const 来自网络的请求 = await fetch(请求);
                更新缓存(请求, 来自网络的请求.clone());
                return 来自网络的请求;
            } catch (e) {
                return new Response(
                    new Blob(
                        [
                            "无法获取资源，您的网络可能存在问题，或该资源不存在。",
                        ],
                        { type: "text/plain;charset=utf8" }
                    ),
                    {
                        status: 408,
                        headers: { "Content-Type": "text/plain;charset=utf8" },
                    }
                );
            }
        })(事件.request, 事件.preloadResponse)
    );
});
