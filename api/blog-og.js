async function f(req) {
	return new Response(req.headers.get("Sec-Fetch-Dest"));
}
export const config = {
	runtime: "edge",
};
export default f;
