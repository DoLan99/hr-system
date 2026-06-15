/* jobihome.vn — shared site behaviour
   - injects header + footer (consistent across pages)
   - theme toggle (persisted)
   - mobile nav, scroll reveal, header shadow on scroll
*/
(function () {
  "use strict";

  /* ---------- icons ---------- */
  var I = {
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
  };

  /* ---------- nav model ---------- */
  var LINKS = [
    { href: "features.html", vi: "Tính năng", en: "Features" },
    { href: "solutions.html", vi: "Giải pháp", en: "Solutions" },
    { href: "pricing.html", vi: "Bảng giá", en: "Pricing" },
    { href: "about.html", vi: "Về chúng tôi", en: "About" },
    { href: "blog.html", vi: "Tài nguyên", en: "Resources" }
  ];

  var page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  if (page === "") page = "index.html";

  function brandHTML() {
    return '<a class="brand" href="index.html" aria-label="jobihome">' +
      '<span class="logomark">j</span><span>jobihome<span class="dot">.</span>vn</span></a>';
  }

  /* ---------- header ---------- */
  function buildHeader() {
    var nav = LINKS.map(function (l) {
      var active = l.href === page ? " active" : "";
      return '<a class="' + "nav-link" + active + '" href="' + l.href + '">' + l.vi + "</a>";
    }).join("");

    var html =
      '<div class="wrap"><nav class="nav">' +
        brandHTML() +
        '<div class="nav-links">' + nav + "</div>" +
        '<div class="nav-right">' +
          '<button class="theme-toggle" id="themeToggle" aria-label="Chế độ sáng/tối" title="Sáng / Tối">' +
            '<span class="icon-moon">' + I.moon + "</span>" +
            '<span class="icon-sun">' + I.sun + "</span>" +
          "</button>" +
          '<a class="btn btn-ghost" href="dashboard.html">Đăng nhập</a>' +
          '<a class="btn btn-primary" href="contact.html">Dùng thử</a>' +
          '<button class="nav-toggle" id="navToggle" aria-label="Mở menu">' + I.menu + "</button>" +
        "</div>" +
      "</nav></div>";

    var header = document.createElement("header");
    header.className = "site-header";
    header.innerHTML = html;
    document.body.insertBefore(header, document.body.firstChild);

    document.querySelectorAll(".nav-links a").forEach(function (a) { a.classList.add("nav-links-a"); });
    // restyle active link class name used in CSS
    document.querySelectorAll(".nav-link.active").forEach(function (a) { a.classList.add("active"); });

    var navToggle = document.getElementById("navToggle");
    navToggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("mobile-open");
      navToggle.innerHTML = open ? I.close : I.menu;
    });

    var themeToggle = document.getElementById("themeToggle");
    themeToggle.addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", cur);
      localStorage.setItem("jh-theme", cur);
    });

    var onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- footer ---------- */
  function buildFooter() {
    var cols = [
      { h: "Sản phẩm", items: [
        ["features.html", "Tính năng"], ["solutions.html", "Giải pháp theo module"],
        ["pricing.html", "Bảng giá"], ["contact.html", "Dùng thử 14 ngày"]
      ]},
      { h: "Công ty", items: [
        ["about.html", "Về chúng tôi"], ["blog.html", "Tài nguyên"],
        ["contact.html", "Liên hệ"], ["#", "Tuyển dụng"]
      ]},
      { h: "Tài nguyên", items: [
        ["blog.html", "Blog"], ["#", "Hướng dẫn"], ["#", "Trạng thái hệ thống"], ["#", "Bảo mật"]
      ]}
    ];
    var colsHTML = cols.map(function (c) {
      return '<div class="footer-col"><h4>' + c.h + "</h4><ul>" +
        c.items.map(function (i) { return '<li><a href="' + i[0] + '">' + i[1] + "</a></li>"; }).join("") +
        "</ul></div>";
    }).join("");

    var html =
      '<div class="wrap"><div class="footer-grid">' +
        '<div class="footer-brand">' + brandHTML() +
          "<p>Hệ thống quản lý nhân sự &amp; team cho startup và SME Việt Nam. Task, chấm công, lương, đánh giá — trong một workspace duy nhất.</p>" +
        "</div>" + colsHTML +
      "</div>" +
      '<div class="footer-bottom">' +
        "<span>© 2026 jobihome.vn — Made in Vietnam 🇻🇳</span>" +
        '<span class="mono">v2.4 · hr-system</span>' +
      "</div></div>";

    var footer = document.createElement("footer");
    footer.className = "site-footer";
    footer.innerHTML = html;
    document.body.appendChild(footer);
  }

  /* ---------- scroll reveal (render-probed; never hides content if throttled) ---------- */
  function initReveal() {
    var els = [].slice.call(document.querySelectorAll(".reveal"));
    if (!els.length) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    function start() {
      // enable hidden-state styling, then immediately reveal whatever is on-screen
      // (same frame → above-the-fold shows with no flash; below-fold animates on scroll)
      document.body.classList.add("anim-ready");
      var pending = els.filter(function (e) { return !e.classList.contains("in"); });
      pending.forEach(function (e, i) { e.style.transitionDelay = (Math.min(i % 4, 3) * 70) + "ms"; });

      function check() {
        var vh = window.innerHeight || document.documentElement.clientHeight;
        for (var i = pending.length - 1; i >= 0; i--) {
          var r = pending[i].getBoundingClientRect();
          if (r.top < vh * 0.92 && r.bottom > 0) { pending[i].classList.add("in"); pending.splice(i, 1); }
        }
        if (!pending.length) {
          window.removeEventListener("scroll", onScroll);
          window.removeEventListener("resize", onScroll);
        }
      }
      var ticking = false;
      function onScroll() {
        if (ticking) return; ticking = true;
        requestAnimationFrame(function () { check(); ticking = false; });
      }
      check();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      setTimeout(function () { pending.slice().forEach(function (e) { e.classList.add("in"); }); }, 2500);
    }

    // probe: only enable entrance animation if the page is actually rendering frames
    requestAnimationFrame(function () { requestAnimationFrame(start); });
  }

  /* ---------- boot ---------- */
  function boot() { buildHeader(); buildFooter(); initReveal(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
