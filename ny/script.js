(function () {
    "use strict";
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    var body = document.body;
    var $ = function (id) { return document.getElementById(id); };

    $("year").textContent = new Date().getFullYear();

    /* Intro */
    var intro = $("intro"), count = $("introCount");
    function start() { body.classList.add("ready"); document.dispatchEvent(new Event("kds:ready")); }
    if (reduce) {
        start();
    } else {
        var t0 = performance.now(), dur = 1300;
        (function tick(now) {
            var p = Math.min((now - t0) / dur, 1);
            count.textContent = String(Math.round(p * p * 100)).padStart(3, "0");
            if (p < 1) { requestAnimationFrame(tick); }
            else {
                intro.classList.add("done");
                setTimeout(start, 350);
                setTimeout(function () { intro.style.display = "none"; }, 1200);
            }
        })(t0);
    }

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

    /* Marquee + parallax, driven by scroll */
    var track = $("marquee");
    if (!reduce) {
        var ticking = false;
        function onScroll() {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(function () {
                var y = window.scrollY;
                track.style.transform = "translateX(" + (-y * 0.6 % (track.scrollWidth / 2)) + "px)";
                ticking = false;
            });
        }
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
    }

    /* Cursor, project preview, magnet (desktop only) */
    if (!fine || reduce) return;
    var cur = $("cursor"), label = $("cursorLabel");
    var prev = $("preview"), prevText = $("previewText");
    var mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my, px = mx, py = my;
    body.classList.add("has-cursor");

    window.addEventListener("mousemove", function (e) { mx = e.clientX; my = e.clientY; });
    (function loop() {
        cx += (mx - cx) * 0.22; cy += (my - cy) * 0.22;
        px += (mx - px) * 0.12; py += (my - py) * 0.12;
        cur.style.transform = "translate(" + cx + "px," + cy + "px)";
        prev.style.transform = "translate(" + (px + 30) + "px," + (py - 140) + "px) rotate(" + ((mx - px) * 0.04) + "deg)";
        requestAnimationFrame(loop);
    })();

    document.querySelectorAll("[data-cursor]").forEach(function (el) {
        el.addEventListener("mouseenter", function () { label.textContent = el.getAttribute("data-cursor"); cur.classList.add("big"); });
        el.addEventListener("mouseleave", function () { cur.classList.remove("big"); });
    });

    document.querySelectorAll(".work__item").forEach(function (li) {
        li.addEventListener("mouseenter", function () {
            prev.style.background = li.dataset.bg;
            prev.style.color = li.dataset.ink;
            prevText.textContent = li.querySelector(".work__no").textContent;
            prev.classList.add("show");
        });
        li.addEventListener("mouseleave", function () { prev.classList.remove("show"); });
    });

    document.querySelectorAll("[data-magnet]").forEach(function (el) {
        el.addEventListener("mousemove", function (e) {
            var r = el.getBoundingClientRect();
            el.style.transform = "translate(" + (e.clientX - r.left - r.width / 2) * 0.12 + "px," + (e.clientY - r.top - r.height / 2) * 0.3 + "px)";
        });
        el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
})();
