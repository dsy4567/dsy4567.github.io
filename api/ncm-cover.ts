export const config = {
    runtime: "edge",
};

export default async (request: Request) => {
    let u = new URL("" + request.url);
    let id = u.pathname.replace("/", "");
    let s = await (await fetch("https://music.163.com/song?id=" + id)).text();
    let m = s.match(
        /<meta property="og:image" content="http:\/\/.+\.jpg" \/>/s
    );
    return fetch(
        m?.[0]
            .replace('<meta property="og:image" content="', "")
            .replace('" />', "") + u.search
    );
};
