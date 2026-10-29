/*
 * Procedural sculpture: a twisting ribbon knot made of fine strands that
 * dissolves into dust at both ends. Drawn to an offscreen canvas with a
 * transparent background; the liquid-particle hero samples its pixels.
 * Seeded, so it looks the same on every load.
 */
(function () {
    "use strict";

    function rng(seed) {
        var s = seed >>> 0;
        return function () {
            s = (s + 0x6D2B79F5) >>> 0;
            var t = s;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    function smooth(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

    // dark umber -> grey -> sand -> pale silver
    var STOPS = [[0, 74, 68, 61], [0.35, 140, 135, 128], [0.62, 203, 185, 157], [1, 243, 236, 224]];
    function tone(v) {
        v = Math.min(1, Math.max(0, v));
        for (var i = 1; i < STOPS.length; i++) {
            if (v <= STOPS[i][0]) {
                var a = STOPS[i - 1], b = STOPS[i], k = (v - a[0]) / (b[0] - a[0]);
                return [a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k, a[3] + (b[3] - a[3]) * k];
            }
        }
        return [243, 236, 224];
    }

    var TAU = Math.PI * 2;
    var tick = function () {
        return new Promise(function (res) { setTimeout(res, 0); });
    };

    /* async + time-sliced: generation never holds the main thread for long */
    async function make(W, H, q) {
        q = q || 1;
        var c = document.createElement("canvas");
        c.width = W; c.height = H;
        var ctx = c.getContext("2d");
        var r = rng(11);
        var unit = Math.min(W / 2400, H / 960 * (W / H > 1.6 ? 1 : 1.4));
        var STR = Math.round(300 * q), SEG = 300, TAU = Math.PI * 2;
        var sx = W * 0.355 / 2.7, sy = H * 0.31 / 3.1;
        var rot = -0.1, cr = Math.cos(rot), sr = Math.sin(rot);

        function P(t) {
            var x = Math.sin(t) + 2 * Math.sin(2 * t);
            var y = Math.cos(t) - 2 * Math.cos(2 * t);
            var X = x * sx, Y = y * sy;
            return { x: W / 2 + X * cr - Y * sr, y: H / 2 + X * sr + Y * cr, z: -Math.sin(3 * t) };
        }

        var layers = [];
        for (var L = 0; L < 18; L++) layers.push([]);
        var dust = [];
        var hw = W / 2;

        for (var s = 0; s < STR; s++) {
            if (s % 10 === 9) await tick();
            var o = (r() * 2 - 1);
            var jit = (r() - 0.5) * 0.1;
            var wph = r() * 0.5;
            var sAlpha = 0.5 + 0.4 * r();
            var sWidth = 1.0 + r() * 1.2;
            var prev = null;
            for (var i = 0; i <= SEG; i++) {
                var t = (i / SEG) * TAU;
                var p = P(t), q = P(t + 0.004);
                var tx = q.x - p.x, ty = q.y - p.y, tl = Math.hypot(tx, ty) || 1;
                var nx = -ty / tl, ny = tx / tl;
                var th = 3 * t + 0.8 * Math.sin(2 * t) + wph;
                var width = H * 0.062 * (0.55 + 0.45 * Math.sin(2 * t + 1.1)) + H * 0.012;
                var off = o * width + Math.sin(5 * t + wph * 9) * H * 0.012 * (0.4 + Math.abs(o));
                var px = p.x + nx * off * Math.cos(th);
                var py = p.y + ny * off * Math.cos(th);
                var depth = p.z * 0.9 + o * Math.sin(th) * 0.7;
                var cur = { x: px, y: py, d: depth, th: th };
                if (prev) {
                    var xn = Math.abs((px - W / 2) / hw);
                    var drop = smooth(0.5, 0.98, xn);
                    if (r() > drop * 0.92 + 0.0) {
                        var v = 0.5 + 0.38 * Math.cos(th + o * 0.7) + 0.16 * (p.z) + jit;
                        var col = tone(v);
                        var li = Math.min(17, Math.max(0, Math.floor((depth * 0.5 + 0.5) * 18)));
                        layers[li].push(prev.x, prev.y, px, py, col[0] | 0, col[1] | 0, col[2] | 0, sAlpha, sWidth);
                    } else if (r() < 0.55) {
                        dust.push(px, py, xn, v === undefined ? 0.5 : (0.5 + 0.38 * Math.cos(th)));
                    }
                }
                prev = cur;
            }
        }

        ctx.lineCap = "round";
        for (var l = 0; l < layers.length; l++) {
            var a = layers[l];
            for (var k = 0; k < a.length; k += 9) {
                if (k % 4500 === 0 && k) await tick();
                ctx.strokeStyle = "rgba(" + a[k + 4] + "," + a[k + 5] + "," + a[k + 6] + "," + a[k + 7].toFixed(2) + ")";
                ctx.lineWidth = a[k + 8] * unit * 1.1;
                ctx.beginPath();
                ctx.moveTo(a[k], a[k + 1]);
                ctx.lineTo(a[k + 2], a[k + 3]);
                ctx.stroke();
            }
        }

        // dust: scattered from dropped strand segments, widening toward the ends
        function dot(x, y, vv, rr) {
            var col = tone(vv);
            ctx.fillStyle = "rgba(" + (col[0] | 0) + "," + (col[1] | 0) + "," + (col[2] | 0) + "," + (0.5 + r() * 0.45).toFixed(2) + ")";
            ctx.beginPath();
            ctx.arc(x, y, rr, 0, TAU);
            ctx.fill();
        }
        await tick();
        for (var d = 0; d < dust.length; d += 4) {
            if (d % 4000 === 0 && d) await tick();
            var sp = H * 0.02 * (0.5 + 3 * dust[d + 2] * dust[d + 2]);
            dot(dust[d] + (r() + r() + r() - 1.5) * sp * 2, dust[d + 1] + (r() + r() + r() - 1.5) * sp * 2,
                dust[d + 3] + (r() - 0.5) * 0.3, (0.7 + r() * r() * 2.6) * unit * 1.2);
        }
        // fine haze of grains along the whole form
        await tick();
        for (var g = 0; g < 7000 * q; g++) {
            if (g % 2000 === 0 && g) await tick();
            var pp = P(r() * TAU);
            var xn2 = Math.abs((pp.x - W / 2) / hw);
            var sp2 = H * 0.03 * (0.4 + 2.5 * xn2);
            dot(pp.x + (r() + r() - 1) * sp2 * 2, pp.y + (r() + r() - 1) * sp2 * 2, 0.35 + r() * 0.5, (0.6 + r() * r() * 1.8) * unit * 1.1);
        }
        return c;
    }


    /* The company name as the sculpture: letters with a fibrous thread texture and dust along the edges */
    async function name(W, H, q, mobile) {
        q = q || 1;
        var c = document.createElement("canvas");
        c.width = W; c.height = H;
        var ctx = c.getContext("2d");
        var r = rng(23);
        var unit = Math.min(W / 2400, H / 900);
        var lines = mobile ? ["Kaplan", "Digital", "Solutions"] : ["Kaplan Digital", "Solutions"];
        var SANS = function (z) { return "500 " + z + 'px Geist, "Helvetica Neue", Arial, sans-serif'; };
        var SERIF = function (z) { return "italic 400 " + z + 'px "Instrument Serif", Georgia, serif'; };
        var fontOf = function (i, z) { return i === lines.length - 1 ? SERIF(z) : SANS(z); };
        function setFont(i, z) {
            ctx.font = fontOf(i, z);
            if ("letterSpacing" in ctx) ctx.letterSpacing = (i === lines.length - 1 ? -0.02 : -0.04) * z + "px";
        }
        function widthAt(i, z) { setFont(i, z); return ctx.measureText(lines[i]).width; }

        // size every line so the block fits the canvas; the serif line is set a touch larger (smaller x-height)
        var maxW = W * (mobile ? 0.84 : 0.8), size = [], i, z;
        for (i = 0; i < lines.length; i++) {
            z = 200; size.push(z * maxW / widthAt(i, z));
        }
        if (mobile) {
            var m = Math.min.apply(null, size);
            size = size.map(function (v, k) { return k === lines.length - 1 ? Math.min(v, m * 1.1) : m; });
        } else {
            size[0] = Math.min(size[0], H * 0.5);
            size[1] = Math.min(size[1], size[0] * 1.14);
        }
        var lead = mobile ? 0.98 : 0.92, base = [], y = 0;
        // never let the block exceed the canvas: scale everything down together if needed
        var est = size[0] * 0.72 + lead * size.slice(1).reduce(function (a, b) { return a + b; }, 0) + size[size.length - 1] * 0.2;
        var fit = Math.min(1, H * 0.8 / est);
        size = size.map(function (v) { return v * fit; });
        for (i = 0; i < lines.length; i++) { y += i ? size[i] * lead : size[0] * 0.72; base.push(y); }
        var blockH = base[base.length - 1] + size[size.length - 1] * 0.2 - 0;
        var shift = (H - blockH) / 2;

        function drawText(fill) {
            ctx.textAlign = "center";
            ctx.textBaseline = "alphabetic";
            ctx.fillStyle = fill;
            for (var k = 0; k < lines.length; k++) { setFont(k, size[k]); ctx.fillText(lines[k], W / 2, base[k] + shift); }
        }

        // 1) solid letters, a dark warm gradient for legibility
        var g = ctx.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, "#1b1917"); g.addColorStop(0.55, "#2c2824"); g.addColorStop(1, "#4a4239");
        drawText(g);
        var top = shift, bottom = shift + blockH;

        // 2) fibres, clipped to the letters
        ctx.globalCompositeOperation = "source-atop";
        ctx.lineCap = "round";
        var N = Math.round(1100 * q);
        for (var f = 0; f < N; f++) {
            if (f % 250 === 249) await tick();
            var x0 = r() * W * 1.1 - W * 0.05, y0 = top + r() * (bottom - top);
            var len = (180 + r() * 620) * unit, wob = (r() - 0.5) * 40 * unit;
            var light = r() < 0.7;
            var col = light ? tone(0.45 + r() * 0.55) : tone(0.05 + r() * 0.2);
            ctx.strokeStyle = "rgba(" + (col[0] | 0) + "," + (col[1] | 0) + "," + (col[2] | 0) + "," + (light ? 0.14 + r() * 0.22 : 0.25 + r() * 0.3).toFixed(2) + ")";
            ctx.lineWidth = (0.7 + r() * 1.3) * unit;
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.bezierCurveTo(x0 + len * 0.33, y0 + wob, x0 + len * 0.66, y0 - wob, x0 + len, y0 + wob * 0.4);
            ctx.stroke();
        }
        ctx.globalCompositeOperation = "source-over";

        // 3) dust scattered from the letter edges
        await tick();
        var qw = Math.round(W / 4), qh = Math.round(H / 4);
        var mc = document.createElement("canvas");
        mc.width = qw; mc.height = qh;
        var mctx = mc.getContext("2d", { willReadFrequently: true });
        mctx.drawImage(c, 0, 0, qw, qh);
        var d = mctx.getImageData(0, 0, qw, qh).data, edge = [];
        function a(px, py) { return px < 0 || py < 0 || px >= qw || py >= qh ? 0 : d[(py * qw + px) * 4 + 3]; }
        for (var yy = 0; yy < qh; yy++) {
            for (var xx = 0; xx < qw; xx++) {
                if (a(xx, yy) > 128 && (a(xx - 1, yy) < 100 || a(xx + 1, yy) < 100 || a(xx, yy - 1) < 100 || a(xx, yy + 1) < 100)) edge.push(xx, yy);
            }
        }
        var M = Math.round(6500 * q), pairs = edge.length / 2;
        if (pairs) {
            for (var k = 0; k < M; k++) {
                if (k % 2500 === 2499) await tick();
                var e = ((r() * pairs) | 0) * 2;
                var spread = (6 + r() * r() * 70) * unit;
                var px2 = edge[e] * 4 + (r() + r() + r() - 1.5) * spread * 1.4;
                var py2 = edge[e + 1] * 4 + (r() + r() + r() - 1.5) * spread * 1.4;
                var cc = r() < 0.75 ? tone(0.04 + r() * 0.35) : tone(0.5 + r() * 0.4);
                ctx.fillStyle = "rgba(" + (cc[0] | 0) + "," + (cc[1] | 0) + "," + (cc[2] | 0) + "," + (0.35 + r() * 0.5).toFixed(2) + ")";
                ctx.beginPath();
                ctx.arc(px2, py2, (0.6 + r() * r() * 2.2) * unit * 1.15, 0, TAU);
                ctx.fill();
            }
        }
        return c;
    }

    window.KDSSculpture = { make: make, name: name };
})();
