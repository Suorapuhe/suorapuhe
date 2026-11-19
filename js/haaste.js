/* ==========================================================================
   Suorapuhe – 12 viikon elämänmuutoshaaste: sovellus
   Toimii täysin staattisesti (GitHub Pages). Tila tallennetaan vain
   käyttäjän selaimeen (localStorage), mitään ei lähetetä minnekään.
   ========================================================================== */
(function () {
  'use strict';
  var D = window.SP_HAASTE;
  var root = document.getElementById('sp-app');
  if (!D || !root) return;

  var KEY = 'sp_haaste_v1';
  var TOTAL_DAYS = 84;
  var SLOT_LABEL = ['Lue ja ymmärrä', 'Harjoitus 1/3', 'Harjoitus 2/3', 'Harjoitus 3/3', 'Mittaus', 'Viikon haaste', 'Viikkokatsaus'];
  var LITE = 'Kevyt versio: tee tästä 5 minuutin versio. Pienikin askel pitää putken hengissä.';

  /* ---------------- tila ---------------- */
  var S = load();
  var view = { day: null };
  var wiz = { step: 0, path: 'all', answers: {}, base: {}, side: null, name: '', letter: '' };

  function load() {
    try { var s = JSON.parse(localStorage.getItem(KEY) || 'null'); return s && s.v === 1 ? s : null; } catch (e) { return null; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function txt(v, lvl) { if (v && typeof v === 'object' && !Array.isArray(v)) return v[lvl] || v[2] || v[1]; return v; }
  function isoToday() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function daysSince(iso) { var a = new Date(iso + 'T00:00:00'), b = new Date(isoToday() + 'T00:00:00'); return Math.round((b - a) / 86400000); }

  function currentDay() {
    var m = location.search.match(/[?&]day=(\d+)/);         // testausta varten: ?day=N
    if (m) return Math.max(1, Math.min(TOTAL_DAYS, +m[1]));
    return Math.max(1, Math.min(TOTAL_DAYS, daysSince(S.started) + 1));
  }
  function weekOf(d) { return Math.ceil(d / 7); }
  function slotOf(d) { return (d - 1) % 7; }

  function tracks() {
    var t = S.path === 'all' ? ['mieli', 'keho', 'raha'] : [S.path];
    if (S.flags.savu) t.push('savu');
    return t;
  }
  function item(w, tr) {
    var W = D.WEEKS[w - 1];
    if (tr === 'savu') return W.savu || null;
    if (tr === 'keho' && w === 7) return D.KEHO7[S.flags.alko ? 'alko' : 'sokeri'];
    if (tr === 'raha' && w >= 6 && w <= 11) return D.SIDE[S.side || 'none'].weeks[w - 6];
    return W[tr] || null;
  }
  function art(k) { var a = D.A[k]; return a ? '<a href="../' + a[0] + '.html">' + esc(a[1]) + '</a>' : ''; }
  function dayLog(d) { S.log[d] = S.log[d] || {}; return S.log[d]; }

  function dayStatus(d) {
    var L = S.log[d]; if (!L) return '';
    var trs = tracks(), n = 0, any = false;
    if (slotOf(d) === 6) return L.review ? 'done' : '';
    trs.forEach(function (t) { if (!item(weekOf(d), t)) { n++; return; } if (L[t] && L[t] !== 'skip') { n++; any = true; } else if (L[t]) any = true; });
    return n === trs.length ? 'done' : any ? 'part' : '';
  }
  function streak() {
    var d = currentDay(), s = 0;
    if (!dayStatus(d)) d--;
    for (; d >= 1; d--) { if (dayStatus(d)) s++; else break; }
    return s;
  }

  /* ---------------- aloitus (wizard) ---------------- */
  function renderWizard() {
    var h = '<div class="hz-card hz-wizard">';
    var steps = ['Polku', 'Kartoitus', 'Lähtötaso', 'Lisätulot', 'Sitoumus'];
    h += '<ol class="hz-steps">' + steps.map(function (s, i) { return '<li class="' + (i < wiz.step ? 'done' : i === wiz.step ? 'on' : '') + '">' + s + '</li>'; }).join('') + '</ol>';

    if (wiz.step === 0) {
      h += '<h2>Mitä haluat muuttaa?</h2><p class="hz-lead">Valitse polku. Suosittelemme koko elämänmuutosta – mieli, keho ja raha tukevat toisiaan.</p><div class="hz-paths">';
      [['all', '🔥', 'Koko elämänmuutos', 'Mieli, keho ja raha rinnakkain. Suositeltu.'], ['mieli', '🧠', 'Ota mieli haltuun', 'Some, dopamiini, jumi, huoli ja itsevarmuus.'],
        ['keho', '💪', 'Rakenna keho', 'Liike, uni, ruoka, treeni ja palautuminen.'], ['raha', '💰', 'Ota raha haltuun', 'Menot, puskuri, velat ja lisätulot.']].forEach(function (p) {
        h += '<button type="button" class="hz-path' + (wiz.path === p[0] ? ' sel' : '') + '" data-path="' + p[0] + '"><span class="hz-path-ic">' + p[1] + '</span><b>' + p[2] + '</b><small>' + p[3] + '</small></button>';
      });
      h += '</div>';
    }
    if (wiz.step === 1) {
      h += '<h2>Missä olet nyt?</h2><p class="hz-lead">Vastausten perusteella tehtävät alkavat sinun tasoltasi – ei liian helposta, ei liian vaikeasta.</p>';
      quizFor(wiz.path).forEach(function (q) {
        h += '<fieldset class="hz-q"><legend>' + esc(q.q) + '</legend>';
        q.opts.forEach(function (o, i) {
          h += '<label class="hz-opt"><input type="radio" name="q_' + q.id + '" value="' + i + '"' + (wiz.answers[q.id] === i ? ' checked' : '') + '> <span>' + esc(o[0]) + '</span></label>';
        });
        h += '</fieldset>';
      });
    }
    if (wiz.step === 2) {
      h += '<h2>Lähtötaso</h2><p class="hz-lead">Kirjaa luvut rehellisesti. Viikolla 8 ja 12 mittaat samat asiat – ja näet muutoksen omin silmin. Voit jättää kentän tyhjäksi, jos et tiedä.</p>' + metricsForm(wiz.base, true);
    }
    if (wiz.step === 3) {
      h += '<h2>Lisätulot</h2><p class="hz-lead">Viikolla 5 valitset lisätuloradan. Suosittelemme flippausta tai hustlausta: ne opettavat myymään, neuvottelemaan ja toimimaan – taitoja, jotka vievät eteenpäin kaikessa muussakin. Voit valita jo nyt tai myöhemmin.</p>' + sideChooser(wiz.side, true);
    }
    if (wiz.step === 4) {
      h += '<h2>Sitoumus</h2><p class="hz-lead">Tutkimukset ja kokemus sanovat saman: kirjoitettu sitoumus pitää paremmin kuin ajatus päässä.</p>' +
        '<label class="hz-field"><span>Nimesi todistukseen (vapaaehtoinen)</span><input type="text" id="hz-name" maxlength="40" value="' + esc(wiz.name) + '" placeholder="Esim. etunimesi tai nimimerkki"></label>' +
        '<label class="hz-field"><span>Kirje itsellesi – avataan päivänä 84</span><textarea id="hz-letter" rows="5" placeholder="Miksi aloitat? Miltä elämäsi tuntuu nyt? Millainen haluat olla 12 viikon päästä?">' + esc(wiz.letter) + '</textarea></label>' +
        '<label class="hz-check"><input type="checkbox" id="hz-commit"> <span><b>Sitoudun 12 viikkoon.</b> Kun päivä menee huonosti, teen kevyen version enkä luovuta.</span></label>' +
        '<p class="hz-privacy">🔒 Tietosi tallentuvat vain tähän selaimeen. Mitään ei lähetetä minnekään.</p>';
    }
    h += '<div class="hz-nav">' + (wiz.step > 0 ? '<button type="button" class="hz-btn ghost" data-act="back">← Takaisin</button>' : '<span></span>') +
      '<button type="button" class="hz-btn" data-act="next">' + (wiz.step === 4 ? 'Aloita haaste 🔥' : 'Jatka →') + '</button></div>';
    h += '<p class="hz-err" id="hz-err" role="alert"></p></div>';
    root.innerHTML = h;
  }
  function quizFor(path) {
    return D.QUIZ.filter(function (q) { return !q.track || path === 'all' || q.track === path; });
  }
  function readWizardInputs() {
    if (wiz.step === 1) quizFor(wiz.path).forEach(function (q) {
      var r = root.querySelector('input[name="q_' + q.id + '"]:checked'); if (r) wiz.answers[q.id] = +r.value;
    });
    if (wiz.step === 2) root.querySelectorAll('[data-metric]').forEach(function (i) { if (i.value !== '') wiz.base[i.getAttribute('data-metric')] = +i.value; });
    if (wiz.step === 4) { wiz.name = root.querySelector('#hz-name').value.trim(); wiz.letter = root.querySelector('#hz-letter').value; }
  }
  function wizardNext() {
    readWizardInputs();
    var err = '';
    if (wiz.step === 1) { var miss = quizFor(wiz.path).filter(function (q) { return wiz.answers[q.id] == null; }); if (miss.length) err = 'Vastaa kaikkiin kysymyksiin.'; }
    if (wiz.step === 4 && !root.querySelector('#hz-commit').checked) err = 'Rastita sitoumus – se on koko jutun ydin.';
    if (err) { root.querySelector('#hz-err').textContent = err; return; }
    if (wiz.step === 2 && !(wiz.path === 'all' || wiz.path === 'raha')) wiz.step++;   // lisätulot vain raharadalla
    if (wiz.step < 4) { wiz.step++; renderWizard(); scrollTop(); return; }
    start();
  }
  function wizardBack() {
    readWizardInputs();
    wiz.step--;
    if (wiz.step === 3 && !(wiz.path === 'all' || wiz.path === 'raha')) wiz.step--;
    renderWizard();
  }
  function start() {
    var lv = { mieli: 2, keho: 2, raha: 2 };
    function ans(id) { var q = D.QUIZ.filter(function (x) { return x.id === id; })[0]; return wiz.answers[id] != null ? q.opts[wiz.answers[id]][1] : null; }
    var m1 = ans('screen'), m2 = ans('mood'); if (m1 || m2) lv.mieli = Math.min(m1 || 3, m2 || 3);
    var k1 = ans('move'), k2 = ans('sleep'); if (k1 || k2) lv.keho = Math.min(k1 || 3, k2 || 3);
    if (ans('money')) lv.raha = ans('money');
    S = { v: 1, started: isoToday(), path: wiz.path, levels: lv,
      flags: { alko: ans('alko') === 'kyllä', savu: ans('savu') === 'kyllä' },
      side: wiz.side, name: wiz.name, letter: wiz.letter, log: {}, reviews: {}, metrics: { base: wiz.base }, created: Date.now() };
    save();
    view.day = null;
    render();
    scrollTop();
    toast('🔥 Haaste alkoi. Päivä 1/84 – tee tänään vain tämän päivän tehtävät.');
  }

  /* ---------------- osat ---------------- */
  function metricsForm(vals, baseline) {
    var trs = S ? tracks() : (wiz.path === 'all' ? ['mieli', 'keho', 'raha'] : [wiz.path]);
    var h = '<div class="hz-metrics">';
    D.METRICS.forEach(function (m) {
      if (trs.indexOf(m.track) < 0) return;
      if (baseline && m.skipBaseline) return;
      var v = vals[m.id] != null ? vals[m.id] : '';
      h += '<label class="hz-field"><span>' + esc(m.label) + '</span><input type="number" inputmode="decimal" data-metric="' + m.id + '"' +
        (m.min ? ' min="' + m.min + '"' : '') + (m.max ? ' max="' + m.max + '"' : '') + (m.step ? ' step="' + m.step + '"' : '') + ' value="' + v + '"></label>';
    });
    return h + '</div>';
  }
  function sideChooser(sel, inWizard) {
    var h = '<div class="hz-paths hz-sides">';
    [['flip', '🔄', 'Flippaus', 'Osta halvalla, myy kalliimmalla. Opit näkemään arvon, myymään ja neuvottelemaan. Suositeltu.'],
      ['hustle', '🛠', 'Hustlaus', 'Myy palvelua: pihatyöt, siivous, muutot, tietokoneapu. Ensimmäinen asiakas, hinnoittelu, yritys. Suositeltu.'],
      ['none', '📊', 'Talouden perusteet', 'Ei lisätuloja nyt – opit talouden ja sijoittamisen perusteet. Voit vaihtaa myöhemmin.']].forEach(function (p) {
      h += '<button type="button" class="hz-path' + (sel === p[0] ? ' sel' : '') + '" data-side="' + p[0] + '"><span class="hz-path-ic">' + p[1] + '</span><b>' + p[2] + '</b><small>' + p[3] + '</small></button>';
    });
    if (inWizard) h += '<button type="button" class="hz-path' + (sel == null ? ' sel' : '') + '" data-side=""><span class="hz-path-ic">⏳</span><b>Päätän viikolla 5</b><small>Ehdit tutustua ensin.</small></button>';
    return h + '</div>';
  }

  function trackCard(d, tr) {
    var w = weekOf(d), slot = slotOf(d), it = item(w, tr);
    if (!it) return '';
    var T = D.TRACKS[tr], lvl = S.levels[tr] || 2, L = dayLog(d), st = L[tr] || '';
    var title = it.title;
    if (tr === 'raha' && w >= 6 && w <= 11) title = D.SIDE[S.side || 'none'].icon + ' ' + title;
    var h = '<article class="hz-card hz-track" style="--tc:' + T.color + '">';
    h += '<header><span class="hz-tr">' + T.icon + ' ' + T.name + '</span><span class="hz-chip">' + SLOT_LABEL[slot] + '</span></header>';
    h += '<h3>' + esc(title) + '</h3>';
    var body = '';
    if (slot === 0) {
      body += '<p>' + esc(it.why) + '</p>';
      var note = it.note ? txt(it.note, lvl) : null; if (note && it.note[lvl]) body += '<p class="hz-note">' + esc(note) + '</p>';
      body += '<p class="hz-read"><b>Lue:</b> ' + (it.read || []).map(art).join(' · ') + '</p>';
      body += '<p class="hz-habit"><b>Tämän viikon tapa:</b> ' + esc(txt(it.habit, lvl)) + '<br><small>Aloita huomenna ja jatka koko viikon. Tapa jää päivän tapoihin.</small></p>';
    } else if (slot <= 3) {
      var tasks = txt(it.tasks, lvl);
      body += '<p class="hz-task">' + esc(tasks[slot - 1]) + '</p>';
    } else if (slot === 4) {
      body += '<p class="hz-task">' + esc(it.measure) + '</p>';
    } else if (slot === 5) {
      body += '<p class="hz-task">🏆 ' + esc(it.challenge) + '</p>';
    }
    if (st === 'skip') body += '<p class="hz-lite">' + LITE + '</p>';
    h += body;
    h += '<div class="hz-actions" data-day="' + d + '" data-track="' + tr + '">';
    if (st === 'skip') {
      h += '<button type="button" class="hz-btn" data-st="lite">Tein kevyen version</button><button type="button" class="hz-btn ghost" data-st="">Peru</button>';
    } else {
      [['done', slot === 0 ? '✓ Luin ja ymmärsin' : '✓ Tein'], ['part', 'Osittain'], ['skip', 'En pystynyt']].forEach(function (b) {
        if (slot === 0 && b[0] === 'part') return;
        h += '<button type="button" class="hz-btn' + (b[0] === 'done' ? '' : ' ghost') + (st === b[0] || (b[0] === 'done' && st === 'lite') ? ' is-on' : '') + '" data-st="' + b[0] + '">' + b[1] + '</button>';
      });
    }
    h += '</div></article>';
    return h;
  }

  function habitsCard(d) {
    var w = weekOf(d), slot = slotOf(d), L = dayLog(d); L.habits = L.habits || {};
    var active = [], settled = [];
    tracks().forEach(function (tr) {
      for (var i = 1; i <= w; i++) {
        if (i === w && slot === 0) continue;            // uusi tapa alkaa huomenna
        var it = item(i, tr); if (!it || !it.habit) continue;
        var o = { key: 'w' + i + tr, tr: tr, text: txt(it.habit, S.levels[tr] || 2), w: i };
        if (i >= w - 2) active.push(o); else settled.push(o);
      }
    });
    if (!active.length && !settled.length) return '';
    var done = active.filter(function (o) { return L.habits[o.key]; }).length;
    var h = '<article class="hz-card hz-habits"><header><span class="hz-tr">✅ Päivän tavat</span><span class="hz-chip">' + done + '/' + active.length + '</span></header><ul>';
    active.forEach(function (o) {
      h += '<li><label><input type="checkbox" data-habit="' + o.key + '" data-day="' + d + '"' + (L.habits[o.key] ? ' checked' : '') + '> <span>' + D.TRACKS[o.tr].icon + ' ' + esc(o.text) + '</span></label></li>';
    });
    h += '</ul>';
    if (settled.length) h += '<details><summary>Vakiintuneet tavat (' + settled.length + ') – jatka näitä automaattisesti</summary><ul class="hz-settled">' +
      settled.map(function (o) { return '<li>' + D.TRACKS[o.tr].icon + ' ' + esc(o.text) + ' <small>(vk ' + o.w + ')</small></li>'; }).join('') + '</ul></details>';
    return h + '</article>';
  }

  function reviewCard(d) {
    var w = weekOf(d), R = S.reviews[w] || {};
    var h = '<article class="hz-card hz-review"><header><span class="hz-tr">📝 Viikkokatsaus</span><span class="hz-chip">Viikko ' + w + '</span></header>';
    h += '<p>Kymmenen minuuttia. Rehellisyys ratkaisee – kukaan muu ei lue tätä.</p>';
    D.REVIEW.forEach(function (q, i) { h += '<label class="hz-field"><span>' + esc(q) + '</span><textarea rows="2" data-rev="' + i + '">' + esc(R[i] || '') + '</textarea></label>'; });
    h += '<label class="hz-field"><span>Kuinka paljon tunnet muuttuneesi (1–10)?</span><input type="number" min="1" max="10" data-rev="score" value="' + esc(R.score || '') + '"></label>';
    h += '<div class="hz-actions"><button type="button" class="hz-btn" data-act="review" data-day="' + d + '">' + (S.log[d] && S.log[d].review ? '✓ Tallennettu – päivitä' : 'Tallenna katsaus') + '</button></div></article>';
    return h;
  }

  function measureCard(kind) {
    var lbl = kind === 'mid' ? 'Välimittaus – viikko 8' : 'Loppumittaus – viikko 12';
    return '<article class="hz-card hz-measure"><header><span class="hz-tr">📏 ' + lbl + '</span></header>' +
      '<p>Mittaa samat asiat kuin aloittaessasi. Luvut eivät valehtele.</p>' + metricsForm(S.metrics[kind] || {}, false) +
      '<div class="hz-actions"><button type="button" class="hz-btn" data-act="measure" data-kind="' + kind + '">Tallenna mittaus</button></div></article>';
  }

  function resultsCard() {
    var B = S.metrics.base || {}, M = S.metrics.mid || {}, E = S.metrics.end || {};
    var trs = tracks();
    var h = '<article class="hz-card hz-results"><header><span class="hz-tr">🏁 Tuloksesi</span></header><h3>Näin olet muuttunut</h3><div class="hz-table"><table><thead><tr><th>Mittari</th><th>Alussa</th><th>Vk 8</th><th>Vk 12</th><th>Muutos</th></tr></thead><tbody>';
    D.METRICS.forEach(function (m) {
      if (trs.indexOf(m.track) < 0) return;
      var a = B[m.id], z = E[m.id] != null ? E[m.id] : M[m.id], diff = '';
      if (a != null && z != null) {
        var dlt = Math.round((z - a) * 10) / 10, good = m.better === 'up' ? dlt > 0 : dlt < 0;
        diff = '<span class="' + (dlt === 0 ? '' : good ? 'up' : 'down') + '">' + (dlt > 0 ? '+' : '') + dlt + '</span>';
      } else if (m.skipBaseline && z != null) diff = '<span class="up">+' + z + '</span>';
      h += '<tr><td>' + esc(m.label) + '</td><td>' + (a != null ? a : '–') + '</td><td>' + (M[m.id] != null ? M[m.id] : '–') + '</td><td>' + (E[m.id] != null ? E[m.id] : '–') + '</td><td>' + diff + '</td></tr>';
    });
    h += '</tbody></table></div>';
    if (S.letter) h += '<details class="hz-letter"' + (E && Object.keys(E).length ? ' open' : '') + '><summary>✉️ Kirjeesi päivältä 1</summary><blockquote>' + esc(S.letter).replace(/\n/g, '<br>') + '</blockquote></details>';
    if (Object.keys(E).length) h += '<div class="hz-actions"><button type="button" class="hz-btn" data-act="cert">🎓 Lataa todistus</button><button type="button" class="hz-btn ghost" data-act="again">Aloita uusi 12 viikon kierros</button></div>';
    return h + '</article>';
  }

  /* ---------------- dashboard ---------------- */
  function render() {
    if (!S) { renderWizard(); document.body.classList.remove('hz-active'); return; }
    document.body.classList.add('hz-active');
    var today = currentDay(), d = view.day || today, w = weekOf(d), slot = slotOf(d), W = D.WEEKS[w - 1];
    var h = '';
    // yläpaneeli
    var pct = Math.round(today / TOTAL_DAYS * 100), st = streak();
    h += '<section class="hz-hero"><div class="hz-hero-top"><div><span class="hz-phase">Vaihe ' + W.phase + ' · ' + D.PHASES[W.phase] + '</span>' +
      '<h2>Viikko ' + w + '/12: ' + esc(W.title) + '</h2></div><div class="hz-streak" title="Putki">🔥 <b>' + st + '</b><small>päivän putki</small></div></div>' +
      '<div class="hz-bar"><span style="width:' + pct + '%"></span></div><p class="hz-sub">Päivä ' + today + '/' + TOTAL_DAYS + (S.name ? ' · ' + esc(S.name) : '') + '</p></section>';
    // viikkonauha
    h += '<nav class="hz-week" aria-label="Viikon päivät">';
    h += '<button type="button" class="hz-wk-arrow" data-goto="' + Math.max(1, (w - 2) * 7 + 1) + '"' + (w === 1 ? ' disabled' : '') + ' aria-label="Edellinen viikko">‹</button>';
    for (var i = 0; i < 7; i++) {
      var dd = (w - 1) * 7 + i + 1, s2 = dayStatus(dd), fut = dd > today;
      h += '<button type="button" class="hz-day' + (dd === d ? ' sel' : '') + (s2 ? ' ' + s2 : '') + (fut ? ' fut' : '') + '" data-goto="' + dd + '"' + (fut ? ' disabled' : '') + '><small>Pv ' + dd + '</small><b>' + ['Lue', 'H1', 'H2', 'H3', 'Mittaa', 'Haaste', 'Katsaus'][i] + '</b></button>';
    }
    h += '<button type="button" class="hz-wk-arrow" data-goto="' + Math.min(today, w * 7 + 1) + '"' + (w * 7 + 1 > today ? ' disabled' : '') + ' aria-label="Seuraava viikko">›</button></nav>';
    if (d !== today) h += '<p class="hz-past">Katselet päivää ' + d + '. <a href="#" data-goto="' + today + '">Palaa tähän päivään →</a></p>';

    // lisätulovalinta
    if (tracks().indexOf('raha') >= 0 && S.side == null && w >= 5) {
      h += '<article class="hz-card hz-choose"><header><span class="hz-tr">💰 Valitse lisätulorata</span><span class="hz-chip">Tärkeä</span></header><p>Viikoilla 6–11 raharata on valitsemasi lisätulorata. Suosittelemme flippausta tai hustlausta.</p>' + sideChooser(null, false) + '</article>';
    }
    // mittaukset
    if (w === 8 && slot >= 4 && !S.metrics.mid) h += measureCard('mid');
    if (w === 12 && slot >= 4 && !S.metrics.end) h += measureCard('end');

    if (slot === 6) h += reviewCard(d);
    else tracks().forEach(function (tr) { h += trackCard(d, tr); });
    h += habitsCard(d);
    if (S.metrics.mid || S.metrics.end) h += resultsCard();

    // asetukset
    h += '<details class="hz-card hz-settings"><summary>⚙️ Asetukset ja laitteen vaihto</summary>' +
      '<p>Edistymisesi on tallessa vain tässä selaimessa. Siirrä se toiselle laitteelle kopioimalla koodi ja liittämällä se toisella laitteella.</p>' +
      '<div class="hz-actions"><button type="button" class="hz-btn ghost" data-act="export">Näytä siirtokoodi</button><button type="button" class="hz-btn ghost" data-act="import">Tuo siirtokoodi</button></div>' +
      '<textarea id="hz-code" rows="3" hidden></textarea>' +
      (tracks().indexOf('raha') >= 0 && w >= 5 ? '<p><b>Lisätulorata:</b> ' + (S.side ? D.SIDE[S.side].name : 'ei valittu') + ' – <a href="#" data-act="reside">vaihda</a></p>' : '') +
      '<p><a href="#" data-act="reset" class="hz-danger">Aloita haaste alusta (poistaa kaiken)</a></p></details>';
    root.innerHTML = h;
  }

  /* ---------------- tapahtumat ---------------- */
  root.addEventListener('click', function (e) {
    var b = e.target.closest('button, a'); if (!b || !root.contains(b)) return;
    if (!S) {
      if (b.hasAttribute('data-path')) { wiz.path = b.getAttribute('data-path'); renderWizard(); return; }
      if (b.hasAttribute('data-side')) { wiz.side = b.getAttribute('data-side') || null; renderWizard(); return; }
      if (b.getAttribute('data-act') === 'next') return wizardNext();
      if (b.getAttribute('data-act') === 'back') return wizardBack();
      return;
    }
    if (b.hasAttribute('data-goto')) { e.preventDefault(); var g = +b.getAttribute('data-goto'); view.day = g === currentDay() ? null : g; render(); return; }
    if (b.hasAttribute('data-side')) { S.side = b.getAttribute('data-side') || 'none'; save(); render(); toast('Lisätulorata valittu: ' + D.SIDE[S.side].name); return; }
    if (b.hasAttribute('data-st')) {
      var box = b.closest('.hz-actions'), d = +box.getAttribute('data-day'), tr = box.getAttribute('data-track'), st = b.getAttribute('data-st');
      var L = dayLog(d), was = dayStatus(d);
      if (st) L[tr] = st; else delete L[tr];
      save(); render();
      if (st === 'done' || st === 'lite') toast(st === 'lite' ? '💪 Kevyt versio tehty – putki jatkuu.' : '✓ Hyvä. ' + (dayStatus(d) === 'done' && was !== 'done' ? 'Päivä ' + d + ' suoritettu! 🔥 ' + streak() + ' päivän putki.' : 'Jatka.'));
      return;
    }
    var act = b.getAttribute('data-act');
    if (act === 'review') {
      var d2 = +b.getAttribute('data-day'), w2 = weekOf(d2), R = {};
      root.querySelectorAll('[data-rev]').forEach(function (i) { R[i.getAttribute('data-rev')] = i.value; });
      S.reviews[w2] = R; dayLog(d2).review = 1; save(); render(); toast('📝 Viikko ' + w2 + ' katsottu. ' + (w2 < 12 ? 'Huomenna alkaa viikko ' + (w2 + 1) + '.' : ''));
    }
    if (act === 'measure') {
      var k = b.getAttribute('data-kind'), M = {};
      root.querySelectorAll('.hz-measure [data-metric]').forEach(function (i) { if (i.value !== '') M[i.getAttribute('data-metric')] = +i.value; });
      S.metrics[k] = M; save(); render(); toast(k === 'end' ? '🏁 Loppumittaus tallennettu. Katso tuloksesi!' : '📏 Välimittaus tallennettu.');
    }
    if (act === 'cert') certificate();
    if (act === 'again') { if (confirm('Aloitetaanko uusi 12 viikon kierros? Nykyinen edistyminen poistetaan.')) { S = null; save(); localStorage.removeItem(KEY); wiz = { step: 0, path: 'all', answers: {}, base: {}, side: null, name: '', letter: '' }; render(); } }
    if (act === 'export') { e.preventDefault(); var ta = root.querySelector('#hz-code'); ta.hidden = false; ta.value = btoa(unescape(encodeURIComponent(JSON.stringify(S)))); ta.select(); }
    if (act === 'import') {
      e.preventDefault(); var ta2 = root.querySelector('#hz-code');
      if (ta2.hidden) { ta2.hidden = false; ta2.value = ''; ta2.placeholder = 'Liitä siirtokoodi tähän ja paina uudelleen "Tuo siirtokoodi"'; ta2.focus(); return; }
      try { var ns = JSON.parse(decodeURIComponent(escape(atob(ta2.value.trim())))); if (ns.v !== 1) throw 0; S = ns; save(); render(); toast('✓ Edistyminen siirretty.'); } catch (x) { alert('Koodi ei kelpaa. Tarkista, että kopioit sen kokonaan.'); }
    }
    if (act === 'reside') { e.preventDefault(); S.side = null; save(); render(); }
    if (act === 'reset') { e.preventDefault(); if (confirm('Poistetaanko koko edistymisesi? Tätä ei voi perua.')) { localStorage.removeItem(KEY); S = null; wiz.step = 0; render(); } }
  });
  root.addEventListener('change', function (e) {
    var c = e.target; if (!S || !c.hasAttribute('data-habit')) return;
    var L = dayLog(+c.getAttribute('data-day')); L.habits = L.habits || {};
    if (c.checked) L.habits[c.getAttribute('data-habit')] = 1; else delete L.habits[c.getAttribute('data-habit')];
    save();
    var chip = c.closest('.hz-habits').querySelector('.hz-chip'), all = c.closest('ul').querySelectorAll('input'), n = 0;
    all.forEach(function (i) { if (i.checked) n++; }); chip.textContent = n + '/' + all.length;
    if (n === all.length) toast('✅ Kaikki päivän tavat tehty!');
  });

  /* ---------------- todistus (canvas → PNG) ---------------- */
  function certificate() {
    var c = document.createElement('canvas'); c.width = 1200; c.height = 800;
    var x = c.getContext('2d');
    var g = x.createLinearGradient(0, 0, 1200, 800); g.addColorStop(0, '#111'); g.addColorStop(1, '#2a2010');
    x.fillStyle = g; x.fillRect(0, 0, 1200, 800);
    x.strokeStyle = '#c79a3a'; x.lineWidth = 6; x.strokeRect(40, 40, 1120, 720);
    x.fillStyle = '#c79a3a'; x.textAlign = 'center';
    x.font = '700 28px system-ui, sans-serif'; x.fillText('SUORAPUHE', 600, 130);
    x.fillStyle = '#fff'; x.font = '800 64px system-ui, sans-serif'; x.fillText('12 viikon elämänmuutos', 600, 240);
    x.fillStyle = '#c9c4b8'; x.font = '400 30px system-ui, sans-serif'; x.fillText('suoritettu', 600, 295);
    x.fillStyle = '#fff'; x.font = '700 56px Georgia, serif'; x.fillText(S.name || 'Muutoksen tekijä', 600, 400);
    var B = S.metrics.base || {}, E = S.metrics.end || {}, lines = [];
    D.METRICS.forEach(function (m) { if (B[m.id] != null && E[m.id] != null && B[m.id] !== E[m.id]) lines.push(m.label.replace(/ \(.*\)/, '') + ': ' + B[m.id] + ' → ' + E[m.id]); });
    x.fillStyle = '#e6c46e'; x.font = '600 28px system-ui, sans-serif';
    lines.slice(0, 4).forEach(function (l, i) { x.fillText(l, 600, 480 + i * 44); });
    x.fillStyle = '#8a8478'; x.font = '400 22px system-ui, sans-serif';
    x.fillText(new Date().toLocaleDateString('fi-FI') + ' · suorapuhe.github.io/suorapuhe/haaste', 600, 720);
    var a = document.createElement('a'); a.download = 'suorapuhe-todistus.png'; a.href = c.toDataURL('image/png'); document.body.appendChild(a); a.click(); a.remove();
  }

  /* ---------------- apurit ---------------- */
  function toast(t) {
    var el = document.createElement('div'); el.className = 'sp-toast'; el.setAttribute('role', 'status'); el.textContent = t; document.body.appendChild(el);
    setTimeout(function () { el.classList.add('is-on'); }, 10);
    setTimeout(function () { el.classList.remove('is-on'); }, 3000);
    setTimeout(function () { el.remove(); }, 3600);
  }
  function scrollTop() { var y = root.getBoundingClientRect().top + window.scrollY - 80; window.scrollTo(0, Math.max(0, y)); }

  // Aloita-painikkeet sivun staattisessa osassa
  document.querySelectorAll('[data-hz-start]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); var p = a.getAttribute('data-hz-start'); if (!S && p) { wiz.path = p; wiz.step = 0; render(); } scrollTop(); });
  });

  render();
})();
