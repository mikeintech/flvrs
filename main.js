(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  gsap.registerPlugin(ScrollTrigger);

  // garment color (bg), thread color (logo), and the logo file per flavor
  const FLAVORS = [
    { id: 'cream', name: 'Creamsicle', desc: 'Cream fleece · orange stitch', bg: '#f1e7d2', thread: '#ff5a14', logo: 'orange' },
    { id: 'blue', name: 'Cherry Ice', desc: 'Sky blue fleece · cherry red stitch', bg: '#9fc4ee', thread: '#d8241f', logo: 'red' },
    { id: 'grey', name: 'Grape', desc: 'Heather grey fleece · grape stitch', bg: '#cfcfd1', thread: '#5b2a86', logo: 'purple' },
    { id: 'pink', name: 'Pink Licorice', desc: 'Pink fleece · black stitch', bg: '#f5c6d6', thread: '#151515', logo: 'black' },
  ];
  const PRICE = { hoodie: 65, pants: 55 };     // placeholders until the drop is live
  const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL'];
  const img = (f, p) => `img/${f}-${p}.png?v=5`;

  // ---------- 1. pick your flavor ----------
  const hoodie = $('.hoodie'), pants = $('.pants'), logo = $('.logo'), fname = $('.fname'), fdesc = $('.fdesc');
  const flood = $('.flood'), scoops = $('.scoops');
  let cur = 0;
  FLAVORS.forEach((f, i) => {
    const b = document.createElement('button');
    b.className = 'scoop'; b.setAttribute('role', 'radio'); b.setAttribute('aria-label', f.name);
    b.style.setProperty('--c', f.bg); b.style.setProperty('--t', f.thread);
    b.onclick = () => setFlavor(i, b);
    scoops.appendChild(b);
  });
  function paint(f) {
    document.documentElement.style.setProperty('--bg', f.bg);
    document.documentElement.style.setProperty('--accent', f.thread);
    $$('.scoop').forEach((s, i) => s.setAttribute('aria-checked', FLAVORS[i] === f));
  }
  function setFlavor(i, from, first, auto) {
    const f = FLAVORS[i]; cur = i;
    if (first) {
      hoodie.src = img(f.id, 'hoodie'); pants.src = img(f.id, 'pants'); logo.src = `img/logo-${f.logo}.png`;
      fname.textContent = f.name; fdesc.textContent = f.desc; paint(f); flood.style.background = f.bg; return;
    }
    // color floods out of the scoop you tapped
    const r = from.getBoundingClientRect(), hr = $('.hero').getBoundingClientRect();
    const x = r.left + r.width / 2 - hr.left, y = r.top + r.height / 2 - hr.top;
    const wave = document.createElement('div');
    wave.style.cssText = `position:absolute;inset:0;z-index:-1;background:${f.bg};clip-path:circle(0px at ${x}px ${y}px)`;
    $('.hero').appendChild(wave);
    const R = Math.hypot(Math.max(x, hr.width - x), Math.max(y, hr.height - y));
    gsap.to(wave, { clipPath: `circle(${R}px at ${x}px ${y}px)`, duration: .8, ease: 'power3.inOut', onComplete: () => { flood.style.background = f.bg; wave.remove(); } });
    paint(f);
    // pieces drop out, new ones swing in
    gsap.timeline()
      .to(hoodie, { y: 120, rotate: -14, opacity: 0, duration: .3, ease: 'power2.in' }, 0)
      .to(pants, { y: 140, rotate: 12, opacity: 0, duration: .3, ease: 'power2.in' }, .05)
      .to(logo, { scale: .6, opacity: 0, duration: .25, ease: 'power2.in' }, 0)
      .to(fname, { y: 30, opacity: 0, duration: .2 }, 0)
      .add(() => {
        hoodie.src = img(f.id, 'hoodie'); pants.src = img(f.id, 'pants'); logo.src = `img/logo-${f.logo}.png`;
        fname.textContent = f.name; fdesc.textContent = f.desc;
      })
      .fromTo(hoodie, { y: -160, rotate: 18, opacity: 0 }, { y: 0, rotate: -4, opacity: 1, duration: .9, ease: 'elastic.out(1,.6)' })
      .fromTo(pants, { y: -180, rotate: -16, opacity: 0 }, { y: 0, rotate: 4, opacity: 1, duration: .9, ease: 'elastic.out(1,.6)' }, '<.08')
      .fromTo(logo, { scale: 1.4, opacity: 0 }, { scale: 1, opacity: 1, duration: .6, ease: 'back.out(2.2)' }, '<')
      .fromTo(fname, { y: -24, opacity: 0 }, { y: 0, opacity: 1, duration: .5 }, '<.1');
    pickBuild('hoodie', i); pickBuild('pants', i);
  }
  setFlavor(0, null, true);
  gsap.set(hoodie, { rotate: -4 }); gsap.set(pants, { rotate: 4 });

  // ---------- idle mode: flavors rotate on their own and the pieces trade sides ----------
  const stage = $('.stage');
  let busy = false;
  // one move at a time: either the pieces trade sides, or the color changes. Never both together.
  // pieces glide across and trade places in one continuous move (FLIP: measure, swap, animate from old spot)
  function sideSwap() {
    busy = true;
    const b = [hoodie, pants].map(el => el.getBoundingClientRect());
    gsap.set([hoodie, pants], { x: 0, y: 0 });
    const a0 = [hoodie, pants].map(el => el.getBoundingClientRect());
    stage.classList.toggle('flip');
    const a1 = [hoodie, pants].map(el => el.getBoundingClientRect());
    const dx = [0, 1].map(k => b[k].left - a1[k].left), dy = [0, 1].map(k => b[k].top - a1[k].top);
    gsap.set(hoodie, { zIndex: 5 });
    gsap.timeline({ onComplete: () => { busy = false; gsap.set(hoodie, { clearProps: 'zIndex' }); } })
      // hoodie arcs up and over in front, pants dip and pass behind
      .fromTo(hoodie, { x: dx[0], y: dy[0] }, { x: 0, duration: 1.6, ease: 'power2.inOut' }, 0)
      .to(hoodie, { keyframes: { y: [dy[0], dy[0] * .5 - 70, 0], easeEach: 'sine.inOut' }, duration: 1.6 }, 0)
      .to(hoodie, { keyframes: { rotation: [-4, 6, -4], scale: [1, 1.06, 1] }, duration: 1.6, ease: 'sine.inOut' }, 0)
      .fromTo(pants, { x: dx[1], y: dy[1] }, { x: 0, duration: 1.6, ease: 'power2.inOut' }, 0)
      .to(pants, { keyframes: { y: [dy[1], dy[1] * .5 + 50, 0], easeEach: 'sine.inOut' }, duration: 1.6 }, 0)
      .to(pants, { keyframes: { rotation: [4, -5, 4], scale: [1, .94, 1] }, duration: 1.6, ease: 'sine.inOut' }, 0);
  }
  // color change: the new colorway cross-fades right over the old one, nothing vanishes
  function crossfade(el, src) {
    const ghost = el.cloneNode(); ghost.removeAttribute('data-depth'); ghost.classList.add('ghost');
    ghost.src = src; ghost.style.opacity = 0;
    el.after(ghost);
    gsap.set(ghost, { x: gsap.getProperty(el, 'x'), y: gsap.getProperty(el, 'y'), rotation: gsap.getProperty(el, 'rotation'), xPercent: gsap.getProperty(el, 'xPercent'), yPercent: gsap.getProperty(el, 'yPercent') });
    return gsap.to(ghost, { opacity: 1, duration: 1.2, ease: 'sine.inOut', onComplete: () => { el.src = src; ghost.remove(); } });
  }
  function colorFade(i) {
    const f = FLAVORS[i]; cur = i; busy = true;
    gsap.timeline({ onComplete: () => (busy = false) })
      .to(flood, { backgroundColor: f.bg, duration: 1.4, ease: 'sine.inOut' }, 0)
      .add(() => paint(f), 0)
      .add(() => { crossfade(hoodie, img(f.id, 'hoodie')); crossfade(pants, img(f.id, 'pants')); crossfade(logo, `img/logo-${f.logo}.png`); }, 0)
      .to(fname, { opacity: 0, duration: .4 }, .1)
      .add(() => { fname.textContent = f.name; fdesc.textContent = f.desc; }, .5)
      .to(fname, { opacity: 1, duration: .6 }, .55)
      .to({}, { duration: .1 }, 1.3);
  }
  // idle: after ~5s quiet the pieces trade sides; after a couple of swaps the next step is a color change
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lastTouch = performance.now(), lastAuto = performance.now(), ticks = 0;
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(ev => addEventListener(ev, () => { lastTouch = performance.now(); ticks = 0; }, { passive: true }));
  if (!calm) setInterval(() => {
    const now = performance.now();
    if (busy || document.hidden || scrollY > innerHeight * .5) return;   // only while the hero is on screen
    if (now - lastTouch < 5000 || now - lastAuto < 6000) return;
    lastAuto = now; ticks++;
    if (ticks % 3 === 0) colorFade((cur + 1) % FLAVORS.length);          // every third step: new flavor, no movement
    else sideSwap();                                                       // otherwise: trade sides, same flavor
  }, 500);

  // hero intro (skipped if the page opens in a background tab, so nothing is left hidden)
  const intro = gsap.timeline({ defaults: { ease: 'power4.out' } });
  if (document.hidden) addEventListener('visibilitychange', () => intro.progress(1), { once: true });
  intro
    .from('.top', { y: -40, opacity: 0, duration: .8 })
    .from(logo, { scale: .7, opacity: 0, duration: 1 }, .1)
    .from(hoodie, { x: -200, opacity: 0, rotate: -20, duration: 1.2 }, .25)
    .from(pants, { x: 200, opacity: 0, rotate: 20, duration: 1.2 }, .35)
    .from('.fname, .fdesc, .kicker', { y: 24, opacity: 0, stagger: .08, duration: .8 }, .5)
    .from('.scoop', { y: 30, opacity: 0, stagger: .07, duration: .6, ease: 'back.out(2.5)', clearProps: 'transform,opacity' }, .7)
    .from('.cta', { y: 20, opacity: 0, duration: .6 }, 1);

  // 3D tilt: pieces follow the pointer at different depths
  if (matchMedia('(hover:hover)').matches) {
    const pieces = $$('.piece'), lw = $('.logo-wrap');
    gsap.set(lw, { xPercent: -50, yPercent: -50, x: 0, y: 0 });   // centering lives in GSAP so the parallax can't knock it off
    const tilt = pieces.map(p => [gsap.quickTo(p, 'rotationY', { duration: .6 }), gsap.quickTo(p, 'rotationX', { duration: .6 }), gsap.quickTo(p, 'x', { duration: .8 }), +p.dataset.depth]);
    const lx = gsap.quickTo(lw, 'x', { duration: .9 }), ly = gsap.quickTo(lw, 'y', { duration: .9 });
    addEventListener('pointermove', e => {
      if (busy) return;                                    // don't fight the idle swap mid-spin
      const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
      tilt.forEach(([ry, rx, x, d]) => { ry(nx * 30 * d); rx(-ny * 18 * d); x(nx * 40 * d); });
      lx(nx * -20); ly(ny * -12);
    }, { passive: true });
  }
  // gentle float
  gsap.to('.hoodie', { yPercent: -3, duration: 2.4, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  gsap.to('.pants', { yPercent: 3, duration: 2.8, yoyo: true, repeat: -1, ease: 'sine.inOut' });

  // marquee
  const words = FLAVORS.map(f => `<span>${f.name} <b>●</b></span>`).join('') + '<span>Stitched not printed <b>●</b></span>';
  $('.track').innerHTML = words + words + words + words;

  // ---------- 2. embroidery magnifier ----------
  const box = $('.lensbox'), big = $('.big'), lens = $('.lens');
  big.src = 'img/logo-red.png';
  const Z = 2.0;
  box.addEventListener('pointermove', e => {
    const br = box.getBoundingClientRect(), ir = big.getBoundingClientRect();
    const x = e.clientX - br.left, y = e.clientY - br.top;
    const ix = e.clientX - ir.left, iy = e.clientY - ir.top;
    lens.style.left = x + 'px'; lens.style.top = y + 'px';
    lens.style.backgroundImage = `url(${big.src})`;
    lens.style.backgroundSize = `${ir.width * Z}px ${ir.height * Z}px`;
    lens.style.backgroundPosition = `${-(ix * Z - 100)}px ${-(iy * Z - 100)}px`;
  });
  // the close-up cycles the thread colors as you scroll past
  ScrollTrigger.create({ trigger: '.stitch', start: 'top 70%', end: 'bottom 30%', onUpdate: s => {
    const k = ['red', 'purple', 'black', 'orange'][Math.min(3, Math.floor(s.progress * 4))];
    if (!big.src.endsWith(`logo-${k}.png`)) big.src = `img/logo-${k}.png`;
  } });

  // ---------- 3. build a set ----------
  const pick = { hoodie: 0, pants: 0, size: null };
  const pvTop = $('.pv-top'), pvBot = $('.pv-bot');
  $$('.opts').forEach(o => {
    const part = o.dataset.part;
    FLAVORS.forEach((f, i) => {
      const b = document.createElement('button'); b.className = 'opt'; b.setAttribute('role', 'radio');
      b.setAttribute('aria-label', `${f.name} ${part === 'hoodie' ? 'hoodie' : 'pants'}`);
      b.innerHTML = `<img src="${img(f.id, part)}" alt="">`;
      b.onclick = () => pickBuild(part, i, true);
      o.appendChild(b);
    });
  });
  SIZES.forEach(s => {
    const b = document.createElement('button'); b.className = 'size'; b.textContent = s; b.setAttribute('role', 'radio');
    b.onclick = () => { pick.size = s; $$('.size').forEach(x => x.setAttribute('aria-checked', x === b)); updateBuild(); };
    $('.sizes').appendChild(b);
  });
  function pickBuild(part, i, anim) {
    pick[part] = i;
    $$(`.opts[data-part=${part}] .opt`).forEach((b, k) => b.setAttribute('aria-checked', k === i));
    const el = part === 'hoodie' ? pvTop : pvBot;
    if (anim) gsap.timeline()
      .to(el, { x: part === 'hoodie' ? -60 : 60, opacity: 0, rotate: part === 'hoodie' ? -8 : 8, duration: .2, ease: 'power2.in' })
      .add(() => { el.src = img(FLAVORS[i].id, part); })
      .fromTo(el, { x: part === 'hoodie' ? 60 : -60, rotate: part === 'hoodie' ? 8 : -8 }, { x: 0, rotate: 0, opacity: 1, duration: .5, ease: 'back.out(1.8)', xPercent: -50 });
    else { el.src = img(FLAVORS[i].id, part); gsap.set(el, { xPercent: -50, x: 0 }); }
    updateBuild();
  }
  function updateBuild() {
    const t = FLAVORS[pick.hoodie], b = FLAVORS[pick.pants];
    $('.combo').textContent = t === b ? `${t.name} set` : `${t.name} top × ${b.name} bottom`;
    $('.preview').style.background = `linear-gradient(180deg, ${t.bg}55, ${b.bg}55), #fff`;
    $('.total').textContent = '$' + (PRICE.hoodie + PRICE.pants);
    const add = $('.add'); add.disabled = !pick.size; add.textContent = pick.size ? `Add set to bag · ${pick.size}` : 'Pick a size';
  }
  pvTop.style.transform = 'none'; pvBot.style.transform = 'none';
  pickBuild('hoodie', 0); pickBuild('pants', 0);

  // ---------- bag ----------
  let bag = [];
  try { bag = JSON.parse(localStorage.getItem('flvrs-bag') || '[]'); } catch (e) {}
  const save = () => { try { localStorage.setItem('flvrs-bag', JSON.stringify(bag)); } catch (e) {} };
  function renderBag() {
    $('.count').textContent = bag.length;
    const ul = $('.items');
    ul.innerHTML = bag.length ? '' : '<li class="empty">Your bag is empty. Pick a flavor.</li>';
    bag.forEach((it, k) => {
      const t = FLAVORS[it.top], b = FLAVORS[it.bot];
      const li = document.createElement('li');
      li.innerHTML = `<div class="thumb"><img src="${img(t.id, 'hoodie')}" alt=""><img src="${img(b.id, 'pants')}" alt=""></div>
        <div><b>${t === b ? t.name + ' set' : t.name + ' × ' + b.name}</b><small>Size ${it.size} · $${PRICE.hoodie + PRICE.pants}</small></div>
        <button class="rm">Remove</button>`;
      li.querySelector('.rm').onclick = () => { bag.splice(k, 1); save(); renderBag(); };
      ul.appendChild(li);
    });
    $('.bagtotal').textContent = '$' + bag.length * (PRICE.hoodie + PRICE.pants);
  }
  const openBag = on => { $('.bag').classList.toggle('open', on); $('.scrim').classList.toggle('on', on); $('.bag').setAttribute('aria-hidden', !on); };
  $('.bagbtn').onclick = () => openBag(true); $('.close').onclick = () => openBag(false); $('.scrim').onclick = () => openBag(false);
  $('.add').onclick = () => {
    if (!pick.size) return;
    bag.push({ top: pick.hoodie, bot: pick.pants, size: pick.size }); save(); renderBag();
    // the hoodie flies into the bag
    const r = pvTop.getBoundingClientRect(), t = $('.bagbtn').getBoundingClientRect();
    const f = document.createElement('img'); f.className = 'fly'; f.src = pvTop.src; f.style.left = r.left + 'px'; f.style.top = r.top + 'px'; f.style.height = r.height + 'px';
    document.body.appendChild(f);
    gsap.to(f, { left: t.left, top: t.top, height: 24, rotate: 25, opacity: .3, duration: .8, ease: 'power3.in', onComplete: () => { f.remove(); gsap.fromTo('.bagbtn', { scale: 1.25 }, { scale: 1, duration: .6, ease: 'elastic.out(1.2,.4)' }); } });
  };
  renderBag();

  // ---------- 4. lineup ----------
  FLAVORS.forEach((f, i) => {
    const c = document.createElement('div'); c.className = 'card'; c.style.setProperty('--c', f.bg);
    c.innerHTML = `<div class="set"><img src="${img(f.id, 'hoodie')}" alt=""><img src="${img(f.id, 'pants')}" alt=""></div><h3>${f.name}</h3><small>${f.desc}</small>`;
    c.onclick = () => { scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => setFlavor(i, $$('.scoop')[i]), 500); };
    $('.cards').appendChild(c);
  });

  // scroll reveals
  gsap.utils.toArray('.stitch .copy > *, .build h2, .build .sub, .lineup h2').forEach(el =>
    gsap.from(el, { y: 50, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } }));
  gsap.from('.card', { y: 80, opacity: 0, stagger: .1, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: '.cards', start: 'top 85%' } });
  gsap.from('.lensbox', { y: 60, rotate: -3, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.lensbox', start: 'top 85%' } });
})();
