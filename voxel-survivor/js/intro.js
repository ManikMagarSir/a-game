import { audio } from './audio.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ss = t => t * t * (3 - 2 * t);

function mulberry32(seed) {
    return function () {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

function genSkyline(seed, n, minW, maxW, minH, maxH, gap) {
    const rnd = mulberry32(seed);
    const list = [];
    let x = 0;
    for (let i = 0; i < n; i++) {
        const w = minW + rnd() * (maxW - minW);
        const h = minH + rnd() * (maxH - minH);
        const lit = [];
        if (rnd() < 0.55) {
            const cols = Math.max(1, Math.floor(w * 20));
            for (let j = 0; j < cols; j++) if (rnd() < 0.2) lit.push([j / cols, rnd() * 0.55 + 0.04, rnd()]);
        }
        list.push({ x, w, h, lit });
        x += w + gap + rnd() * gap * 1.4;
    }
    return { list, span: x, pan: 0 };
}

function drawSkyline(ctx, layer, W, baseY, now) {
    layer.pan = (layer.pan + layer.speed * 0.016) % layer.span;
    const pan = layer.pan;
    for (const b of layer.list) {
        let sx = b.x - pan;
        while (sx < 1) {
            if (sx + b.w >= 0) {
                const bx = sx * W, bw = b.w * W, bh = b.h * baseY;
                ctx.fillStyle = layer.color;
                ctx.fillRect(bx, baseY - bh, bw + 0.6, bh);
                if (b.lit) {
                    for (let k = 0; k < b.lit.length; k++) {
                        const f = b.lit[k][2];
                        const on = f > 0.55 ? 0.5 + 0.5 * Math.sin(now * 1.4 + f * 60) : 0.3;
                        if (on > 0.52) {
                            ctx.globalAlpha = (on - 0.52) * 1.1;
                            ctx.fillStyle = 'rgba(255,190,120,0.9)';
                            ctx.fillRect(bx + b.lit[k][0] * bw, baseY - bh + b.lit[k][1] * bh, Math.max(1.5, bw * 0.07), Math.max(1, bh * 0.05));
                        }
                    }
                    ctx.globalAlpha = 1;
                }
            }
            sx += layer.span;
        }
    }
}

function drawMoon(ctx, m, W, baseY, now) {
    const x = m.fx * W, y = m.fy * baseY, r = m.r * baseY;
    const g = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 3.4);
    g.addColorStop(0, m.color);
    g.addColorStop(0.2, m.color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r * 3.4, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = m.color;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    const cr = r * 0.22;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.arc(x - r * 0.28, y - r * 0.2, cr, 0, TAU);
    ctx.arc(x + r * 0.2, y + r * 0.24, cr * 0.8, 0, TAU);
    ctx.arc(x + r * 0.34, y - r * 0.3, cr * 0.55, 0, TAU);
    ctx.fill();
}

function drawGround(ctx, W, baseY, bottomY, color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, baseY, W, bottomY - baseY);
}

function drawFog(ctx, W, H, baseY, now, bands) {
    for (const f of bands) {
        const y = f.fy * baseY + Math.sin(now * 0.12 + f.fx * 20) * H * 0.008;
        const h = f.fh * H;
        const g = ctx.createLinearGradient(0, y, 0, y + h);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(0.5, f.color);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, y, W, h);
    }
}

function drawZombie(ctx, x, y, s, ph, col, eye, armsUp) {
    ctx.save();
    ctx.strokeStyle = col; ctx.fillStyle = col;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const bob = Math.sin(ph) * s * 0.05;
    const hipY = y - s * 0.6 + bob;
    const headY = y - s + bob;
    const cx = x + Math.sin(ph * 0.7) * s * 0.05;
    ctx.lineWidth = s * 0.09;
    ctx.beginPath();
    const l1 = Math.sin(ph) * s * 0.3, l2 = Math.sin(ph + Math.PI) * s * 0.3;
    ctx.moveTo(cx, hipY); ctx.lineTo(cx + l1 * 0.6, y);
    ctx.moveTo(cx, hipY); ctx.lineTo(cx - l2 * 0.6, y);
    ctx.stroke();
    ctx.lineWidth = s * 0.17;
    ctx.beginPath();
    ctx.moveTo(cx, hipY); ctx.lineTo(cx + Math.sin(ph * 0.5) * s * 0.05, headY + s * 0.18);
    ctx.stroke();
    ctx.lineWidth = s * 0.07;
    ctx.beginPath();
    if (armsUp) {
        ctx.moveTo(cx, hipY + s * 0.1); ctx.lineTo(cx - s * 0.16, hipY - s * 0.18);
        ctx.moveTo(cx, hipY + s * 0.1); ctx.lineTo(cx + s * 0.18, hipY - s * 0.16);
    } else {
        ctx.moveTo(cx, hipY + s * 0.1); ctx.lineTo(cx + s * 0.26, hipY - s * 0.04);
        ctx.moveTo(cx, hipY + s * 0.12); ctx.lineTo(cx + s * 0.24, hipY + s * 0.14);
    }
    ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + Math.sin(ph * 0.5) * s * 0.04, headY, s * 0.115, 0, TAU); ctx.fill();
    if (eye) {
        ctx.fillStyle = 'rgba(255,70,60,0.95)';
        ctx.beginPath();
        ctx.arc(cx + s * 0.02, headY - s * 0.01, s * 0.022, 0, TAU);
        ctx.arc(cx + s * 0.1, headY - s * 0.01, s * 0.022, 0, TAU);
        ctx.fill();
    }
    ctx.restore();
}

function drawSurvivor(ctx, x, y, s, ph, col) {
    ctx.save();
    ctx.strokeStyle = col; ctx.fillStyle = col;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const bob = Math.sin(ph) * s * 0.02;
    const hipY = y - s * 0.56 + bob;
    const headY = y - s + bob;
    ctx.lineWidth = s * 0.09;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.05, hipY); ctx.lineTo(x - s * 0.09, y);
    ctx.moveTo(x + s * 0.05, hipY); ctx.lineTo(x + s * 0.11, y);
    ctx.stroke();
    ctx.lineWidth = s * 0.2;
    ctx.beginPath(); ctx.moveTo(x, hipY); ctx.lineTo(x, hipY - s * 0.3); ctx.stroke();
    ctx.lineWidth = s * 0.14;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.02, hipY - s * 0.16); ctx.lineTo(x - s * 0.1, hipY - s * 0.02); ctx.stroke();
    ctx.lineWidth = s * 0.07;
    ctx.beginPath();
    ctx.moveTo(x, hipY - s * 0.26); ctx.lineTo(x + s * 0.3, hipY - s * 0.18);
    ctx.moveTo(x + s * 0.3, hipY - s * 0.18); ctx.lineTo(x + s * 0.42, hipY - s * 0.13);
    ctx.moveTo(x, hipY - s * 0.26); ctx.lineTo(x + s * 0.28, hipY - s * 0.06);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(x, headY, s * 0.085, 0, TAU); ctx.fill();
    ctx.restore();
}

function genHorde(rnd, n, fy0, fy1, s0, s1, eyeChance, armsUpChance) {
    const out = [];
    for (let i = 0; i < n; i++) {
        out.push({
            fx: rnd() * 1.3 - 0.15,
            fy: fy0 + rnd() * (fy1 - fy0),
            s: s0 + rnd() * (s1 - s0),
            ph: rnd() * TAU,
            eye: rnd() < eyeChance,
            armsUp: rnd() < armsUpChance,
        });
    }
    return out.sort((a, b) => a.fy - b.fy);
}

function drawHorde(ctx, arr, t, now, W, H, baseY, bottomY, col, advance) {
    for (let i = 0; i < arr.length; i++) {
        const z = arr[i];
        const footY = baseY + z.fy * (bottomY - baseY);
        const s = z.s * (0.3 + z.fy * 0.9) * H * (1 + t * 0.18);
        const ph = now * 2.2 + z.ph;
        const x = (z.fx + t * advance) * W;
        drawZombie(ctx, x, footY, s, ph, col, z.eye, z.armsUp);
    }
}

function genRain(n) {    const rnd = mulberry32(99);
    const out = [];
    for (let i = 0; i < n; i++) out.push({ x: rnd(), y: rnd(), sp: 0.5 + rnd() * 0.9, len: 0.02 + rnd() * 0.03 });
    return out;
}

function genEmbers(n) {
    const rnd = mulberry32(7);
    const out = [];
    for (let i = 0; i < n; i++) out.push({ x: rnd(), y: rnd(), v: 0.03 + rnd() * 0.05, ph: rnd() * TAU });
    return out;
}

const S = (() => {
    const rnd = mulberry32(42);
    const stars = [];
    for (let i = 0; i < 130; i++) stars.push({ fx: rnd(), fy: rnd() * 0.9, r: rnd() * 1.1 + 0.4, tw: rnd() * TAU });
    const ch1 = {
        layers: [
            { ...genSkyline(11, 14, 0.05, 0.11, 0.16, 0.38, 0.02), speed: 0.02, color: '#0a1220' },
            { ...genSkyline(22, 10, 0.07, 0.14, 0.28, 0.5, 0.04), speed: 0.035, color: '#080d18' },
            { ...genSkyline(33, 7, 0.1, 0.18, 0.45, 0.72, 0.06), speed: 0.05, color: '#050910' },
        ],
        moon: { fx: 0.72, fy: 0.3, r: 0.075, color: '#e8f2ff' },
        fog: [
            { fx: 0.2, fy: 0.72, fh: 0.16, color: 'rgba(90,140,190,0.07)' },
            { fx: 0.7, fy: 0.8, fh: 0.2, color: 'rgba(60,110,170,0.06)' },
            { fx: 0.45, fy: 0.9, fh: 0.18, color: 'rgba(40,80,140,0.09)' },
        ],
        ground: '#04060c',
    };
    const ch2 = {
        layers: [
            { ...genSkyline(111, 14, 0.05, 0.11, 0.16, 0.38, 0.02), speed: 0.03, color: '#17090c' },
            { ...genSkyline(222, 10, 0.07, 0.14, 0.28, 0.5, 0.04), speed: 0.045, color: '#110609' },
            { ...genSkyline(333, 7, 0.1, 0.18, 0.45, 0.72, 0.06), speed: 0.06, color: '#0a0407' },
        ],
        moon: { fx: 0.7, fy: 0.3, r: 0.095, color: '#ff6a52' },
        fog: [
            { fx: 0.3, fy: 0.72, fh: 0.16, color: 'rgba(120,40,40,0.08)' },
            { fx: 0.6, fy: 0.84, fh: 0.2, color: 'rgba(90,30,30,0.1)' },
            { fx: 0.4, fy: 0.93, fh: 0.16, color: 'rgba(70,20,20,0.12)' },
        ],
        ground: '#070309',
        fires: [
            { fx: 0.14, ph: 0.3 }, { fx: 0.31, ph: 1.7 }, { fx: 0.63, ph: 3.1 }, { fx: 0.88, ph: 4.6 }, { fx: 0.5, ph: 5.8 },
        ],
        smoke: [
            { fx: 0.2, h: 0.5 }, { fx: 0.42, h: 0.62 }, { fx: 0.68, h: 0.46 }, { fx: 0.85, h: 0.58 },
        ],
        horde: genHorde(rnd, 46, 0.05, 0.95, 0.045, 0.1, 0.85, 0.25),
    };
    const ch3 = {
        layers: [
            { ...genSkyline(444, 12, 0.06, 0.12, 0.14, 0.32, 0.02), speed: 0.015, color: '#06080e' },
            { ...genSkyline(555, 8, 0.08, 0.15, 0.22, 0.44, 0.04), speed: 0.03, color: '#04060b' },
        ],
        moon: { fx: 0.82, fy: 0.26, r: 0.06, color: '#c9d6ee' },
        fog: [
            { fx: 0.5, fy: 0.86, fh: 0.22, color: 'rgba(70,110,170,0.08)' },
            { fx: 0.25, fy: 0.92, fh: 0.18, color: 'rgba(50,90,150,0.1)' },
        ],
        ground: '#03050a',
        rain: genRain(140),
        horde: genHorde(rnd, 30, 0.02, 0.7, 0.05, 0.12, 0.9, 0.9),
        fence: [],
    };
    for (let fx = -0.05; fx < 1.1; fx += 0.055) {
        ch3.fence.push({ fx, h: 0.09 + rnd() * 0.05, h2: 0.05 + rnd() * 0.03 });
    }
    const ch4 = {
        horde: genHorde(rnd, 34, 0.02, 0.9, 0.025, 0.05, 0.5, 0.2),
        embers: genEmbers(64),
    };
    return { stars, ch1, ch2, ch3, ch4 };
})();

const CH = [
    {
        key: 'DAY 214',
        kicker: 'CHAPTER I — THE FALL',
        sub: 'The city fell silent weeks ago.',
        dur: 1.6,
        draw(t, ctx, W, H, baseY, bottomY, now, dt) {
            const c = S.ch1;
            drawSkyline(ctx, c.layers[0], W, baseY, now);
            drawSkyline(ctx, c.layers[1], W, baseY, now);
            drawSkyline(ctx, c.layers[2], W, baseY, now);
            drawGround(ctx, W, baseY, bottomY, c.ground);
            drawFog(ctx, W, H, baseY, now, c.fog);
        },
    },
    {
        key: 'THE OUTBREAK',
        kicker: 'CHAPTER II — THE OUTBREAK',
        sub: 'No cure. No evacuation.',
        dur: 1.7,
        draw(t, ctx, W, H, baseY, bottomY, now, dt) {
            const c = S.ch2;
            const sh = Math.sin(now * 2.3) * 2;
            ctx.save();
            ctx.translate(sh, Math.cos(now * 2.7) * 1.2);
            drawSkyline(ctx, c.layers[0], W, baseY, now);
            drawSkyline(ctx, c.layers[1], W, baseY, now);
            drawSkyline(ctx, c.layers[2], W, baseY, now);
            for (const sm of c.smoke) {
                const bx = sm.fx * W, by = baseY - sm.h * baseY;
                for (let i = 0; i < 5; i++) {
                    const pr = (i + t * 4 + now * 0.15) % 5;
                    const r = (8 + pr * 26) * (H / 720);
                    const alpha = Math.max(0, 0.16 - pr * 0.03) * 0.7;
                    ctx.fillStyle = 'rgba(40,30,34,1)';
                    ctx.globalAlpha = alpha;
                    ctx.beginPath(); ctx.arc(bx + pr * 6, by - pr * 34, r, 0, TAU); ctx.fill();
                }
            }
            ctx.globalAlpha = 1;
            drawGround(ctx, W, baseY, bottomY, c.ground);
            drawHorde(ctx, c.horde, t, now, W, H, baseY, bottomY, '#0b050a', 0.2);
            for (const f of c.fires) {
                const fx = f.fx * W, fy = bottomY - H * 0.01;
                const fl = 0.55 + 0.45 * Math.sin(now * 6 + f.ph);
                const r = (0.02 + 0.035 * fl) * H;
                const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, r);
                g.addColorStop(0, 'rgba(255,150,60,0.8)');
                g.addColorStop(0.35, 'rgba(255,90,40,0.35)');
                g.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.globalAlpha = 0.5 + fl * 0.4;
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(fx, fy, r, 0, TAU); ctx.fill();
            }
            ctx.globalAlpha = 1;
            drawFog(ctx, W, H, baseY, now, c.fog);
            ctx.restore();
        },
    },
    {
        key: 'THE BARRICADE',
        kicker: 'CHAPTER III — THE BARRICADE',
        sub: 'The beacon keeps the dark back.',
        dur: 1.7,
        draw(t, ctx, W, H, baseY, bottomY, now, dt) {
            const c = S.ch3;
            drawSkyline(ctx, c.layers[0], W, baseY, now);
            drawSkyline(ctx, c.layers[1], W, baseY, now);
            drawGround(ctx, W, baseY, bottomY, c.ground);
            drawHorde(ctx, c.horde, t, now, W, H, baseY, bottomY, '#0d0f16', 0.05);
            drawFog(ctx, W, H, baseY, now, c.fog);
            const tx = 0.82 * W, ty = baseY - 0.34 * H;
            const ang = -0.5 + Math.sin(now * 0.6 + 1.3) * 0.45;
            ctx.save();
            ctx.translate(tx, ty);
            ctx.rotate(ang);
            const R = H * 1.7;
            const g = ctx.createLinearGradient(0, 0, R, 0);
            g.addColorStop(0, 'rgba(200,235,255,0.5)');
            g.addColorStop(1, 'rgba(200,235,255,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(R, -R * 0.24);
            ctx.lineTo(R, R * 0.24);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            ctx.fillStyle = '#0a0d13';
            ctx.fillRect(tx - 5, ty, 10, baseY + H * 0.15 - ty);
            const hg = ctx.createRadialGradient(tx, ty, 0, tx, ty, H * 0.1);
            hg.addColorStop(0, 'rgba(220,245,255,0.95)');
            hg.addColorStop(0.25, 'rgba(180,220,255,0.4)');
            hg.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = hg;
            ctx.beginPath(); ctx.arc(tx, ty, H * 0.1, 0, TAU); ctx.fill();
            for (const p of c.fence) {
                const fx = p.fx * W, h = p.h * H;
                const fx2 = (p.fx + 0.055) * W;
                ctx.strokeStyle = '#0e1219';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(fx, bottomY); ctx.lineTo(fx, bottomY - h); ctx.stroke();
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(fx, bottomY - h * 0.55); ctx.lineTo(fx2, bottomY - p.h2 * H);
                ctx.moveTo(fx, bottomY - h); ctx.lineTo(fx2, bottomY - p.h2 * H);
                ctx.stroke();
                ctx.strokeStyle = '#1b2230';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(fx, bottomY - h);
                for (let k = 0; k < 5; k++) {
                    const zx = fx + (fx2 - fx) * (k / 5 + 0.05);
                    ctx.lineTo(zx + (k % 2 ? 3 : -3), bottomY - h - (k % 2 ? 4 : -4));
                }
                ctx.stroke();
            }
            ctx.globalAlpha = 0.75;
            for (const d of c.rain) {
                const x = (d.x * W + now * 40 * d.sp) % (W + 30) - 15;
                const y = (d.y * H + now * 420 * d.sp) % (H + 40) - 20;
                ctx.strokeStyle = 'rgba(150,180,210,0.22)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x - 3, y + d.len * H);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        },
    },
    {
        key: 'LAST SURVIVOR',
        kicker: 'LAST SURVIVOR STANDING',
        sub: 'Hold the line. Survive the night.',
        dur: 1.9,
        draw(t, ctx, W, H, baseY, bottomY, now, dt) {
            const c = S.ch4;
            const vg = ctx.createLinearGradient(0, 0, 0, H);
            vg.addColorStop(0, '#050409');
            vg.addColorStop(0.5, '#09060d');
            vg.addColorStop(1, '#0d0808');
            ctx.fillStyle = vg;
            ctx.fillRect(0, 0, W, H);
            const gr = ctx.createRadialGradient(W * 1.05, baseY * 0.9, 0, W * 1.05, baseY * 0.9, H * 0.8);
            gr.addColorStop(0, 'rgba(255,80,50,0.32)');
            gr.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = gr;
            ctx.fillRect(0, 0, W, H);
            drawHorde(ctx, c.horde, t, now, W, H, baseY, bottomY, '#0a0406', 0);
            for (const e of c.embers) {
                const y = (H - (e.y * H + now * e.v * 60)) % H;
                const x = e.x * W + Math.sin(now * 2 + e.ph) * 14;
                const a = 0.25 + 0.3 * Math.sin(now * 5 + e.ph);
                ctx.fillStyle = 'rgba(255,120,60,1)';
                ctx.globalAlpha = Math.max(0, a);
                ctx.beginPath(); ctx.arc(x, y, 1.6 + Math.sin(e.ph) * 0.8, 0, TAU); ctx.fill();
            }
            ctx.globalAlpha = 1;
            const sxp = W * 0.5;
            const syp = bottomY * 0.82;
            const sp = H * 0.34;
            const glow = ctx.createRadialGradient(sxp + sp * 0.4, syp - sp * 0.5, sp * 0.1, sxp + sp * 0.4, syp - sp * 0.5, sp * 0.5);
            glow.addColorStop(0, 'rgba(255,180,120,0.25)');
            glow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = glow;
            ctx.beginPath(); ctx.arc(sxp + sp * 0.4, syp - sp * 0.5, sp * 0.5, 0, TAU); ctx.fill();
            drawSurvivor(ctx, sxp, syp, sp, now * 1.1, '#10141c');
            const a = ss(clamp((t - 0.28) / 0.2, 0, 1));
            const size = Math.min(W, H) * 0.088;
            const pulse = 0.6 + 0.4 * Math.sin(now * 4);
            const tg = ctx.createRadialGradient(W * 0.5, H * 0.34, size * 0.1, W * 0.5, H * 0.34, size * 2.6 * pulse);
            tg.addColorStop(0, 'rgba(77,231,255,' + (0.3 * a).toFixed(3) + ')');
            tg.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = tg;
            ctx.beginPath(); ctx.arc(W * 0.5, H * 0.34, size * 2.6 * pulse, 0, TAU); ctx.fill();
            ctx.save();
            ctx.translate(W * 0.5, H * 0.34);
            ctx.scale(1.08 - a * 0.08, 1.08 - a * 0.08);
            ctx.globalAlpha = a;
            ctx.textAlign = 'center';
            ctx.font = '900 ' + size + 'px Orbitron, "Arial Black", sans-serif';
            ctx.shadowColor = 'rgba(77,231,255,0.9)';
            ctx.shadowBlur = 34;
            ctx.fillStyle = '#fff';
            ctx.fillText('V O X E L   S U R V I V O R', 0, 0);
            ctx.shadowBlur = 0;
            ctx.font = '600 ' + size * 0.18 + 'px Orbitron, "Arial Black", sans-serif';
            ctx.fillStyle = 'rgba(77,231,255,1)';
            ctx.fillText('L A S T   S U R V I V O R   S T A N D I N G', 0, size * 0.34);
            ctx.restore();
            if (t > 0.9) {
                ctx.fillStyle = 'rgba(0,0,0,' + ((t - 0.9) / 0.1) + ')';
                ctx.fillRect(0, 0, W, H);
            }
        },
    },
];

export function playIntro(onDone) {
    const root = document.getElementById('intro');
    if (!root) { if (onDone) onDone(); return; }
    root.classList.remove('hidden');
    let cv = document.getElementById('introCanvas');
    if (!cv) {
        cv = document.createElement('canvas');
        cv.id = 'introCanvas';
        root.insertBefore(cv, root.firstChild);
    }
    const ctx = cv.getContext('2d');
    const kEl = document.getElementById('introKicker');
    const cEl = document.getElementById('introChap');
    const sEl = document.getElementById('introSub');
    const pEl = document.getElementById('introProgress');
    const skip = document.getElementById('introSkip');

    let idx = 0;
    let elapsed = 0;
    let cutFlash = 0;
    let typeStart = -1;
    let last = performance.now();
    let raf = null;
    let running = true;

    function showChap() {
        const c = CH[idx];
        kEl.textContent = c.kicker;
        cEl.textContent = c.key;
        cEl.style.animation = 'none';
        void cEl.offsetWidth;
        cEl.style.animation = 'introChapIn .5s ease forwards';
        sEl.textContent = '';
        sEl.style.opacity = '1';
        typeStart = -1;
        audio.groan(90, 130);
        if (idx === 0) audio.whoosh();
        else if (idx === 1) { audio.explosion(); setTimeout(() => audio.groan(60, 90), 200); }
        else if (idx === 2) audio.thud();
        else audio.whoosh();
    }
    function finish() {
        if (!running) return;
        running = false;
        if (raf) cancelAnimationFrame(raf);
        removeEventListener('keydown', onKey);
        root.removeEventListener('click', onClk);
        root.classList.add('hidden');
        if (onDone) onDone();
    }
    function next() {
        if (!running) return;
        if (idx < CH.length - 1) { idx++; elapsed = 0; cutFlash = 0.2; showChap(); }
        else finish();
    }

    const onKey = e => {
        if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); next(); }
        else if (e.code === 'Escape') finish();
    };
    const onClk = () => next();
    skip.onclick = finish;
    addEventListener('keydown', onKey);
    root.addEventListener('click', onClk);

    function frame(ms) {
        if (!running) return;
        raf = requestAnimationFrame(frame);
        const dt = Math.min(0.05, (ms - last) / 1000);
        last = ms;
        const cw = root.clientWidth, ch = root.clientHeight;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        if (cv.width !== Math.floor(cw * dpr) || cv.height !== Math.floor(ch * dpr)) {
            cv.width = Math.floor(cw * dpr);
            cv.height = Math.floor(ch * dpr);
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const W = cw, H = ch;
        if (cutFlash > 0) {
            const zs = 1 + cutFlash * 0.05;
            ctx.translate(W / 2, H / 2);
            ctx.scale(zs, zs);
            ctx.translate(-W / 2, -H / 2);
        }
        const baseY = H * 0.15 + H * 0.7 * 0.78;
        const bottomY = H * 0.85;

        const chap = CH[idx];
        const t = clamp(elapsed / chap.dur, 0, 1);
        elapsed += dt;

        ctx.fillStyle = '#020408';
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
        for (const st of S.stars) {
            const tw = 0.4 + 0.6 * Math.abs(Math.sin(ms * 0.001 * 2 + st.tw));
            ctx.fillStyle = 'rgba(210,225,245,' + (tw * 0.8) + ')';
            ctx.fillRect(st.fx * W, st.fy * baseY, st.r, st.r);
        }
        ctx.globalAlpha = 1;
        const moon = idx === 1 ? S.ch2.moon : idx === 2 ? S.ch3.moon : S.ch1.moon;
        if (idx < 3) drawMoon(ctx, moon, W, baseY, ms * 0.001);
        chap.draw(t, ctx, W, H, baseY, bottomY, ms * 0.001, dt);

        const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.8);
        vg.addColorStop(0, 'rgba(0,0,0,0)');
        vg.addColorStop(1, 'rgba(0,0,0,0.6)');
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.05) + ')';
        const grain = Math.floor(W * H / 5200);
        for (let i = 0; i < grain; i++) {
            ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
        }
        if (cutFlash > 0) {
            cutFlash -= dt;
            ctx.fillStyle = 'rgba(255,255,255,' + clamp(cutFlash * 1.1, 0, 0.22) + ')';
            ctx.fillRect(0, 0, W, H);
        }

        if (typeStart < 0 && elapsed > 0.3) typeStart = ms;
        if (typeStart >= 0) {
            const n = Math.floor(((ms - typeStart) / 850) * chap.sub.length);
            const txt = chap.sub.slice(0, n);
            if (sEl.textContent !== txt) sEl.textContent = txt;
        }
        pEl.style.width = clamp(elapsed / chap.dur * 100, 0, 100) + '%';
        if (elapsed >= chap.dur) next();
    }

    showChap();
    raf = requestAnimationFrame(frame);
}
