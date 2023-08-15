/* Copyright (c) 2023 dsy4567, view license at <https://github.com/dsy4567/dsy4567.github.io/blob/main/LICENSE.md> */

export default (() => {
	if (location.hostname !== "dsy4567.cf" && location.hostname !== "dsy4567.github.io") return;
	const /** @type {HTMLScriptElement} */ s1 = document.createElement("script"),
		ga_id = location.hostname === "dsy4567.cf" ? "G-060YCRMSSH" : "G-N7WR0PVV4J";
	s1.async = s1.defer = true;
	s1.src = "https://www.googletagmanager.com/gtag/js?id=" + ga_id;
	document.body.append(s1);
	window.dataLayer = window.dataLayer || [];
	function gtag() {
		dataLayer.push(arguments);
	}
	gtag("js", new Date());
	gtag("config", ga_id);

	if (location.hostname !== "dsy4567.cf") return;
	const /** @type {HTMLScriptElement} */ s2 = document.createElement("script");
	s2.src = "/_vercel/insights/script.js";
	s2.async = s2.defer = true;
	document.body.append(s2);
})();
