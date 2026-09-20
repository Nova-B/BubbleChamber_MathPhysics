// widgets.js — physics diagrams and plots, each sketched in progressively and then kept alive
// Every widget is authored in a small "design space" (w × h) and scaled when placed.
(function () {
  const { Sketch, rand, randi, pick, clamp, label, ink } = PC;
  const PI = Math.PI, TAU = PI * 2;

  // ---------- geometry helpers
  function wavy(a, b, nw, amp = 4.5) {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, N = nw * 16, pts = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, o = amp * Math.sin(TAU * nw * t);
      pts.push([a[0] + dx * t + nx * o, a[1] + dy * t + ny * o]);
    }
    return pts;
  }
  function curly(a, b, loops, r = 5) {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux, N = loops * 22, pts = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, ph = TAU * loops * t, al = L * t - r * 1.5 * Math.sin(ph), pe = r * (1 - Math.cos(ph));
      pts.push([a[0] + ux * al + nx * pe, a[1] + uy * al + ny * pe]);
    }
    return pts;
  }
  function plot(f, x0, x1, n = 80) {
    const pts = [];
    for (let i = 0; i <= n; i++) { const x = x0 + ((x1 - x0) * i) / n; pts.push([x, f(x)]); }
    return pts;
  }
  function fermion(sk, a, b, t0, t1, rev = false, o = {}) {
    sk.path([a, b], t0, t1, o);
    sk.arrow((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Math.atan2(b[1] - a[1], b[0] - a[0]) + (rev ? PI : 0), t1, 6.5);
  }
  function axes(sk, ox, oy, xe, ye, t0, t1, xl, yl) {
    sk.path([[ox, oy], [xe, oy]], t0, t1).arrow(xe, oy, 0, t1, 5.5);
    sk.path([[ox, oy], [ox, ye]], t0, t1).arrow(ox, ye, -PI / 2, t1, 5.5);
    if (xl) sk.label(xl, xe + 2, oy + 13, t1, { align: 'r' });
    if (yl) sk.label(yl, ox + 8, ye + 3, t1, { align: 'l' });
  }

  // ---------- Feynman diagrams
  function sChannel(l1, l2, boson, bl, l3, l4) {
    return {
      w: 250, h: 160, tIn: 5,
      build(sk) {
        const A = [24, 24], B = [24, 136], V1 = [90, 80], V2 = [160, 80], C = [226, 24], D = [226, 136];
        fermion(sk, A, V1, 0, 0.25);
        fermion(sk, B, V1, 0.05, 0.3, true);
        sk.dot(V1[0], V1[1], 2.2, 0.3);
        sk.path(boson === 'g' ? curly(V1, V2, 6, 5) : wavy(V1, V2, 5), 0.3, 0.6);
        sk.dot(V2[0], V2[1], 2.2, 0.6);
        fermion(sk, V2, C, 0.6, 0.85);
        fermion(sk, V2, D, 0.65, 0.9, true);
        sk.label(l1, 12, 14, 0.1).label(l2, 12, 147, 0.15).label(bl, 125, boson === 'g' ? 98 : 62, 0.5)
          .label(l3, 238, 14, 0.8).label(l4, 238, 147, 0.85);
      },
    };
  }

  const betaDecay = {
    w: 262, h: 232, tIn: 7,
    build(sk) {
      sk.path([[20, 214], [20, 18]], 0, 0.2).arrow(20, 18, -PI / 2, 0.2, 6).label('t', 10, 14, 0.2);
      for (let i = 0; i < 3; i++) {
        const b = [62 + 8 * i, 212], m = [98 + 8 * i, 122], t = [68 + 8 * i, 36];
        fermion(sk, b, m, 0.05 + i * 0.03, 0.4 + i * 0.03);
        fermion(sk, m, t, 0.4 + i * 0.03, 0.75 + i * 0.03);
      }
      const v = [114, 122], x = [168, 132];
      sk.dot(v[0], v[1], 2.2, 0.46);
      sk.path(wavy(v, x, 4, 4.5), 0.46, 0.66);
      sk.dot(x[0], x[1], 2.2, 0.66);
      fermion(sk, x, [216, 44], 0.66, 0.9, true);
      fermion(sk, x, [238, 82], 0.68, 0.92);
      sk.label('n', 56, 224, 0.1).label('"udd"', 84, 224, 0.12, { size: 11 })
        .label('p', 76, 10, 0.8).label('"udu"', 76, 24, 0.8, { size: 11 })
        .label('W^−', 140, 146, 0.6).label('¯ν_e', 224, 34, 0.9).label('e^−', 248, 76, 0.92);
    },
  };

  const tChannel = {
    w: 230, h: 176, tIn: 5,
    build(sk) {
      const V1 = [115, 48], V2 = [115, 128];
      fermion(sk, [20, 30], V1, 0, 0.3); fermion(sk, V1, [210, 30], 0.3, 0.6);
      fermion(sk, [20, 146], V2, 0.05, 0.35); fermion(sk, V2, [210, 146], 0.6, 0.9);
      sk.dot(V1[0], V1[1], 2.2, 0.3).path(wavy(V1, V2, 5), 0.3, 0.6).dot(V2[0], V2[1], 2.2, 0.6);
      sk.label('e^−', 12, 18, 0.1).label('e^−', 218, 18, 0.6).label('γ', 132, 88, 0.5)
        .label('q', 12, 158, 0.15).label('q', 218, 158, 0.9).label('q^2 = (p_1 − p_3)^2', 172, 90, 0.95, { size: 10, a: 0.8 });
    },
  };

  const higgsDiphoton = {
    w: 290, h: 164, tIn: 7,
    build(sk) {
      const T1 = [98, 46], T2 = [98, 118], T3 = [152, 82], Hx = [206, 82];
      sk.path(curly([16, 30], T1, 7, 4.5), 0, 0.3).path(curly([16, 134], T2, 7, 4.5), 0.03, 0.33);
      fermion(sk, T1, T3, 0.33, 0.45); fermion(sk, T3, T2, 0.45, 0.57); fermion(sk, T2, T1, 0.57, 0.66);
      sk.path([T3, Hx], 0.66, 0.8, { dash: [5, 4] }).dot(Hx[0], Hx[1], 2.2, 0.8);
      sk.path(wavy(Hx, [272, 36], 5, 4), 0.8, 1).path(wavy(Hx, [272, 128], 5, 4), 0.8, 1);
      sk.label('g', 10, 18, 0.1).label('g', 10, 146, 0.1).label('t', 84, 82, 0.5).label('H', 180, 70, 0.75)
        .label('γ', 280, 28, 0.95).label('γ', 280, 136, 0.95);
    },
  };

  // ---------- plots
  const wavePacket = {
    w: 300, h: 150, tIn: 4,
    build(sk) {
      sk.path([[12, 105], [290, 105]], 0, 0.35).arrow(290, 105, 0, 0.35, 5.5).label('x', 288, 118, 0.35);
      sk.label('|ψ(x,t)|^2', 50, 16, 0.5, { size: 12 }).label('"Re" ψ', 50, 34, 0.55, { size: 11, a: 0.65 });
    },
    live(ctx, st, age, p, alpha) {
      if (p < 0.35) return;
      const loop = 9.5, tt = age % loop, tau = tt / 4.5, xc = 45 + 26 * tt, den = 1 + tau * tau, s2 = 14 * 14;
      const gate = clamp((p - 0.35) / 0.3) * clamp(tt / 0.8) * clamp((loop - tt) / 1.2);
      const re = [], env = [];
      for (let x = 14; x <= 286; x += 1.5) {
        const d = x - xc, amp = Math.pow(den, -0.25) * Math.exp(-(d * d) / (4 * s2 * den));
        const ph = 0.55 * d + (d * d * tau) / (4 * s2 * den) - 0.5 * Math.atan(tau) - 0.9 * tt;
        re.push([x, 105 - 40 * amp * Math.cos(ph)]);
        env.push([x, 105 - 62 * amp * amp]);
      }
      for (const [pts, a, lw] of [[re, 0.55, 0.9], [env, 1, 1.4]]) {
        ctx.globalAlpha = alpha * gate * a; ctx.lineWidth = lw;
        ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.stroke();
      }
    },
  };

  const blackbody = {
    w: 286, h: 196, tIn: 7,
    build(sk) {
      axes(sk, 34, 168, 270, 16, 0, 0.15, 'λ', 'B_λ(T)');
      const B = (x, T) => Math.pow(x, -5) / (Math.exp(1 / (x * T)) - 1), Ts = [0.8, 0.9, 1.0, 1.1];
      const xp = (T) => 1 / (4.965 * T), top = B(xp(1.1), 1.1), X = (x) => 34 + x * 190, Y = (v) => 168 - (v / top) * 138;
      Ts.forEach((T, i) => sk.path(plot((x) => Y(B(x, T)), 0.035, 1.2, 140).map(([x, y]) => [X(x), y]), 0.15 + i * 0.17, 0.4 + i * 0.17, { lw: 1.3 }));
      sk.path(Ts.map((T) => [X(xp(T)), Y(B(xp(T), T))]).concat([[X(xp(1.1)) - 4, 22]]).reverse(), 0.85, 1, { dash: [3, 4], a: 0.7 });
      Ts.forEach((T, i) => sk.label('T_' + (i + 1), X(xp(T)) + 38 - i * 5, Y(B(xp(T), T)) + 8 - i * 2, 0.4 + i * 0.17, { size: 10 }));
      sk.label('λ_{"max"}T = b', 150, 24, 0.95, { size: 11, a: 0.85 });
    },
  };

  const oscillator = {
    w: 250, h: 214, tIn: 7,
    build(sk) {
      const c = 0.016, cx = 125, base = 198;
      sk.path(plot((x) => base - c * (x - cx) ** 2, cx - 104, cx + 104, 60), 0, 0.3, { lw: 1.3 });
      const herm = [(x) => 1, (x) => 2 * x, (x) => 4 * x * x - 2, (x) => 8 * x ** 3 - 12 * x, (x) => 16 * x ** 4 - 48 * x * x + 12];
      for (let n = 0; n < 5; n++) {
        const E = 18 + 34 * n, y = base - E, hw = Math.sqrt(E / c), t0 = 0.3 + n * 0.13;
        sk.path([[cx - hw, y], [cx + hw, y]], t0, t0 + 0.1, { a: 0.55, lw: 0.9 });
        const f = (x) => herm[n](x) * Math.exp(-x * x / 2);
        let mx = 0; for (let x = -5; x <= 5; x += 0.05) mx = Math.max(mx, Math.abs(f(x)));
        sk.dyn((t) => plot((x) => y - (13 / mx) * f((x - cx) / 21) * Math.cos((n + 0.5) * t * 0.9), cx - hw - 14, cx + hw + 14, 70), t0 + 0.05, t0 + 0.2, { lw: 1.2 });
        sk.label('n=' + n, cx + hw + 30, y, t0 + 0.1, { size: 10, a: 0.8 });
      }
      sk.label('V(x)', cx - 98, 22, 0.3, { size: 12 }).label('E_n = ħω(n + ½)', cx + 34, 12, 0.95, { size: 12 });
    },
  };

  const resonance = {
    w: 290, h: 200, tIn: 8,
    build(sk) {
      axes(sk, 40, 170, 276, 18, 0, 0.12, 'm_{γγ} "[GeV]"', '"Events / 2 GeV"');
      const X = (m) => 40 + (m - 100) * 3.7, bg = (m) => 150 * Math.exp(-(m - 100) / 28), sig = (m) => 24 * Math.exp(-((m - 125) ** 2) / (2 * 2.3 ** 2)), Y = (v) => 170 - v * 0.88;
      for (const m of [100, 120, 140, 160]) { sk.path([[X(m), 170], [X(m), 174]], 0.12, 0.14); sk.label('"' + m + '"', X(m), 183, 0.14, { size: 9, a: 0.8 }); }
      for (let i = 0; i < 30; i++) {
        const m = 101 + 2 * i, mu = bg(m) + sig(m), v = mu + PC.gauss() * Math.sqrt(mu) * 0.55, e = Math.sqrt(mu) * 0.8, t0 = 0.15 + (0.55 * i) / 30;
        sk.dot(X(m), Y(v), 1.7, t0).path([[X(m), Y(v + e)], [X(m), Y(v - e)]], t0, t0 + 0.02, { lw: 0.8, a: 0.8 });
      }
      sk.path(plot((m) => Y(bg(m)), 100, 160, 60).map(([m, y]) => [X(m), y]), 0.7, 0.85, { dash: [4, 4], a: 0.7 });
      sk.path(plot((m) => Y(bg(m) + sig(m)), 100, 160, 120).map(([m, y]) => [X(m), y]), 0.78, 1, { lw: 1.4 });
      sk.label('H → γγ', X(125) + 34, Y(bg(125) + sig(125)) - 16, 0.95, { size: 12 });
      sk.label('m_H ≈ "125 GeV"', X(125) + 44, Y(bg(125) + sig(125)) - 1, 0.97, { size: 10, a: 0.8 });
    },
  };

  const lightCone = {
    w: 236, h: 216, tIn: 5,
    build(sk, st) {
      const cx = 118, cy = 112, s = 36;
      sk.path([[14, cy], [222, cy]], 0, 0.2).arrow(222, cy, 0, 0.2, 5.5).label('x', 224, cy + 12, 0.2);
      sk.path([[cx, 208], [cx, 12]], 0, 0.2).arrow(cx, 12, -PI / 2, 0.2, 5.5).label('ct', cx + 14, 12, 0.2);
      sk.path([[cx - 94, cy + 94], [cx + 94, cy - 94]], 0.2, 0.4, { dash: [4, 4], a: 0.7 });
      sk.path([[cx - 94, cy - 94], [cx + 94, cy + 94]], 0.2, 0.4, { dash: [4, 4], a: 0.7 });
      for (const sg of [1, -1]) {
        sk.path(plot((x) => cy - sg * s * Math.sqrt(1 + ((x - cx) / s) ** 2), cx - 86, cx + 86, 60), 0.4, 0.6, { a: 0.6, lw: 0.9 });
        sk.path(plot((y) => cx - sg * s * Math.sqrt(1 + ((y - cy) / s) ** 2), cy - 86, cy + 86, 60).map(([y, x]) => [x, y]), 0.5, 0.7, { a: 0.6, lw: 0.9 });
      }
      const beta = (t) => 0.6 * Math.sin(t * 0.5);
      sk.dyn((t) => { const b = beta(t), n = 96 / Math.hypot(1, b); return [[cx - n, cy + b * n], [cx + n, cy - b * n]]; }, 0.7, 0.85, { lw: 1.3 });
      sk.dyn((t) => { const b = beta(t), n = 96 / Math.hypot(1, b); return [[cx - b * n, cy + n], [cx + b * n, cy - n]]; }, 0.7, 0.85, { lw: 1.3 });
      st.geo = { cx, cy, s, beta };
    },
    live(ctx, st, age, p, alpha) {
      if (p < 0.85) return;
      const { cx, cy, s, beta } = st.geo, b = beta(age), n = 96 / Math.hypot(1, b), eta = Math.atanh(b), a = alpha * clamp((p - 0.85) / 0.1);
      label(ctx, "x'", cx + n + 8, cy - b * n, 12, 'c', a);
      label(ctx, "ct'", cx + b * n + 4, cy - n - 9, 12, 'c', a);
      ctx.globalAlpha = a;
      for (const [ex, ey] of [[Math.sinh(eta), Math.cosh(eta)], [Math.cosh(eta), Math.sinh(eta)]]) {
        ctx.beginPath(); ctx.arc(cx + ex * s, cy - ey * s, 2.6, 0, TAU); ctx.fill();
      }
    },
  };

  const hydrogen = {
    w: 276, h: 216, tIn: 7,
    build(sk) {
      const Y = (n) => 24 + 172 / Math.pow(n, 1.25);
      for (let n = 1; n <= 6; n++) {
        sk.path([[52, Y(n)], [216, Y(n)]], 0.05 * n, 0.05 * n + 0.15, { lw: n === 1 ? 1.4 : 1.1 });
        if (n <= 4) sk.label('n=' + n, 30, Y(n), 0.05 * n + 0.1, { size: 10 });
      }
      sk.path([[52, 24], [216, 24]], 0.35, 0.5, { dash: [3, 4], a: 0.7 }).label('∞', 34, 24, 0.5, { size: 11 });
      const series = [[1, 76, 'Lyman'], [2, 126, 'Balmer'], [3, 176, 'Paschen']];
      series.forEach(([nf, x0, name], s) => {
        for (let j = 0; j < 3; j++) {
          const x = x0 + 12 * j, t0 = 0.45 + s * 0.15 + j * 0.04;
          sk.path([[x, Y(nf + 1 + j)], [x, Y(nf) - 1]], t0, t0 + 0.12, { lw: 0.9 }).arrow(x, Y(nf) - 3, PI / 2, t0 + 0.12, 5);
        }
        sk.label('"' + name + '"', x0 + 12, Y(nf) + 10, 0.6 + s * 0.15, { size: 9, a: 0.85 });
      });
      sk.label('"−13.6 eV"', 246, Y(1), 0.3, { size: 10, a: 0.85 }).label('E_n = −13.6/n^2 "eV"', 150, 8, 0.95, { size: 11 });
    },
  };

  const pendulum = {
    w: 276, h: 196, tIn: 7,
    build(sk, st) {
      const cx = 138, cy = 98, sx = 124 / TAU, sy = 25, clip = [14, 18, 248, 160];
      const P = (q, p) => [cx + q * sx, cy - p * sy];
      sk.path([[10, cy], [266, cy]], 0, 0.15, { a: 0.6 }).arrow(266, cy, 0, 0.15, 5).label('θ', 268, cy + 12, 0.15);
      sk.path([[cx, 186], [cx, 10]], 0, 0.15, { a: 0.6 }).arrow(cx, 10, -PI / 2, 0.15, 5).label('p_θ', cx + 14, 10, 0.15);
      let k = 0;
      for (const c of [-TAU, 0, TAU]) for (const E of [-0.65, 0, 0.6]) {
        const qm = Math.acos(-E), up = plot((q) => Math.sqrt(Math.max(0, 2 * (E + Math.cos(q)))), -qm, qm, 40);
        const loop = up.map(([q, p]) => P(c + q, p)).concat(up.reverse().map(([q, p]) => P(c + q, -p)));
        sk.path(loop, 0.15 + k * 0.04, 0.4 + k * 0.04, { clip, lw: 1 }); k++;
      }
      for (const sg of [1, -1]) {
        sk.path(plot((q) => sg * 2 * Math.abs(Math.cos(q / 2)), -TAU, TAU, 120).map(([q, p]) => P(q, p)), 0.55, 0.75, { clip, lw: 1.5 });
        for (const E of [1.7, 2.9]) sk.path(plot((q) => sg * Math.sqrt(2 * (E + Math.cos(q))), -TAU, TAU, 100).map(([q, p]) => P(q, p)), 0.7, 0.95, { clip, lw: 1, a: 0.8 });
      }
      sk.label('H = ½p_θ^2 − "cos" θ', 214, 8, 0.95, { size: 11 });
      st.q = 2.55; st.p = 0; st.P = P;
    },
    update(st, dt) {
      for (let i = 0; i < 4; i++) { const h = dt * 0.4; st.p -= Math.sin(st.q) * h; st.q += st.p * h; }
    },
    live(ctx, st, age, p, alpha) {
      if (p < 0.5) return;
      const [x, y] = st.P(st.q, st.p);
      ctx.globalAlpha = alpha * clamp((p - 0.5) / 0.1);
      ctx.beginPath(); ctx.arc(x, y, 2.8, 0, TAU); ctx.fill();
    },
  };

  const emWave = {
    w: 306, h: 176, tIn: 5,
    build(sk) {
      const A = [50, 104], L = 228, d = [0.993, -0.115], E = [0, -40], B = [-21, 17], kx = TAU / 92;
      const at = (s, v, t) => { const a = Math.sin(kx * s - 2.4 * t); return [A[0] + d[0] * s + v[0] * a, A[1] + d[1] * s + v[1] * a]; };
      const on = (s) => [A[0] + d[0] * s, A[1] + d[1] * s];
      sk.path([on(-6), on(L + 16)], 0, 0.25).arrow(...on(L + 16), Math.atan2(d[1], d[0]), 0.25, 6).label('"k"', on(L + 16)[0] + 4, on(L + 16)[1] + 13, 0.25);
      for (const [v, t0, a] of [[E, 0.25, 1], [B, 0.5, 0.75]]) {
        sk.dyn((t) => { const pts = []; for (let s = 0; s <= L; s += 3) pts.push(at(s, v, t)); return pts; }, t0, t0 + 0.3, { lw: 1.4, a });
        sk.segs((t) => { const l = []; for (let s = 0; s <= L; s += 9) l.push([...on(s), ...at(s, v, t)]); return l; }, t0 + 0.1, t0 + 0.4, { lw: 0.7, a: a * 0.6 });
      }
      sk.path([on(0), [A[0], A[1] - 58]], 0.2, 0.3, { a: 0.7 }).arrow(A[0], A[1] - 58, -PI / 2, 0.3, 5).label('"E"', A[0] + 12, A[1] - 60, 0.3);
      sk.path([on(0), [A[0] - 37, A[1] + 30]], 0.45, 0.55, { a: 0.7 }).label('"B"', A[0] - 30, A[1] + 42, 0.55);
      sk.label('c = 1/√(μ_0ε_0)', 236, 160, 0.95, { size: 11, a: 0.85 });
    },
  };

  const bloch = {
    w: 226, h: 226, tIn: 6,
    build(sk, st) {
      const cx = 113, cy = 116, R = 78, pr = (x, y, z) => [cx + R * (y - 0.4 * x), cy + R * (-z + 0.25 * x)];
      const circ = []; for (let i = 0; i <= 72; i++) circ.push([cx + R * Math.cos((TAU * i) / 72), cy + R * Math.sin((TAU * i) / 72)]);
      sk.path(circ, 0, 0.35, { lw: 1.3 });
      const eq = (a0, a1) => plot((f) => f, a0, a1, 40).map(([f]) => pr(Math.cos(f), Math.sin(f), 0));
      sk.path(eq(-PI / 2, PI / 2), 0.3, 0.5, { lw: 1 }).path(eq(PI / 2, 1.5 * PI), 0.45, 0.6, { dash: [3, 4], a: 0.6, lw: 1 });
      sk.path([pr(0, 0, -1.18), pr(0, 0, 1.22)], 0.35, 0.55, { a: 0.7, lw: 0.9 }).arrow(...pr(0, 0, 1.22), -PI / 2, 0.55, 5);
      sk.path([pr(0, -1.15, 0), pr(0, 1.22, 0)], 0.4, 0.6, { a: 0.7, lw: 0.9 }).arrow(...pr(0, 1.22, 0), 0, 0.6, 5);
      sk.path([pr(-1.1, 0, 0), pr(1.5, 0, 0)], 0.45, 0.65, { a: 0.7, lw: 0.9 });
      sk.label('|0⟩', cx + 16, cy - R - 16, 0.55).label('|1⟩', cx + 16, cy + R + 14, 0.55)
        .label('y', cx + R + 26, cy + 10, 0.6, { size: 11 }).label('x', pr(1.62, 0, 0)[0], pr(1.62, 0, 0)[1] + 4, 0.65, { size: 11 });
      st.pr = pr; st.trail = [];
    },
    update(st, dt, age) {
      const th = 1.0 + 0.4 * Math.sin(0.23 * age), ph = 0.9 * age;
      st.v = [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)];
      st.trail.push(st.pr(...st.v));
      if (st.trail.length > 170) st.trail.shift();
    },
    live(ctx, st, age, p, alpha) {
      if (p < 0.7 || !st.v) return;
      const a = alpha * clamp((p - 0.7) / 0.15), o = st.pr(0, 0, 0), tip = st.pr(...st.v), foot = st.pr(st.v[0], st.v[1], 0);
      ctx.lineWidth = 0.8;
      for (let i = 1; i < st.trail.length; i++) {
        ctx.globalAlpha = a * 0.5 * (i / st.trail.length);
        ctx.beginPath(); ctx.moveTo(...st.trail[i - 1]); ctx.lineTo(...st.trail[i]); ctx.stroke();
      }
      ctx.globalAlpha = a * 0.5; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(...tip); ctx.lineTo(...foot); ctx.lineTo(...o); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = a; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(...o); ctx.lineTo(...tip); ctx.stroke();
      ctx.beginPath(); ctx.arc(tip[0], tip[1], 2.8, 0, TAU); ctx.fill();
      label(ctx, '|ψ⟩', tip[0] + 14, tip[1] - 9, 12, 'c', a);
    },
  };

  const couplings = {
    w: 280, h: 196, tIn: 6,
    build(sk) {
      axes(sk, 38, 168, 266, 16, 0, 0.15, '"log"_{10}(μ/"GeV")', 'α_i^{−1}');
      const X = (l) => 38 + (l - 2) * 13.4, Y = (v) => 168 - v * 2.25;
      for (const l of [5, 10, 15]) { sk.path([[X(l), 168], [X(l), 172]], 0.15, 0.17); sk.label('"' + l + '"', X(l), 181, 0.17, { size: 9, a: 0.8 }); }
      [[59, 36.5, 'α_1^{−1}'], [29.6, 47.2, 'α_2^{−1}'], [8.5, 45.4, 'α_3^{−1}']].forEach(([a, b, name], i) => {
        sk.path([[X(2), Y(a)], [X(18), Y(b)]], 0.2 + i * 0.2, 0.55 + i * 0.2, { lw: 1.3 });
        sk.label(name, X(2) + 22, Y(a) - 10 + (i === 0 ? 20 : 0), 0.3 + i * 0.2, { size: 11 });
      });
      sk.path([[X(15), Y(0)], [X(15), Y(62)]], 0.9, 1, { dash: [2, 4], a: 0.5 }).label('M_{"GUT"} ?', X(15) + 4, Y(62) - 6, 1, { size: 10, a: 0.8 });
    },
  };

  const smTable = {
    w: 256, h: 222, tIn: 8,
    build(sk) {
      const rows = [['u', 'c', 't', 'g'], ['d', 's', 'b', 'γ'], ['e', 'μ', 'τ', 'Z'], ['ν_e', 'ν_μ', 'ν_τ', 'W']];
      const cell = (x, y, s, t0, dash) => {
        sk.path([[x, y], [x + 40, y], [x + 40, y + 40], [x, y + 40], [x, y]], t0, t0 + 0.12, { lw: 1, dash });
        sk.label(s, x + 20, y + 21, t0 + 0.1, { size: 16 });
      };
      rows.forEach((r, j) => r.forEach((s, i) => cell(20 + 45 * i, 30 + 45 * j, s, 0.04 * (i + j * 1.6) + (i === 3 ? 0.35 : 0), i === 3 ? [4, 3] : null)));
      cell(204, 97, 'H', 0.85, [2, 3]);
      ['I', 'II', 'III'].forEach((g, i) => sk.label('"' + g + '"', 40 + 45 * i, 18, 0.1 + i * 0.05, { size: 10, a: 0.8 }));
      sk.label('SU(3)_C × SU(2)_L × U(1)_Y', 110, 218, 0.95, { size: 10, a: 0.85 });
    },
  };

  // ---------- dot clouds (single quanta accumulating into a distribution)
  function sampler(dens, max, draw) {
    return () => { for (let i = 0; i < 40; i++) { const s = draw(); if (Math.random() * max < dens(...s)) return s; } return null; };
  }
  function cloudLive(ctx, st, alpha) {
    ctx.shadowBlur = 0;
    ctx.globalAlpha = alpha * 0.85;
    for (const d of st.dots) ctx.fillRect(d[0], d[1], 1.25, 1.25);
  }

  const doubleSlit = {
    w: 306, h: 184, tIn: 5,
    build(sk, st) {
      const I = (y) => { const d = y - 92, s = d / 46 || 1e-6; return Math.cos((PI * d) / 13) ** 2 * (Math.sin(PI * s) / (PI * s)) ** 2; };
      sk.dot(18, 92, 2.6, 0);
      for (const [a, b] of [[14, 80], [86, 98], [104, 170]]) sk.path([[96, a], [96, b]], 0.05, 0.3, { lw: 2 });
      sk.path([[238, 14], [238, 170]], 0.3, 0.5);
      sk.path(plot((y) => 270 + 30 * I(y), 16, 168, 150).map(([y, x]) => [x, y]), 0.7, 1, { lw: 1.1 });
      sk.label('I(y)', 286, 10, 1, { size: 11 }).label('d', 86, 92, 0.3, { size: 10 }).label('d "sin" θ = nλ', 166, 176, 0.95, { size: 11, a: 0.85 });
      st.dots = [];
      st.sample = sampler(I, 1, () => [rand(16, 168)]);
    },
    update(st, dt, age, p) {
      if (p < 0.5 || st.dots.length > 1700) return;
      for (let n = dt * 70 + Math.random(); n >= 1; n--) { const s = st.sample(); if (s) st.dots.push([rand(241, 264), s[0]]); }
    },
    live(ctx, st, age, p, alpha) {
      if (p >= 0.3) {
        ctx.save();
        ctx.beginPath(); ctx.rect(20, 10, 217, 164); ctx.clip();
        ctx.lineWidth = 0.7;
        for (const [sx, sy, x0] of [[18, 92, 18], [96, 83, 96], [96, 101, 96]]) for (let j = 0; j < 8; j++) {
          const r = ((age * 26) % 20) + 20 * j, lim = x0 === 18 ? 78 : 142;
          if (r > lim) continue;
          ctx.globalAlpha = alpha * 0.28 * clamp((p - 0.3) / 0.2) * (1 - r / (lim * 1.15));
          ctx.beginPath(); ctx.arc(sx, sy, r, -1.15, 1.15); ctx.stroke();
        }
        ctx.restore();
      }
      cloudLive(ctx, st, alpha);
    },
  };

  const orbital = {
    w: 226, h: 232, tIn: 3,
    build(sk, st) {
      const [name, ext, psi] = pick([
        ['210', 11, (r, c) => r * Math.exp(-r / 2) * c],
        ['310', 21, (r, c) => r * (6 - r) * Math.exp(-r / 3) * c],
        ['320', 22, (r, c) => r * r * Math.exp(-r / 3) * (3 * c * c - 1)],
        ['300', 20, (r) => (27 - 18 * r + 2 * r * r) * Math.exp(-r / 3)],
      ]);
      const dens = (x, z) => { const r = Math.hypot(x, z) || 1e-6; return psi(r, z / r) ** 2 * (name === '300' ? Math.min(1, r / 2) : 1); };
      let max = 0;
      for (let x = -ext; x <= ext; x += ext / 60) for (let z = -ext; z <= ext; z += ext / 60) max = Math.max(max, dens(x, z));
      const cx = 113, cy = 124;
      sk.path([[cx, 226], [cx, 22]], 0, 0.6, { dash: [2, 5], a: 0.45 }).path([[10, cy], [216, cy]], 0, 0.6, { dash: [2, 5], a: 0.45 });
      sk.label('z', cx + 10, 22, 0.6, { size: 11, a: 0.8 }).label('|ψ_{' + name + '}(r,θ)|^2', 50, 10, 0.3, { size: 12 });
      st.dots = [];
      st.sample = sampler(dens, max * 0.8, () => [rand(-ext, ext), rand(-ext, ext)]);
      st.map = (s) => [cx + (s[0] / ext) * 100, cy - (s[1] / ext) * 100];
    },
    update(st, dt, age, p) {
      if (st.dots.length > 3000) return;
      for (let n = dt * 190 + Math.random(); n >= 1; n--) { const s = st.sample(); if (s) st.dots.push(st.map(s)); }
    },
    live(ctx, st, age, p, alpha) { cloudLive(ctx, st, alpha); },
  };

  const DEFS = [
    betaDecay, tChannel, higgsDiphoton,
    sChannel('e^−', 'e^+', 'γ', 'γ', 'μ^−', 'μ^+'),
    sChannel('q', '¯q', 'g', 'g', 't', '¯t'),
    wavePacket, blackbody, oscillator, resonance, lightCone, hydrogen, pendulum, emWave, bloch, couplings, smTable, doubleSlit, orbital,
  ];

  class Widget {
    constructor(def, k, rect) {
      Object.assign(this, { def, k, rect, age: 0, tIn: def.tIn || 6, life: rand(26, 40), fade: 3.5, st: {}, sk: new Sketch() });
      def.build(this.sk, this.st);
    }
    get p() { return clamp(this.age / this.tIn); }
    get dead() { return this.age > this.life + this.fade; }
    update(dt) {
      this.age += dt;
      if (this.def.update) this.def.update(this.st, dt, this.age, this.p);
    }
    draw(ctx) {
      const alpha = this.age > this.life ? clamp(1 - (this.age - this.life) / this.fade) : 1;
      ctx.save();
      ctx.translate(this.rect.x, this.rect.y);
      ctx.scale(this.k, this.k);
      this.sk.draw(ctx, this.p, this.age, alpha, true);
      ctx.shadowColor = ink(0.55);
      ctx.shadowBlur = 5;
      this.sk.draw(ctx, this.p, this.age, alpha);
      if (this.def.live) {
        ctx.strokeStyle = ink(1); ctx.fillStyle = ink(1);
        this.def.live(ctx, this.st, this.age, this.p, alpha);
      }
      ctx.restore();
    }
  }

  PC.Widgets = {
    list: [],
    bag: new PC.Bag(DEFS),
    spawn() {
      const def = this.bag.next();
      for (const k of [PC.u * rand(1.0, 1.3), PC.u * 0.85]) {
        const rect = PC.Layout.place(def.w * k, def.h * k);
        if (rect) { this.list.push(new Widget(def, k, rect)); return true; }
      }
      return false;
    },
    update(dt) {
      for (let i = this.list.length - 1; i >= 0; i--) {
        const w = this.list[i];
        w.update(dt);
        if (w.dead) { PC.Layout.release(w.rect); this.list.splice(i, 1); }
      }
    },
    draw(ctx) { for (const w of this.list) w.draw(ctx); },
    // after a resize: start fading whatever no longer fits on screen
    evict() {
      for (const w of this.list) if (w.rect.x + w.rect.w > PC.W || w.rect.y + w.rect.h > PC.H) w.age = Math.max(w.age, w.life);
    },
    reset() { this.list.length = 0; },
  };
})();
