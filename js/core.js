// core.js — shared utilities: random, layout manager, math-label renderer, progressive Sketch
(function () {
  const PC = (window.PC = { W: 0, H: 0, dpr: 1, u: 1 });

  PC.rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
  PC.randi = (a, b) => Math.floor(PC.rand(a, b + 1));
  PC.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  PC.clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  PC.gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 0.5;
  PC.ink = (a) => `rgba(255,247,232,${a})`;

  // shuffle bag: every item once before repeating
  PC.Bag = class {
    constructor(items) { this.items = items; this.pool = []; this.last = null; }
    next() {
      if (!this.pool.length) {
        this.pool = this.items.slice();
        for (let i = this.pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [this.pool[i], this.pool[j]] = [this.pool[j], this.pool[i]];
        }
        const n = this.pool.length;
        if (n > 1 && this.pool[n - 1] === this.last) [this.pool[0], this.pool[n - 1]] = [this.pool[n - 1], this.pool[0]];
      }
      return (this.last = this.pool.pop());
    }
  };

  // ---- layout: keeps equations and diagrams from overlapping each other
  PC.Layout = {
    rects: [],
    fading: [],
    reset() { this.rects.length = 0; this.fading.length = 0; },
    // each rect carries a backing opacity `a` so the tracks dim softly behind equations/diagrams
    update(dt) {
      for (const r of this.rects) r.a = Math.min(1, r.a + dt * 0.6);
      for (let i = this.fading.length - 1; i >= 0; i--) if ((this.fading[i].a -= dt * 0.5) <= 0) this.fading.splice(i, 1);
    },
    place(w, h, { margin = 26, pad = 24, tries = 80 } = {}) {
      const { W, H } = PC;
      if (w > W - 2 * margin || h > H - 2 * margin) return null;
      for (let i = 0; i < tries; i++) {
        const r = { x: PC.rand(margin, W - margin - w), y: PC.rand(margin, H - margin - h), w, h, a: 0 };
        const hit = this.rects.some((o) =>
          r.x < o.x + o.w + pad && r.x + r.w + pad > o.x && r.y < o.y + o.h + pad && r.y + r.h + pad > o.y);
        if (!hit) { this.rects.push(r); return r; }
      }
      return null;
    },
    release(r) {
      const i = this.rects.indexOf(r);
      if (i >= 0) { this.rects.splice(i, 1); this.fading.push(r); }
    },
  };

  // ---- math-ish labels on canvas
  // markup:  _x _{xy} subscript · ^x ^{xy} superscript · ¯x overbar · "text" upright
  const fontI = (sz) => `italic ${sz}px KaTeX_Math, "Cambria Math", "Times New Roman", serif`;
  const fontR = (sz) => `${sz}px KaTeX_Main, "Cambria Math", "Times New Roman", serif`;
  const labelCache = new Map();

  function parseLabel(str) {
    const runs = [];
    let rm = false, bar = false, i = 0;
    const push = (ch, mode) => {
      const italic = !rm && /[A-Za-zͰ-Ͽ]/.test(ch);
      const last = runs[runs.length - 1];
      if (last && last.mode === mode && last.italic === italic && !last.bar && !bar && !last.closed) last.txt += ch;
      else runs.push({ txt: ch, mode, italic, bar });
      bar = false;
    };
    while (i < str.length) {
      const c = str[i];
      if (c === '"') { rm = !rm; i++; continue; }
      if (c === '¯') { bar = true; i++; continue; }
      if (c === '_' || c === '^') {
        const mode = c === '_' ? 'sub' : 'sup';
        i++;
        let grp;
        if (str[i] === '{') { const j = str.indexOf('}', i); grp = str.slice(i + 1, j); i = j + 1; }
        else { grp = str[i]; i++; }
        for (const ch of grp) push(ch, mode);
        if (runs.length) runs[runs.length - 1].closed = true;
        continue;
      }
      push(c, 'n');
      i++;
    }
    return runs;
  }

  PC.label = function (ctx, str, x, y, size = 13, align = 'c', alpha = 1, halo = false) {
    let runs = labelCache.get(str);
    if (!runs) { runs = parseLabel(str); labelCache.set(str, runs); }
    let cx = 0, prevScript = null, scriptStart = 0;
    const pos = [];
    for (const r of runs) {
      const sz = r.mode === 'n' ? size : size * 0.68;
      ctx.font = r.italic ? fontI(sz) : fontR(sz);
      const w = ctx.measureText(r.txt).width + (r.italic ? sz * 0.04 : 0);
      let px;
      if (r.mode === 'n') { px = cx; cx += w; prevScript = null; }
      else {
        if (prevScript && prevScript !== r.mode) px = scriptStart;
        else { px = cx; scriptStart = cx; }
        cx = Math.max(cx, px + w);
        prevScript = r.mode;
      }
      pos.push({ px, w, sz });
    }
    const x0 = align === 'c' ? x - cx / 2 : align === 'r' ? x - cx : x;
    ctx.save();
    ctx.fillStyle = PC.ink(alpha);
    ctx.strokeStyle = halo ? `rgba(0,0,0,${0.85 * alpha})` : PC.ink(alpha);
    ctx.lineJoin = 'round';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    runs.forEach((r, i) => {
      const { px, w, sz } = pos[i];
      const dy = r.mode === 'sub' ? size * 0.32 : r.mode === 'sup' ? -size * 0.38 : 0;
      ctx.font = r.italic ? fontI(sz) : fontR(sz);
      if (halo) { ctx.lineWidth = Math.max(2.5, sz * 0.3); ctx.strokeText(r.txt, x0 + px, y + dy); return; }
      ctx.fillText(r.txt, x0 + px, y + dy);
      if (r.bar) {
        ctx.lineWidth = Math.max(0.7, sz * 0.06);
        ctx.beginPath();
        ctx.moveTo(x0 + px + w * 0.1, y + dy - sz * 0.42);
        ctx.lineTo(x0 + px + w * 0.95, y + dy - sz * 0.42);
        ctx.stroke();
      }
    });
    ctx.restore();
    return cx;
  };

  // ---- Sketch: a list of strokes/labels, each drawn progressively over its [t0,t1] window
  function cumLen(pts) {
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return cum;
  }

  function tracePartial(ctx, pts, f, cum) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    if (f >= 1) { for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); return; }
    const target = cum[cum.length - 1] * f;
    for (let i = 1; i < pts.length; i++) {
      if (cum[i] <= target) { ctx.lineTo(pts[i][0], pts[i][1]); continue; }
      const seg = cum[i] - cum[i - 1] || 1, t = (target - cum[i - 1]) / seg;
      ctx.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t);
      break;
    }
  }

  PC.Sketch = class {
    constructor() { this.items = []; }
    path(pts, t0, t1, o = {}) { this.items.push({ k: 'path', pts, t0, t1, lw: 1.2, a: 1, ...o }); return this; }
    dyn(fn, t0, t1, o = {}) { this.items.push({ k: 'path', fn, t0, t1, lw: 1.2, a: 1, ...o }); return this; }
    segs(src, t0, t1, o = {}) { this.items.push({ k: 'segs', src, t0, t1, lw: 1, a: 1, ...o }); return this; }
    label(str, x, y, t0, o = {}) { this.items.push({ k: 'label', str, x, y, t0, t1: t0, size: 13, align: 'c', a: 1, ...o }); return this; }
    arrow(x, y, ang, t0, size = 6) { this.items.push({ k: 'arrow', x, y, ang, t0, t1: t0, size }); return this; }
    dot(x, y, r, t0) { this.items.push({ k: 'dot', x, y, r, t0, t1: t0 }); return this; }

    // halo = true draws only a dark outline of every stroke/label: a local knockout that keeps the sketch
    // legible over bubble tracks without hiding them behind a box
    draw(ctx, p, time, alpha, halo = false) {
      const clamp = PC.clamp;
      ctx.strokeStyle = halo ? 'rgba(0,0,0,0.85)' : PC.ink(1);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const it of this.items) {
        if (p <= it.t0) continue;
        const f = it.t1 > it.t0 ? clamp((p - it.t0) / (it.t1 - it.t0)) : 1;
        const pop = clamp((p - it.t0) / 0.06);
        if (it.k === 'path') {
          const pts = it.fn ? it.fn(time) : it.pts;
          if (pts.length < 2) continue;
          ctx.save();
          if (it.clip) { ctx.beginPath(); ctx.rect(...it.clip); ctx.clip(); }
          ctx.globalAlpha = halo ? alpha : alpha * it.a;
          ctx.lineWidth = halo ? it.lw + 4.5 : it.lw;
          if (it.dash && !halo) ctx.setLineDash(it.dash);
          const cum = f >= 1 ? null : it.fn ? cumLen(pts) : (it.cum || (it.cum = cumLen(pts)));
          tracePartial(ctx, pts, f, cum);
          ctx.stroke();
          ctx.restore();
        } else if (it.k === 'segs') {
          if (halo) continue;
          const list = typeof it.src === 'function' ? it.src(time) : it.src;
          const n = Math.ceil(list.length * f);
          ctx.save();
          ctx.globalAlpha = alpha * it.a;
          ctx.lineWidth = it.lw;
          ctx.beginPath();
          for (let i = 0; i < n; i++) { ctx.moveTo(list[i][0], list[i][1]); ctx.lineTo(list[i][2], list[i][3]); }
          ctx.stroke();
          ctx.restore();
        } else if (it.k === 'label') {
          PC.label(ctx, it.str, it.x, it.y, it.size, it.align, alpha * (halo ? 1 : it.a) * pop, halo);
        } else if (it.k === 'arrow') {
          if (halo) continue;
          const s = it.size, c = Math.cos(it.ang), sn = Math.sin(it.ang);
          const tx = it.x + c * s * 0.5, ty = it.y + sn * s * 0.5;
          ctx.save();
          ctx.globalAlpha = alpha * pop;
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(tx - s * Math.cos(it.ang - 0.42), ty - s * Math.sin(it.ang - 0.42));
          ctx.lineTo(tx - s * Math.cos(it.ang + 0.42), ty - s * Math.sin(it.ang + 0.42));
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        } else if (it.k === 'dot') {
          if (halo) continue;
          ctx.save();
          ctx.globalAlpha = alpha * pop;
          ctx.beginPath();
          ctx.arc(it.x, it.y, it.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }
  };
})();
