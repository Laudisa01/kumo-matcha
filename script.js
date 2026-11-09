(() => {
  // Wheel order, left → right. "leaf" is the plain matcha ("Original").
  const FLAVOURS = [
    { id: "blackberry", name: "Blackberry", price: "22.50$", imgs: ["assets/fruits/blackberry.png"],
      colors: ["#5b1a55", "#3a0c36", "#8b3c82", "#a0559a"] },
    { id: "strawberry", name: "Strawberry", price: "21.40$", imgs: ["assets/fruits/strawberry.png"],
      colors: ["#c42a35", "#8c1120", "#e0505a", "#e98088"] },
    { id: "leaf", name: "Original", price: "19.33$", imgs: ["assets/fruits/leaf.png"], colors: null },
    { id: "blueberry", name: "Blueberry", price: "22.10$", imgs: ["assets/fruits/blueberry.png"],
      colors: ["#3a3a7c", "#22205a", "#5f5ea8", "#8483c2"] },
    { id: "cranberry", name: "Cranberry", price: "21.90$",
      imgs: ["assets/fruits/cranberry.png", "assets/fruits/cranberry.png", "assets/fruits/cranberry.png"],
      colors: ["#8c1d4b", "#5e0f33", "#ad3a6c", "#c45a86"] },
  ];
  const N = FLAVOURS.length;
  const COPIES = 2;               // duplicate the set so the arc is always full
  const TOTAL = N * COPIES;

  const card = document.getElementById("card");
  const wheel = document.getElementById("wheel");
  const flavourEl = document.getElementById("flavour");
  const priceValue = document.getElementById("priceValue");
  const priceBtn = document.getElementById("price");
  const badge = document.getElementById("badge");
  const headline = document.getElementById("headline");
  const fruitLayer = document.getElementById("fruitLayer");
  const fruitParts = ["fruitA", "fruitB", "fruitC", "fruitD"].map((id) => document.getElementById(id));
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let pos = 2;                    // index (in TOTAL space) of the card sitting behind the cup
  let cartCount = 0;

  // ---------- build cards ----------
  const cards = [];
  for (let j = 0; j < TOTAL; j++) {
    const f = FLAVOURS[j % N];
    const el = document.createElement("button");
    el.type = "button";
    el.className = `fruit fruit--${f.id}`;
    el.setAttribute("role", "option");
    el.setAttribute("aria-label", f.name);
    const imgs = f.imgs.map((src) => `<img src="${src}" alt="" draggable="false">`).join("");
    const sprig = f.id === "cranberry" ? `<img class="leaf-sprig" src="assets/fruits/leaf.png" alt="" draggable="false">` : "";
    el.innerHTML = `<span class="fruit__inner"><span class="fruit__img">${sprig}${imgs}</span></span>`;
    el.addEventListener("click", () => {
      const k = slotOf(j);
      if (k !== 0) { go(pos + k); userInteracted(); }
    });
    wheel.appendChild(el);
    cards.push({ el, j, lastSlot: null });
  }

  // ---------- geometry ----------
  const isNarrow = () => matchMedia("(max-width: 720px)").matches;
  function geom(k) {
    // values in cqw (percent of stage width), measured from the reference design
    if (isNarrow()) return { x: 38 * k, y: 58 + 8 * k * k, r: 16 * k };
    return { x: 21.4 * k, y: 29.6 + 2.86 * k * k, r: 16 * k };
  }
  function slotOf(j) {
    let k = (((j - pos) % TOTAL) + TOTAL) % TOTAL;
    if (k >= TOTAL / 2) k -= TOTAL;
    return k;                     // -5 … 4
  }
  function place(c, k, extraY = 0) {
    const g = geom(k);
    const hidden = k === 0;
    const scale = hidden ? 0.72 : 1;
    c.el.style.transform =
      `translate(${g.x}cqw, ${g.y + extraY + (hidden ? 6 : 0)}cqw) rotate(${g.r}deg) scale(${scale})`;
    c.el.style.opacity = hidden || Math.abs(k) >= 4 ? "0" : "1";
    c.el.tabIndex = hidden || Math.abs(k) >= 3 ? -1 : 0;
    c.el.setAttribute("aria-selected", hidden ? "true" : "false");
  }
  function layout(animate = true) {
    cards.forEach((c) => {
      const k = slotOf(c.j);
      // a card wrapping around from one end to the other must jump, not fly across
      const wraps = c.lastSlot !== null && Math.abs(k - c.lastSlot) > TOTAL / 2 - 1;
      if (!animate || wraps) c.el.classList.add("no-anim");
      place(c, k);
      if (!animate || wraps) { void c.el.offsetWidth; c.el.classList.remove("no-anim"); }
      c.lastSlot = k;
    });
  }

  // ---------- flavour state ----------
  function applyFlavour(f, instant = false) {
    syncTiles(f);
    priceValue.textContent = f.price;
    if (f.colors) {
      fruitParts.forEach((p, i) => p.setAttribute("fill", f.colors[i]));
      fruitLayer.style.opacity = "1";
    } else {
      fruitLayer.style.opacity = "0";
    }
    if (instant) { flavourEl.textContent = f.name; return; }
    fx.splash(f.colors || ["#7a9a3c", "#a9b766", "#f1f2ea"]);
    flavourEl.classList.add("is-out");
    setTimeout(() => {
      flavourEl.textContent = f.name;
      flavourEl.classList.remove("is-out");
    }, 420);
  }
  function current() { return FLAVOURS[((pos % N) + N) % N]; }

  let busy = false;
  function go(next) {
    if (next === pos || busy) return;
    busy = true;
    pos = next;
    layout(true);
    applyFlavour(current());
    setTimeout(() => (busy = false), 650);
  }
  function select(idx) {
    let d = (((idx - pos) % N) + N) % N;
    if (d > N / 2) d -= N;
    go(pos + d);
  }
  const prev = () => go(pos + 1);   // card on the right slides in
  const nextF = () => go(pos - 1);  // card on the left slides in

  // ---------- autoplay ----------
  let timer = null, resumeTimer = null;
  function startAuto() { stopAuto(); if (!reduceMotion) timer = setInterval(nextF, 3600); }
  function stopAuto() { clearInterval(timer); timer = null; }
  function userInteracted() {
    stopAuto(); clearTimeout(resumeTimer);
    resumeTimer = setTimeout(startAuto, 9000);
  }

  // ---------- input ----------
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { nextF(); userInteracted(); }
    if (e.key === "ArrowRight") { prev(); userInteracted(); }
  });
  let downX = null;
  card.addEventListener("pointerdown", (e) => { downX = e.clientX; });
  card.addEventListener("pointerup", (e) => {
    if (downX === null) return;
    const dx = e.clientX - downX; downX = null;
    if (Math.abs(dx) > 40) { dx > 0 ? nextF() : prev(); userInteracted(); }
  });
  let wheelAcc = 0, wheelLock = false;
  card.addEventListener("wheel", (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // leave vertical scroll alone
    e.preventDefault();
    if (wheelLock) return;
    wheelAcc += e.deltaX;
    if (Math.abs(wheelAcc) > 40) {
      wheelAcc > 0 ? prev() : nextF();
      wheelAcc = 0; wheelLock = true; userInteracted();
      setTimeout(() => (wheelLock = false), 700);
    }
  }, { passive: false });

  priceBtn.addEventListener("click", () => {
    cartCount += 1;
    badge.hidden = false;
    badge.textContent = cartCount;
    miniCount.textContent = cartCount;
    flyToCart();
  });
  document.querySelectorAll('a[href="#"]').forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));

  addEventListener("resize", () => layout(false));

  // ---------- headline letters ----------
  const text = headline.textContent;
  headline.setAttribute("aria-label", text);
  headline.innerHTML = text.split(" ").map((word) =>
    `<span class="word" aria-hidden="true">${[...word].map((ch) => `<span class="ch">${ch}</span>`).join("")}</span>`
  ).join(`<span class="sp" aria-hidden="true"> </span>`);
  const letters = [...headline.querySelectorAll(".ch")];

  // ---------- intro ----------
  // ---------- flavour tiles (section 03) ----------
  const tilesEl = document.getElementById("tiles");
  const order = [2, 1, 3, 4, 0]; // Original first
  const tiles = order.map((i) => {
    const f = FLAVOURS[i];
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tile";
    b.innerHTML = `<span class="tile__img"><img src="${f.imgs[0]}" alt=""></span><b>${f.name}</b><span>${f.price}</span>`;
    b.addEventListener("click", () => { select(i); userInteracted(); });
    tilesEl.appendChild(b);
    return { b, f };
  });
  function syncTiles(f) { tiles.forEach((t) => t.b.classList.toggle("is-active", t.f === f)); }

  // ---------- the cup travels with the scroll (smoothed render loop) ----------
  const floatCup = document.getElementById("floatCup");
  const meta = document.getElementById("meta");
  const anchors = [...document.querySelectorAll("[data-anchor]")];
  const hillsFront = document.querySelector(".hills--front");
  const hillsSide = document.querySelector(".hills--side");
  const speedEls = [...document.querySelectorAll("[data-speed]")];
  const marqueeRows = [...document.querySelectorAll(".marquee__row")].map((row) => ({
    dir: +row.dataset.dir, track: row.querySelector(".marquee__track"), half: 0,
  }));
  const fxText = document.getElementById("fxText");
  const miniCart = document.getElementById("miniCart");
  const miniCount = document.getElementById("miniCount");
  const root = document.documentElement;
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const smooth = (t) => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;

  // split the dive-in sentence into letters
  const fxWords = fxText.textContent.trim().split(" ");
  fxText.innerHTML = fxWords.map((w) => `<span class="w">${[...w].map((c) => `<span class="c">${c}</span>`).join("")}</span>`).join(" ");
  const fxChars = [...fxText.querySelectorAll(".c")];

  let baseW = 300, A = [], speedBase = [], vw = innerWidth, vh = innerHeight;
  function measure() {
    vw = innerWidth; vh = innerHeight;
    const sy = scrollY, maxS = root.scrollHeight - vh;
    let last = -Infinity;
    A = anchors.map((el, i) => {
      const r = el.getBoundingClientRect();
      let doc, at, hold = 0;
      if (el.hasAttribute("data-zoom")) {
        const sec = el.closest(".zoom");
        const sr = sec.getBoundingClientRect();
        const st = el.parentElement.getBoundingClientRect();
        const secTop = sr.top + sy;
        doc = { x: r.left + scrollX, y: secTop + (r.top - st.top), w: r.width, h: r.height };
        at = secTop;
        hold = sec.offsetHeight - vh;
      } else {
        doc = { x: r.left + scrollX, y: r.top + sy, w: r.width, h: r.height };
        at = i === 0 ? 0 : doc.y + doc.h / 2 - vh / 2 + (el.dataset.meta === "1" ? 40 : 0);
        at = Math.min(at, maxS - (anchors.length - 1 - i) * 2);
      }
      at = Math.max(at, last + 1);
      last = at + hold;
      return { ...doc, at, hold, rot: +el.dataset.rot || 0, meta: +el.dataset.meta, zoom: el.hasAttribute("data-zoom") };
    });
    // parallax elements: remember their untranslated centre in document space
    speedBase = speedEls.map((el) => {
      const prev = el.style.translate; el.style.translate = "0 0";
      const r = el.getBoundingClientRect();
      el.style.translate = prev;
      return r.top + sy + r.height / 2;
    });
    marqueeRows.forEach((m) => (m.half = m.track.scrollWidth / 2));
    baseW = A[0].w;
    floatCup.style.width = `${baseW}px`;
  }

  // pointer tilt (desktop only)
  const finePointer = matchMedia("(pointer: fine)").matches;
  let mx = 0, my = 0, tx = 0, ty = 0;
  if (finePointer) addEventListener("pointermove", (e) => { mx = e.clientX / vw - 0.5; my = e.clientY / vh - 0.5; }, { passive: true });

  let sm = scrollY, lastSm = sm, vel = 0, zoomK = 0;
  function render() {
    const target = scrollY;
    // ease the rendered scroll towards the real one → fluid, weighted motion
    sm = reduceMotion ? target : lerp(sm, target, 0.14);
    if (Math.abs(sm - target) < 0.1) sm = target;
    const s = sm;
    vel = lerp(vel, s - lastSm, 0.2); lastSm = s;

    // which segment are we in?
    let a, b, raw = 0, holdP = -1;
    for (let i = 0; i < A.length; i++) {
      if (s < A[i].at) {
        if (i === 0) { a = b = A[0]; break; }
        const p = A[i - 1];
        a = { ...p, y: p.y + p.hold }; b = A[i];
        raw = clamp01((s - (p.at + p.hold)) / (b.at - (p.at + p.hold)));
        break;
      }
      if (s <= A[i].at + A[i].hold) { a = b = { ...A[i], y: A[i].y + (s - A[i].at) }; holdP = A[i].hold ? (s - A[i].at) / A[i].hold : -1; break; }
    }
    if (!a) { const L = A[A.length - 1]; a = b = { ...L, y: L.y + L.hold }; }

    const t = smooth(raw);
    const w = lerp(a.w, b.w, t);
    const x = lerp(a.x, b.x, t);
    const y = lerp(a.y, b.y, t);
    const arc = Math.sin(Math.PI * raw);
    const swing = reduceMotion ? 0 : arc * (b.x >= a.x ? 10 : -10);
    let r = lerp(a.rot, b.rot, t) + swing;
    let sc = reduceMotion ? 1 : 1 + arc * 0.08;

    // dive-in zoom: cup grows until its liquid fills the whole screen
    zoomK = 0;
    if (holdP >= 0 && a.zoom) {
      const grow = smooth(clamp01((holdP - 0.08) / 0.42));
      const shrink = smooth(clamp01((holdP - 0.8) / 0.2));
      zoomK = grow * (1 - shrink);
      const h = w * 1.35;
      const sMax = Math.max(vw / (w * 0.62), vh / (h * 0.5));
      sc = Math.pow(sMax, zoomK);
      r += Math.sin(Math.PI * zoomK) * 8;
    }

    // pointer tilt fades out while zoomed / travelling
    tx = lerp(tx, mx, 0.08); ty = lerp(ty, my, 0.08);
    const tilt = finePointer && !reduceMotion ? (1 - zoomK) * (1 - arc) : 0;
    // fixed layout width, size comes from scale → no reflow while animating
    const k = w / baseW, cx = w / 2, cy = w * 1.35 * 0.5;
    floatCup.style.transform =
      `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) translate(${cx}px, ${cy}px) perspective(900px) rotateY(${(tx * 22 * tilt).toFixed(2)}deg) rotateX(${(-ty * 14 * tilt).toFixed(2)}deg) rotate(${r.toFixed(2)}deg) scale(${sc.toFixed(4)}) translate(${-cx}px, ${-cy}px) scale(${k.toFixed(4)})`;

    if (!document.body.classList.contains("is-intro")) {
      const m = lerp(a.meta, b.meta, t) * (1 - arc * 0.95) * (1 - zoomK);
      meta.style.opacity = m.toFixed(3);
      meta.style.pointerEvents = m > 0.5 ? "" : "none";
    }

    // dive-in sentence: letters flip up one after another once the screen is full
    const textIn = holdP >= 0 && a.zoom ? clamp01((holdP - 0.42) / 0.22) : 0;
    const textOut = holdP >= 0 && a.zoom ? clamp01((holdP - 0.74) / 0.08) : 0;
    const n = fxChars.length;
    fxChars.forEach((c, i) => {
      const k = smooth(clamp01(textIn * 1.6 - (i / n) * 0.6)) * (1 - textOut);
      c.style.opacity = k.toFixed(3);
      c.style.transform = `translateY(${((1 - k) * 60).toFixed(1)}%) rotateX(${((1 - k) * -80).toFixed(1)}deg)`;
    });

    if (!reduceMotion) {
      const hh = Math.min(s, vh * 1.2);
      wheel.style.translate = `0 ${(hh * -0.22).toFixed(1)}px`;
      hillsFront.style.translate = `0 ${(hh * 0.16).toFixed(1)}px`;
      hillsSide.style.translate = `0 ${(hh * 0.08).toFixed(1)}px`;
      headline.style.translate = `0 ${(hh * 0.32).toFixed(1)}px`;
      headline.style.opacity = Math.max(0, 1 - hh / (vh * 0.55)).toFixed(3);
      speedEls.forEach((el, i) => {
        const d = speedBase[i] - s - vh / 2;
        if (Math.abs(d) > vh * 1.5) return;
        el.style.translate = `0 ${(-d * el.dataset.speed).toFixed(1)}px`;
      });
      // marquee rows run with the scroll and lean into its speed
      const skew = Math.max(-14, Math.min(14, vel * 0.35));
      marqueeRows.forEach((m) => {
        if (!m.half) return;
        const off = (((s * 0.7) % m.half) + m.half) % m.half;
        const xx = m.dir > 0 ? -off : off - m.half;
        m.track.style.transform = `translate3d(${xx.toFixed(1)}px,0,0) skewX(${(-skew * m.dir).toFixed(2)}deg)`;
      });
      root.style.setProperty("--skew", `${Math.max(-5, Math.min(5, vel * 0.12)).toFixed(2)}deg`);
    }

    miniCart.classList.toggle("is-on", target > vh * 0.7);
    fx.tick(zoomK);
    requestAnimationFrame(render);
  }

  // ---------- fx canvas: bubbles while diving, splash on flavour change ----------
  const fx = (() => {
    const cv = document.getElementById("fxCanvas");
    const ctx = cv.getContext("2d");
    let dpr = 1, parts = [];
    function size() {
      dpr = Math.min(2, devicePixelRatio || 1);
      cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size(); addEventListener("resize", size);
    function splash(colors) {
      if (reduceMotion) return;
      const r = floatCup.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const cx = r.left + r.width / 2, cy = r.top + r.height * 0.42;
      for (let i = 0; i < 46; i++) {
        const ang = Math.random() * Math.PI * 2, sp = 3 + Math.random() * 9;
        parts.push({ k: "drop", x: cx, y: cy, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 5,
          r: 3 + Math.random() * 9, c: colors[i % colors.length], life: 1 });
      }
    }
    function tick(zk) {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      if (zk > 0.35 && !reduceMotion) {
        for (let i = 0; i < 3; i++) if (Math.random() < zk) parts.push({
          k: "bub", x: Math.random() * innerWidth, y: innerHeight + 30, vx: 0, vy: -(1.5 + Math.random() * 4),
          r: 4 + Math.random() * 26, life: 1, ph: Math.random() * 6,
        });
      }
      parts = parts.filter((p) => p.life > 0 && p.y > -60 && p.y < innerHeight + 80);
      for (const p of parts) {
        if (p.k === "drop") {
          p.vy += 0.38; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.life -= 0.012;
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.fillStyle = p.c;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.r, p.r * (1 + Math.min(1, Math.abs(p.vy) / 14)), Math.atan2(p.vy, p.vx) + Math.PI / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          p.ph += 0.05; p.x += Math.sin(p.ph) * 0.8; p.y += p.vy;
          p.life -= zk > 0.2 ? 0.002 : 0.04;
          ctx.globalAlpha = Math.max(0, p.life) * 0.55;
          ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke();
          ctx.globalAlpha = Math.max(0, p.life) * 0.35;
          ctx.fillStyle = "#ffffff";
          ctx.beginPath(); ctx.arc(p.x - p.r * 0.35, p.y - p.r * 0.35, p.r * 0.22, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }
    return { splash, tick };
  })();

  // ---------- fly-to-cart ----------
  function flyToCart() {
    const f = current();
    const cartBtn = document.querySelector(".pill__btn.is-dark");
    const target = miniCart.classList.contains("is-on") ? miniCart : cartBtn;
    const from = priceBtn.getBoundingClientRect(), to = target.getBoundingClientRect();
    const img = document.createElement("img");
    img.src = f.imgs[0]; img.className = "flyer"; img.alt = "";
    document.body.appendChild(img);
    const x0 = from.left + from.width / 2 - 28, y0 = from.top + from.height / 2 - 28;
    const x1 = to.left + to.width / 2 - 28, y1 = to.top + to.height / 2 - 28;
    const peak = Math.min(y0, y1) - 160;
    const done = () => {
      img.remove();
      [miniCart, badge].forEach((el) => { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); });
    };
    if (reduceMotion) { done(); return; }
    img.animate([
      { transform: `translate(${x0}px, ${y0}px) scale(.4) rotate(0deg)`, opacity: 0 },
      { transform: `translate(${lerp(x0, x1, 0.5)}px, ${peak}px) scale(1.5) rotate(200deg)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${x1}px, ${y1}px) scale(.3) rotate(400deg)`, opacity: 0.6 },
    ], { duration: 900, easing: "cubic-bezier(.5,0,.3,1)" }).onfinish = done;
  }

  measure();
  const remeasure = () => measure();
  addEventListener("resize", remeasure);
  addEventListener("load", remeasure);
  if (document.fonts) document.fonts.ready.then(remeasure);
  new ResizeObserver(remeasure).observe(document.body);
  requestAnimationFrame(render);

  // reveal blocks as they enter
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
  }), { threshold: 0.2 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  applyFlavour(current(), true);
  if (reduceMotion) {
    document.body.classList.remove("is-intro");
    layout(false);
    letters.forEach((l) => l.classList.add("in"));
    return;
  }
  // cards start hidden behind the mountain, then rise into the arc
  cards.forEach((c) => {
    const k = slotOf(c.j);
    c.el.classList.add("no-anim");
    place(c, k, isNarrow() ? 70 : 34);
    c.lastSlot = k;
  });
  void wheel.offsetWidth;
  cards.forEach((c) => c.el.classList.remove("no-anim"));

  setTimeout(() => {
    cards
      .slice()
      .sort((a, b) => Math.abs(slotOf(a.j)) - Math.abs(slotOf(b.j)))
      .forEach((c, i) => setTimeout(() => place(c, slotOf(c.j)), i * 90));
  }, 700);
  setTimeout(() => letters.forEach((l, i) => setTimeout(() => l.classList.add("in"), i * 38)), 1400);
  setTimeout(() => document.body.classList.remove("is-intro"), 2000);
  setTimeout(startAuto, 4200);
})();
