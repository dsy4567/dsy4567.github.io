async function f(req) {
	console.log(req.headers.get("Sec-Fetch-Dest"));
	return new Response();
}
export const config = {
	runtime: "edge",
};
export default f;
