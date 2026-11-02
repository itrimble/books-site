/* Dead Signal landing/reader page tracking.
 *
 * Purpose: paid and organic traffic to Dead Signal must be attributable by
 * SOURCE and CREATIVE, otherwise a $5/day ad test cannot produce a decision.
 * The launch-list CTA is a mailto: (no email provider is wired yet), so this
 * script records the click in PostHog with the captured source/creative props
 * BEFORE the mail client opens. That makes "launch-list intent" measurable
 * even though the address itself is not captured.
 *
 * Props captured: source, medium, campaign, creative, content, referrer, landing path.
 * Events: ds_landing_view, ds_launch_click, ds_reader_view.
 */
(function () {
  var qs = new URLSearchParams(window.location.search);
  var utm = {};
  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id"].forEach(function (k) {
    var v = qs.get(k);
    if (v) utm[k] = v;
  });
  // Allow ?src=&creative= overrides for off-platform links (newsletter, podcast, QR).
  if (qs.get("src")) utm.utm_source = qs.get("src");
  if (qs.get("creative")) utm.utm_content = qs.get("creative");

  var props = {
    source: utm.utm_source || "(none)",
    medium: utm.utm_medium || "(none)",
    campaign: utm.utm_campaign || "(none)",
    creative: utm.utm_content || "(none)",
    term: utm.utm_term || "",
    referrer: document.referrer || "(direct)",
    path: window.location.pathname,
  };

  function capture(name, extra) {
    try {
      if (window.posthog && window.posthog.capture) {
        var p = {};
        for (var k in props) p[k] = props[k];
        if (extra) for (var k2 in extra) p[k2] = extra[k2];
        window.posthog.capture(name, p);
      }
    } catch (e) {}
  }

  // First-touch source, so a direct return visit is still credited to the campaign.
  try {
    var prior = window.sessionStorage.getItem("ds_source");
    if (!prior && utm.utm_source) {
      window.sessionStorage.setItem("ds_source", JSON.stringify(utm));
    } else if (prior) {
      try {
        var saved = JSON.parse(prior);
        for (var sk in saved) if (!utm[sk]) utm[sk] = saved[sk];
        if (!utm.utm_source) props.source = "(none)";
      } catch (e2) {}
    }
  } catch (e3) {}

  if (document.querySelector("[data-read-prose]")) {
    capture("ds_reader_view");
  } else {
    capture("ds_landing_view");
  }

  // Launch-list / preorder CTAs: fire the event, then let the mailto proceed.
  var links = document.querySelectorAll(
    'a[href^="mailto:"], a[href*="/dead-signal/preorder.html"], a[href*="/dead-signal/sample.html"], a[href*="/read/dead-signal/"]'
  );
  for (var i = 0; i < links.length; i++) {
    links[i].addEventListener(
      "click",
      function (ev) {
        var el = ev.currentTarget;
        capture("ds_launch_click", {
          cta_text: (el.textContent || "").trim().slice(0, 60),
          cta_href: el.getAttribute("href"),
        });
      },
      true
    );
  }
})();
