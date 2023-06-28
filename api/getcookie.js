async function f(req) {
    return new Response(req.headers.get("cookie"));
}
export const config = {
    runtime: "edge",
};
export default f;
