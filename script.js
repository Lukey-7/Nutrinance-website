/* ============================================================
   NUTRINANCE — front-end interactions
   ------------------------------------------------------------
   >>> CHANGE THE WHATSAPP NUMBER ON THE NEXT LINE ONLY. <<<
   Format: country code + number, digits only, no + or spaces.
   Example for India: "919876543210"
   ============================================================ */
var WHATSAPP_NUMBER = "919999999999";

document.addEventListener("DOMContentLoaded", function () {

  /* ---------- 1. Wire up every WhatsApp link ---------- */
  var waLinks = document.querySelectorAll("[data-wa]");
  waLinks.forEach(function (el) {
    var msg = el.getAttribute("data-wa") || "Hi Nutrinance!";
    el.setAttribute("href", "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(msg));
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener");
  });

  /* ---------- 2. Mobile navigation ---------- */
  var nav = document.getElementById("nav");
  var burger = document.getElementById("hamburger");
  var backdrop = document.createElement("div");
  backdrop.className = "nav-backdrop";
  document.body.appendChild(backdrop);

  function closeNav() {
    nav.classList.remove("is-open");
    burger.classList.remove("is-open");
    backdrop.classList.remove("is-on");
    document.body.classList.remove("nav-open");
    burger.setAttribute("aria-expanded", "false");
  }
  burger.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    burger.classList.toggle("is-open", open);
    backdrop.classList.toggle("is-on", open);
    document.body.classList.toggle("nav-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
  });
  backdrop.addEventListener("click", closeNav);
  nav.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", closeNav); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeNav(); });

  /* ---------- 3. Sticky header + active section ---------- */
  var header = document.getElementById("header");
  var navLinks = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  function onScroll() {
    header.classList.toggle("is-stuck", window.scrollY > 12);
    var pos = window.scrollY + 150, current = null;
    sections.forEach(function (sec) { if (sec.offsetTop <= pos) current = sec.id; });
    navLinks.forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("href") === "#" + current);
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- 4. Program tabs ---------- */
  var tabs = document.querySelectorAll(".tab");
  var panels = document.querySelectorAll(".tab-panel");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var key = tab.getAttribute("data-tab");
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      panels.forEach(function (p) {
        p.classList.toggle("is-active", p.getAttribute("data-panel") === key);
      });
      revealAll(document.querySelector('.tab-panel[data-panel="' + key + '"]'));
    });
  });

  /* ---------- 5. Recipe filters ---------- */
  var filters = document.querySelectorAll(".filter");
  var recipes = document.querySelectorAll(".recipe");
  filters.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var key = btn.getAttribute("data-filter");
      filters.forEach(function (f) { f.classList.toggle("is-active", f === btn); });
      recipes.forEach(function (card) {
        var show = key === "all" || card.getAttribute("data-cat") === key;
        card.classList.toggle("is-hidden", !show);
        if (show) {
          card.classList.remove("in");
          void card.offsetWidth;
          card.classList.add("in");
        }
      });
    });
  });

  /* ---------- 6. Testimonial slider ---------- */
  var track = document.getElementById("sliderTrack");
  var dotsWrap = document.getElementById("dots");
  var prevBtn = document.getElementById("prevBtn");
  var nextBtn = document.getElementById("nextBtn");

  function pageCount() {
    var cards = track.children.length || 1;
    if (!track.clientWidth) return 1;
    return Math.min(cards, Math.max(1, Math.round(track.scrollWidth / track.clientWidth)));
  }
  function buildDots() {
    dotsWrap.innerHTML = "";
    for (var i = 0; i < pageCount(); i++) {
      var d = document.createElement("button");
      d.setAttribute("aria-label", "Go to testimonial page " + (i + 1));
      d.dataset.page = i;
      d.addEventListener("click", function (e) {
        track.scrollTo({ left: track.clientWidth * Number(e.currentTarget.dataset.page), behavior: "smooth" });
      });
      dotsWrap.appendChild(d);
    }
    syncDots();
  }
  function syncDots() {
    var active = Math.round(track.scrollLeft / track.clientWidth);
    dotsWrap.querySelectorAll("button").forEach(function (d, i) {
      d.classList.toggle("is-active", i === active);
    });
  }
  if (track) {
    buildDots();
    track.addEventListener("scroll", syncDots, { passive: true });
    window.addEventListener("load", buildDots);
    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(buildDots, 150);
    });
    nextBtn.addEventListener("click", function () {
      var atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
      track.scrollTo({ left: atEnd ? 0 : track.scrollLeft + track.clientWidth, behavior: "smooth" });
    });
    prevBtn.addEventListener("click", function () {
      var atStart = track.scrollLeft <= 8;
      track.scrollTo({ left: atStart ? track.scrollWidth : track.scrollLeft - track.clientWidth, behavior: "smooth" });
    });
  }

  /* ---------- 7. Booking form -> WhatsApp ---------- */
  var form = document.getElementById("bookForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("bName");
      var age = document.getElementById("bAge").value.trim();
      var goal = document.getElementById("bGoal").value;
      var note = document.getElementById("bNote").value.trim();

      if (!name.value.trim()) {
        name.classList.add("err");
        name.focus();
        return;
      }
      name.classList.remove("err");

      var lines = [
        "Hi Vrushika! I would like to book a consultation with Nutrinance.",
        "",
        "Name: " + name.value.trim()
      ];
      if (age) lines.push("Age: " + age);
      lines.push("I need help with: " + goal);
      if (note) lines.push("Other details: " + note);
      lines.push("", "Looking forward to hearing from you!");

      window.open(
        "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(lines.join("\n")),
        "_blank",
        "noopener"
      );
    });
    document.getElementById("bName").addEventListener("input", function () {
      this.classList.remove("err");
    });
  }

  /* ---------- 8. Reveal on scroll ---------- */
  function revealAll(scope) {
    (scope || document).querySelectorAll(".reveal").forEach(function (el) {
      el.classList.add("in");
    });
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (entry.isIntersecting) {
          var el = entry.target;
          setTimeout(function () { el.classList.add("in"); }, i * 70);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    revealAll();
  }

  /* ---------- 9. Footer year ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();
});
