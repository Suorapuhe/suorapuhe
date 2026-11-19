(function(){
  'use strict';

  // ── Mobiilimenu ────────────────────────────────────────────
  var toggle = document.getElementById('menu-toggle');
  var navLinks = document.querySelector('.nav-links');
  if(toggle && navLinks){
    toggle.addEventListener('click', function(){
      var open = navLinks.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });
  }

  // ── Ulkoiset linkit ────────────────────────────────────────
  document.querySelectorAll('.article-body a').forEach(function(a){
    if(a.hostname && a.hostname !== location.hostname){
      if(!a.getAttribute('target')) a.setAttribute('target','_blank');
      if(!a.getAttribute('rel')) a.setAttribute('rel','noopener');
    }
  });

  // ── TOC: vain H2, max 6 kpl ───────────────────────────────
  var tocWidget = document.getElementById('toc-widget');
  if(tocWidget){
    // Vain H2, ei H3
    var headings = Array.prototype.slice.call(document.querySelectorAll('.article-body h2')).slice(0, 6);
    if(headings.length >= 2){
      var ul = document.createElement('ul');
      ul.className = 'toc-list';
      var idx = 0;
      headings.forEach(function(h){
        if(!h.id){ h.id = 'h-' + (++idx); }
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = '#' + h.id;
        // Lyhennetään jos liian pitkä
        var txt = h.textContent.trim();
        a.textContent = txt.length > 55 ? txt.slice(0,52)+'…' : txt;
        a.addEventListener('click', function(e){
          e.preventDefault();
          h.scrollIntoView({behavior:'smooth', block:'start'});
        });
        li.appendChild(a);
        ul.appendChild(li);
      });
      var title = document.createElement('div');
      title.className = 'toc-title';
      title.textContent = 'Sisällysluettelo';
      tocWidget.appendChild(title);
      tocWidget.appendChild(ul);
    } else {
      tocWidget.style.display = 'none';
    }
  }

  // ── Reading progress bar ───────────────────────────────────
  var bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;top:0;left:0;height:3px;background:#c79a3a;z-index:9999;width:0;transition:width .1s;pointer-events:none';
  document.body.appendChild(bar);
  window.addEventListener('scroll', function(){
    var h = document.documentElement, b = document.body;
    var st = h.scrollTop || b.scrollTop;
    var sh = (h.scrollHeight || b.scrollHeight) - h.clientHeight;
    if(sh > 0) bar.style.width = (st / sh * 100) + '%';
  }, {passive: true});

})();


/* ==========================================================================
   Suorapuhe v2 – lukukokemus
   - "N min jäljellä" -merkki navigaatiossa
   - sisällysluettelo seuraa lukijaa (luetut osiot merkitään)
   - kun artikkeli on luettu loppuun, lähetetään 'sp:complete' (readpath.js
     merkitsee artikkelin luetuksi ja näyttää "Luit loppuun" -kortin)
   ========================================================================== */
(function(){
  'use strict';
  var body = document.querySelector('.article-body');
  if (!body) return;

  // Haaste-CTA artikkelin loppuun
  (function(){
    var cat = (location.pathname.match(/\/([a-z-]+)\/[^\/]+$/) || [])[1] || "";
    var M = {
      mielenterveys: "Tieto ei muuta mitään, jos et toimi. 12 viikon haasteessa somepaasto, jumin murtaminen ja huolen hallinta muuttuvat päivittäisiksi teoiksi.",
      "terveys-ja-liikunta": "Tiedät nyt, mitä pitää tehdä. Haasteessa uni, liike ja ruoka rakennetaan tavaksi viikko kerrallaan – sinun tasoltasi.",
      lisatulot: "Haasteen lisätuloradalla opettelet flippauksen tai hustlauksen käytännössä ja teet ensimmäiset omat lisätulosi 12 viikon aikana.",
      kryptovaluutta: "Ennen kryptoja perusta kuntoon: puskuri, velat ja lisätulot. 12 viikon haaste laittaa ne järjestykseen.",
      yhteiskunta: "Kun näet, miten järjestelmä toimii, seuraava askel on toimia toisin. 12 viikon haaste muuttaa sen teoiksi.",
      mediakritiikki: "Lopeta reagoiminen ja ala rakentaa. 12 viikon haaste vie huomiosi takaisin omaan elämääsi."
    };
    var box = document.createElement("div");
    box.className = "sp-hz-cta";
    box.innerHTML = "<b>🔥 Lukeminen ei muuta mitään. Tekeminen muuttaa.</b><p>" + (M[cat] || M.mielenterveys) + " Ilmainen, 15–30 min päivässä.</p><a href=\"../haaste/\">Aloita 12 viikon haaste →</a>";
    body.appendChild(box);
  })();

  var WPM = 200;
  var words = (body.innerText || body.textContent || '').trim().split(/\s+/).length;
  var totalMin = Math.max(1, Math.round(words / WPM));

  // Jäljellä oleva aika -merkki navigaatioon
  var nav = document.querySelector('.site-nav-inner');
  var pill = document.createElement('span');
  pill.className = 'sp-remaining';
  pill.setAttribute('aria-live', 'polite');
  if (nav) {
    var toggle = document.getElementById('menu-toggle');
    if (toggle) nav.insertBefore(pill, toggle); else nav.appendChild(pill);
  }

  // Sisällysluettelon tila
  var tocLinks = [], heads = [];
  function collectToc(){
    tocLinks = Array.prototype.slice.call(document.querySelectorAll('.toc-list a'));
    heads = tocLinks.map(function(a){ return document.getElementById(a.getAttribute('href').slice(1)); });
    var w = document.getElementById('toc-widget');
    if (w && tocLinks.length && !w.querySelector('.toc-progress')) {
      var p = document.createElement('div');
      p.className = 'toc-progress';
      p.innerHTML = '<span></span>';
      w.appendChild(p);
    }
  }

  var completed = false, ticking = false;
  function update(){
    ticking = false;
    var rect = body.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var read = (vh * 0.6 - rect.top) / rect.height;          // luettu osuus tekstistä
    read = Math.min(1, Math.max(0, read));
    var started = rect.top < vh * 0.4;

    // Jäljellä-merkki
    var left = Math.ceil(totalMin * (1 - read));
    if (completed || read >= 0.97) {
      pill.textContent = '✓ Luettu';
      pill.classList.add('is-done');
    } else {
      pill.textContent = '⏱ ' + left + ' min jäljellä';
      pill.classList.remove('is-done');
    }
    pill.classList.toggle('is-on', started);

    // Sisällysluettelo
    var line = 110, activeIdx = -1;
    for (var i = 0; i < heads.length; i++) {
      if (heads[i] && heads[i].getBoundingClientRect().top < line) activeIdx = i;
    }
    for (var j = 0; j < tocLinks.length; j++) {
      tocLinks[j].classList.toggle('is-active', j === activeIdx);
      tocLinks[j].classList.toggle('is-done', j < activeIdx || (completed && j <= activeIdx));
    }
    var tp = document.querySelector('.toc-progress > span');
    if (tp) tp.style.width = Math.round(read * 100) + '%';

    // Valmis: lukija on päässyt tekstin loppuun
    if (!completed && rect.bottom < vh * 0.95 && read > 0.9) {
      completed = true;
      document.dispatchEvent(new CustomEvent('sp:complete'));
      update();
    }
  }
  function onScroll(){ if (!ticking) { ticking = true; setTimeout(update, 60); } }

  function start(){
    collectToc();
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  }
  // Odota, että readpath.js on kuuntelemassa ja TOC on rakennettu
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(start, 0); });
  else setTimeout(start, 0);
  window.addEventListener('load', function(){ collectToc(); onScroll(); });
})();
