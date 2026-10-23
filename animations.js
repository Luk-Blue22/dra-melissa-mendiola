/*
  Animaciones — Dra. Melissa Mendiola (JS propio, sin librerías).
  - Los elementos solo se ocultan cuando este script confirma que cargó (clase html.anim).
  - ?captura=1 o prefers-reduced-motion: no se anima nada y todo queda en su estado final.
  - El header fijo, la barra inferior y el menú hamburguesa no se tocan.
*/
(function () {
  'use strict';

  var root = document.documentElement;

  if (new URLSearchParams(window.location.search).get('captura') === '1') {
    root.classList.add('captura');
    return;
  }
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window) || !window.WeakMap || !window.CSS || !CSS.supports('translate', '0 1px')) return;

  function $$(selector) { return Array.prototype.slice.call(document.querySelectorAll(selector)); }
  function isStar(el) { return el.classList.contains('material-symbols-outlined') && /^star(_half)?$/.test(el.textContent.trim()); }

  var tagged = [];                 // elementos que se revelan al hacer scroll
  var heroItems = [];              // {el, delay}: se revelan al cargar
  var starGroups = new WeakMap();  // contenedor -> estrellas

  function tag(list, kind) {
    list.forEach(function (el) {
      if (el.hasAttribute('data-anim')) return;
      el.setAttribute('data-anim', kind || 'rise');
      if (kind !== 'hero') tagged.push(el);
    });
  }

  function cleanup() {
    root.classList.remove('anim');
    $$('[data-anim]').forEach(function (el) {
      el.removeAttribute('data-anim');
      el.style.removeProperty('--ad');
      el.classList.remove('is-in', 'is-instant');
    });
  }

  function setup() {
    /* ---- Hero (al cargar: texto y luego imagen) ---- */
    var dText = $$('#inicio .grid > div:first-child > *');
    var dImg = $$('#inicio .grid > div:last-child');
    var mItems = $$('#m-inicio > *');
    var mDelays = [100, 220, 430, 570, 690]; // badge/calificación, título, foto, botón, ribbon

    dText.forEach(function (el, i) { heroItems.push({ el: el, delay: 120 + i * 110 }); });
    dImg.forEach(function (el) { heroItems.push({ el: el, delay: 620 }); });
    mItems.forEach(function (el, i) { heroItems.push({ el: el, delay: mDelays[i] != null ? mDelays[i] : 690 }); });
    tag(heroItems.map(function (h) { return h.el; }), 'hero');

    /* ---- Secciones al hacer scroll ---- */
    tag([].concat(
      // escritorio
      $$('#servicios .max-w-2xl'), $$('#servicios .grid > div'), $$('#servicios .mt-12'),
      $$('#sobre-mi > div > div'),
      $$('#opiniones .text-center'), $$('#opiniones .grid > div'),
      $$('#ubicacion .text-center'), $$('#ubicacion .grid > div'),
      $$('#contacto > div > div'),
      $$('#v-desktop footer .grid > div'),
      // móvil
      $$('#m-servicios > div:first-child'), $$('#m-servicios .grid > div'), $$('#m-servicios > div:last-child'),
      $$('#m-sobre-mi > div'),
      $$('#m-opiniones > div:first-child'), $$('#m-opiniones > div:last-child > div'),
      $$('#m-ubicacion > div'),
      $$('#m-contacto-directo > div'),
      $$('#m-contacto .max-w-md > div')
    ));

    /* ---- Estrellas: una por una (solo contenedores que contienen únicamente estrellas) ---- */
    var seen = [];
    $$('.material-symbols-outlined').filter(isStar).forEach(function (star) {
      var group = star.parentElement;
      if (seen.indexOf(group) !== -1) return;
      var kids = Array.prototype.slice.call(group.children);
      if (!kids.every(isStar)) return;
      seen.push(group);
      starGroups.set(group, kids);
      kids.forEach(function (s) { s.setAttribute('data-anim', 'star'); });
      tagged.push(group);
    });

    /* ---- Hover (solo escritorio; los estilos están en animations.css) ---- */
    $$('a[href^="https://wa.me"], a[href^="tel:"]').forEach(function (a) {
      if (!a.closest('aside')) a.setAttribute('data-hover', 'btn');
    });
    $$('#servicios .grid > div, #opiniones .grid > div').forEach(function (el) { el.setAttribute('data-hover', 'card'); });
    $$('#inicio .rounded-3xl.overflow-hidden').forEach(function (el) { el.setAttribute('data-hover', 'frame'); });
    $$('#sobre-mi img').forEach(function (el) { el.setAttribute('data-hover', 'zoom'); });

    /* ---- Activa el modo animado (a partir de aquí lo marcado queda oculto hasta revelarse) ---- */
    root.classList.add('anim');

    function fire(el, delay, instant) {
      if (el.classList.contains('is-in')) return;
      if (instant) el.classList.add('is-instant');
      else el.style.setProperty('--ad', delay + 'ms');
      el.classList.add('is-in');
    }

    var io = new IntersectionObserver(function (entries) {
      var show = [];
      entries.forEach(function (e) {
        if (e.isIntersecting) show.push(e);
        else if (e.boundingClientRect.top < 0) reveal(e.target, 0, true); // ya quedó por encima del viewport
      });
      show.sort(function (a, b) {
        var A = a.boundingClientRect, B = b.boundingClientRect;
        return (Math.round(A.top / 8) - Math.round(B.top / 8)) || (A.left - B.left);
      });
      show.forEach(function (e, i) { reveal(e.target, Math.min(i, 3) * 100, false); }); // escalonado ~100 ms
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    function reveal(el, delay, instant) {
      io.unobserve(el);
      var stars = starGroups.get(el);
      if (stars) {
        var base = el.closest('#inicio, #m-inicio') ? 450 : 120;
        stars.forEach(function (s, i) { fire(s, base + i * 70, instant); });
        return;
      }
      fire(el, delay, instant);
    }

    tagged.forEach(function (el) { io.observe(el); });

    // Hero: arranca tras pintar el estado oculto
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        heroItems.forEach(function (h) { fire(h.el, h.delay, false); });
      });
    });
  }

  try { setup(); } catch (err) { cleanup(); }
})();
