/* ============================================================
   NUTRINANCE — front-end interactions & smooth scrolling engine
   ------------------------------------------------------------
   >>> CHANGE THE WHATSAPP NUMBER ON THE NEXT LINE ONLY. <<<
   Format: country code + number, digits only, no + or spaces.
   Example for India: "919876543210"
   ============================================================ */
var WHATSAPP_NUMBER = "919999999999";

document.addEventListener("DOMContentLoaded", function () {

  /* ---------- 0. Smooth Momentum Scrolling Engine (Lenis & GSAP Sync) ---------- */
  var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var prefersReducedMotion = motionQuery.matches;
  var lenis = null;
  window.lenis = null;

  function initLenis() {
    if (prefersReducedMotion || typeof Lenis === "undefined") {
      return null;
    }

    var instance = new Lenis({
      duration: 1.15,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.0,
      infinite: false
    });

    window.lenis = instance;

    // Synchronize Lenis with GSAP Ticker & ScrollTrigger
    if (typeof gsap !== "undefined") {
      if (typeof ScrollTrigger !== "undefined") {
        gsap.registerPlugin(ScrollTrigger);
        instance.on("scroll", ScrollTrigger.update);
      }
      gsap.ticker.add(function (time) {
        instance.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    } else {
      function raf(time) {
        instance.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }

    return instance;
  }

  lenis = initLenis();

  // Dynamic reduced motion listener
  if (motionQuery.addEventListener) {
    motionQuery.addEventListener("change", function (e) {
      prefersReducedMotion = e.matches;
      if (prefersReducedMotion && lenis) {
        lenis.destroy();
        lenis = null;
        window.lenis = null;
      } else if (!prefersReducedMotion && !lenis) {
        lenis = initLenis();
      }
    });
  }

  /* ---------- 1. Wire up every WhatsApp link ---------- */
  var waLinks = document.querySelectorAll("[data-wa]");
  waLinks.forEach(function (el) {
    var msg = el.getAttribute("data-wa") || "Hi Nutrinance!";
    el.setAttribute("href", "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(msg));
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener");
  });

  /* ---------- 2. Mobile navigation with Lenis Pause / Resume ---------- */
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
    if (window.lenis) {
      window.lenis.start();
    }
  }

  burger.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    burger.classList.toggle("is-open", open);
    backdrop.classList.toggle("is-on", open);
    document.body.classList.toggle("nav-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    if (window.lenis) {
      if (open) {
        window.lenis.stop();
      } else {
        window.lenis.start();
      }
    }
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
    var scrollY = window.lenis ? window.lenis.scroll : window.scrollY;
    header.classList.toggle("is-stuck", scrollY > 12);
    var pos = scrollY + 150, current = null;
    sections.forEach(function (sec) { if (sec.offsetTop <= pos) current = sec.id; });
    navLinks.forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("href") === "#" + current);
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  if (lenis) {
    lenis.on("scroll", onScroll);
  }
  onScroll();

  /* ---------- 4. Smooth Anchor Navigation with Dynamic Sticky Header Offset ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      var targetId = this.getAttribute("href");
      if (!targetId || targetId === "#") return;
      if (targetId.startsWith("#")) {
        var targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          var headerEl = document.getElementById("header");
          var headerHeight = headerEl ? headerEl.offsetHeight : 78;
          var targetOffset = -(headerHeight + 16);

          if (window.lenis && !prefersReducedMotion) {
            window.lenis.scrollTo(targetElement, {
              offset: targetOffset,
              duration: 1.1,
              easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }
            });
          } else {
            var targetTop = targetElement.getBoundingClientRect().top + window.pageYOffset + targetOffset;
            window.scrollTo({
              top: Math.max(0, targetTop),
              behavior: prefersReducedMotion ? "auto" : "smooth"
            });
          }

          if (history.pushState) {
            history.pushState(null, null, targetId);
          }
        }
      }
    });
  });

  /* ---------- 5. Program tabs (WAI-ARIA Tablist Pattern with Keyboard Navigation) ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
  var panels = Array.prototype.slice.call(document.querySelectorAll(".tab-panel"));

  function switchTab(targetTab, shouldFocus) {
    if (!targetTab) return;
    var key = targetTab.getAttribute("data-tab");
    tabs.forEach(function (t) {
      var on = t === targetTab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.setAttribute("tabindex", on ? "0" : "-1");
    });
    panels.forEach(function (p) {
      var matches = p.getAttribute("data-panel") === key;
      p.classList.toggle("is-active", matches);
      if (matches) {
        p.removeAttribute("hidden");
      } else {
        p.setAttribute("hidden", "hidden");
      }
    });
    if (shouldFocus) {
      targetTab.focus();
    }
    var activePanel = document.querySelector('.tab-panel[data-panel="' + key + '"]');
    if (activePanel) {
      revealAll(activePanel);
      if (typeof gsap !== "undefined" && !prefersReducedMotion) {
        var cards = activePanel.querySelectorAll(".prog-card");
        gsap.fromTo(
          cards,
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "power2.out", overwrite: "auto" }
        );
      }
    }
    if (typeof ScrollTrigger !== "undefined" && ScrollTrigger.refresh) {
      setTimeout(function () { ScrollTrigger.refresh(); }, 100);
    }
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener("click", function () {
      switchTab(tab, false);
    });

    tab.addEventListener("keydown", function (e) {
      var newIndex = -1;
      if (e.key === "ArrowRight" || e.key === "Right") {
        e.preventDefault();
        newIndex = (index + 1) % tabs.length;
      } else if (e.key === "ArrowLeft" || e.key === "Left") {
        e.preventDefault();
        newIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (e.key === "Home") {
        e.preventDefault();
        newIndex = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        newIndex = tabs.length - 1;
      }

      if (newIndex !== -1 && tabs[newIndex]) {
        switchTab(tabs[newIndex], true);
      }
    });
  });

  /* ---------- 6. Recipe filters ---------- */
  var filters = document.querySelectorAll(".filter");
  var recipes = document.querySelectorAll(".recipe");
  filters.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var key = btn.getAttribute("data-filter");
      filters.forEach(function (f) { f.classList.toggle("is-active", f === btn); });
      var visibleRecipes = [];
      recipes.forEach(function (card) {
        var show = key === "all" || card.getAttribute("data-cat") === key;
        card.classList.toggle("is-hidden", !show);
        if (show) {
          card.classList.remove("in");
          void card.offsetWidth;
          card.classList.add("in");
          visibleRecipes.push(card);
        }
      });
      if (typeof gsap !== "undefined" && !prefersReducedMotion && visibleRecipes.length > 0) {
        gsap.fromTo(
          visibleRecipes,
          { opacity: 0, y: 20, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.05, ease: "power2.out", overwrite: "auto" }
        );
      }
      if (typeof ScrollTrigger !== "undefined" && ScrollTrigger.refresh) {
        setTimeout(function () { ScrollTrigger.refresh(); }, 150);
      }
    });
  });

  /* ---------- 7. Testimonial slider (Scroll Contained) ---------- */
  var track = document.getElementById("sliderTrack");
  var dotsWrap = document.getElementById("dots");
  var prevBtn = document.getElementById("prevBtn");
  var nextBtn = document.getElementById("nextBtn");

  if (track && !track.getAttribute("data-lenis-prevent")) {
    track.setAttribute("data-lenis-prevent", "true");
  }

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

  /* ---------- 8. Booking form -> WhatsApp ---------- */
  var form = document.getElementById("bookForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("bName");
      var age = document.getElementById("bAge").value.trim();
      var goal = document.getElementById("bGoal").value;
      var note = document.getElementById("bNote").value.trim();
      var statusEl = document.getElementById("formStatus");

      if (!name.value.trim()) {
        name.classList.add("err");
        name.setAttribute("aria-invalid", "true");
        if (statusEl) {
          statusEl.textContent = "Please enter your name to proceed.";
        }
        name.focus();
        return;
      }
      name.classList.remove("err");
      name.setAttribute("aria-invalid", "false");
      if (statusEl) {
        statusEl.textContent = "Opening WhatsApp to send your consultation request...";
      }

      var lines = [
        "Hi Nutrinance! I would like to book a consultation.",
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

    var nameInput = document.getElementById("bName");
    if (nameInput) {
      nameInput.addEventListener("input", function () {
        this.classList.remove("err");
        this.setAttribute("aria-invalid", "false");
        var statusEl = document.getElementById("formStatus");
        if (statusEl) {
          statusEl.textContent = "";
        }
      });
    }
  }

  /* ---------- 9. FAQ Accordion WAAPI Smooth Expansion / Collapse ---------- */
  var accordionDetails = document.querySelectorAll(".accordion details");
  accordionDetails.forEach(function (el) {
    var summary = el.querySelector("summary");
    var content = el.querySelector("p");
    var animation = null;
    var isClosing = false;
    var isExpanding = false;

    if (!summary) return;

    summary.addEventListener("click", function (e) {
      if (typeof el.animate !== "function" || prefersReducedMotion) {
        if (typeof ScrollTrigger !== "undefined" && ScrollTrigger.refresh) {
          setTimeout(function () { ScrollTrigger.refresh(); }, 50);
        }
        return;
      }

      e.preventDefault();
      el.style.overflow = "hidden";

      if (isClosing || !el.open) {
        openAccordion();
      } else if (isExpanding || el.open) {
        shrinkAccordion();
      }
    });

    function shrinkAccordion() {
      isClosing = true;
      var startHeight = el.offsetHeight + "px";
      var endHeight = summary.offsetHeight + "px";

      if (animation) animation.cancel();

      animation = el.animate(
        { height: [startHeight, endHeight] },
        { duration: 300, easing: "cubic-bezier(0.25, 1, 0.5, 1)" }
      );

      animation.onfinish = function () {
        onAnimationFinish(false);
      };
      animation.oncancel = function () {
        isClosing = false;
      };
    }

    function openAccordion() {
      el.style.height = el.offsetHeight + "px";
      el.open = true;
      window.requestAnimationFrame(function () {
        expandAccordion();
      });
    }

    function expandAccordion() {
      isExpanding = true;
      var startHeight = el.offsetHeight + "px";
      var contentH = content ? content.offsetHeight : 0;
      var endHeight = (summary.offsetHeight + contentH + 18) + "px";

      if (animation) animation.cancel();

      animation = el.animate(
        { height: [startHeight, endHeight] },
        { duration: 340, easing: "cubic-bezier(0.25, 1, 0.5, 1)" }
      );

      animation.onfinish = function () {
        onAnimationFinish(true);
      };
      animation.oncancel = function () {
        isExpanding = false;
      };
    }

    function onAnimationFinish(openState) {
      el.open = openState;
      animation = null;
      isClosing = false;
      isExpanding = false;
      el.style.height = "";
      el.style.overflow = "";
      if (typeof ScrollTrigger !== "undefined" && ScrollTrigger.refresh) {
        ScrollTrigger.refresh();
      }
    }
  });

  /* ---------- 10. GSAP & ScrollTrigger Batch Reveals & Ambient Motion ---------- */
  function revealAll(scope) {
    (scope || document).querySelectorAll(".reveal").forEach(function (el) {
      el.classList.add("in");
    });
  }

  if (prefersReducedMotion) {
    revealAll();
  } else {
    // 1. GSAP ScrollTrigger Batch Reveals when GSAP & ScrollTrigger are available
    if (typeof gsap !== "undefined") {
      // Floating Hero Badges (organic continuous sine tweens)
      gsap.to(".float-card-1", {
        y: -12,
        rotation: 1.2,
        duration: 3.4,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true
      });

      gsap.to(".float-card-2", {
        y: 10,
        rotation: -1,
        duration: 4.1,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: 0.7
      });

      if (typeof ScrollTrigger !== "undefined") {
        // Section Headings (Staggered Fade-Up)
        document.querySelectorAll(".section-head").forEach(function (head) {
          if (head.children && head.children.length > 0) {
            gsap.from(head.children, {
              scrollTrigger: {
                trigger: head,
                start: "top 85%",
                once: true
              },
              y: 35,
              opacity: 0,
              duration: 0.85,
              stagger: 0.12,
              ease: "power3.out"
            });
          }
        });

        // "Who We Help" Cards (Staggered Entrance)
        ScrollTrigger.batch(".who-card", {
          interval: 0.1,
          batchMax: 4,
          onEnter: function (batch) {
            gsap.fromTo(
              batch,
              { opacity: 0, y: 45, scale: 0.96 },
              { opacity: 1, y: 0, scale: 1, duration: 0.75, stagger: 0.12, ease: "power3.out", overwrite: "auto" }
            );
            batch.forEach(function (el) { el.classList.add("in"); });
          },
          once: true
        });

        // Program Cards Batch Reveal (on active panel)
        ScrollTrigger.batch(".tab-panel.is-active .prog-card", {
          interval: 0.08,
          batchMax: 4,
          onEnter: function (batch) {
            gsap.fromTo(
              batch,
              { opacity: 0, y: 40 },
              { opacity: 1, y: 0, duration: 0.65, stagger: 0.08, ease: "power2.out", overwrite: "auto" }
            );
            batch.forEach(function (el) { el.classList.add("in"); });
          },
          once: true
        });

        // Women's Health Cards
        ScrollTrigger.batch(".women-card", {
          interval: 0.1,
          batchMax: 3,
          onEnter: function (batch) {
            gsap.fromTo(
              batch,
              { opacity: 0, y: 40 },
              { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: "power3.out", overwrite: "auto" }
            );
            batch.forEach(function (el) { el.classList.add("in"); });
          },
          once: true
        });

        // How It Works Steps
        ScrollTrigger.batch(".step", {
          interval: 0.12,
          batchMax: 4,
          onEnter: function (batch) {
            gsap.fromTo(
              batch,
              { opacity: 0, y: 35, scale: 0.95 },
              { opacity: 1, y: 0, scale: 1, duration: 0.75, stagger: 0.12, ease: "back.out(1.4)", overwrite: "auto" }
            );
            batch.forEach(function (el) { el.classList.add("in"); });
          },
          once: true
        });

        // Recipe Cards Batch Reveal
        ScrollTrigger.batch(".recipe:not(.is-hidden)", {
          interval: 0.08,
          batchMax: 4,
          onEnter: function (batch) {
            gsap.fromTo(
              batch,
              { opacity: 0, y: 35, scale: 0.97 },
              { opacity: 1, y: 0, scale: 1, duration: 0.65, stagger: 0.09, ease: "power3.out", overwrite: "auto" }
            );
            batch.forEach(function (el) { el.classList.add("in"); });
          },
          once: true
        });

        // Transformations Reveal
        ScrollTrigger.batch(".transform", {
          interval: 0.1,
          batchMax: 3,
          onEnter: function (batch) {
            gsap.fromTo(
              batch,
              { opacity: 0, y: 35 },
              { opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: "power3.out", overwrite: "auto" }
            );
            batch.forEach(function (el) { el.classList.add("in"); });
          },
          once: true
        });

        // Instagram Community Strip Reveal
        ScrollTrigger.batch(".insta-box", {
          interval: 0.1,
          batchMax: 1,
          onEnter: function (batch) {
            gsap.fromTo(
              batch,
              { opacity: 0, y: 35, scale: 0.98 },
              { opacity: 1, y: 0, scale: 1, duration: 0.75, ease: "power3.out", overwrite: "auto" }
            );
            batch.forEach(function (el) { el.classList.add("in"); });
          },
          once: true
        });
      }
    }

    // 2. IntersectionObserver for general .reveal containers & testing environments
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
  }

  /* ---------- 11. Refresh ScrollTrigger on Load & Font Readiness ---------- */
  window.addEventListener("load", function () {
    if (typeof ScrollTrigger !== "undefined" && ScrollTrigger.refresh) {
      ScrollTrigger.refresh();
    }
  });
  if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      if (typeof ScrollTrigger !== "undefined" && ScrollTrigger.refresh) {
        ScrollTrigger.refresh();
      }
    });
  }

  /* ---------- 12. Debounced Resize Handler for Layout Stability ---------- */
  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (typeof ScrollTrigger !== "undefined" && ScrollTrigger.refresh) {
        ScrollTrigger.refresh();
      }
    }, 200);
  });

  /* ---------- 13. Footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
});
