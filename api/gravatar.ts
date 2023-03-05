export const config = {
    runtime: "edge",
};
export default async (request: Request) => {
    return fetch(
        "https://s.gravatar.com/avatar/9b52496d475f92cafb75ea1f822c0b74" +
            new URL(request.url).search
    );
};
