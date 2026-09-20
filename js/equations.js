// equations.js — KaTeX equations written onto the screen, plus multi-line derivations that unfold line by line
(function () {
  const { rand, clamp } = PC;

  const SINGLES = [
    String.raw`\left(\frac{-\hbar^2}{2m}\nabla^2+V\right)\psi=i\hbar\frac{\partial\psi}{\partial t}`,
    String.raw`\Delta x_i\,\Delta p_i\ge\frac{\hbar}{2}`,
    String.raw`(i\gamma^\mu\partial_\mu-m)\psi=0`,
    String.raw`G_{\mu\nu}+\Lambda g_{\mu\nu}=\frac{8\pi G}{c^4}T_{\mu\nu}`,
    String.raw`\nabla\times\mathbf{B}=\mu_0\mathbf{J}+\mu_0\varepsilon_0\frac{\partial\mathbf{E}}{\partial t}`,
    String.raw`\nabla\cdot\mathbf{E}=\frac{\rho}{\varepsilon_0}`,
    String.raw`\partial_\mu F^{\mu\nu}=\mu_0 J^\nu`,
    String.raw`\langle x_f|e^{-iHt/\hbar}|x_i\rangle=\int\mathcal{D}x\,e^{\frac{i}{\hbar}S[x]}`,
    String.raw`S=\int\mathrm{d}^4x\,\sqrt{-g}\left(\frac{R}{16\pi G}+\mathcal{L}_m\right)`,
    String.raw`\mathcal{L}=-\frac14F_{\mu\nu}F^{\mu\nu}+i\bar\psi\gamma^\mu D_\mu\psi+|D_\mu\phi|^2-V(\phi)`,
    String.raw`\frac{\mathrm d}{\mathrm dt}\frac{\partial L}{\partial\dot q_i}-\frac{\partial L}{\partial q_i}=0`,
    String.raw`S=k_B\ln\Omega`,
    String.raw`Z=\sum_n e^{-\beta E_n}`,
    String.raw`B_\nu(T)=\frac{2h\nu^3}{c^2}\frac{1}{e^{h\nu/k_BT}-1}`,
    String.raw`[\hat x,\hat p]=i\hbar`,
    String.raw`E^2=(pc)^2+(mc^2)^2`,
    String.raw`\left(\Box+\frac{m^2c^2}{\hbar^2}\right)\phi=0`,
    String.raw`\rho\left(\frac{\partial\mathbf v}{\partial t}+\mathbf v\cdot\nabla\mathbf v\right)=-\nabla p+\mu\nabla^2\mathbf v`,
    String.raw`\left(\frac{\dot a}{a}\right)^2=\frac{8\pi G}{3}\rho-\frac{kc^2}{a^2}+\frac{\Lambda c^2}{3}`,
    String.raw`\frac{\mathrm d^2x^\mu}{\mathrm d\tau^2}+\Gamma^\mu_{\alpha\beta}\frac{\mathrm dx^\alpha}{\mathrm d\tau}\frac{\mathrm dx^\beta}{\mathrm d\tau}=0`,
    String.raw`\Gamma_{i\to f}=\frac{2\pi}{\hbar}\left|\langle f|H'|i\rangle\right|^2\rho(E_f)`,
    String.raw`-\left\langle\frac{\mathrm dE}{\mathrm dx}\right\rangle=Kz^2\frac{Z}{A}\frac{1}{\beta^2}\left[\frac12\ln\frac{2m_ec^2\beta^2\gamma^2W_{\max}}{I^2}-\beta^2\right]`,
    String.raw`\mathbf F=q(\mathbf E+\mathbf v\times\mathbf B)`,
    String.raw`r=\frac{p_\perp}{|q|B}`,
    String.raw`|\langle AB\rangle+\langle AB'\rangle+\langle A'B\rangle-\langle A'B'\rangle|\le2`,
    String.raw`\hat f(k)=\int_{-\infty}^{\infty}f(x)\,e^{-2\pi ikx}\,\mathrm dx`,
    String.raw`\psi_{n\ell m}(r,\theta,\varphi)=R_{n\ell}(r)\,Y_\ell^m(\theta,\varphi)`,
    String.raw`E_n=-\frac{m_ee^4}{8\varepsilon_0^2h^2}\frac1{n^2}`,
    String.raw`\frac{\partial\rho}{\partial t}+\nabla\cdot\mathbf j=0`,
    String.raw`D_\mu=\partial_\mu-ig_sT^aG^a_\mu-ig\frac{\sigma^i}{2}W^i_\mu-ig'\frac Y2B_\mu`,
    String.raw`R_{\mu\nu}-\frac12Rg_{\mu\nu}=\kappa T_{\mu\nu}`,
    String.raw`\mathrm ds^2=-\left(1-\frac{r_s}{r}\right)c^2\mathrm dt^2+\left(1-\frac{r_s}{r}\right)^{-1}\mathrm dr^2+r^2\mathrm d\Omega^2`,
    String.raw`T_H=\frac{\hbar c^3}{8\pi GMk_B}`,
    String.raw`i\hbar\frac{\mathrm d}{\mathrm dt}|\psi(t)\rangle=\hat H|\psi(t)\rangle`,
    String.raw`\rho(t)=e^{-iHt/\hbar}\,\rho(0)\,e^{iHt/\hbar}`,
    String.raw`\sigma(e^+e^-\to\mu^+\mu^-)=\frac{4\pi\alpha^2}{3s}`,
    String.raw`\alpha=\frac{e^2}{4\pi\varepsilon_0\hbar c}\approx\frac1{137}`,
    String.raw`a_\mu=\frac{g-2}{2}=\frac{\alpha}{2\pi}+\cdots`,
    String.raw`\mathcal M=\bar u(p_3)(ie\gamma^\mu)u(p_1)\,\frac{-ig_{\mu\nu}}{q^2}\,\bar u(p_4)(ie\gamma^\nu)u(p_2)`,
    String.raw`\beta(g)=\mu\frac{\partial g}{\partial\mu}=-\frac{g^3}{16\pi^2}\left(11-\frac23n_f\right)`,
    String.raw`\oint_{\partial\Sigma}\mathbf E\cdot\mathrm d\boldsymbol\ell=-\frac{\mathrm d}{\mathrm dt}\int_\Sigma\mathbf B\cdot\mathrm d\mathbf S`,
    String.raw`\nabla^2\phi-\frac1{c^2}\frac{\partial^2\phi}{\partial t^2}=0`,
    String.raw`Y_\ell^m(\theta,\varphi)=\sqrt{\frac{2\ell+1}{4\pi}\frac{(\ell-m)!}{(\ell+m)!}}\,P_\ell^m(\cos\theta)\,e^{im\varphi}`,
    String.raw`\langle\hat A\rangle=\mathrm{Tr}(\hat\rho\hat A)`,
    String.raw`\delta S=0`,
    String.raw`n\to p+e^-+\bar\nu_e`,
    String.raw`F_{\mu\nu}^a=\partial_\mu A_\nu^a-\partial_\nu A_\mu^a+gf^{abc}A_\mu^bA_\nu^c`,
    String.raw`\frac{1}{\lambda}=R_\infty\left(\frac1{n_1^2}-\frac1{n_2^2}\right)`,
    String.raw`S_{BH}=\frac{k_Bc^3A}{4G\hbar}`,
    String.raw`U(\Lambda)=\exp\left(-\frac i2\omega_{\mu\nu}M^{\mu\nu}\right)`,
  ];

  const DERIVATIONS = [
    [ // separation of variables
      String.raw`i\hbar\,\partial_t\Psi=\hat H\Psi,\quad\Psi(x,t)=\psi(x)\,T(t)`,
      String.raw`i\hbar\frac1T\frac{\mathrm dT}{\mathrm dt}=\frac1\psi\hat H\psi=E`,
      String.raw`T(t)=e^{-iEt/\hbar}`,
      String.raw`\Rightarrow\;-\frac{\hbar^2}{2m}\frac{\mathrm d^2\psi}{\mathrm dx^2}+V\psi=E\psi`,
    ],
    [ // Maxwell → wave equation
      String.raw`\nabla\times(\nabla\times\mathbf E)=-\frac{\partial}{\partial t}(\nabla\times\mathbf B)`,
      String.raw`\nabla(\nabla\cdot\mathbf E)-\nabla^2\mathbf E=-\mu_0\varepsilon_0\frac{\partial^2\mathbf E}{\partial t^2}`,
      String.raw`\Rightarrow\;\nabla^2\mathbf E=\frac1{c^2}\frac{\partial^2\mathbf E}{\partial t^2},\quad c=\frac1{\sqrt{\mu_0\varepsilon_0}}`,
    ],
    [ // why the tracks curl
      String.raw`\frac{\mathrm d\mathbf p}{\mathrm dt}=q\,\mathbf v\times\mathbf B`,
      String.raw`\frac{\gamma mv^2}{r}=|q|vB`,
      String.raw`\Rightarrow\;r=\frac{p}{|q|B},\quad p\,[\mathrm{GeV}/c]\simeq0.3\,B\,[\mathrm T]\;r\,[\mathrm m]`,
    ],
    [ // Dirac
      String.raw`E^2=p^2c^2+m^2c^4`,
      String.raw`\hat H=c\,\boldsymbol\alpha\cdot\hat{\mathbf p}+\beta mc^2`,
      String.raw`\{\alpha_i,\alpha_j\}=2\delta_{ij},\quad\{\alpha_i,\beta\}=0,\quad\beta^2=1`,
      String.raw`\Rightarrow\;(i\hbar\gamma^\mu\partial_\mu-mc)\psi=0`,
    ],
    [ // Noether
      String.raw`\phi\to\phi+\epsilon\,\delta\phi,\qquad\delta\mathcal L=\partial_\mu K^\mu`,
      String.raw`j^\mu=\frac{\partial\mathcal L}{\partial(\partial_\mu\phi)}\delta\phi-K^\mu`,
      String.raw`\Rightarrow\;\partial_\mu j^\mu=0`,
    ],
    [ // uncertainty
      String.raw`\sigma_A^2\sigma_B^2\ge\left|\frac1{2i}\langle[\hat A,\hat B]\rangle\right|^2`,
      String.raw`[\hat x,\hat p]=i\hbar`,
      String.raw`\Rightarrow\;\sigma_x\sigma_p\ge\frac\hbar2`,
    ],
    [ // least action
      String.raw`\delta S=\delta\int_{t_1}^{t_2}L(q,\dot q,t)\,\mathrm dt=0`,
      String.raw`\int_{t_1}^{t_2}\left(\frac{\partial L}{\partial q}-\frac{\mathrm d}{\mathrm dt}\frac{\partial L}{\partial\dot q}\right)\delta q\,\mathrm dt=0`,
      String.raw`\Rightarrow\;\frac{\mathrm d}{\mathrm dt}\frac{\partial L}{\partial\dot q}=\frac{\partial L}{\partial q}`,
    ],
    [ // Higgs mechanism
      String.raw`V(\phi)=-\mu^2\phi^\dagger\phi+\lambda(\phi^\dagger\phi)^2`,
      String.raw`\langle\phi\rangle=\frac1{\sqrt2}\begin{pmatrix}0\\v\end{pmatrix},\quad v=\frac{\mu}{\sqrt\lambda}\approx246\ \mathrm{GeV}`,
      String.raw`\Rightarrow\;m_W=\frac{gv}2,\quad m_Z=\frac v2\sqrt{g^2+g'^2},\quad m_H=\sqrt{2\lambda}\,v`,
    ],
    [ // Planck
      String.raw`\langle E\rangle=\frac{h\nu}{e^{h\nu/k_BT}-1}`,
      String.raw`u(\nu,T)=\frac{8\pi\nu^2}{c^3}\langle E\rangle=\frac{8\pi h\nu^3}{c^3}\frac1{e^{h\nu/k_BT}-1}`,
      String.raw`\Rightarrow\;\int_0^\infty u\,\mathrm d\nu=\frac{8\pi^5k_B^4}{15h^3c^3}\,T^4`,
    ],
  ];

  const HIDDEN = 'linear-gradient(90deg, transparent, transparent)';
  const setMask = (el, v) => { el.style.webkitMaskImage = v; el.style.maskImage = v; };

  class EqItem {
    constructor(root, lines, fontPx) {
      this.lines = lines.length;
      this.el = document.createElement('div');
      this.el.className = 'eq';
      this.el.style.fontSize = fontPx + 'px';
      this.lineEls = lines.map((tex) => {
        const d = document.createElement('div');
        d.className = 'eq-line';
        katex.render(tex, d, { displayMode: true, throwOnError: false });
        setMask(d, HIDDEN);
        this.el.appendChild(d);
        return d;
      });
      root.appendChild(this.el);
      this.w = this.el.offsetWidth;
      this.h = this.el.offsetHeight;
      this.idx = 0; this.t = 0; this.pause = 0;
      this.state = 'write';
      this.hold = rand(14, 24) + (this.lines > 1 ? 10 : 0);
      this.peak = rand(0.82, 1);
    }
    show(rect) {
      this.rect = rect;
      this.el.style.transform = `translate(${rect.x}px, ${rect.y}px)`;
      this.el.style.opacity = this.peak;
      this.el.style.visibility = 'visible';
      this.durs = this.lineEls.map((d) => Math.max(1.1, d.offsetWidth / (250 * PC.u)));
    }
    update(dt) {
      if (this.state === 'write') {
        if (this.pause > 0) { this.pause -= dt; return; }
        this.t += dt;
        const el = this.lineEls[this.idx], f = clamp(this.t / this.durs[this.idx]);
        if (f >= 1) {
          setMask(el, 'none');
          this.idx++; this.t = 0; this.pause = 0.9;
          if (this.idx >= this.lines) { this.state = 'hold'; this.t = 0; }
        } else {
          const b = f * 110;
          setMask(el, `linear-gradient(90deg, #000 ${b - 10}%, transparent ${b}%)`);
        }
      } else if (this.state === 'hold') {
        this.t += dt;
        if (this.t > this.hold) { this.state = 'fade'; this.t = 0; }
      } else if (this.state === 'fade') {
        this.t += dt;
        this.el.style.opacity = this.peak * clamp(1 - this.t / 3.5);
        if (this.t > 3.5) this.state = 'dead';
      }
    }
    remove() { this.el.remove(); }
  }

  PC.Eqs = {
    root: null,
    list: [],
    singles: new PC.Bag(SINGLES),
    derivs: new PC.Bag(DERIVATIONS),
    spawn() {
      if (!window.katex) return false;
      const nDeriv = this.list.filter((e) => e.lines > 1).length;
      const deriv = nDeriv < 2 && Math.random() < 0.3;
      const lines = deriv ? this.derivs.next() : [this.singles.next()];
      const longest = Math.max(...lines.map((l) => l.length));
      let px = (deriv ? rand(17, 22) : longest > 95 ? rand(16, 20) : longest > 55 ? rand(19, 27) : rand(24, 38)) * PC.u;
      for (let attempt = 0; attempt < 2; attempt++, px *= 0.78) {
        const item = new EqItem(this.root, lines, Math.round(px));
        const rect = PC.Layout.place(item.w, item.h, { pad: 14 });
        if (rect) { item.show(rect); this.list.push(item); return true; }
        item.remove();
      }
      return false;
    },
    update(dt) {
      for (let i = this.list.length - 1; i >= 0; i--) {
        const e = this.list[i];
        e.update(dt);
        if (e.state === 'dead') { e.remove(); PC.Layout.release(e.rect); this.list.splice(i, 1); }
      }
    },
    // after a resize: start fading whatever no longer fits on screen
    evict() {
      for (const e of this.list) {
        if ((e.rect.x + e.rect.w > PC.W || e.rect.y + e.rect.h > PC.H) && e.state !== 'fade') { e.state = 'fade'; e.t = 0; }
      }
    },
    reset() {
      for (const e of this.list) e.remove();
      this.list.length = 0;
    },
  };
})();
