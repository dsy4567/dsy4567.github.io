/* Copyright (c) 2023 dsy4567, view license at <https://github.com/dsy4567/dsy4567.github.io/blob/main/LICENSE.md> */

"use strict";

let 网抑云阴乐 = {
    重试timeout: -1,
    已初始化: false,
    立即播放: false,
    设置: { 音量: 50 / 100, 随机播放: false, 域名: "ncm.vercel.dsy4567.cf" },
    /** @type {{完整歌名:string, 歌名:string, 歌手:string, 专辑:string, 封面:string, id:number, mv:number}[]} */ 歌单: [],
    /** @type {Record<number, number>} */ 歌单索引: {},
    /** @type {Record<number, number>} */ 歌单索引备份: null,
    正在播放: {
        索引: 0,
        /** @type {HTMLAudioElement} */ Audio: new Audio(),
        /** @type {VTTCue[]} */ 所有歌词: [],
        /** @type {VTTCue[]} */ 所有歌词翻译: [],
        /** @type {TextTrack} */ 歌词track: null,
        /** @type {TextTrack} */ 翻译track: null,
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
    async 获取音乐地址(id) {
        let 数据 = (
            await (
                await fetch(`https://${网抑云阴乐.设置.域名}/song/url?id=${id}`)
            ).json()
        )?.data[0];
        // vip 歌曲尝试获取 mv
        if (数据?.fee === 0 || 数据?.fee === 8)
            return 数据?.url?.replace("http://", "https://");
        else
            return (
                await (
                    await fetch(
                        `https://${网抑云阴乐.设置.域名}/mv/url?id=${
                            网抑云阴乐.歌单[网抑云阴乐.歌单索引[id]].mv
                        }&r=${
                            (
                                await (
                                    await fetch(
                                        `https://${
                                            网抑云阴乐.设置.域名
                                        }/mv/detail?mvid=${
                                            网抑云阴乐.歌单[
                                                网抑云阴乐.歌单索引[id]
                                            ].mv
                                        }`
                                    )
                                ).json()
                            )?.data?.brs?.[0]?.br // 最小分辨率
                        }`
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
                gd("网抑云阴乐", true).title =
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
            gd("歌词", true).innerText = "";
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
            gd("网抑云阴乐", true).title =
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
            gd("歌词", true).innerText = "";
            await 网抑云阴乐.初始化();
            网抑云阴乐.正在播放.Audio.pause();
            网抑云阴乐.正在播放.Audio.currentTime = 0;
            if (!网抑云阴乐.设置.随机播放) {
                if (++网抑云阴乐.正在播放.索引 > 网抑云阴乐.歌单.length - 1)
                    网抑云阴乐.正在播放.索引 = 0;
            } else 网抑云阴乐.正在播放.索引 = 随机数(网抑云阴乐.歌单.length);
            网抑云阴乐.正在播放.Audio.src = await 网抑云阴乐.获取音乐地址(
                网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].id
            );
            网抑云阴乐.正在播放.Audio.autoplay = true;
            gd("网抑云阴乐", true).title =
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
                gd("播放列表", true).scrollTop = qs(
                    "li[data-id='" + 上次播放 + "']"
                )?.offsetTop;
            }
            网抑云阴乐.正在播放.Audio.src = await 网抑云阴乐.获取音乐地址(
                网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].id
            );

            网抑云阴乐.正在播放.Audio.preload = "none";
            网抑云阴乐.正在播放.Audio.autoplay = false;
            网抑云阴乐.正在播放.Audio.volume = 网抑云阴乐.设置.音量;
            网抑云阴乐.正在播放.Audio.onended = 网抑云阴乐.下一首;
            网抑云阴乐.正在播放.歌词track =
                网抑云阴乐.正在播放.Audio.addTextTrack("captions", "歌词");
            网抑云阴乐.正在播放.翻译track =
                网抑云阴乐.正在播放.Audio.addTextTrack(
                    "subtitles",
                    "翻译",
                    "zh-CN"
                );
            网抑云阴乐.正在播放.歌词track.oncuechange = () => {
                let 歌词 = 网抑云阴乐.正在播放.歌词track?.activeCues[0]?.text;
                if (歌词) gd("歌词", true).innerText = 歌词;
            };
            网抑云阴乐.正在播放.翻译track.oncuechange = () => {
                let 翻译 = 网抑云阴乐.正在播放.翻译track?.activeCues[0]?.text;
                if (翻译) gd("歌词", true).innerText += ` (${翻译})`;
            };

            // 使用浏览器/系统提供的控件控制音乐播放
            navigator.mediaSession?.setActionHandler("play", function () {
                网抑云阴乐.正在播放.Audio.play();
                navigator.mediaSession.playbackState = "playing";
            });
            navigator.mediaSession?.setActionHandler("pause", function () {
                网抑云阴乐.正在播放.Audio.pause();
                navigator.mediaSession.playbackState = "paused";
            });
            navigator.mediaSession?.setActionHandler(
                "previoustrack",
                网抑云阴乐.上一首
            );
            navigator.mediaSession?.setActionHandler(
                "nexttrack",
                网抑云阴乐.下一首
            );
            网抑云阴乐.正在播放.Audio.onloadedmetadata = () => {
                gd("歌词", true).innerText = "";
                网抑云阴乐.正在播放.所有歌词.forEach(歌词 =>
                    网抑云阴乐.正在播放.歌词track.removeCue(歌词)
                );
                网抑云阴乐.正在播放.所有歌词翻译.forEach(歌词翻译 =>
                    网抑云阴乐.正在播放.翻译track.removeCue(歌词翻译)
                );
                网抑云阴乐.正在播放.所有歌词 = [];
                网抑云阴乐.正在播放.所有歌词翻译 = [];
                fetch(
                    `https://${网抑云阴乐.设置.域名}/lyric?id=${
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
                            gd("歌词", true).innerText = "";
                            网抑云阴乐.正在播放.所有歌词 = [];
                            return;
                        }
                        await 添加脚本("/js/lrc-parser.js");
                        let 所有歌词 = lrcParser(
                            待解析歌词 + "[999:59.59]\n"
                        ).scripts;
                        所有歌词.forEach(歌词 => {
                            let c = new VTTCue(歌词.start, 歌词.end, 歌词.text);
                            网抑云阴乐.正在播放.所有歌词.push(c);
                            网抑云阴乐.正在播放.歌词track.addCue(c);
                        });

                        if (待解析歌词翻译?.includes("[")) {
                            let 所有歌词翻译 = lrcParser(
                                待解析歌词翻译 + "[999:59.99]\n"
                            ).scripts;
                            所有歌词翻译.forEach(歌词翻译 => {
                                let c = new VTTCue(
                                    歌词翻译.start,
                                    歌词翻译.end,
                                    歌词翻译.text
                                );
                                网抑云阴乐.正在播放.所有歌词翻译.push(c);
                                网抑云阴乐.正在播放.翻译track.addCue(c);
                            });
                        }
                    });

                gd("播放列表", true).scrollTop = qs(
                    "li[data-id='" +
                        网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].id +
                        "']"
                )?.offsetTop;

                let 封面;
                navigator.mediaSession &&
                    (navigator.mediaSession.metadata = new MediaMetadata({
                        title: 网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].歌名,
                        artist: 网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].歌手,
                        artwork: [
                            {
                                src: (封面 =
                                    网抑云阴乐.歌单[网抑云阴乐.正在播放.索引]
                                        .封面),
                            },
                        ],
                    }));
                gd("网抑云阴乐封面", true).onerror = () => {
                    gd("网抑云阴乐封面", true).src = "";
                };
                gd("网抑云阴乐封面", true).src = 封面 + "?param=24x24";
            };
            网抑云阴乐.正在播放.Audio.onplay = () => {
                gd("网抑云阴乐封面", true).style.animationName = "匀速转";
                qsa("li.正在播放")?.forEach(元素 => {
                    元素.classList.remove("正在播放");
                });
                qs(
                    "li[data-id='" +
                        网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].id +
                        "']"
                )?.classList.add("正在播放");
            };
            网抑云阴乐.正在播放.Audio.onpause = () => {
                gd("网抑云阴乐封面", true).style.animationName = "unset";
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
            gd("网抑云阴乐", true).title =
                "网抑云阴乐 - 正在播放: " +
                网抑云阴乐.歌单[网抑云阴乐.正在播放.索引].完整歌名;
        } catch (e) {
            提示("播放失败");
            console.error(e);
        }
    },
};

export default 网抑云阴乐;

_global["ncm.js"] = () => ({
    网抑云阴乐,
});
