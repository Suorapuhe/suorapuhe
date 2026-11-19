/* ==========================================================================
   Suorapuhe – luetut artikkelit + haasteen jatkopainike
   - Artikkeli merkitään luetuksi, kun lukija pääsee loppuun asti
     (main.js lähettää 'sp:complete'-tapahtuman)
   - Luetut artikkelit saavat "✓ Luettu" -merkin korteissa
   - Jos 12 viikon haaste on aloitettu, haastepainikkeet muuttuvat
     muotoon "Jatka haastetta – päivä X/84"
   Tila tallennetaan evästeeseen (luetut) ja localStorageen (haaste)
   vain tällä laitteella. Mitään ei lähetetä minnekään.
   ========================================================================== */
(function () {
  'use strict';

  var COOKIE_NAME = 'sp_read';
  var COOKIE_DAYS = 90;
  var BASE_PATH = '/suorapuhe/';

  function setCookie(name, value, days) {
    var d = new Date();
    d.setTime(d.getTime() + days * 864e5);
    document.cookie = name + '=' + encodeURIComponent(value) + ';expires=' + d.toUTCString() + ';path=' + BASE_PATH + ';SameSite=Lax';
  }
  function getCookie(name) {
    var m = document.cookie.match('(?:^|; )' + name + '=([^;]*)');
    return m ? decodeURIComponent(m[1]) : '';
  }
  function getRead() { try { return JSON.parse(getCookie(COOKIE_NAME) || '{}') || {}; } catch (e) { return {}; } }
  function isRead(slug) { return !!getRead()[slug]; }
  function markRead(slug) { var r = getRead(); r[slug] = 1; setCookie(COOKIE_NAME, JSON.stringify(r), COOKIE_DAYS); }

  function normalize(p) {
    if (!p) return '';
    p = p.replace(/^https?:\/\/[^/]+/i, '').split('#')[0].split('?')[0];
    if (p.indexOf(BASE_PATH) === 0) p = p.slice(BASE_PATH.length);
    return p.replace(/^(?:\.\.?\/)+/, '').replace(/^\/+/, '').replace(/\.html$/i, '').replace(/\/+$/, '').toLowerCase();
  }

  function toast(text) {
    var t = document.createElement('div');
    t.className = 'sp-toast';
    t.setAttribute('role', 'status');
    t.textContent = text;
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('is-on'); }, 10);
    setTimeout(function () { t.classList.remove('is-on'); }, 3000);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3600);
  }

  /* Artikkeli luettu loppuun */
  function completeCurrent() {
    if (!document.querySelector('.article-body')) return;
    var slug = normalize(location.pathname);
    if (!slug) return;
    var was = isRead(slug);
    markRead(slug);
    if (!was) toast('✓ Artikkeli luettu loppuun');
  }

  /* "✓ Luettu" -merkit artikkelikortteihin */
  function decorateCards() {
    var cat = normalize(location.pathname).split('/')[0];
    document.querySelectorAll('.card').forEach(function (card) {
      var a = card.querySelector('.card-title a[href]') || card.querySelector('a[href]');
      if (!a) return;
      var slug = normalize(a.getAttribute('href'));
      if (slug.indexOf('/') < 0) slug = cat + '/' + slug;
      if (isRead(slug) && !card.querySelector('.card-read')) {
        card.classList.add('is-read');
        var b = document.createElement('span');
        b.className = 'card-read';
        b.textContent = '✓ Luettu';
        card.appendChild(b);
      }
    });
  }

  /* Haastepainikkeet: aloita tai jatka */
  function decorateChallenge() {
    var st = null;
    try { st = JSON.parse(localStorage.getItem('sp_haaste_v1') || 'null'); } catch (e) {}
    if (!st || !st.started) return;
    var a = new Date(st.started + 'T00:00:00'), now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var day = Math.max(1, Math.min(84, Math.round((today - a) / 864e5) + 1));
    ['sp-hero-cta', 'sp-haaste-cta'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = '🔥 Jatka haastetta – päivä ' + day + '/84 →';
    });
    var prog = document.getElementById('sp-hero-progress');
    if (prog) prog.innerHTML = 'Viikko <b>' + Math.ceil(day / 7) + '/12</b> menossa. Tee tämän päivän tehtävä.';
  }

  function init() {
    decorateCards();
    decorateChallenge();
    document.addEventListener('sp:complete', completeCurrent);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
