// chamber.js — bubble-chamber tracks: charged particles spiralling in a magnetic field while losing energy
(function () {
  const { rand, randi, clamp, gauss } = PC;
  const layerPool = [];

  // radius of curvature r = p/|q|B, so r doubles as "momentum". r shrinks along the path (dE/dx) → inward spiral.
  class Particle {
    constructor(o) {
      Object.assign(this, { q: 1, k: 0.03, v: 600, lw: rand(1.0, 1.5), visible: true, flight: Infinity, onEnd: null, delta: true }, o);
      this.r0 = this.r;
      this.alive = true;
      this.path = 0;
      this.on = true;
      this.run = rand(3, 11);
    }

    step(dt, ev) {
      const g = ev.g, { W, H } = PC;
      let dist = this.v * (0.3 + 0.7 * Math.min(1, this.r / this.r0)) * dt;
      const blobs = [];
      let px = this.x, py = this.y;
      g.beginPath();
      g.moveTo(px, py);
      while (dist > 0 && this.alive) {
        const ds = Math.min(dist, clamp(this.r * 0.12, 0.5, 2.4));
        dist -= ds;
        this.path += ds;
        this.th += (this.q * ds) / this.r;
        this.x += Math.cos(this.th) * ds;
        this.y += Math.sin(this.th) * ds;
        if (this.q) this.r -= this.k * ds * (1 + 8 / this.r);

        if (this.visible) {
          const jx = this.x + rand(-0.25, 0.25), jy = this.y + rand(-0.25, 0.25);
          // broken dash-dot trail of bubbles
          this.run -= ds;
          if (this.run <= 0) { this.on = !this.on; this.run = this.on ? rand(3, 12) : rand(1.5, 5); }
          if (this.on) g.lineTo(jx, jy); else g.moveTo(jx, jy);
          if (this.on && Math.random() < 0.012 * ds) blobs.push(jx, jy, rand(1.1, 2.3));
          // knock-on electrons (delta rays): the tiny curls along a track
          if (this.delta && this.r > 28 && Math.random() < 0.0007 * ds) {
            ev.add({ x: this.x, y: this.y, th: this.th + rand(-1.1, 1.1), q: -1, r: rand(4, 13) * PC.u, k: rand(0.05, 0.12), v: rand(140, 220), delta: false, lw: rand(0.9, 1.3) });
          }
        }

        if (this.r < 1.6 || this.path > this.flight || this.path > 18000) this.alive = false;
        const out = Math.max(-this.x, this.x - W, -this.y, this.y - H);
        // off-screen and heading further away: it is never coming back
        if (out > 0 && out > this.out && (this.r > Math.max(W, H) || out > 2 * this.r + 60)) this.alive = false;
        this.out = out;
      }
      if (this.visible) {
        const lw = this.lw * (1 + 0.9 * (1 - Math.min(1, this.r / this.r0)));
        g.lineWidth = lw * 3.4; g.strokeStyle = 'rgba(255,240,210,0.10)'; g.stroke();
        g.lineWidth = lw; g.strokeStyle = 'rgba(255,248,235,0.92)'; g.stroke();
        if (!this.alive && this.r < 1.6) blobs.push(this.x, this.y, rand(1.4, 2.4));
        for (let i = 0; i < blobs.length; i += 3) {
          g.fillStyle = 'rgba(255,240,210,0.13)';
          g.beginPath(); g.arc(blobs[i], blobs[i + 1], blobs[i + 2] * 2.6, 0, 6.2832); g.fill();
          g.fillStyle = 'rgba(255,250,240,0.95)';
          g.beginPath(); g.arc(blobs[i], blobs[i + 1], blobs[i + 2], 0, 6.2832); g.fill();
        }
      }
      if (!this.alive && this.onEnd) this.onEnd(this);
    }
  }

  class ChamberEvent {
    constructor(vx, vy) {
      const { H, u } = PC;
      this.allocLayer();
      this.particles = [];
      this.spawned = 0;
      this.rest = 0;
      this.hold = rand(12, 20);
      this.fade = 7;
      this.alpha = 1;

      // beam enters from the left and interacts at the vertex
      const ang = rand(-0.22, 0.22);
      const x0 = -10, y0 = vy - Math.tan(ang) * (vx - x0);
      this.add({ x: x0, y: y0, th: ang, q: 1, r: 30000, k: 0, v: 1700 * u, flight: Math.hypot(vx - x0, vy - y0), delta: false, onEnd: (p) => this.burst(p.x, p.y, ang) });
      // a few non-interacting beam tracks crossing the whole picture
      for (let i = randi(0, 1); i > 0; i--) {
        this.add({ x: -10, y: rand(0.05, 0.95) * H, th: ang + rand(-0.05, 0.05), q: 1, r: rand(6000, 30000), k: 0, v: rand(1200, 1800) * u });
      }
    }

    // (re)creates the track layer at the current stage size, carrying over what was already drawn
    allocLayer() {
      const { W, H, dpr } = PC, old = this.layer;
      this.layer = layerPool.pop() || document.createElement('canvas');
      this.layer.width = Math.round(W * dpr);
      this.layer.height = Math.round(H * dpr);
      this.g = this.layer.getContext('2d');
      this.g.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.g.lineCap = 'round';
      this.g.lineJoin = 'round';
      if (old) { this.g.drawImage(old, 0, 0, this.W, this.H); layerPool.push(old); }
      this.W = W; this.H = H;
    }

    add(o) {
      if (this.spawned >= 90) return;
      this.spawned++;
      this.particles.push(new Particle(o));
    }

    burst(x, y, dir) {
      const u = PC.u;
      const n = randi(2, 5);
      for (let i = 0; i < n; i++) {
        const th = dir + gauss() * 0.85, q = Math.random() < 0.5 ? 1 : -1, t = Math.random();
        if (i === 0) this.add({ x, y, th, q, r: rand(140, 330) * u, k: rand(0.02, 0.045), v: rand(750, 1150) * u });
        else if (t < 0.6) this.add({ x, y, th, q, r: rand(38, 130) * u, k: rand(0.03, 0.08), v: rand(420, 760) * u });
        else this.add({ x, y, th, q, r: rand(900, 5000) * u, k: 0.01, v: rand(900, 1400) * u });
      }
      // neutral particles: invisible flight, then a "V" of two opposite curls
      for (let i = randi(0, 1); i > 0; i--) {
        const th = dir + gauss() * 0.6, conv = Math.random() < 0.5;
        this.add({
          x, y, th, q: 0, r: 1e9, k: 0, v: 900 * u, visible: false, flight: rand(70, 320) * u,
          onEnd: (p) => {
            const r = conv ? rand(12, 42) : rand(35, 120), k = conv ? rand(0.06, 0.12) : rand(0.03, 0.07);
            for (const s of [1, -1]) this.add({ x: p.x, y: p.y, th: p.th + s * 0.1, q: s, r: r * rand(0.7, 1.3) * u, k, v: rand(380, 640) * u });
          },
        });
      }
    }

    update(dt) {
      let active = false;
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        if (p.alive) { p.step(dt, this); active = true; }
      }
      if (!active) this.rest += dt;
      this.alpha = this.rest < this.hold ? 1 : 1 - (this.rest - this.hold) / this.fade;
    }
  }

  PC.Chamber = {
    events: [],
    spawn(x, y) {
      const { W, H } = PC;
      if (this.events.length >= (x === undefined ? 4 : 7)) return false;
      this.events.push(new ChamberEvent(x ?? rand(0.2, 0.85) * W, y ?? rand(0.22, 0.78) * H));
      return true;
    },
    update(dt) {
      for (let i = this.events.length - 1; i >= 0; i--) {
        const ev = this.events[i];
        ev.update(dt);
        if (ev.alpha <= 0) { layerPool.push(ev.layer); this.events.splice(i, 1); }
      }
    },
    draw(ctx) {
      for (const ev of this.events) {
        ctx.globalAlpha = clamp(ev.alpha);
        ctx.drawImage(ev.layer, 0, 0, ev.W, ev.H);
      }
      ctx.globalAlpha = 1;
    },
    resize() { for (const ev of this.events) ev.allocLayer(); },
    reset() {
      for (const ev of this.events) layerPool.push(ev.layer);
      this.events.length = 0;
    },
  };
})();
