export const config = {
    runtime: "edge",
};
var url = "";
export default async (request: Request) => {
    try {
        let u = new URL(request.url);
        let s = await (
            await fetch(
                "https://music.163.com/song?id=" + u.searchParams.get("id")
            )
        ).text();
        let m = s.match(
            /<meta property="og:image" content="http:\/\/.+\.jpg" \/>/s
        );
        return new Response(
            m?.[0]
                .replace('<meta property="og:image" content="', "")
                .replace('" />', "") +
                "?param=" +
                (u.searchParams.get("size") || "64") +
                "y" +
                (u.searchParams.get("size") || "64")
        );
        return fetch(
            m?.[0]
                .replace('<meta property="og:image" content="', "")
                .replace('" />', "") +
                "?param=" +
                (u.searchParams.get("size") || "64") +
                "y" +
                (u.searchParams.get("size") || "64")
        );
    } catch (e) {
        return new Response("Failed: " + request.url, { status: 500 });
    }
};
