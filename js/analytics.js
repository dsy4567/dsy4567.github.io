export default (() => {
	if (location.hostname === "dev.dsy4567.cf") return;
	let /** @type {HTMLScriptElement} */ s1 = document.createElement("script");
	s1.async = s1.defer = true;
	s1.src = "https://www.googletagmanager.com/gtag/js?id=G-060YCRMSSH";
	document.body.append(s1);
	window.dataLayer = window.dataLayer || [];
	function gtag() {
		dataLayer.push(arguments);
	}
	gtag("js", new Date());
	gtag("config", "G-060YCRMSSH");

	if (
		location.hostname !== "dsy4567.cf" &&
		location.hostname !== "home-vercel.mirrors.dsy4567.cf"
	)
		return;
	let /** @type {HTMLScriptElement} */ s2 = document.createElement("script");
	s2.src = "/_vercel/insights/script.js";
	s2.async = s2.defer = true;
	document.body.append(s2);
})();
