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

    function make(W, H) {
        var c = document.createElement("canvas");
        c.width = W; c.height = H;
        var ctx = c.getContext("2d");
        var r = rng(11);
        var unit = Math.min(W / 2400, H / 960 * (W / H > 1.6 ? 1 : 1.4));
        var STR = 300, SEG = 300, TAU = Math.PI * 2;
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
            var o = (r() * 2 - 1);
            var jit = (r() - 0.5) * 0.14;
            var wph = r() * 0.5;
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
                        layers[li].push(prev.x, prev.y, px, py, col[0] | 0, col[1] | 0, col[2] | 0, 0.55 + 0.4 * r());
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
            for (var k = 0; k < a.length; k += 8) {
                ctx.strokeStyle = "rgba(" + a[k + 4] + "," + a[k + 5] + "," + a[k + 6] + "," + a[k + 7].toFixed(2) + ")";
                ctx.lineWidth = (1.0 + r() * 1.2) * unit * 1.1;
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
        for (var d = 0; d < dust.length; d += 4) {
            var sp = H * 0.02 * (0.5 + 3 * dust[d + 2] * dust[d + 2]);
            dot(dust[d] + (r() + r() + r() - 1.5) * sp * 2, dust[d + 1] + (r() + r() + r() - 1.5) * sp * 2,
                dust[d + 3] + (r() - 0.5) * 0.3, (0.7 + r() * r() * 2.6) * unit * 1.2);
        }
        // fine haze of grains along the whole form
        for (var g = 0; g < 7000; g++) {
            var pp = P(r() * TAU);
            var xn2 = Math.abs((pp.x - W / 2) / hw);
            var sp2 = H * 0.03 * (0.4 + 2.5 * xn2);
            dot(pp.x + (r() + r() - 1) * sp2 * 2, pp.y + (r() + r() - 1) * sp2 * 2, 0.35 + r() * 0.5, (0.6 + r() * r() * 1.8) * unit * 1.1);
        }
        return c;
    }

    window.KDSSculpture = { make: make };
})();
