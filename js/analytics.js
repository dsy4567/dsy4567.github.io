/* Copyright (c) 2023 dsy4567, view license at <https://github.com/dsy4567/dsy4567.github.io/blob/main/LICENSE.md> */

export default (() => {
	if (location.hostname !== "dsy4567.icu" && location.hostname !== "dsy4567.github.io") return;
	const /** @type {HTMLScriptElement} */ s1 = document.createElement("script"),
		ga_id = location.hostname === "dsy4567.icu" ? "G-060YCRMSSH" : "G-N7WR0PVV4J";
	s1.async = s1.defer = true;
	s1.src = "https://www.googletagmanager.com/gtag/js?id=" + ga_id;
	document.body.append(s1);
	window.dataLayer = window.dataLayer || [];
	function gtag() {
		dataLayer.push(arguments);
	}
	gtag("js", new Date());
	gtag("config", ga_id);

	const /** @type {HTMLScriptElement} */ s2 = document.createElement("script");
	s2.defer = true;
	s2.setAttribute("data-cf-beacon", '{"token": "9ef701d58e594dcc960850227e0f2436"}');
	s2.src = "https://static.cloudflareinsights.com/beacon.min.js";

	if (location.hostname !== "dsy4567.icu") return;
	const /** @type {HTMLScriptElement} */ s3 = document.createElement("script");
	s3.src = "/_vercel/insights/script.js";
	s3.async = s2.defer = true;
	document.body.append(s2);
})();
