# 如何优化网站加载速度

中考完了之后，闲的没事的我拿 LightHouse 测了一下自己的网站，发现分数有点低。为了拿到四个圆圈圈~~以满足我的虚荣心~~，我决定花些力气来优化网站性能。

<!-- more -->

废话不多说，先把图放上来。

优化前：

[![s:969x835 优化前](/blog-md/how-to-improve-performance/img/before.png)](https://pagespeed.web.dev/analysis/https-dsy4567-cf/gf94qbiu4z)

优化后：

[![s:964x831 优化后](/blog-md/how-to-improve-performance/img/after.png)](https://pagespeed.web.dev/analysis/https-dsy4567-cf/jyhkiaf907)

## 为什么优化网站加载速度很重要

像我这种有点耐心<spoiler>（还不是被某堵墙和我这老爷机逼的）</spoiler>的人，逛加载速度慢网站通常会一边忍着一边想带妈的词语。而一些没耐心的人进了这种网站，肯定会想`这™什么破网站`，然后立马点叉。对于用户很多的电商平台来说，网站加载时间每多 100ms，用户越没有耐心看下去，然后电商平台就要少赚好几沓钞票。

## 少说废话，进入正题

### 多用 `getElement(s)ByXxx`，少用 `querySelector(All)`

![s:428x362 用一段代码比较 getElement(s)ByXxx 和 querySelector(All) 的性能](/blog-md/how-to-improve-performance/img/compare-gebxxx-qs.png)

由图可知，二者的速度差距挺大的。虽然 `querySelector(All)` 用起来又舒服又方便，但它是真的慢。平时写代码的时候，我们应该权衡方便和性能，最好只在 `getElement(s)ByXxx` 满足不了要求时才用 `querySelector(All)`。

### 善用预加载

如果你的网页有可能会晚些加载的资源（比如动态加载脚本、CSS 里的背景图片），可以在`<head>` 里添加 `<link rel="preload"/>` 或 `<link rel="dns-prefetch">`，声明稍后可能会加载的资源，举个栗子：

```html
<!DOCTYPE html>
<html lang="zh-CN">
    <head>
        <!-- ... -->

        <link rel="dns-prefetch" href="https://api.github.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />

        <link
            rel="preload"
            href="/js/ncm.js"
            as="script"
            crossorigin="anonymous"
        />
        <link
            rel="preload"
            href="/json/icon.json"
            as="fetch"
            crossorigin="anonymous"
        />
        <link
            rel="preload"
            href="/json/theme.json"
            as="fetch"
            crossorigin="anonymous"
        />
    </head>
    <!-- ... -->
</html>
```

具体用法可以看看[这篇 MDN 文档（英语）](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preload)。

### 为 `<script>` 标签添加 `async` 或 `defer` 属性

如果脚本不需要尽快执行，添加这两个属性可以让浏览器尽快渲染网页，而不必等待脚本执行完毕。

需要注意的是，添加 `async` 属性后，`DOMContentLoaded` 事件可能无法触发。

### 更多做法

这些做法我就不细说了

-   推迟加载不太重要的资源
-   压缩资源（这个我不想搞）
-   少用小站长提供的接口，说不定哪一天就变慢或者崩掉了，建议自行搭建
-   少用费资源的 CSS 方法（比如 `blur()`）
