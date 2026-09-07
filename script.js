/* СОМНИЯ — интерактив: лепестки, reveal-анимации, навигация, счётчики */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isShot = new URLSearchParams(location.search).has("shot");

  /* ---------- Capture-режим (?shot): всё показывать сразу, без анимаций ---------- */
  if (isShot) {
    document.documentElement.classList.add("shot");
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
    document.querySelectorAll(".count").forEach((el) => (el.textContent = el.dataset.count));
  }

  /* ---------- Заголовок hero по буквам ---------- */
  const title = document.getElementById("heroTitle");
  if (title && !reduceMotion && !isShot) {
    const text = title.textContent.trim();
    title.textContent = "";
    [...text].forEach((ch, i) => {
      const span = document.createElement("span");
      span.className = "ltr";
      span.textContent = ch;
      span.style.animationDelay = `${0.12 + i * 0.07}s`;
      title.appendChild(span);
    });
  }

  /* ---------- Reveal при скролле ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if (reduceMotion) {
    revealEls.forEach((el) => el.classList.add("in"));
  } else {
    // каскадная задержка внутри групп
    document.querySelectorAll(".reqs__grid, .facts, .hero__badges").forEach((group) => {
      [...group.children].forEach((child, i) => {
        const r = child.classList.contains("reveal")
          ? child
          : child.querySelector(".reveal") || child;
        r.style.setProperty("--d", `${i * 0.09}s`);
      });
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -6% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- Счётчики ---------- */
  const counters = document.querySelectorAll(".count");
  const animateCount = (el) => {
    const target = +el.dataset.count;
    if (reduceMotion) { el.textContent = target; return; }
    const dur = 1400;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const cio = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { animateCount(e.target); cio.unobserve(e.target); }
    }),
    { threshold: 0.6 }
  );
  counters.forEach((el) => cio.observe(el));

  /* ---------- Навигация: стекло при скролле + активная секция ---------- */
  const nav = document.getElementById("nav");
  const onScrollNav = () => nav.classList.toggle("nav--scrolled", window.scrollY > 30);
  onScrollNav();
  window.addEventListener("scroll", onScrollNav, { passive: true });

  const sections = [...document.querySelectorAll("main section[id]")];
  const links = [...document.querySelectorAll(".nav__link")];
  const sio = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((l) =>
          l.classList.toggle("nav__link--active", l.getAttribute("href") === `#${e.target.id}`)
        );
      });
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );
  sections.forEach((s) => sio.observe(s));

  /* ---------- Бургер-меню ---------- */
  const burger = document.getElementById("burger");
  const closeMenu = () => {
    nav.classList.remove("nav--open");
    burger.classList.remove("nav__burger--open");
    burger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  };
  burger.addEventListener("click", () => {
    const open = nav.classList.toggle("nav--open");
    burger.classList.toggle("nav__burger--open", open);
    burger.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  });
  document.querySelectorAll(".nav__links a").forEach((a) => a.addEventListener("click", closeMenu));
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });

  /* ---------- Лёгкий параллакс ветки ---------- */
  const heroBg = document.getElementById("heroBg");
  if (heroBg && !reduceMotion && window.matchMedia("(min-width: 760px)").matches) {
    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const y = window.scrollY;
          if (y < window.innerHeight * 1.2) {
            heroBg.querySelector("img").style.transform = `translateY(${y * 0.22}px) scale(1.05)`;
          }
          ticking = false;
        });
      },
      { passive: true }
    );
  }

  /* ---------- Лепестки (canvas) ---------- */
  const canvas = document.getElementById("petals");
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d");
    let W, H, dpr, petals = [], running = true;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const COUNT = Math.round(Math.min(34, Math.max(16, window.innerWidth / 46)));
    const rand = (a, b) => a + Math.random() * (b - a);

    const spawn = (initial) => ({
      x: rand(0, W),
      y: initial ? rand(-H, H) : rand(-70, -14),
      s: rand(3.4, 8.2),                 // размер
      vy: rand(0.32, 0.95),              // скорость падения
      drift: rand(0.35, 1.15),           // амплитуда качания
      ph: rand(0, Math.PI * 2),          // фаза
      spin: rand(0.004, 0.016),
      a: rand(0, Math.PI * 2),
      o: rand(0.25, 0.7)                 // прозрачность
    });

    for (let i = 0; i < COUNT; i++) petals.push(spawn(true));

    let last = performance.now();
    const frame = (now) => {
      if (!running) return;
      const dt = Math.min((now - last) / 16.7, 3);
      last = now;
      ctx.clearRect(0, 0, W, H);
      for (const p of petals) {
        p.y += p.vy * dt;
        p.ph += 0.014 * dt;
        p.a += p.spin * dt;
        const x = p.x + Math.sin(p.ph) * 34 * p.drift;
        if (p.y > H + 24) Object.assign(p, spawn(false));

        ctx.save();
        ctx.translate(x, p.y);
        ctx.rotate(p.a);
        // лепесток: вытянутый эллипс с мягким градиентом
        const g = ctx.createLinearGradient(0, -p.s, 0, p.s);
        g.addColorStop(0, `rgba(255,255,255,${p.o})`);
        g.addColorStop(1, `rgba(224,236,248,${p.o * 0.35})`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.s, p.s * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      requestAnimationFrame(frame);
    };

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        running = false;
      } else {
        running = true;
        last = performance.now();
        requestAnimationFrame(frame);
      }
    });

    requestAnimationFrame(frame);
  }
})();
