(function () {
    "use strict";
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    var $ = function (id) { return document.getElementById(id); };

    $("year").textContent = new Date().getFullYear();

    /* Top bar hairline after scrolling */
    var top = $("top");
    function onScroll() { top.classList.toggle("scrolled", window.scrollY > 8); }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    /* Scroll reveal */
    var items = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window && !reduce) {
        var io = new IntersectionObserver(function (es) {
            es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
        }, { threshold: 0.15 });
        items.forEach(function (el) { io.observe(el); });
    } else {
        items.forEach(function (el) { el.classList.add("in"); });
    }

    /* Project preview that follows the pointer (desktop only) */
    if (!fine || reduce) return;
    var prev = $("preview"), prevText = $("previewText");
    var mx = innerWidth / 2, my = innerHeight / 2, px = mx, py = my;
    window.addEventListener("mousemove", function (e) { mx = e.clientX; my = e.clientY; });
    (function loop() {
        px += (mx - px) * 0.12; py += (my - py) * 0.12;
        prev.style.transform = "translate(" + (px + 30) + "px," + (py - 140) + "px) rotate(" + ((mx - px) * 0.04) + "deg)";
        requestAnimationFrame(loop);
    })();
    document.querySelectorAll(".work__item").forEach(function (li) {
        li.addEventListener("mouseenter", function () {
            prev.style.background = li.dataset.bg;
            prevText.textContent = li.querySelector(".work__no").textContent;
            prev.classList.add("show");
        });
        li.addEventListener("mouseleave", function () { prev.classList.remove("show"); });
    });
})();
