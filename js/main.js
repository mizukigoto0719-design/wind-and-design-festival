/* WIND & DESIGN FESTIVAL — Vanilla JS
   1. Motion typography   2. Hamburger menu   3. Parallax
   4. Slideshow           5. Modal window     6. Accordion */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     1. MOTION TYPOGRAPHY
     Splits text into characters, staggers them in on load / on scroll.
     A marquee reacts to scroll speed and direction.
  ------------------------------------------------------------------ */
  function splitText(el) {
    const lines = $$('.ln', el);
    const targets = lines.length ? lines : [el];
    if (!el.hasAttribute('aria-label')) {
      el.setAttribute('aria-label', targets.map((t) => t.textContent.trim()).join(' '));
    }
    let n = 0;
    targets.forEach((t) => {
      const text = t.textContent.trim();
      t.textContent = '';
      text.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { t.append(' '); return; }
        const ascii = /^[\x21-\x7E]+$/.test(part);
        const holder = ascii ? document.createElement('span') : t;
        if (ascii) { holder.className = 'w'; holder.setAttribute('aria-hidden', 'true'); }
        [...part].forEach((c) => {
          const s = document.createElement('span');
          s.className = 'ch';
          s.setAttribute('aria-hidden', 'true');
          s.style.setProperty('--i', n++);
          s.textContent = c;
          holder.append(s);
        });
        if (ascii) t.append(holder);
      });
    });
    el.classList.add('split');
  }

  function initTypography() {
    const all = $$('[data-split]');
    all.forEach(splitText);
    const onLoad = all.filter((e) => e.dataset.split === 'load');
    const onView = all.filter((e) => e.dataset.split === 'view');
    onView.forEach((e) => e.classList.add('interactive'));

    const fontsReady = (document.fonts && document.fonts.ready) || Promise.resolve();
    Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1200))]).then(() => {
      requestAnimationFrame(() => onLoad.forEach((e) => e.classList.add('is-in')));
    });

    if (!('IntersectionObserver' in window) || reduce) {
      onView.forEach((e) => e.classList.add('is-in'));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.3, rootMargin: '0px 0px -6% 0px' });
      onView.forEach((e) => io.observe(e));
    }
  }

  function initMarquee() {
    const box = $('.marquee');
    if (!box) return;
    const track = $('.marquee__track', box);
    const unit = track.innerHTML;
    let copies = 2;
    track.innerHTML = unit + unit;
    while (track.scrollWidth < window.innerWidth * 2.2) { track.innerHTML += unit; copies += 1; }
    if (reduce) return;

    let x = 0, last = window.scrollY, vel = 0, dir = -1, visible = false;
    const unitWidth = () => track.scrollWidth / copies;
    new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(box);

    const tick = () => {
      const dy = window.scrollY - last;
      last = window.scrollY;
      vel += (Math.abs(dy) - vel) * 0.12;
      if (Math.abs(dy) > 1) dir = dy > 0 ? -1 : 1;
      if (visible) {
        x += dir * (0.7 + Math.min(vel * 0.55, 18));
        const w = unitWidth();
        if (x <= -w) x += w;
        if (x > 0) x -= w;
        track.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
        box.style.setProperty('--sk', (Math.min(vel * 0.35, 9) * (dir < 0 ? 1 : -1)).toFixed(2));
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ------------------------------------------------------------------
     2. HAMBURGER MENU
  ------------------------------------------------------------------ */
  function initMenu() {
    const btn = $('.burger');
    const drawer = $('#drawer');
    const hdr = $('#hdr');
    if (!btn || !drawer) return;

    const set = (open, returnFocus = true) => {
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
      drawer.classList.toggle('is-open', open);
      drawer.inert = !open;
      root.classList.toggle('menu-open', open);
      if (open) setTimeout(() => $('a', drawer)?.focus({ preventScroll: true }), 60);
      else if (returnFocus) btn.focus({ preventScroll: true });
    };
    btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
    drawer.addEventListener('click', (e) => {
      if (e.target.closest('a')) set(false, false);
      if (e.target.closest('[data-modal-open]')) set(false, false);
    });
    window.addEventListener('resize', () => { if (window.innerWidth >= 960) set(false, false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) set(false);
    });

    const onScroll = () => hdr.classList.toggle('is-scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ------------------------------------------------------------------
     3. PARALLAX  ([data-speed] layers inside [data-parallax-root])
  ------------------------------------------------------------------ */
  function initParallax() {
    if (reduce) return;
    const items = $$('[data-speed]').map((el) => ({
      el,
      host: el.closest('[data-parallax-root]'),
      speed: parseFloat(el.dataset.speed) || 0,
    })).filter((i) => i.host);

    let queued = false;
    const run = () => {
      queued = false;
      const vh = window.innerHeight;
      items.forEach(({ el, host, speed }) => {
        const r = host.getBoundingClientRect();
        if (r.bottom < -120 || r.top > vh + 120) return;
        let y;
        if (host.dataset.parallaxRoot === 'bottom') {
          y = Math.max(-(r.top - (vh - r.height)) * speed, -160);
        } else {
          y = -r.top * speed;
        }
        el.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
      });
    };
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(run); } };
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    run();
  }

  /* ------------------------------------------------------------------
     4. SLIDESHOW  (loop, arrows, dots, swipe, keys, autoplay)
  ------------------------------------------------------------------ */
  function initSlideshow(box) {
    const viewport = $('.ss__viewport', box);
    const track = $('.ss__track', box);
    const dotsBox = $('.ss__dots', box);
    const originals = [...track.children];
    const n = originals.length;

    originals.slice(0, 2).forEach((s) => {
      const c = s.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.inert = true;
      track.append(c);
    });
    const slides = [...track.children];

    const dots = originals.map((_, k) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ss__dot';
      b.setAttribute('aria-label', `${k + 1} / ${n} 枚目を表示`);
      b.addEventListener('click', () => { goTo(k); restart(); });
      dotsBox.append(b);
      return b;
    });

    let i = 0, step = 0, timer = null;
    const measure = () => {
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      step = slides[0].getBoundingClientRect().width + gap;
    };
    const render = (animate = true) => {
      track.style.transition = animate ? '' : 'none';
      track.style.transform = `translate3d(${-i * step}px,0,0)`;
      dots.forEach((d, k) => d.setAttribute('aria-current', String(k === i % n)));
    };
    const settle = () => { if (i >= n) { i -= n; render(false); } };
    const goTo = (k) => { settle(); i = k; render(true); };
    const next = () => {
      settle();
      void track.offsetWidth;
      i += 1;
      render(true);
      if (reduce) settle();
    };
    const prev = () => {
      if (i <= 0) { i = n; render(false); void track.offsetWidth; }
      i -= 1;
      render(true);
    };
    track.addEventListener('transitionend', (e) => {
      if (e.target === track && e.propertyName === 'transform') settle();
    });

    box.querySelector('.ss__arrow--next').addEventListener('click', () => { next(); restart(); });
    box.querySelector('.ss__arrow--prev').addEventListener('click', () => { prev(); restart(); });
    box.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { next(); restart(); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { prev(); restart(); e.preventDefault(); }
    });

    // swipe / drag
    let sx = 0, dx = 0, drag = false, moved = false;
    viewport.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      drag = true; moved = false; sx = e.clientX; dx = 0; stop();
    });
    viewport.addEventListener('pointermove', (e) => {
      if (!drag) return;
      dx = e.clientX - sx;
      if (!moved && Math.abs(dx) > 6) {
        moved = true;
        try { viewport.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      }
      if (moved) {
        const eased = (i === 0 && dx > 0) ? dx * 0.3 : dx;
        track.style.transition = 'none';
        track.style.transform = `translate3d(${-i * step + eased}px,0,0)`;
      }
    });
    const end = () => {
      if (!drag) return;
      drag = false;
      if (Math.abs(dx) > 50) { dx < 0 ? next() : prev(); } else { render(true); }
      restart();
    };
    viewport.addEventListener('pointerup', end);
    viewport.addEventListener('pointercancel', end);
    viewport.addEventListener('click', (e) => {
      if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
    }, true);

    // autoplay
    const auto = () => { if (!root.classList.contains('modal-open')) next(); };
    function start() { if (!reduce && !timer) timer = setInterval(auto, 5200); }
    function stop() { clearInterval(timer); timer = null; }
    function restart() { stop(); start(); }
    box.addEventListener('pointerenter', stop);
    box.addEventListener('pointerleave', start);
    box.addEventListener('focusin', stop);
    box.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

    window.addEventListener('resize', () => { measure(); render(false); });
    measure();
    render(false);
    start();
  }

  /* ------------------------------------------------------------------
     5. MODAL WINDOW  (focus trap, Esc, backdrop, restores focus)
  ------------------------------------------------------------------ */
  const modal = { current: null, opener: null };
  const focusables = (el) => $$('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])', el)
    .filter((n) => !n.closest('[hidden]') && n.getClientRects().length > 0);

  function openModal(id, opener) {
    const el = document.getElementById(`modal-${id}`);
    if (!el) return;
    if (modal.current) closeModal(false);
    modal.current = el;
    modal.opener = opener || document.activeElement;
    el.inert = false;
    el.classList.add('is-open');
    root.classList.add('modal-open');
    setTimeout(() => $('.modal__panel', el).focus({ preventScroll: true }), 30);
  }
  function closeModal(returnFocus = true) {
    const el = modal.current;
    if (!el) return;
    el.classList.remove('is-open');
    el.inert = true;
    root.classList.remove('modal-open');
    modal.current = null;
    if (returnFocus && modal.opener && document.contains(modal.opener)) modal.opener.focus({ preventScroll: true });
  }

  function fillDetail(trg) {
    const d = trg.dataset;
    const panel = $('#modal-detail .modal__panel');
    const img = trg.querySelector('img');
    const mediaImg = $('#md-img');
    if (img) { mediaImg.src = img.getAttribute('src'); mediaImg.alt = d.title || ''; }
    panel.classList.toggle('no-media', !img);
    $('#md-meta').textContent = d.meta || '';
    $('#md-title').textContent = d.title || '';
    $('#md-place').textContent = d.place ? `会場：${d.place}` : '';
    $('#md-desc').textContent = d.desc || '';
    const list = $('#md-list');
    list.replaceChildren();
    (d.list ? d.list.split('|') : []).forEach((name) => {
      const li = document.createElement('li');
      li.textContent = name;
      list.append(li);
    });
    const extra = $('#md-extra');
    extra.replaceChildren();
    if (d.template) {
      const tpl = document.getElementById(d.template);
      if (tpl) extra.append(tpl.content.cloneNode(true));
    }
    panel.scrollTop = 0;
  }

  function initModal() {
    document.addEventListener('click', (e) => {
      const opener = e.target.closest('[data-modal-open]');
      if (opener) {
        const id = opener.dataset.modalOpen;
        if (id === 'detail') fillDetail(opener);
        openModal(id, opener);
        return;
      }
      if (e.target.closest('[data-modal-close]')) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (!modal.current) return;
      if (e.key === 'Escape') { closeModal(); return; }
      if (e.key === 'Tab') {
        const f = focusables(modal.current);
        if (!f.length) return;
        const first = f[0], lastEl = f[f.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === $('.modal__panel', modal.current))) { e.preventDefault(); lastEl.focus(); }
        else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
      }
    });
    initTicket();
  }

  function initTicket() {
    const form = $('#ticket-form');
    if (!form) return;
    const done = $('#ticket-done');
    const qtyOut = $('#qty-out');
    const totalOut = $('#ticket-total');
    const yen = (v) => `¥${v.toLocaleString('ja-JP')}`;
    let qty = 1;

    const plan = () => $('input[name="plan"]:checked', form);
    const update = () => {
      qtyOut.textContent = String(qty);
      totalOut.textContent = yen(Number(plan().dataset.price) * qty);
    };
    $('#qty-minus').addEventListener('click', () => { qty = Math.max(1, qty - 1); update(); });
    $('#qty-plus').addEventListener('click', () => { qty = Math.min(6, qty + 1); update(); });
    $$('input[name="plan"]', form).forEach((r) => r.addEventListener('change', update));

    const check = (input, errEl, msg) => {
      const ok = input.checkValidity() && input.value.trim() !== '';
      input.setAttribute('aria-invalid', String(!ok));
      errEl.textContent = ok ? '' : msg;
      return ok;
    };
    const nameEl = $('#t-name'), mailEl = $('#t-mail');
    const nameErr = $('#t-name-err'), mailErr = $('#t-mail-err');
    nameEl.addEventListener('input', () => { if (nameEl.getAttribute('aria-invalid') === 'true') check(nameEl, nameErr, 'お名前を入力してください。'); });
    mailEl.addEventListener('input', () => { if (mailEl.getAttribute('aria-invalid') === 'true') check(mailEl, mailErr, 'メールアドレスの形式で入力してください。例：name@example.com'); });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const a = check(nameEl, nameErr, 'お名前を入力してください。');
      const b = check(mailEl, mailErr, 'メールアドレスの形式で入力してください。例：name@example.com');
      if (!a) { nameEl.focus(); return; }
      if (!b) { mailEl.focus(); return; }
      const p = plan();
      $('#ticket-summary').textContent = `${nameEl.value.trim()} 様　${p.dataset.label} × ${qty}枚（合計 ${yen(Number(p.dataset.price) * qty)}）`;
      form.hidden = true;
      done.hidden = false;
      done.focus();
    });
    $('#ticket-reset').addEventListener('click', () => {
      form.reset();
      qty = 1;
      [nameEl, mailEl].forEach((i) => i.removeAttribute('aria-invalid'));
      nameErr.textContent = ''; mailErr.textContent = '';
      update();
      done.hidden = true;
      form.hidden = false;
      $('input[name="plan"]', form).focus();
    });
    update();
  }

  /* ------------------------------------------------------------------
     6. ACCORDION  (single-open option, arrow-key navigation)
  ------------------------------------------------------------------ */
  function initAccordion(box) {
    const items = $$('.acc__item', box);
    const single = box.hasAttribute('data-single');
    const btnOf = (it) => $('.acc__btn', it);
    const panelOf = (it) => $('.acc__panel', it);
    const setOpen = (it, open) => {
      btnOf(it).setAttribute('aria-expanded', String(open));
      panelOf(it).classList.toggle('is-open', open);
    };
    items.forEach((it) => {
      btnOf(it).addEventListener('click', () => {
        const open = btnOf(it).getAttribute('aria-expanded') !== 'true';
        if (open && single) items.forEach((o) => { if (o !== it) setOpen(o, false); });
        setOpen(it, open);
      });
    });
    box.addEventListener('keydown', (e) => {
      const btns = items.map(btnOf);
      const k = btns.indexOf(document.activeElement);
      if (k < 0) return;
      const target = { ArrowDown: (k + 1) % btns.length, ArrowUp: (k - 1 + btns.length) % btns.length, Home: 0, End: btns.length - 1 }[e.key];
      if (target !== undefined) { e.preventDefault(); btns[target].focus(); }
    });
  }

  /* ------------------------------------------------------------------ */
  function boot() {
    initTypography();
    initMarquee();
    initMenu();
    initParallax();
    $$('[data-slideshow]').forEach(initSlideshow);
    initModal();
    $$('[data-accordion]').forEach(initAccordion);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
