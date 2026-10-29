(function () {
    "use strict";
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    var $ = function (id) { return document.getElementById(id); };
    function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

    $("year").textContent = new Date().getFullYear();

    var topbar = $("top");
    var hero = $("hem");
    var rows = Array.prototype.slice.call(document.querySelectorAll(".band__row"));

    /* ── Scroll reveal, staggered within a batch ───────────────── */
    var items = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window && !reduce.matches) {
        var io = new IntersectionObserver(function (es) {
            var n = 0;
            es.forEach(function (e) {
                if (!e.isIntersecting) return;
                e.target.style.transitionDelay = (n++ * 70) + "ms";
                e.target.classList.add("in");
                io.unobserve(e.target);
            });
        }, { threshold: 0.15 });
        items.forEach(function (el) { io.observe(el); });
    } else {
        items.forEach(function (el) { el.classList.add("in"); });
    }

    /* ── Word-by-word highlight of the statement ───────────────── */
    var big = document.querySelector(".about__big");
    var words = [];
    function wrap(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (c) {
            if (c.nodeType === 3) {
                var frag = document.createDocumentFragment();
                c.textContent.split(/(\s+)/).forEach(function (part) {
                    if (!part) return;
                    if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
                    var w = document.createElement("span");
                    w.className = "w";
                    w.textContent = part;
                    words.push(w);
                    frag.appendChild(w);
                });
                node.replaceChild(frag, c);
            } else if (c.nodeType === 1) {
                wrap(c);
            }
        });
    }
    if (big && !reduce.matches) wrap(big);

    /* ── One scroll loop for everything scroll-driven ──────────── */
    var ticking = false, lastP = -1;
    function update() {
        ticking = false;
        var y = window.scrollY, vh = window.innerHeight;
        topbar.classList.toggle("scrolled", y > 8);

        var p = clamp(y / (hero.offsetHeight * 0.9), 0, 1);
        if (Math.abs(p - lastP) > 0.004) {
            lastP = p;
            hero.style.setProperty("--p", p.toFixed(3));
            if (window.KDSHero) window.KDSHero.setScroll(p);
        }

        if (!reduce.matches) {
            rows.forEach(function (row) {
                var box = row.parentNode.getBoundingClientRect();
                if (box.bottom < 0 || box.top > vh) return;
                var dir = parseFloat(row.dataset.dir) || 1;
                // 0 when the band enters the viewport, 1 when it leaves; rows always cover the full width
                var t = clamp((vh - box.top) / (vh + box.height), 0, 1);
                var room = Math.max(0, row.scrollWidth - window.innerWidth);
                row.style.transform = "translate3d(" + (-room * (dir < 0 ? t : 1 - t)) + "px,0,0)";
            });
            if (words.length) {
                var r2 = big.getBoundingClientRect();
                var prog = clamp((vh * 0.85 - r2.top) / (r2.height + vh * 0.35), 0, 1) * words.length * 1.15;
                for (var i = 0; i < words.length; i++) words[i].classList.toggle("on", prog > i);
            }
        }
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();

    /* ── Current section in the menu ───────────────────────────── */
    var links = Array.prototype.slice.call(document.querySelectorAll(".top__link"));
    if ("IntersectionObserver" in window) {
        var spy = new IntersectionObserver(function (es) {
            es.forEach(function (e) {
                if (!e.isIntersecting) return;
                links.forEach(function (a) {
                    if (a.getAttribute("href") === "#" + e.target.id) a.setAttribute("aria-current", "true");
                    else a.removeAttribute("aria-current");
                });
            });
        }, { rootMargin: "-45% 0px -50% 0px" });
        ["tjanster", "arbeten", "om"].forEach(function (id) { var el = $(id); if (el) spy.observe(el); });
    }

    /* ── Project preview that follows the pointer (desktop) ────── */
    if (!fine || reduce.matches) return;
    var prev = $("preview"), prevText = $("previewText");
    var mx = innerWidth / 2, my = innerHeight / 2, px = mx, py = my, raf = 0, on = false;
    function loop() {
        px += (mx - px) * 0.12; py += (my - py) * 0.12;
        prev.style.transform = "translate(" + (px + 30) + "px," + (py - 140) + "px) rotate(" + ((mx - px) * 0.04) + "deg)";
        raf = on ? requestAnimationFrame(loop) : 0;
    }
    window.addEventListener("mousemove", function (e) { mx = e.clientX; my = e.clientY; });
    document.querySelectorAll(".work__item").forEach(function (li) {
        li.addEventListener("mouseenter", function () {
            prev.style.background = li.dataset.bg;
            prevText.textContent = li.querySelector(".work__no").textContent;
            prev.classList.add("show");
            on = true; if (!raf) raf = requestAnimationFrame(loop);
        });
        li.addEventListener("mouseleave", function () { prev.classList.remove("show"); on = false; });
    });
})();
