async function f(req) {
    return fetch('https://1.1.1.1/dns-query',
                 {method:req.method,body:req.body})
}
f.fetch = f;
export const config = {
    runtime: "edge",
};
export default f;