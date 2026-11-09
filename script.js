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
    priceValue.textContent = f.price;
    if (f.colors) {
      fruitParts.forEach((p, i) => p.setAttribute("fill", f.colors[i]));
      fruitLayer.style.opacity = "1";
    } else {
      fruitLayer.style.opacity = "0";
    }
    if (instant) { flavourEl.textContent = f.name; return; }
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
    badge.classList.remove("bump"); void badge.offsetWidth; badge.classList.add("bump");
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
  applyFlavour(current(), true);
  if (reduceMotion) {
    layout(false);
    letters.forEach((l) => l.classList.add("in"));
    return;
  }
  card.classList.add("is-intro");
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
  setTimeout(() => card.classList.remove("is-intro"), 2000);
  setTimeout(startAuto, 4200);
})();
