(function () {
  var bar = document.querySelector("[data-sticky-bar]");
  var hero = document.querySelector("[data-hero]");
  if (!bar || !hero) return;
  function update() {
    if (hero.getBoundingClientRect().bottom < 8) bar.classList.add("is-visible");
    else bar.classList.remove("is-visible");
  }
  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
})();
