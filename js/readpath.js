/* ==========================================================================
   Suorapuhe – Lukupolun seuranta (read-path tracker)
   - Merkitsee artikkelin luetuksi kun sivu avataan
   - Renderöi ✅-merkit "Lue tässä järjestyksessä" -listoihin (etusivu/kategoriat)
   - Näyttää artikkeleissa pienen "Jatka lukupolkua" -laatikon
   - Tila tallennetaan evästeeseen 3 kuukaudeksi (per laite/selain)
   ========================================================================== */
(function () {
  'use strict';

  var COOKIE_NAME = 'sp_read';
  var COOKIE_DAYS = 90; // 3 kuukautta
  var BASE_PATH = '/suorapuhe/'; // GitHub Pages -projektin juuri

  /* ---- Lukupolku järjestyksessä (slug ilman .html, ilman domainia) ------- */
  var READ_PATH = [
    { s: "mielenterveys/aivosi-ovat-tulessa-nain-someriippuvuus-lihottaa-lompakkosi", t: "Aivosi ovat tulessa – someriippuvuus", step: 1 },
    { s: "mielenterveys/dopamiinipaasto-miten-otat-aivosi-takaisin-haltuun", t: "Dopamiinipaasto", step: 1 },
    { s: "mielenterveys/miten-lopettaa-itsensa-sabotoiminen-tunnista-kierre-ennen-kuin-se-tunnistaa-sinut", t: "Miten lopettaa itsensä sabotoiminen", step: 1 },
    { s: "mielenterveys/uhrimentaliteetti-suurin-este-menestyksesi-tiella", t: "Uhrimentaliteetti: suurin este", step: 1 },
    { s: "mielenterveys/jumin-murtaminen-toimi-ennen-kuin-olet-valmis", t: "Jumin murtaminen – toimi heti", step: 1 },
    { s: "mielenterveys/miten-parantaa-ahdistus-ja-masennus", t: "Ahdistus ja masennus", step: 1 },
    { s: "mielenterveys/huoli-on-turhaa-tiede-todistaa-sen", t: "Huoli on turhaa", step: 1 },
    { s: "mielenterveys/vertailun-ansa-miksi-toisten-menestys-lamaannuttaa-sinua", t: "Vertailun ansa", step: 1 },
    { s: "mielenterveys/taydellisyyden-tavoittelu-on-pahin-esteesi", t: "Täydellisyyden tavoittelu", step: 1 },
    { s: "mielenterveys/poista-negatiivisuus-elamastasi", t: "Poista negatiivisuus elämästäsi", step: 1 },
    { s: "mielenterveys/mitka-ajatusmallit-ovat-haitallasia", t: "Haitalliset ajatusmallit", step: 1 },
    { s: "mielenterveys/yksinaisyys-nykymaailmassa-miten-rakennat-oikeat-yhteydet", t: "Yksinäisyys nykymaailmassa", step: 1 },
    { s: "mielenterveys/menneisyys-ei-maarita-tulevaisuuttasi-konkreettiset-askeleet-irtautumiseen", t: "Menneisyys ei määritä tulevaisuuttasi", step: 1 },
    { s: "mielenterveys/et-enaa-samastu-kaikkiin-ja-se-on-hyva-merkki", t: "Et enää samastu kaikkiin", step: 1 },
    { s: "mielenterveys/alter-ego-metodi-taydellinen-opas-siihen-miten-luot-itsestasi-paremman-version", t: "Alter Ego -metodi", step: 1 },
    { s: "mielenterveys/epaonnistuminen-on-edellytys-ja-jos-pelkaat-sita-olet-jo-havinnyt-ennen-kuin-aloitat", t: "Epäonnistuminen on edellytys", step: 1 },
    { s: "terveys-ja-liikunta/taydellinen-uni", t: "Täydellinen uni", step: 2 },
    { s: "terveys-ja-liikunta/aamurituaali-joka-toimii-rakenna-paiva-ennen-kuin-maailma-hairitsee", t: "Toimiva aamurituaali", step: 2 },
    { s: "terveys-ja-liikunta/nesteytyksella-terava-mieli", t: "Nesteytyksellä terävä mieli", step: 2 },
    { s: "terveys-ja-liikunta/mika-on-terveellinen-ruokavalio", t: "Mikä on terveellinen ruokavalio?", step: 2 },
    { s: "terveys-ja-liikunta/ultraprosessoitu-ruoka-hiljainen-tappaja-kaupan-hyllylla", t: "Ultraprosessoitu ruoka", step: 2 },
    { s: "terveys-ja-liikunta/sokeririippuvuus-miten-sokeri-tuhoaa-terveytesi-hitaasti-ja-mita-sille-pitaa-tehda", t: "Sokeririippuvuus", step: 2 },
    { s: "terveys-ja-liikunta/proteiini-miksi-liian-vahainen-saanti-sabotoi-kehosi-lihaksesi-ja-suorituskykysi-ilman-etta-huomaat-sita", t: "Proteiinin tärkeys", step: 2 },
    { s: "terveys-ja-liikunta/d-vitamiini-suomalaiselle-miksi-lahes-jokainen-tarvitsee-lisaa-ja-mita-tapahtuu-kun-ei-saa", t: "D-vitamiini suomalaiselle", step: 2 },
    { s: "terveys-ja-liikunta/magnesium-ja-palautuminen-miksi-puutteesta-karsii-niin-moni", t: "Magnesium & palautuminen", step: 2 },
    { s: "terveys-ja-liikunta/omega-3-mista-on-oikeasti-nayttoa-ja-kenelle-se-sopii", t: "Omega-3 faktoja", step: 2 },
    { s: "terveys-ja-liikunta/kortisoli-miten-stressihormonisi-sabotoi-taloutesi-paatoksesi-ja-kykysi-rakentaa-parempaa-elamaa", t: "Kortisoli ja stressi", step: 2 },
    { s: "terveys-ja-liikunta/krooninen-tulehdus-kytee-hiljaa-miten-tunnistat-sen-ja-mita-elamantapamuutoksia-se-vaatii", t: "Krooninen tulehdus", step: 2 },
    { s: "terveys-ja-liikunta/miten-alkoholi-vaikuttaa-sinuun-ja-miksi-valttaa-sita", t: "Alkoholin vaikutukset", step: 2 },
    { s: "terveys-ja-liikunta/miten-liikunta-vaikuttaa-sinuun", t: "Miten liikunta vaikuttaa", step: 2 },
    { s: "terveys-ja-liikunta/kehopainoharjoittelu-treeniohjelma-tuloksia-ilman-kuntosalia", t: "Kehopainoharjoittelu (Kotitreeni)", step: 2 },
    { s: "terveys-ja-liikunta/painoharjoittelu-treeniohjelma-rakenna-tuloksia-fiksusti", t: "Painoharjoittelu & tulokset", step: 2 },
    { s: "terveys-ja-liikunta/venyttelyohje-palautuminen-kayntiin-ja-paikat-auki", t: "Venyttelyohje & palautuminen", step: 2 },
    { s: "terveys-ja-liikunta/sauna-ja-terveys-mita-tutkimukset-oikeasti-sanovat", t: "Sauna ja terveys", step: 2 },
    { s: "terveys-ja-liikunta/miksi-pukeutua-orgaanisiin-vaatteisiin", t: "Orgaaniset vaatteet", step: 2 },
    { s: "yhteiskunta/miten-maailma-pyorii-ymparillasi-heraa-vihdoin", t: "Herää: Miten maailma pyörii", step: 3 },
    { s: "yhteiskunta/miksi-koulujarjestelma-ei-opeta-sinulle-tarkeimpia-asioita", t: "Mitä koulu ei opeta", step: 3 },
    { s: "yhteiskunta/miksi-9-17-tyo-ei-tee-sinusta-varakasta-ja-mita-tehda", t: "Miksi 9–17-työ ei riitä", step: 3 },
    { s: "yhteiskunta/pankkien-suuri-kusetus-miksi-saastotilisi-syo-rahasi", t: "Pankit & säästötilin ansa", step: 3 },
    { s: "lisatulot/hatarahasto-miksi-et-laita-kaikkea-rahaa-osakkeisiin-ja-mita-puskurirahasto-oikeasti-tarkoittaa", t: "Hätärahasto & puskuri", step: 3 },
    { s: "lisatulot/sijoittaminen-aloittelijalle-mista-aloittaa-mihin-sijoittaa-ja-mita-virheita-valttaa", t: "Sijoittaminen aloittelijalle", step: 3 },
    { s: "lisatulot/mita-on-flippaaminen-ja-miten-aloitat-tanaan-ilman-rahaa", t: "Flippaaminen ilman rahaa", step: 3 },
    { s: "lisatulot/hustlaus-suomessa-miten-muutat-naapuriavun-kassavirraksi-ja-keikkailun-yritykseksi", t: "Hustlaus & lisätulot", step: 3 },
    { s: "lisatulot/ensimmainen-asiakas-miten-hankit-sen-flippaukseen-hustlaukseen-tai-palveluusi-ilman-verkostoa", t: "Ensimmäisen asiakkaan hankinta", step: 3 },
    { s: "lisatulot/miten-hinnoitella-palvelusi-oikein-ala-alenna", t: "Palveluiden hinnoittelu", step: 3 },
    { s: "lisatulot/nain-perustat-taydellisen-yrityksen-tyhjasta", t: "Yritys tyhjästä (kokonaiskuva)", step: 3 },
    { s: "lisatulot/henkilobrandi-miten-se-rakennetaan-miksi-suomalaiset-eivat-usko-siihen-ja-miten-se-muutetaan-rahaksi", t: "Henkilöbrändin rakentaminen", step: 3 },
    { s: "lisatulot/mita-on-digitaalinen-omaisuus-ja-miten-rakennat-sellaisen", t: "Digitaalinen omaisuus", step: 3 },
    { s: "lisatulot/affiliate-markkinointi-suomessa-miten-rakennat-sivuston-joka-tienaa-nukkuessasi", t: "Affiliate-markkinointi", step: 3 },
    { s: "kryptovaluutta/cex-porssit-taydellisesti-kycsta-pankkitiliin-lompakoihin-ja-kryptoveroihin", t: "Kryptot: CEX-pörssit", step: 3 },
    { s: "kryptovaluutta/kryptolompakot-taydellinen-opas-seed-lauseesta-kylmasailytykseen-ja-yksityisyytta-suojaaviin-vaihtoehtoihin", t: "Kryptolompakot & Turvallisuus", step: 3 },
    { s: "kryptovaluutta/dex-porssit-ja-meme-tokenit-miten-tunnistat-huijaukset-kaytat-oikeita-tyokaluja-ja-treidaat-turvallisesti", t: "DEX-pörssit & Meme-tokenit", step: 3 },
    { s: "kryptovaluutta/nain-voit-kayttaa-kryptojasi-stablecoineista-defiin-ja-kryptomaksukortteihin", t: "Kryptojen käyttö & DeFi", step: 3 }
  ];

  /* ---- Evästeapurit ------------------------------------------------------ */
  function setCookie(name, value, days) {
    var d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = name + '=' + encodeURIComponent(value) +
      ';expires=' + d.toUTCString() + ';path=' + BASE_PATH + ';SameSite=Lax';
  }
  function getCookie(name) {
    var m = document.cookie.match('(?:^|; )' + name + '=([^;]*)');
    return m ? decodeURIComponent(m[1]) : '';
  }

  function getRead() {
    var raw = getCookie(COOKIE_NAME);
    if (!raw) return {};
    try { return JSON.parse(raw) || {}; } catch (e) { return {}; }
  }
  function saveRead(obj) {
    // Uudelleenasetus pidentää eväste-elinaikaa aina 90 pv:ään uusimmasta käynnistä
    setCookie(COOKIE_NAME, JSON.stringify(obj), COOKIE_DAYS);
  }
  function isRead(slug) { return !!getRead()[slug]; }
  function markRead(slug) {
    var r = getRead();
    if (!r[slug]) { r[slug] = 1; saveRead(r); }
    else { saveRead(r); } // pidennä elinaika
  }

  /* ---- Polun normalisointi ---------------------------------------------- */
  // Muuntaa href / location.pathname muotoon "kategoria/slug" ilman .html
  function normalize(pathOrHref) {
    if (!pathOrHref) return '';
    var p = pathOrHref;
    // poista domain jos absoluuttinen
    p = p.replace(/^https?:\/\/[^/]+/i, '');
    // poista query/hash
    p = p.split('#')[0].split('?')[0];
    // poista projektijuuri
    if (p.indexOf(BASE_PATH) === 0) p = p.slice(BASE_PATH.length);
    // poista suhteelliset etuliitteet (../ ja ./)
    p = p.replace(/^(?:\.\.?\/)+/, '');
    // poista mahdollinen etuslash
    p = p.replace(/^\/+/, '');
    // poista .html
    p = p.replace(/\.html$/i, '');
    // poista mahdollinen loppuslash
    p = p.replace(/\/+$/, '');
    return p.toLowerCase();
  }

  var PATH_SET = {};
  READ_PATH.forEach(function (x) { PATH_SET[x.s] = x; });

  /* ---- 1) Merkitse nykyinen artikkeli luetuksi -------------------------- */
  function markCurrentIfArticle() {
    // Vain varsinaiset artikkelit (on .article-body), ei kategoria-indeksit
    if (!document.querySelector('.article-body')) return;
    var slug = normalize(location.pathname);
    if (PATH_SET[slug]) markRead(slug);
    else if (slug) markRead(slug); // merkitään myös polun ulkopuoliset artikkelit
  }

  /* ---- 2) ✅-merkit "Lue tässä järjestyksessä" -listoihin ---------------- */
  function decorateReadOrder() {
    var sec = document.querySelector('.read-order-section');
    if (!sec) return;
    var links = sec.querySelectorAll('.grid-card ol li a[href]');
    links.forEach(function (a) {
      var slug = normalize(a.getAttribute('href'));
      var li = a.closest('li');
      if (!li) return;
      if (isRead(slug)) {
        li.classList.add('rp-done');
        if (!li.querySelector('.rp-check')) {
          var chk = document.createElement('span');
          chk.className = 'rp-check';
          chk.setAttribute('aria-label', 'Luettu');
          chk.textContent = '✅';
          li.insertBefore(chk, li.firstChild);
        }
      }
    });
    // Edistymislaskuri otsikkoon
    var done = sec.querySelectorAll('li.rp-done').length;
    var total = links.length;
    var hdr = sec.querySelector('.section-header h2');
    if (hdr && total) {
      var badge = hdr.querySelector('.rp-progress');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'rp-progress';
        hdr.appendChild(badge);
      }
      badge.textContent = ' ' + done + '/' + total + ' luettu';
    }
  }

  /* ---- 3) "Jatka lukupolkua" -laatikko artikkeleihin -------------------- */
  function relPrefixFromDepth() {
    // Artikkelit ovat aina yhden kansion syvyydellä (kategoria/artikkeli.html)
    // joten juureen pääsee '../'. Varmistetaan silti pathnamesta.
    var parts = normalize(location.pathname).split('/').filter(Boolean);
    var depth = parts.length - 1; // artikkelitiedosto pois
    return depth > 0 ? Array(depth + 1).join('../') : './';
  }

  function renderContinueBox() {
    var body = document.querySelector('.article-body');
    if (!body) return;
    var curSlug = normalize(location.pathname);
    // Löydä nykyisen artikkelin indeksi polusta
    var idx = -1;
    for (var i = 0; i < READ_PATH.length; i++) {
      if (READ_PATH[i].s === curSlug) { idx = i; break; }
    }

    var read = getRead();
    var readCount = READ_PATH.reduce(function (n, x) { return n + (read[x.s] ? 1 : 0); }, 0);
    var total = READ_PATH.length;
    var prefix = relPrefixFromDepth();

    // Etsi seuraava lukematon polun artikkeli (nykyisen jälkeen, sitten alusta)
    var next = null;
    var order = [];
    if (idx >= 0) {
      for (var j = idx + 1; j < READ_PATH.length; j++) order.push(READ_PATH[j]);
      for (var k = 0; k < idx; k++) order.push(READ_PATH[k]);
    } else {
      order = READ_PATH.slice();
    }
    for (var m = 0; m < order.length; m++) {
      if (!read[order[m].s]) { next = order[m]; break; }
    }

    var box = document.createElement('div');
    box.className = 'rp-continue';

    var stepNames = { 1: 'Vaihe 1 · Mieli & Asenne', 2: 'Vaihe 2 · Terveys & Suorituskyky', 3: 'Vaihe 3 · Talous, Bisnes & Krypto' };

    var html = '';
    html += '<div class="rp-continue-head">';
    html += '<span class="rp-continue-title">📚 Lukupolkusi</span>';
    html += '<span class="rp-continue-count">' + readCount + '/' + total + ' luettu</span>';
    html += '</div>';
    html += '<div class="rp-bar"><span style="width:' + Math.round(readCount / total * 100) + '%"></span></div>';

    if (next) {
      html += '<div class="rp-next">';
      html += '<span class="rp-next-label">Seuraavaksi' + (idx >= 0 ? '' : ' suositellussa polussa') + ':</span> ';
      html += '<a href="' + prefix + next.s + '.html">' + next.t + '</a>';
      html += ' <span class="rp-next-step">' + (stepNames[next.step] || '') + '</span>';
      html += '</div>';
    } else {
      html += '<div class="rp-next rp-done-all">🎉 Olet lukenut koko suositellun lukupolun. Hienoa!</div>';
    }
    html += '<div class="rp-continue-foot"><a href="' + prefix + 'index.html#lukupolku">Näytä koko lukupolku</a></div>';

    box.innerHTML = html;

    // Sijoita artikkelin loppuun (ennen affiliate-notea / footeria jos löytyy)
    var affNote = body.querySelector('.aff-note');
    if (affNote && affNote.parentNode) affNote.parentNode.insertBefore(box, affNote);
    else body.appendChild(box);
  }

  /* ---- Käynnistys -------------------------------------------------------- */
  function init() {
    markCurrentIfArticle();   // 1: merkitse luetuksi
    decorateReadOrder();      // 2: ✅ listoihin (etusivu/kategoriat)
    renderContinueBox();      // 3: laatikko artikkeleihin
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
