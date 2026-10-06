/* Global Holding Group – hiệu ứng trang chủ
   Cần: GSAP 3 + ScrollTrigger (bắt buộc cho phần lớn hiệu ứng), Lenis (tùy chọn, cuộn mượt).
   Không có thư viện nào thì trang vẫn hiển thị đầy đủ, chỉ mất hiệu ứng. */
(function () {
  'use strict';
  var root = document.getElementById('ghg');
  if (!root) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var G = window.gsap, ST = window.ScrollTrigger;
  var hasG = !!(G && ST) && !reduce;
  if (hasG) G.registerPlugin(ST);
  var $ = function (s, c) { return (c || root).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || root).querySelectorAll(s)); };

  /* ---------- 1. Cuộn mượt (Lenis) ---------- */
  var lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true });
    if (hasG) {
      lenis.on('scroll', ST.update);
      G.ticker.add(function (t) { lenis.raf(t * 1000); });
      G.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    }
  }

  /* ---------- 2. Menu mobile + link neo ---------- */
  var burger = $('.ghg-burger');
  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    if (burger) { burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu'); }
    if (lenis) open ? lenis.stop() : lenis.start();
  }
  if (burger) burger.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });

  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var t = root.querySelector(id);
      if (!t) return;
      e.preventDefault();
      setMenu(false);
      if (lenis) lenis.scrollTo(t, { offset: -60, duration: 1.4 });
      else t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* ---------- 3. Header ẩn khi cuộn xuống, hiện khi cuộn lên ---------- */
  var nav = $('.ghg-nav'), lastY = window.scrollY;
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    nav.classList.toggle('is-solid', y > 40);
    nav.classList.toggle('is-hidden', y > lastY && y > 320 && !root.classList.contains('menu-open'));
    lastY = y;
  }, { passive: true });

  /* ---------- 4. Con trỏ tùy biến + nút hút nam châm ---------- */
  if (finePointer && !reduce) {
    root.classList.add('has-cursor');
    var cur = $('.ghg-cursor'), dot = $('.ghg-cursor__dot'), ring = $('.ghg-cursor__ring'), label = $('.ghg-cursor__ring em');
    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    window.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
    });
    (function loop() {
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
      requestAnimationFrame(loop);
    })();
    root.addEventListener('mouseover', function (e) {
      var labelled = e.target.closest('[data-cursor]');
      var link = e.target.closest('a,button');
      cur.classList.toggle('is-label', !!labelled);
      cur.classList.toggle('is-link', !!link && !labelled);
      if (labelled) label.textContent = labelled.getAttribute('data-cursor');
    });

    $$('.magnetic').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        el.style.transform = 'translate(' + x * 0.3 + 'px,' + y * 0.4 + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });

    /* Ảnh xem trước bay theo chuột ở danh sách công ty thành viên */
    var mf = $('.ghg-members__float'), mfIn = $('.ghg-members__float-in');
    if (mf && mfIn) {
      var fx = mx, fy = my;
      $$('.mem').forEach(function (m, i) {
        m.addEventListener('mouseenter', function () {
          mf.classList.add('is-on');
          mfIn.style.transform = 'translateY(' + (-i * 100 / 6) + '%)';
        });
      });
      $('.ghg-members__list').addEventListener('mouseleave', function () { mf.classList.remove('is-on'); });
      (function follow() {
        fx += (mx - fx) * 0.1; fy += (my - fy) * 0.1;
        mf.style.transform = 'translate(' + fx + 'px,' + fy + 'px)';
        requestAnimationFrame(follow);
      })();
    }

    $$('.news-card').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'rotateY(' + px * 8 + 'deg) rotateX(' + -py * 8 + 'deg)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------- 5. Quả cầu điểm (canvas) ở hero ---------- */
  (function globe() {
    var cv = document.getElementById('ghgGlobe');
    if (!cv || !cv.getContext) return;
    var ctx = cv.getContext('2d'), DPR = Math.min(window.devicePixelRatio || 1, 2), W = 0, H = 0;
    var N = finePointer ? 1100 : 650, pts = [], golden = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < N; i++) {
      var y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * golden;
      pts.push([Math.cos(th) * r, y, Math.sin(th) * r]);
    }
    // 6 điểm nút = 6 lĩnh vực
    var hubs = [80, 260, 430, 610, 790, 960].map(function (k) { return pts[Math.floor(k * N / 1100)]; });
    var rotY = 0, rotX = -0.38, tY = 0, tX = 0, offY = 0, offX = 0, running = true, t0 = 0;

    function resize() {
      var b = cv.getBoundingClientRect(); W = b.width; H = b.height;
      cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    function project(p, cy, sy, cx, sx) {
      var x = p[0] * cy - p[2] * sy, z = p[0] * sy + p[2] * cy, y = p[1];
      return [x, y * cx - z * sx, y * sx + z * cx];
    }
    function draw(time) {
      ctx.clearRect(0, 0, W, H);
      var R = Math.min(W, H) * 0.38, cx0 = W / 2, cy0 = H / 2;
      offY += (tY - offY) * 0.05; offX += (tX - offX) * 0.05;
      var a = rotY + offY, b = rotX + offX;
      var cY = Math.cos(a), sY = Math.sin(a), cX = Math.cos(b), sX = Math.sin(b);

      // quỹ đạo
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(242,183,5,.45)';
      ctx.beginPath(); ctx.ellipse(cx0, cy0, R * 1.32, R * 0.34, -0.32, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(245,244,239,.14)';
      ctx.beginPath(); ctx.ellipse(cx0, cy0, R * 1.18, R * 0.52, 0.5, 0, Math.PI * 2); ctx.stroke();

      for (var i = 0; i < N; i++) {
        var q = project(pts[i], cY, sY, cX, sX), d = (q[2] + 1) / 2;
        ctx.fillStyle = 'rgba(245,244,239,' + (0.08 + d * 0.72).toFixed(3) + ')';
        var s = 0.6 + d * 1.7;
        ctx.fillRect(cx0 + q[0] * R, cy0 + q[1] * R, s, s);
      }
      var pulse = (time % 2000) / 2000;
      hubs.forEach(function (p) {
        var q = project(p, cY, sY, cX, sX);
        if (q[2] < -0.1) return;
        var x = cx0 + q[0] * R, y = cy0 + q[1] * R;
        ctx.fillStyle = '#F2B705';
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(242,183,5,' + (1 - pulse).toFixed(2) + ')';
        ctx.beginPath(); ctx.arc(x, y, 4 + pulse * 18, 0, Math.PI * 2); ctx.stroke();
      });
      // satellite chạy trên quỹ đạo
      var ang = time / 2600, ex = Math.cos(ang) * R * 1.32, ey = Math.sin(ang) * R * 0.34, rr = -0.32;
      ctx.fillStyle = '#F2B705';
      ctx.beginPath(); ctx.arc(cx0 + ex * Math.cos(rr) - ey * Math.sin(rr), cy0 + ex * Math.sin(rr) + ey * Math.cos(rr), 5, 0, Math.PI * 2); ctx.fill();
    }
    function tick(time) {
      if (!running) return;
      rotY += 0.0022;
      draw(time);
      requestAnimationFrame(tick);
    }
    resize();
    window.addEventListener('resize', resize);
    if (reduce) { draw(0); return; }
    window.addEventListener('mousemove', function (e) {
      tY = (e.clientX / innerWidth - 0.5) * 0.9;
      tX = (e.clientY / innerHeight - 0.5) * 0.5;
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        var vis = en[0].isIntersecting;
        if (vis && !running) { running = true; requestAnimationFrame(tick); }
        running = vis;
      }).observe(cv);
    }
    requestAnimationFrame(tick);
  })();

  /* ---------- Không có GSAP: dừng ở đây, trang vẫn đầy đủ ---------- */
  var loader = $('.ghg-loader');
  if (!hasG) { if (loader) loader.remove(); return; }

  /* ---------- 6. Preloader + intro hero ---------- */
  function heroIn() {
    G.from('.ghg-hero__title .line > span', { yPercent: 115, rotate: 3, duration: 1.3, stagger: 0.1, ease: 'expo.out' });
    G.from($$('[data-hero]', $('.ghg-hero')), { y: 30, autoAlpha: 0, duration: 1, stagger: 0.08, delay: 0.35, ease: 'power3.out' });
    G.from('#ghgGlobe', { scale: 0.6, autoAlpha: 0, duration: 1.8, ease: 'expo.out' });
    G.from('.ghg-nav', { yPercent: -100, duration: 1, delay: 0.2, ease: 'expo.out' });
  }
  if (loader) {
    loader.style.animation = 'none';
    var c = { v: 0 }, num = $('.ghg-loader__count', loader), bar = $('.ghg-loader__bar i', loader);
    if (lenis) lenis.stop();
    G.timeline()
      .to(c, { v: 100, duration: 1.4, ease: 'power2.inOut', onUpdate: function () {
        num.textContent = String(Math.round(c.v)).padStart(3, '0');
        bar.style.transform = 'scaleX(' + c.v / 100 + ')';
      } })
      .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' })
      .add(heroIn, '-=0.55')
      .add(function () { loader.remove(); if (lenis) lenis.start(); });
  } else heroIn();

  /* Hero trôi lên khi cuộn */
  G.to('.ghg-hero__inner', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: '.ghg-hero', start: 'top top', end: 'bottom top', scrub: true } });
  G.to('#ghgGlobe', { yPercent: 25, scale: 1.15, ease: 'none', scrollTrigger: { trigger: '.ghg-hero', start: 'top top', end: 'bottom top', scrub: true } });

  /* ---------- 7. Băng chạy, tăng tốc theo vận tốc cuộn ---------- */
  var boost = 0;
  ST.create({ onUpdate: function (self) { boost = Math.min(Math.abs(self.getVelocity()) * 0.25, 1200); } });
  $$('.tape__track').forEach(function (tr) {
    var dir = Number(tr.getAttribute('data-dir')) || -1, half = 0, x = 0;
    tr.classList.add('js');
    function measure() { half = tr.scrollWidth / 2; if (dir > 0) x = -half; }
    measure(); window.addEventListener('resize', measure);
    G.ticker.add(function (t, dt) {
      x += dir * (70 + boost) * dt / 1000;
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      tr.style.transform = 'translate3d(' + x + 'px,0,0)';
    });
  });
  G.ticker.add(function () { boost *= 0.93; });
  G.fromTo('.tape--a', { rotate: -8 }, { rotate: -2, ease: 'none', scrollTrigger: { trigger: '.ghg-tapes', start: 'top bottom', end: 'bottom top', scrub: true } });
  G.fromTo('.tape--b', { rotate: 7 }, { rotate: 1, ease: 'none', scrollTrigger: { trigger: '.ghg-tapes', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* ---------- 8. Chữ sáng dần theo từng từ ---------- */
  var txt = $('[data-words]');
  if (txt) {
    var wrapWords = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.appendChild(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) wrapWords(n);
      });
    };
    wrapWords(txt);
    G.fromTo($$('.w', txt), { opacity: 0.15 }, { opacity: 1, stagger: 0.05, ease: 'none',
      scrollTrigger: { trigger: txt, start: 'top 82%', end: 'bottom 50%', scrub: true } });
  }

  /* ---------- 9. Đếm số ---------- */
  $$('[data-count]').forEach(function (el) {
    var end = Number(el.getAttribute('data-count')), o = { v: 0 };
    ST.create({ trigger: el, start: 'top 92%', once: true, onEnter: function () {
      G.to(o, { v: end, duration: 2.2, ease: 'power3.out', onUpdate: function () { el.textContent = Math.round(o.v).toLocaleString('vi-VN'); } });
    } });
  });
  G.from('.ghg-stat', { y: 50, autoAlpha: 0, duration: 1, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: '.ghg-stats', start: 'top 88%' } });

  /* ---------- 10. Lĩnh vực: ghim + cuộn ngang (desktop) ---------- */
  var idx = document.getElementById('ghgSecIdx'), sbar = document.getElementById('ghgSecBar'), track = document.getElementById('ghgTrack');
  var mm = G.matchMedia();
  mm.add('(min-width: 900px)', function () {
    var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
    var tween = G.to(track, { x: function () { return -dist(); }, ease: 'none',
      scrollTrigger: { trigger: '.ghg-sectors', start: 'top top', end: function () { return '+=' + dist(); },
        pin: true, scrub: 1, invalidateOnRefresh: true,
        onUpdate: function (self) {
          var n = Math.min(6, Math.floor(self.progress * 5.999) + 1);
          idx.textContent = String(n).padStart(2, '0');
          sbar.style.transform = 'scaleX(' + Math.max(1 / 6, self.progress) + ')';
        } } });
    $$('.sector', track).forEach(function (card) {
      G.fromTo($('.sector__visual > div', card), { xPercent: -8 }, { xPercent: 8, ease: 'none',
        scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
    });
  });
  mm.add('(max-width: 899px)', function () {
    $$('.sector', track).forEach(function (card) {
      G.from(card, { y: 60, autoAlpha: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: card, start: 'top 88%' } });
    });
  });

  /* ---------- 10b. Công ty thành viên: các dòng trượt lên lần lượt ---------- */
  G.from('.ghg-members__head > *', { y: 50, autoAlpha: 0, duration: 1.1, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: '.ghg-members', start: 'top 80%' } });
  G.from('.mem', { y: 60, autoAlpha: 0, duration: 1, stagger: 0.09, ease: 'power3.out', scrollTrigger: { trigger: '.ghg-members__list', start: 'top 85%' } });
  /* ---------- 11. Khung nhà máy mở rộng khi cuộn ---------- */
  G.fromTo('#ghgReveal', { clipPath: 'inset(12% 18% 12% 18% round 40px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
    scrollTrigger: { trigger: '.ghg-reveal', start: 'top 85%', end: 'top 5%', scrub: true } });
  G.fromTo('#ghgRevealBig', { yPercent: 40 }, { yPercent: 0, ease: 'none',
    scrollTrigger: { trigger: '.ghg-reveal', start: 'top 85%', end: 'top 5%', scrub: true } });

  /* ---------- 12. Thẻ cam kết xếp chồng: thẻ dưới thu nhỏ ---------- */
  var cards = $$('.cc');
  cards.forEach(function (cc, i) {
    if (i === cards.length - 1) return;
    G.to(cc, { scale: 0.9 + i * 0.015, filter: 'brightness(.92)', ease: 'none',
      scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: 'top 120px', scrub: true } });
  });

  /* ---------- 13. Hiện dần các khối còn lại ---------- */
  ['.ghg-sectors__head', '.ghg-commit__intro', '.ghg-news__head', '.news-card', '.ghg-cta h2', '.ghg-cta__contact', '.ghg-foot__cols'].forEach(function (sel) {
    $$(sel).forEach(function (el, i) {
      G.from(el, { y: 50, autoAlpha: 0, duration: 1.1, delay: (i % 3) * 0.08, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
    });
  });
  G.from('.ghg-cta__orb', { scale: 0, rotate: -90, duration: 1.2, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.ghg-cta', start: 'top 70%' } });

  /* ---------- 14. Chữ khổng lồ ở footer ---------- */
  var giant = document.getElementById('ghgGiant');
  if (giant) {
    var t = giant.textContent; giant.textContent = '';
    t.split('').forEach(function (ch) { var s = document.createElement('span'); s.textContent = ch === ' ' ? ' ' : ch; giant.appendChild(s); });
    G.from($$('span', giant), { yPercent: 100, duration: 1.2, stagger: 0.035, ease: 'expo.out', scrollTrigger: { trigger: giant, start: 'top 95%' } });
  }

  /* Tính lại vị trí khi font tải xong */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
  window.addEventListener('load', function () { ST.refresh(); });
})();
