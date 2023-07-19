export default (() => {
    if (location.hostname === "dev.dsy4567.cf") return;
    let /** @type {HTMLScriptElement} */ s1 = document.createElement("script"),
        /** @type {HTMLScriptElement} */ s2 = document.createElement("script");
    s1.async = s1.defer = s2.async = s2.defer = true;
    s1.src = "https://www.googletagmanager.com/gtag/js?id=G-060YCRMSSH";
    s2.src = "https://dsy4567.cf/_vercel/insights/script.js";
    document.body.append(s1, s2);
    window.dataLayer = window.dataLayer || [];
    function gtag() {
        dataLayer.push(arguments);
    }
    gtag("js", new Date());
    gtag("config", "G-060YCRMSSH");
})();
