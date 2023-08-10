async function f(req) {
    let u = new URL(req.url, 'https://dsy4567.cf/api/doh')
    return fetch(
        'https://1.1.1.1/dns-query' + u.search,
        {
            method: req.method,
            body: req.body,
            headers: req.headers
        }
    )
}
f.fetch = f;
export const config = {
    runtime: "edge",
};
export default f;
