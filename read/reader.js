/* /read/ sample reader: progress bar + PostHog reading events.
   Events: read_start, read_25, read_50, read_75, read_complete, buy_click  — props {title, store}.
   Config comes from <body data-read-title="..." data-read-slug="...">. Buy links carry data-store="amazon|gumroad|...". */
(function () {
  var body = document.body;
  var title = body.getAttribute("data-read-title") || document.title;
  var slug = body.getAttribute("data-read-slug") || "";
  var prose = document.querySelector("[data-read-prose]");
  var bar = document.querySelector("[data-read-progress] span");
  var sent = {};
  function track(name, extra) {
    if (sent[name] && name !== "buy_click") return;
    sent[name] = true;
    var props = { title: title, slug: slug };
    if (extra) for (var k in extra) props[k] = extra[k];
    try { if (window.posthog && window.posthog.capture) window.posthog.capture(name, props); } catch (e) {}
    (window.__readEvents = window.__readEvents || []).push([name, props]); // QA hook
  }
  track("read_start");
  function pct() {
    if (!prose) return 0;
    var r = prose.getBoundingClientRect();
    var total = r.height - window.innerHeight * 0.5;
    var done = window.innerHeight * 0.5 - r.top;
    if (total <= 0) return r.top < window.innerHeight ? 100 : 0;
    return Math.max(0, Math.min(100, (done / total) * 100));
  }
  function update() {
    var p = pct();
    if (bar) bar.style.width = p.toFixed(1) + "%";
    if (p >= 25) track("read_25");
    if (p >= 50) track("read_50");
    if (p >= 75) track("read_75");
    if (p >= 99.5) track("read_complete");
  }
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
  var links = document.querySelectorAll("a[data-store]");
  for (var i = 0; i < links.length; i++) {
    links[i].addEventListener("click", function () {
      track("buy_click", { store: this.getAttribute("data-store"), book: this.getAttribute("data-book") || title });
    });
  }
})();
