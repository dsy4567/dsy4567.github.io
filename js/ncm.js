let 网抑云阴乐 = {
    重试timeout: -1,
    已初始化: false,
    立即播放: false,
    设置: { 音量: 50 / 100, 随机播放: false },
    /** @type {{完整歌名:string, 歌名:string, 歌手:string, 专辑:string, 封面:string, id:number, mv:number}[]} */ 歌单: [],
    /** @type {Record<number, number>} */ 歌单索引: {},
    /** @type {Record<number, number>} */ 歌单索引备份: null,
    正在播放: {
        索引: 0,
        /** @type {HTMLAudioElement} */ Audio: new Audio(),
        所有歌词: [],
        所有歌词翻译: [],
        歌词interval: -1,
        上一句歌词: "",
    },
    启用或禁用随机播放(按钮) {
        网抑云阴乐.设置.随机播放 = !网抑云阴乐.设置.随机播放;
        按钮.ariaChecked = 网抑云阴乐.设置.随机播放;
        if (网抑云阴乐.设置.随机播放) 按钮.classList.add("激活");
        else 按钮.classList.remove("激活");
    },
    更改音量() {
        网抑云阴乐.正在播放.Audio.volume = 网抑云阴乐.设置.音量 =
            ((网抑云阴乐.设置.音量 * 100 + 25) % 125) / 100;
    },
    恢复歌词() {
        clearInterval(网抑云阴乐.正在播放.歌词interval);
        网抑云阴乐.正在播放.歌词interval = setInterval(() => {
            const 时间 = 网抑云阴乐.正在播放.Audio.currentTime + 0.2;
            let 需要添加翻译 = false,
                歌词开始时间 = 0;
            for (
                let 索引 = 网抑云阴乐.正在播放.所有歌词.length - 1;
                索引 >= 0;
                索引--
            ) {
                const 歌词 = 网抑云阴乐.正在播放.所有歌词[索引];

                if (歌词.start <= 时间) {
                    歌词开始时间 = 歌词.start;
                    if (歌词.text !== 网抑云阴乐.正在播放.上一句歌词) {
                        网抑云阴乐.正在播放.上一句歌词 = 歌词.text;
                        qs("#歌词").innerText = 歌词.text;
                        需要添加翻译 = true;
                    }
                    break;
                }
            }
            if (网抑云阴乐.正在播放.所有歌词翻译[0])
                for (
                    let 索引 = 网抑云阴乐.正在播放.所有歌词翻译.length - 1;
                    索引 >= 0;
                    索引--
                ) {
                    const 歌词翻译 = 网抑云阴乐.正在播放.所有歌词翻译[索引];

                    if (歌词翻译.start === 歌词开始时间) {
                        if (需要添加翻译)
                            qs("#歌词").innerText += ` (${歌词翻译.text})`;
                        break;
                    }
                }
        }, 200);
    },
    async 获取音乐地址(id) {
        let 数据 = (
            await (
                await fetch("https://ncm.vercel.dsy4567.cf/song/url?id=" + id)
            ).json()
        )?.data[0];
        // vip 歌曲尝试获取 mv
        if (数据?.fee === 0 || 数据?.fee === 8)
            return 数据?.url?.rp("http://", "https://");
        else
            return (
                await (
                    await fetch(
                        "https://ncm.vercel.dsy4567.cf/mv/url?id=" +
                            网抑云阴乐.歌单[网抑云阴乐.歌单索引[id]].mv +
                            "&r=" +
                            (
                                await (
                                    await fetch(
                                        "https://ncm.vercel.dsy4567.cf/mv/detail?mvid=" +
                                            网抑云阴乐.歌单[
                                                网抑云阴乐.歌单索引[id]
                                            ].mv
                                    )
                                ).json()
                            )?.data?.brs?.[0]?.br // 最小分辨率
                    )
                ).json()
            )?.data?.url?.replace("http://", "https://");
    },
    async 切换音乐(欲播放的音乐id, 立即播放 = false) {
        if (typeof 网抑云阴乐.歌单索引[欲播放的音乐id] !== "undefined")
            网抑云阴乐.正在播放.索引 = 网抑云阴乐.歌单索引[欲播放的音乐id];

        if (立即播放)
            try {
                clearTimeout(网抑云阴乐.重试timeout);
                await 网抑云阴乐.初始化();
                网抑云阴乐.正在播放.Audio.pause();
                网抑云阴乐.正在播放.Audio.currentTime = 0;
                网抑云阴乐.正在播放.Audio.src = await 网抑云阴乐.获取音乐地址(
                    网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].id
                );
                网抑云阴乐.正在播放.Audio.autoplay = true;
                qs("#网抑云阴乐").title =
                    "网抑云阴乐 - 正在播放: " +
                    网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].完整歌名;
                localStorage.setItem(
                    "上次播放",
                    网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].id
                );
            } catch (e) {
                提示("播放失败");
                console.error(e);
            }
    },
    async 播放暂停() {
        try {
            clearTimeout(网抑云阴乐.重试timeout);
            await 网抑云阴乐.初始化();
            if (网抑云阴乐.正在播放.Audio.paused)
                网抑云阴乐.正在播放.Audio.play();
            else 网抑云阴乐.正在播放.Audio.pause();
        } catch (e) {
            提示("播放失败");
            console.error(e);
        }
    },
    async 上一首() {
        try {
            clearTimeout(网抑云阴乐.重试timeout);
            qs("#歌词").innerText = "";
            clearInterval(网抑云阴乐.正在播放.歌词interval);
            await 网抑云阴乐.初始化();
            网抑云阴乐.正在播放.Audio.pause();
            网抑云阴乐.正在播放.Audio.currentTime = 0;
            if (!网抑云阴乐.设置.随机播放) {
                if (--网抑云阴乐.正在播放.索引 < 0)
                    网抑云阴乐.正在播放.索引 = 网抑云阴乐.歌单.length - 1;
            } else 网抑云阴乐.正在播放.索引 = 随机数(网抑云阴乐.歌单.length);
            网抑云阴乐.正在播放.Audio.src = await 网抑云阴乐.获取音乐地址(
                网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].id
            );
            网抑云阴乐.正在播放.Audio.autoplay = true;
            qs("#网抑云阴乐").title =
                "网抑云阴乐 - 正在播放: " +
                网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].完整歌名;
            localStorage.setItem(
                "上次播放",
                网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].id
            );
        } catch (e) {
            提示("播放失败");
            console.error(e);
        }
    },
    async 下一首() {
        try {
            clearTimeout(网抑云阴乐.重试timeout);
            qs("#歌词").innerText = "";
            clearInterval(网抑云阴乐.正在播放.歌词interval);
            await 网抑云阴乐.初始化();
            网抑云阴乐.正在播放.Audio.pause();
            网抑云阴乐.正在播放.Audio.currentTime = 0;
            if (!网抑云阴乐.设置.随机播放) {
                if (++网抑云阴乐.正在播放.索引 > 网抑云阴乐.歌单.length - 1)
                    网抑云阴乐.正在播放.索引 = 网抑云阴乐.歌单.length - 1;
            } else 网抑云阴乐.正在播放.索引 = 随机数(网抑云阴乐.歌单.length);
            网抑云阴乐.正在播放.Audio.src = await 网抑云阴乐.获取音乐地址(
                网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].id
            );
            网抑云阴乐.正在播放.Audio.autoplay = true;
            qs("#网抑云阴乐").title =
                "网抑云阴乐 - 正在播放: " +
                网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].完整歌名;
            localStorage.setItem(
                "上次播放",
                网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].id
            );
        } catch (e) {
            提示("播放失败");
            console.error(e);
        }
    },
    async 初始化() {
        try {
            if (网抑云阴乐.已初始化) return;
            网抑云阴乐.已初始化 = true;
            // 根据 id 定位上次播放的音乐
            if (localStorage.getItem("上次播放")) {
                let 上次播放 = localStorage.getItem("上次播放");
                网抑云阴乐.切换音乐(上次播放);
                qs("#播放列表").scrollTop = qs(
                    "li[data-id='" + 上次播放 + "']"
                )?.offsetTop;
            }
            网抑云阴乐.正在播放.Audio.src = await 网抑云阴乐.获取音乐地址(
                网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].id
            );
            网抑云阴乐.正在播放.Audio.preload = "none";
            网抑云阴乐.正在播放.Audio.autoplay =
                (localStorage.getItem("自动播放") &&
                    JSON.parse(localStorage.getItem("自动播放"))) ??
                true;
            网抑云阴乐.正在播放.Audio.volume = 网抑云阴乐.设置.音量;
            网抑云阴乐.正在播放.Audio.onended = 网抑云阴乐.下一首;
            if (navigator.mediaSession) {
                // 使用浏览器/系统提供的控件控制音乐播放
                navigator.mediaSession.setActionHandler("play", function () {
                    网抑云阴乐.正在播放.Audio.play();
                    navigator.mediaSession.playbackState = "playing";
                });
                navigator.mediaSession.setActionHandler("pause", function () {
                    网抑云阴乐.正在播放.Audio.pause();
                    navigator.mediaSession.playbackState = "paused";
                });
                navigator.mediaSession.setActionHandler(
                    "previoustrack",
                    网抑云阴乐.上一首
                );
                navigator.mediaSession.setActionHandler(
                    "nexttrack",
                    网抑云阴乐.下一首
                );
                网抑云阴乐.正在播放.Audio.onloadedmetadata = async () => {
                    qs("#歌词").innerText = "";
                    clearInterval(网抑云阴乐.正在播放.歌词interval);
                    网抑云阴乐.正在播放.所有歌词 = [];
                    网抑云阴乐.正在播放.所有歌词翻译 = [];
                    fetch(
                        `https://ncm.vercel.dsy4567.cf/lyric?id=${
                            网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].id
                        }&realIP=111.18.65.162`
                    )
                        .then(res => res.json())
                        .then(async j => {
                            let 待解析歌词,
                                待解析歌词翻译 = j.tlyric?.lyric;
                            if (
                                (!(待解析歌词 = j.lrc.lyric) &&
                                    j.lrc.version !== 6) ||
                                !j.lrc.lyric.includes("[")
                            ) {
                                qs("#歌词").innerText = "";
                                clearInterval(网抑云阴乐.正在播放.歌词interval);
                                网抑云阴乐.正在播放.所有歌词 = [];
                                return;
                            }
                            await 添加脚本("/js/lrc-parser.js");
                            网抑云阴乐.正在播放.所有歌词 = lrcParser(
                                待解析歌词 + "[99:59.59]\n"
                            ).scripts;
                            待解析歌词翻译?.includes("[") &&
                                (网抑云阴乐.正在播放.所有歌词翻译 = lrcParser(
                                    待解析歌词翻译 + "[99:59.99]\n"
                                ).scripts);

                            网抑云阴乐.恢复歌词();
                        });

                    qs("#播放列表").scrollTop = qs(
                        "li[data-id='" +
                            网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].id +
                            "']"
                    )?.offsetTop;

                    let 封面;
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: 网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].歌名,
                        artist: 网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].歌手,
                        artwork: [
                            {
                                src: (封面 =
                                    网抑云阴乐.歌单[网抑云阴乐.正在播放.索引]
                                        .封面),
                            },
                        ],
                    });
                    qs("#网抑云阴乐封面").onerror = () => {
                        qs("#网抑云阴乐封面").src = "";
                    };
                    qs("#网抑云阴乐封面").src = 封面;
                };
            }
            网抑云阴乐.正在播放.Audio.onplay = () => {
                localStorage.setItem("自动播放", true);
                qs("#网抑云阴乐封面").style.animationName = "匀速转";
                qsa("li.正在播放")?.forEach(元素 => {
                    元素.classList.remove("正在播放");
                });
                qs(
                    "li[data-id='" +
                        网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].id +
                        "']"
                )?.classList.add("正在播放");
                网抑云阴乐.恢复歌词();
            };
            网抑云阴乐.正在播放.Audio.onpause = () => {
                localStorage.setItem("自动播放", false);
                qs("#网抑云阴乐封面").style.animationName = "unset";
                clearInterval(网抑云阴乐.正在播放.歌词interval);
            };
            网抑云阴乐.正在播放.Audio.onerror = e => {
                提示(
                    "无法播放: " +
                        网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].完整歌名 +
                        ", 将在 3 秒后切换下一首"
                );
                console.error(e);
                clearTimeout(网抑云阴乐.重试timeout);
                网抑云阴乐.重试timeout = setTimeout(网抑云阴乐.下一首, 3000);
            };
            qs("#网抑云阴乐").title =
                "网抑云阴乐 - 正在播放: " +
                网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].完整歌名;
        } catch (e) {
            提示("播放失败");
            console.error(e);
        }
    },
};

export default 网抑云阴乐;
