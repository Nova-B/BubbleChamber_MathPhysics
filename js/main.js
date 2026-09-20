// main.js — stage setup, scheduler, render loop, input
(function () {
  const { rand, clamp, Layout, Chamber, Widgets, Eqs } = PC;
  const stage = document.getElementById('stage'), ctx = stage.getContext('2d');
  const hud = document.getElementById('hud'), speedEl = document.getElementById('speed'), grain = document.getElementById('grain');
  Eqs.root = document.getElementById('eqs');

  let dust = document.createElement('canvas');
  let eqTarget = 5, widgetTarget = 3;
  let paused = false, speed = 1, last = performance.now();
  let spawnTimer = 1.2, eventTimer = 0.4;

  // dust is generated once for the largest size seen, so resizing never reshuffles the specks
  let dustW = 0, dustH = 0;
  function makeDust() {
    const dpr = PC.dpr, W = Math.max(PC.W, window.screen.width || 0), H = Math.max(PC.H, window.screen.height || 0);
    if (W <= dustW && H <= dustH && dust.dpr === dpr) return;
    dustW = W; dustH = H; dust.dpr = dpr;
    dust.width = W * dpr; dust.height = H * dpr;
    const g = dust.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (let i = (W * H) / 7000; i > 0; i--) {
      g.fillStyle = `rgba(255,245,225,${Math.random() < 0.06 ? rand(0.35, 0.7) : rand(0.04, 0.22)})`;
      g.beginPath(); g.arc(rand(W), rand(H), rand(0.4, 1.3), 0, 6.2832); g.fill();
    }
  }

  function makeGrain() {
    const c = document.createElement('canvas'); c.width = c.height = 160;
    const g = c.getContext('2d'), img = g.createImageData(160, 160);
    for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0);
    grain.style.backgroundImage = `url(${c.toDataURL()})`;
    setInterval(() => { if (!paused) grain.style.backgroundPosition = `${Math.floor(rand(160))}px ${Math.floor(rand(160))}px`; }, 90);
  }

  // the running scene survives a resize (window drag, fullscreen toggle): only items that no longer fit are retired
  function resize(first) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2), W = window.innerWidth, H = window.innerHeight;
    Object.assign(PC, { W, H, dpr, u: clamp(Math.min(W, H) / 900, 0.55, 1.7) });
    stage.width = Math.round(W * dpr); stage.height = Math.round(H * dpr);
    const area = (W * H) / (PC.u * PC.u);
    eqTarget = clamp(Math.round(area / 330000), 2, 8);
    widgetTarget = clamp(Math.round(area / 520000), 1, 5);
    makeDust();
    if (first === true) return;
    Chamber.resize(); Widgets.evict(); Eqs.evict();
  }

  function schedule(dt) {
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnTimer = rand(0.9, 2.0);
      const needEq = Eqs.list.length < eqTarget, needW = Widgets.list.length < widgetTarget;
      if (needEq && (!needW || Math.random() < 0.55)) Eqs.spawn();
      else if (needW) Widgets.spawn();
    }
    eventTimer -= dt;
    if (eventTimer <= 0) eventTimer = Chamber.spawn() ? rand(6, 10) : 1;
  }

  function frame(now) {
    let dt = Math.min((now - last) / 1000, 0.05) * speed;
    last = now;
    if (paused) dt = 0;
    if (dt > 0) { schedule(dt); Layout.update(dt); Chamber.update(dt); Widgets.update(dt); Eqs.update(dt); }

    ctx.setTransform(PC.dpr, 0, 0, PC.dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, PC.W, PC.H);
    ctx.drawImage(dust, 0, 0, dustW, dustH);
    Chamber.draw(ctx);
    // soft dark backing so equations and diagrams stay readable over dense tracks
    ctx.save();
    ctx.fillStyle = '#000'; ctx.shadowColor = '#000'; ctx.shadowBlur = 36;
    for (const list of [Layout.rects, Layout.fading]) for (const r of list) {
      ctx.globalAlpha = 0.8 * clamp(r.a);
      ctx.fillRect(r.x + 6, r.y + 6, r.w - 12, r.h - 12);
    }
    ctx.restore();
    Widgets.draw(ctx);
    requestAnimationFrame(frame);
  }

  // ---- input
  let resizeT, idleT, hudT;
  window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(resize, 150); });
  function showHud(ms) {
    speedEl.textContent = (paused ? '· 일시정지 ' : '') + (speed !== 1 ? `· ×${speed.toFixed(2)}` : '');
    hud.classList.remove('hidden');
    clearTimeout(hudT); hudT = setTimeout(() => hud.classList.add('hidden'), ms);
  }
  window.addEventListener('keydown', (e) => {
    if (e.key === 'f' || e.key === 'F') { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); return; }
    if (e.key === ' ') { paused = !paused; e.preventDefault(); }
    else if (e.key === 'ArrowUp') speed = Math.min(4, speed * 1.25);
    else if (e.key === 'ArrowDown') speed = Math.max(0.25, speed / 1.25);
    else return;
    showHud(paused ? 1e7 : 2500);
  });
  stage.addEventListener('pointerdown', (e) => Chamber.spawn(e.clientX, e.clientY));
  window.addEventListener('pointermove', () => {
    document.body.classList.remove('idle');
    clearTimeout(idleT); idleT = setTimeout(() => document.body.classList.add('idle'), 2500);
  });

  // ---- boot: wait for the KaTeX fonts so equation boxes are measured correctly
  const fonts = ['16px KaTeX_Main', 'italic 16px KaTeX_Math', 'bold 16px KaTeX_Main', '16px KaTeX_AMS', '16px KaTeX_Caligraphic', '16px KaTeX_Size1', '16px KaTeX_Size2', '16px KaTeX_Size3', '16px KaTeX_Size4'];
  const ready = document.fonts ? Promise.all(fonts.map((f) => document.fonts.load(f).catch(() => 0))) : Promise.resolve();
  Promise.race([ready, new Promise((r) => setTimeout(r, 2500))]).then(() => {
    makeGrain();
    resize(true);
    showHud(7000);
    // ?warp=40 fast-forwards the simulation by that many seconds before the first frame (for testing/screenshots)
    const warp = +new URLSearchParams(location.search).get('warp') || 0;
    for (let t = 0; t < warp; t += 1 / 30) { schedule(1 / 30); Layout.update(1 / 30); Chamber.update(1 / 30); Widgets.update(1 / 30); Eqs.update(1 / 30); }
    requestAnimationFrame((t) => { last = t; frame(t); });
  });
})();
