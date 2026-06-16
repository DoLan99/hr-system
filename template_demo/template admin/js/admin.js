/* jobihome.vn — shared admin shell: sidebar nav, accordion, theme toggle, mobile drawer.
   Active item is detected from the current filename. */
(function () {
  "use strict";
  var I = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    task: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" stroke-linecap="round"/>',
    office: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18" stroke-linecap="round"/>',
    layers: '<path d="M12 2l9 5-9 5-9-5z"/><path d="M3 12l9 5 9-5M3 17l9 5 9-5"/>',
    review: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M9 9l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"/>',
    gauge: '<path d="M12 13a4 4 0 1 0-4-4" stroke-linecap="round"/><circle cx="12" cy="13" r="9"/><path d="M12 13l3-3" stroke-linecap="round"/>',
    perf: '<path d="M12 2l2.6 6.3L21 9l-5 4.3L17.5 20 12 16.5 6.5 20 8 13.3 3 9l6.4-.7z"/>',
    skill: '<circle cx="12" cy="8" r="5"/><path d="M8.5 12.5L7 22l5-3 5 3-1.5-9.5" stroke-linecap="round" stroke-linejoin="round"/>',
    bar: '<path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="6"/><rect x="12" y="7" width="3" height="10"/><rect x="17" y="13" width="3" height="4"/>',
    pay: '<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    leave: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M9 15l6 0M12 12v6" stroke-linecap="round"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    box: '<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8" />',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5 5h14l3 7v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>',
    workflow: '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="9" r="2.5"/><path d="M6 8.5v7M18 11.5c0 3-3 3.5-6 3.5" stroke-linecap="round"/>',
    users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke-linecap="round"/><path d="M16 4a3 3 0 0 1 0 6M21 20a5 5 0 0 0-4-5" stroke-linecap="round"/>',
    msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    sitemap: '<rect x="9" y="2" width="6" height="5" rx="1"/><rect x="3" y="16" width="6" height="5" rx="1"/><rect x="15" y="16" width="6" height="5" rx="1"/><path d="M12 7v5M6 16v-2h12v2" stroke-linecap="round" stroke-linejoin="round"/>',
    shield: '<path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z"/><path d="M4 17h14" stroke-linecap="round"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" stroke-linecap="round"/>',
    activity: '<path d="M3 12h4l3 8 4-16 3 8h4" stroke-linecap="round" stroke-linejoin="round"/>',
    audit: '<path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/><path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"/>',
    alert: '<path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/><path d="M12 9v4M12 16h.01" stroke-linecap="round"/>',
    billing: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20" stroke-linecap="round"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 2.6 14H2.5a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4 7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9.6 4.6V4.5a2 2 0 1 1 4 0v.1A1.6 1.6 0 0 0 16 4l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 .3 2.1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>'
  };
  /* [label, icon, href, badge] */
  var PINNED = ["Dashboard", "grid", "dashboard.html"];
  var GROUPS = [
    ["Công việc", [["Tasks","task","tasks.html"],["Time Logs","clock","time-logs.html"],["Office Time","office","office-time.html"],["Task Templates","layers","task-templates.html"],["Task Reviews","review","task-reviews.html"],["Capacity","gauge","capacity.html"],["Đánh giá hiệu suất","perf","performance.html"],["Skill & Career","skill","skill-career.html"]]],
    ["Lương & Phúc lợi", [["Salary Summary","bar","salary-summary.html"],["Payments","pay","payments.html"],["Leave","leave","leave.html"]]],
    ["Khách hàng", [["Customers","users","customers.html"],["Messages","msg","messages.html","2"]]],
    ["Phê duyệt", [["Hộp duyệt","inbox","approval-inbox.html","4"],["Cấu hình Workflow","workflow","workflow-config.html"]]],
    ["Tài nguyên", [["Tài liệu","folder","documents.html"],["Quản lý Kho","box","#"]]],
    ["Hệ thống", [["Employees","users","#"],["Departments & Teams","sitemap","#"],["Roles","shield","#"],["Passwords","lock","#"],["Work Rules","book","#"],["System Labels","sliders","#"],["Activity Tracking","activity","#"],["Audit Log","audit","#"],["Anomaly Alerts","alert","#","1"],["Billing","billing","#"],["Settings","settings","#"]]]
  ];

  var page = (location.pathname.split("/").pop() || "dashboard.html").toLowerCase();
  if (page === "") page = "dashboard.html";

  function svg(k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">' + (I[k] || "") + '</svg>'; }
  var chev = '<span class="chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></span>';

  /* which group holds the active page? */
  var activeGroup = null;
  GROUPS.forEach(function (g) { g[1].forEach(function (it) { if (it[2] === page) activeGroup = g[0]; }); });

  var openState;
  try { openState = JSON.parse(localStorage.getItem("jh-nav-open")); } catch (e) {}
  if (!Array.isArray(openState)) openState = [activeGroup || "Công việc"];
  if (activeGroup && openState.indexOf(activeGroup) === -1) openState = [activeGroup];
  if (openState.length > 1) openState = [openState[0]];

  function item(it) {
    var active = it[2] === page ? " active" : "";
    var warn = it[1] === "alert" ? " warn" : "";
    var badge = it[3] ? '<span class="badge' + warn + '">' + it[3] + '</span>' : "";
    return '<a class="nav-item' + active + '" href="' + it[2] + '" title="' + it[0] + '">' + svg(it[1]) + '<span>' + it[0] + '</span>' + badge + '</a>';
  }

  var pinned = '<div class="nav-group nav-pinned"><div class="nav-gitems">' + item(PINNED) + '</div></div>';

  var html = pinned + GROUPS.map(function (g) {
    var hasBadge = g[1].some(function (it) { return it[3]; });
    var collapsed = openState.indexOf(g[0]) === -1;
    var items = g[1].map(item).join("");
    return '<div class="nav-group' + (collapsed ? " collapsed" : "") + '" data-g="' + g[0] + '">' +
      '<button class="nav-glabel"><span>' + g[0] + '</span>' + (hasBadge ? '<span class="gdot"></span>' : '') + chev + '</button>' +
      '<div class="nav-gitems">' + items + '</div></div>';
  }).join("");

  var nav = document.getElementById("sideNav");
  if (nav) nav.innerHTML = html;

  /* accordion: single-open, persisted */
  if (nav) nav.addEventListener("click", function (e) {
    var lab = e.target.closest(".nav-glabel");
    if (!lab) return;
    var grp = lab.parentElement, name = grp.getAttribute("data-g");
    var willOpen = grp.classList.contains("collapsed");
    nav.querySelectorAll(".nav-group[data-g]").forEach(function (g) { g.classList.add("collapsed"); });
    if (willOpen) grp.classList.remove("collapsed");
    openState = willOpen ? [name] : [];
    localStorage.setItem("jh-nav-open", JSON.stringify(openState));
  });

  /* theme toggle */
  var themeToggle = document.getElementById("themeToggle");
  if (themeToggle) themeToggle.addEventListener("click", function () {
    var cur = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", cur);
    localStorage.setItem("jh-theme", cur);
  });

  /* mobile drawer */
  var mb = document.getElementById("menuBtn"), scrim = document.getElementById("navScrim");
  function close() { document.body.classList.remove("nav-open"); }
  if (mb) mb.addEventListener("click", function () { document.body.classList.toggle("nav-open"); });
  if (scrim) scrim.addEventListener("click", close);
  if (nav) nav.addEventListener("click", function (e) { if (e.target.closest(".nav-item")) close(); });
})();
