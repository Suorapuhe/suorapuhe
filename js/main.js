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
