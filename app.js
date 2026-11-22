'use strict';

/* ---------- Daten ---------- */

const SPEICHER = 'vorrat-einkauf-v1';
const ORTE = ['Kühlschrank', 'Speisekammer', 'Gefrierfach'];

// basis = Einheit, in die umgerechnet wird; f = Faktor zur Basis
const EINHEITEN = {
  'Stück': { basis: 'Stück', f: 1 },
  'g': { basis: 'g', f: 1 },
  'kg': { basis: 'g', f: 1000 },
  'ml': { basis: 'ml', f: 1 },
  'l': { basis: 'ml', f: 1000 },
  'EL': { basis: 'ml', f: 15 },
  'TL': { basis: 'ml', f: 5 },
  'Packung': { basis: 'Packung', f: 1 },
  'Dose': { basis: 'Dose', f: 1 },
  'Glas': { basis: 'Glas', f: 1 },
  'Flasche': { basis: 'Flasche', f: 1 },
  'Becher': { basis: 'Becher', f: 1 },
  'Bund': { basis: 'Bund', f: 1 },
  'Zehe': { basis: 'Zehe', f: 1 },
  'Scheibe': { basis: 'Scheibe', f: 1 },
  'Prise': { basis: 'Prise', f: 1 },
};

// Schreibweisen in Rezepten -> Einheit
const ALIASE = {
  g: 'g', gr: 'g', gramm: 'g', kg: 'kg', kilo: 'kg', kilogramm: 'kg',
  ml: 'ml', milliliter: 'ml', l: 'l', liter: 'l',
  el: 'EL', essl: 'EL', esslöffel: 'EL', tl: 'TL', teel: 'TL', teelöffel: 'TL',
  stück: 'Stück', stk: 'Stück', st: 'Stück',
  packung: 'Packung', packungen: 'Packung', pck: 'Packung', pkg: 'Packung', päckchen: 'Packung',
  dose: 'Dose', dosen: 'Dose', glas: 'Glas', gläser: 'Glas',
  flasche: 'Flasche', flaschen: 'Flasche', becher: 'Becher', bund: 'Bund',
  zehe: 'Zehe', zehen: 'Zehe', scheibe: 'Scheibe', scheiben: 'Scheibe',
  prise: 'Prise', prisen: 'Prise',
  // englische Rezepte
  tbsp: 'EL', tablespoon: 'EL', tablespoons: 'EL', tsp: 'TL', teaspoon: 'TL', teaspoons: 'TL',
  clove: 'Zehe', cloves: 'Zehe', bunch: 'Bund', bunches: 'Bund', pinch: 'Prise',
  can: 'Dose', cans: 'Dose', tin: 'Dose', tins: 'Dose', slice: 'Scheibe', slices: 'Scheibe',
  piece: 'Stück', pieces: 'Stück', pack: 'Packung', packet: 'Packung',
};

// Englische Maße ohne deutsche Entsprechung: werden gleich umgerechnet
const FREMDMASSE = {
  cup: ['ml', 240], cups: ['ml', 240],
  oz: ['g', 28.35], ounce: ['g', 28.35], ounces: ['g', 28.35],
  lb: ['g', 453.6], lbs: ['g', 453.6], pound: ['g', 453.6], pounds: ['g', 453.6],
  sheet: ['Stück', 1], sheets: ['Stück', 1], stick: ['Stück', 1], sticks: ['Stück', 1],
  sprig: ['Stück', 1], sprigs: ['Stück', 1], handful: ['Stück', 1],
};

// Liefert { einheit, f } für ein Einheitenwort oder null
function einheitFinden(wort) {
  const k = wort.toLowerCase();
  if (ALIASE[k]) return { einheit: ALIASE[k], f: 1 };
  if (FREMDMASSE[k]) return { einheit: FREMDMASSE[k][0], f: FREMDMASSE[k][1] };
  return null;
}

// Umgerechnete Maße (oz, cups) auf ganze Gramm/Milliliter runden
function umrechnen(menge, f) {
  return f === 1 ? menge : Math.round(menge * f);
}

// Einheit, die als Wort vor dem Namen steht: "cloves of garlic", "bunch mint"
const EINHEIT_VORNE = /^(cloves?|bunch(?:es)?|pinch|cans?|tins?|slices?|zehen?|bund|prise|dosen?|scheiben?)\s+(?:of\s+)?(.+)$/i;
// Anhängsel ohne Bedeutung für den Einkauf
const ANHANG = /\s+(to taste|to finish|to serve|to garnish|nach geschmack|zum servieren|zum garnieren)$/i;

function nameSaeubern(name, einheit) {
  name = name.trim().replace(ANHANG, '').trim();
  const m = name.match(EINHEIT_VORNE);
  if (m && (!einheit || einheit === 'Stück')) {
    name = m[2].replace(ANHANG, '').trim();
    einheit = ALIASE[m[1].toLowerCase()];
  }
  // original = Name vor der Übersetzung; wird nur beim Speichern des Rezepts gebraucht
  let deutsch = uebersetzen(name);
  // "4 Knoblauchzehen" -> 4 Zehe Knoblauch, damit der Abgleich mit "Knoblauch" im Vorrat klappt
  const zehe = deutsch.match(/^(.{3,}?)zehen?$/i);
  if (zehe && einheit === 'Stück') { deutsch = zehe[1]; einheit = 'Zehe'; }
  return { name: deutsch, einheit, original: name };
}

let state = laden();
const portionenWahl = {}; // Rezept-ID -> gewählte Portionen (nur Anzeige)
let vorratBearbeiten = null;
let rezeptBearbeiten = null;

function laden() {
  try {
    const d = JSON.parse(localStorage.getItem(SPEICHER));
    if (d && Array.isArray(d.vorrat) && Array.isArray(d.rezepte) && Array.isArray(d.einkauf)) {
      if (!d.plan || typeof d.plan !== 'object') d.plan = {};
      return d;
    }
  } catch (e) { /* kaputte Daten ignorieren */ }
  return { vorrat: [], rezepte: [], einkauf: [], plan: {} };
}

function speichern() {
  localStorage.setItem(SPEICHER, JSON.stringify(state));
  allesZeichnen();
  if (window.syncGeaendert) window.syncGeaendert(); // online speichern, siehe sync.js
}

function neueId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* ---------- Hilfsfunktionen ---------- */

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function einheitInfo(e) {
  return EINHEITEN[e] || { basis: e || 'Stück', f: 1 };
}

// Vergleichsschlüssel: "Tomaten" und "Tomate", "Äpfel" und "Apfel" sollen gleich sein
function schluessel(name) {
  let s = String(name).toLowerCase().trim()
    .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const m = s.match(/(ern|en|er|e|n|s)$/);
  if (m) {
    const rest = s.slice(0, -m[1].length);
    const doppelS = m[1] === 's' && rest.endsWith('s');
    if (rest.length >= 2 && !doppelS) s = rest;
  }
  return s;
}

function zahl(n) {
  return (Math.round(n * 100) / 100).toLocaleString('de-DE');
}

// Basismenge hübsch darstellen: 1500 g -> 1,5 kg
function schoen(menge, basis) {
  if (basis === 'g' && menge >= 1000) return { menge: menge / 1000, einheit: 'kg' };
  if (basis === 'ml' && menge >= 1000) return { menge: menge / 1000, einheit: 'l' };
  return { menge, einheit: basis };
}

function mengeText(menge, einheit) {
  if (menge == null) return '';
  return zahl(menge) + ' ' + esc(einheit);
}

function melde(text) {
  const el = document.getElementById('meldung');
  el.textContent = text;
  el.classList.add('sichtbar');
  clearTimeout(melde.t);
  melde.t = setTimeout(() => el.classList.remove('sichtbar'), 3500);
}

// Ja/Nein-Nachfrage auf der Seite (das Browser-eigene confirm() wird
// in manchen eingebetteten Browsern unterdrückt)
function frage(text) {
  return new Promise(fertig => {
    const dlg = document.getElementById('frage');
    document.getElementById('frage-text').textContent = text;
    dlg.returnValue = '';
    dlg.addEventListener('close', () => fertig(dlg.returnValue === 'ja'), { once: true });
    dlg.showModal();
  });
}

/* ---------- Rezeptzeilen lesen ---------- */

function zeileLesen(roh) {
  let zeile = roh.trim().replace(/^[-*•–]\s*/, '')
    .replace(/½/g, '1/2').replace(/¼/g, '1/4').replace(/¾/g, '3/4');
  if (!zeile) return null;
  const mengeLesen = t => {
    if (t.includes('/')) {
      const [a, b] = t.split('/').map(Number);
      return b ? a / b : a;
    }
    return Number(t.replace(',', '.'));
  };
  const ZAHL = '(\\d+\\s*\\/\\s*\\d+|\\d+(?:[.,]\\d+)?)';

  // Form 1: Menge vorne – "200 g Mehl", "2 Eier"
  const m = zeile.match(new RegExp('^' + ZAHL + '\\s*(.*)$'));
  if (m && m[2]) {
    const menge = mengeLesen(m[1]);
    const rest = m[2].trim();
    const e = rest.match(/^([A-Za-zäöüÄÖÜ]+)\.?\s+(.+)$/);
    const gefunden = e && einheitFinden(e[1]);
    if (gefunden) {
      return { menge: umrechnen(menge, gefunden.f), ...nameSaeubern(e[2], gefunden.einheit) };
    }
    return { menge, ...nameSaeubern(rest, 'Stück') };
  }

  // Form 2: Menge hinten – "beef mince500g", "olive oil2 tbsp", "brown onion1"
  const h = zeile.match(new RegExp('^(.*?\\D)\\s*' + ZAHL + '\\s*([A-Za-zäöüÄÖÜ]*)\\.?$'));
  if (h) {
    const gefunden = h[3] ? einheitFinden(h[3]) : { einheit: 'Stück', f: 1 };
    if (gefunden) {
      return { menge: umrechnen(mengeLesen(h[2]), gefunden.f), ...nameSaeubern(h[1], gefunden.einheit) };
    }
  }

  // Keine Menge – "salt and pepper to taste"
  return { ...nameSaeubern(zeile, ''), menge: null, einheit: '' };
}

function zutatenLesen(text) {
  // Beim Kopieren von Webseiten steht die Menge oft in einer eigenen Zeile
  // ("olive oil" / "2 tbsp"). Solche Zeilen wieder zusammensetzen.
  const nurMenge = /^(\d+\s*\/\s*\d+|\d+(?:[.,]\d+)?)\s*([A-Za-zäöüÄÖÜ]*)\.?$/;
  const zeilen = [];
  let letzteHatMenge = true; // true = es gibt keine Zeile, die noch auf eine Menge wartet
  let wartend = null;        // Menge, die vor ihrer Zutat stand
  for (const roh of text.split('\n')) {
    const zeile = roh.trim().replace(/^[-*•–]\s*/, '')
      .replace(/½/g, '1/2').replace(/¼/g, '1/4').replace(/¾/g, '3/4');
    if (!zeile) continue;
    const m = zeile.match(nurMenge);
    if (m && (!m[2] || einheitFinden(m[2]))) {
      if (!letzteHatMenge) {
        zeilen[zeilen.length - 1] += zeile;
        letzteHatMenge = true;
      } else {
        wartend = zeile;
      }
      continue;
    }
    const ganz = wartend ? `${wartend} ${zeile}` : zeile;
    wartend = null;
    zeilen.push(ganz);
    letzteHatMenge = zeileLesen(ganz).menge != null;
  }

  return zeilen.map(zeileLesen).filter(Boolean).flatMap(z => {
    // "Salz und Pfeffer" ohne Menge sind zwei Zutaten
    if (z.menge == null && / und /.test(z.name)) {
      return z.name.split(/ und /).map(n => ({ name: n.trim(), menge: null, einheit: '' }));
    }
    return [z];
  });
}

function zutatAlsText(z) {
  if (z.menge == null) return z.name;
  if (z.einheit === 'Stück') return `${zahl(z.menge)} ${z.name}`;
  return `${zahl(z.menge)} ${z.einheit} ${z.name}`;
}

/* ---------- Abgleich Rezept <-> Vorrat ---------- */

// Ergebnis: status 'ok' | 'unklar' (vorhanden, andere Einheit) | 'teil' | 'fehlt'
function pruefe(z, faktor) {
  const k = schluessel(z.name);
  const treffer = state.vorrat.filter(v => schluessel(v.name) === k && v.menge > 0);
  if (!treffer.length) {
    return { status: 'fehlt', menge: z.menge == null ? null : z.menge * faktor, einheit: z.einheit };
  }
  if (z.menge == null) return { status: 'ok' };
  // Vorrat in die Einheit des Rezepts umrechnen (z. B. 1 Knolle Knoblauch -> 10 Zehen)
  let habe = 0;
  let umrechenbar = 0;
  for (const v of treffer) {
    const x = inEinheit(z.name, v.menge, v.einheit, z.einheit);
    if (x != null) { habe += x; umrechenbar++; }
  }
  if (!umrechenbar) return { status: 'unklar' };
  const brauche = z.menge * faktor;
  if (habe >= brauche - 1e-9) return { status: 'ok' };
  const e = einheitInfo(z.einheit);
  return { status: 'teil', ...schoen((brauche - habe) * e.f, e.basis) };
}

function faktorVon(r) {
  return (portionenWahl[r.id] || r.portionen) / r.portionen;
}

// auto = false: von Hand eingetragen, Menge wird nicht auf Packungen aufgerundet
function aufEinkaufsliste(name, menge, einheit, auto = true) {
  const k = schluessel(name);
  const offen = state.einkauf.filter(a => !a.erledigt && schluessel(a.name) === k);
  for (const da of offen) {
    if (menge == null) return; // steht schon drauf
    if (da.menge == null) { Object.assign(da, { menge, einheit: einheit || 'Stück' }); return; }
    // Zur vorhandenen Zeile addieren, auch bei anderer Einheit (3 Zehen + 1 Knolle)
    const x = inEinheit(name, menge, einheit, da.einheit);
    if (x != null) {
      const i = einheitInfo(da.einheit);
      Object.assign(da, schoen((da.menge + x) * i.f, i.basis));
      return;
    }
  }
  state.einkauf.push({ id: neueId(), name, menge, einheit: einheit || 'Stück', erledigt: false, auto });
}

// Setzt alles, was für das Rezept fehlt, auf die Einkaufsliste. Gibt die Anzahl zurück.
function fehlendesEinkaufen(r) {
  let n = 0;
  for (const z of r.zutaten) {
    const p = pruefe(z, faktorVon(r));
    if (p.status === 'fehlt' || p.status === 'teil') {
      aufEinkaufsliste(z.name, p.menge ?? null, p.einheit || z.einheit);
      n++;
    }
  }
  return n;
}

function inVorrat(name, menge, einheit) {
  const k = schluessel(name);
  let x = null;
  const da = state.vorrat.find(v => schluessel(v.name) === k &&
    (x = inEinheit(name, menge, einheit, v.einheit)) != null);
  if (da) {
    da.menge = Math.round((da.menge + x) * 1000) / 1000;
  } else {
    state.vorrat.push({ id: neueId(), name, menge, einheit, ort: 'Speisekammer', mhd: '' });
  }
}

function kochen(r) {
  const faktor = faktorVon(r);
  for (const z of r.zutaten) {
    if (z.menge == null) continue;
    const k = schluessel(z.name);
    let offen = z.menge * faktor; // in der Einheit des Rezepts
    const passend = state.vorrat
      .filter(v => schluessel(v.name) === k && inEinheit(z.name, 1, v.einheit, z.einheit) != null)
      .sort((a, b) => (a.mhd || '9999').localeCompare(b.mhd || '9999'));
    for (const v of passend) {
      if (offen <= 1e-9) break;
      const vorhanden = inEinheit(z.name, v.menge, v.einheit, z.einheit);
      const nimm = Math.min(vorhanden, offen);
      v.menge = Math.round((v.menge - inEinheit(z.name, nimm, z.einheit, v.einheit)) * 1000) / 1000;
      offen -= nimm;
    }
  }
  state.vorrat = state.vorrat.filter(v => v.menge > 0);
}

/* ---------- Anzeige ---------- */

function mhdMarke(mhd) {
  if (!mhd) return '';
  const heute = new Date(); heute.setHours(0, 0, 0, 0);
  const tage = Math.round((new Date(mhd + 'T00:00:00') - heute) / 86400000);
  const datum = new Date(mhd + 'T00:00:00').toLocaleDateString('de-DE');
  if (tage < 0) return `<span class="marke fehlt">abgelaufen ${datum}</span>`;
  if (tage <= 3) return `<span class="marke warn">bis ${datum}</span>`;
  return `<span class="marke ok">bis ${datum}</span>`;
}

function vorratZeichnen() {
  const filter = schluessel(document.getElementById('vorrat-suche').value);
  const el = document.getElementById('vorrat-liste');
  if (!state.vorrat.length) {
    el.innerHTML = '<p class="leer">Noch nichts im Vorrat. Trag oben deine erste Zutat ein.</p>';
    return;
  }
  let html = '';
  for (const ort of ORTE) {
    const dinge = state.vorrat
      .filter(v => v.ort === ort && (!filter || schluessel(v.name).includes(filter)))
      .sort((a, b) => a.name.localeCompare(b.name, 'de'));
    if (!dinge.length) continue;
    html += `<h3>${esc(ort)} (${dinge.length})</h3>`;
    for (const v of dinge) {
      html += `<div class="zeile" data-id="${v.id}">
        <span class="name">${esc(v.name)} ${mhdMarke(v.mhd)}</span>
        <span class="menge">${mengeText(v.menge, v.einheit)}</span>
        <span class="aktionen">
          <button class="klein" data-akt="v-minus" title="Weniger">−</button>
          <button class="klein" data-akt="v-plus" title="Mehr">+</button>
          <button class="klein" data-akt="v-kaufen" title="Auf die Einkaufsliste">Nachkaufen</button>
          <button class="klein" data-akt="v-bearbeiten">Ändern</button>
          <button class="klein gefahr" data-akt="v-loeschen" title="Löschen">✕</button>
        </span>
      </div>`;
    }
  }
  el.innerHTML = html || '<p class="leer">Nichts gefunden.</p>';
}

function rezepteZeichnen() {
  const el = document.getElementById('rezept-liste');
  if (!state.rezepte.length) {
    el.innerHTML = '<p class="leer">Noch keine Rezepte. Füge oben dein erstes Rezept ein.</p>';
    return;
  }
  el.innerHTML = state.rezepte.map(r => {
    const faktor = faktorVon(r);
    let fehlen = 0;
    const zeilen = r.zutaten.map(z => {
      const p = pruefe(z, faktor);
      let marke;
      if (p.status === 'ok') marke = '<span class="marke ok">vorhanden</span>';
      else if (p.status === 'unklar') marke = '<span class="marke warn">vorhanden, Menge prüfen</span>';
      else {
        fehlen++;
        const wieviel = p.menge == null ? '' : ' ' + mengeText(p.menge, p.einheit);
        marke = `<span class="marke fehlt">fehlt${p.status === 'teil' ? ' noch' : ''}${wieviel}</span>`;
      }
      const skaliert = { ...z, menge: z.menge == null ? null : z.menge * faktor };
      return `<li><span>${esc(zutatAlsText(skaliert))}</span>${marke}</li>`;
    }).join('');
    const status = fehlen === 0
      ? '<span class="marke ok">Alles da</span>'
      : `<span class="marke fehlt">${fehlen} von ${r.zutaten.length} fehlen</span>`;
    return `<div class="karte" data-id="${r.id}">
      <div class="rezept-kopf"><h2>${esc(r.name)}</h2>${status}</div>
      <label class="portionen">Portionen
        <input type="number" min="1" step="1" value="${portionenWahl[r.id] || r.portionen}" data-akt="r-portionen">
      </label>
      <ul class="zutaten">${zeilen}</ul>
      ${r.anleitung ? `<p class="anleitung">${esc(r.anleitung)}</p>` : ''}
      <div class="knoepfe">
        ${fehlen ? '<button class="primaer" data-akt="r-einkauf">Fehlendes auf die Einkaufsliste</button>' : ''}
        <button data-akt="r-gekocht">Gekocht (vom Vorrat abziehen)</button>
        <button data-akt="r-bearbeiten">Ändern</button>
        <button class="gefahr" data-akt="r-loeschen">Löschen</button>
      </div>
    </div>`;
  }).join('');
}

function einkaufZeichnen() {
  const el = document.getElementById('einkauf-liste');
  const offen = state.einkauf.filter(a => !a.erledigt).length;
  document.getElementById('einkauf-zahl').textContent = offen || '';
  if (!state.einkauf.length) {
    el.innerHTML = '<p class="leer">Die Einkaufsliste ist leer.</p>';
    return;
  }
  const sortiert = [...state.einkauf].sort((a, b) => a.erledigt - b.erledigt);
  el.innerHTML = sortiert.map(a => {
    const k = kaufmenge(a);
    const kauf = mengeText(k.menge, k.einheit);
    const bedarf = mengeText(a.menge, a.einheit);
    const mengeHtml = kauf + (bedarf && bedarf !== kauf ? `<small>Bedarf ${bedarf}</small>` : '');
    return `<div class="zeile ${a.erledigt ? 'erledigt' : ''}" data-id="${a.id}">
      <input type="checkbox" data-akt="e-haken" ${a.erledigt ? 'checked' : ''} aria-label="${esc(a.name)} abhaken">
      <span class="name">${esc(a.name)}</span>
      <span class="menge">${mengeHtml}</span>
      <span class="aktionen">
        <a href="https://shop.rewe.de/productList?search=${encodeURIComponent(a.name)}" target="_blank" rel="noopener" data-fenster="rewe">REWE ↗</a>
        <button class="klein gefahr" data-akt="e-loeschen" title="Löschen">✕</button>
      </span>
    </div>`;
  }).join('');
}

function allesZeichnen() {
  vorratZeichnen();
  rezepteZeichnen();
  planZeichnen();
  einkaufZeichnen();
}

/* ---------- Formulare ---------- */

function einheitenFuellen() {
  const optionen = Object.keys(EINHEITEN).map(e => `<option>${e}</option>`).join('');
  document.querySelectorAll('select[name=einheit]').forEach(s => { s.innerHTML = optionen; });
}

const vorratForm = document.getElementById('vorrat-form');
const rezeptForm = document.getElementById('rezept-form');
const einkaufForm = document.getElementById('einkauf-form');

function vorratFormZuruecksetzen() {
  vorratBearbeiten = null;
  const ort = vorratForm.ort.value;
  vorratForm.reset();
  vorratForm.ort.value = ort; // Ort merken, praktisch beim Einräumen
  document.getElementById('vorrat-form-titel').textContent = 'Zutat hinzufügen';
  document.getElementById('vorrat-abbrechen').hidden = true;
}

vorratForm.addEventListener('submit', ev => {
  ev.preventDefault();
  const f = vorratForm;
  const daten = {
    name: f.name.value.trim(),
    menge: Number(f.menge.value),
    einheit: f.einheit.value,
    ort: f.ort.value,
    mhd: f.mhd.value,
  };
  if (!daten.name) return;
  if (vorratBearbeiten) {
    Object.assign(state.vorrat.find(v => v.id === vorratBearbeiten) || {}, daten);
  } else {
    state.vorrat.push({ id: neueId(), ...daten });
  }
  vorratFormZuruecksetzen();
  speichern();
  f.name.focus();
});
document.getElementById('vorrat-abbrechen').addEventListener('click', vorratFormZuruecksetzen);
document.getElementById('vorrat-suche').addEventListener('input', vorratZeichnen);

function rezeptFormZuruecksetzen() {
  rezeptBearbeiten = null;
  rezeptForm.reset();
  document.getElementById('rezept-form-titel').textContent = 'Rezept hinzufügen';
  document.getElementById('rezept-abbrechen').hidden = true;
}

// Erkennt ein englisches Rezept: Das Wörterbuch hat etwas übersetzt,
// oder der Text enthält typisch englische Rezeptwörter.
function istEnglisch(zutaten, rohtext) {
  return zutaten.some(z => z.original && z.original.toLowerCase() !== z.name.toLowerCase()) ||
    /\b(tbsp|tsp|cups?|cloves?|of|and|or|to taste|chopped|sliced|fresh)\b/i.test(rohtext);
}

const NUR_LINK = /^\s*https?:\/\/\S+\s*$/i; // Zubereitung ist nur eine Internetadresse
const ENGLISCHE_WOERTER = /\b(of|and|with|fresh|sliced|chopped|rice|chicken|beef|sauce|seeds?|water|tin|jar|hot|white|bowl|bake|cloves?|the|until|add|heat)\b/i;

// Bereits gespeicherte Rezepte nachträglich übersetzen
async function gespeicherteUebersetzen() {
  const deutsch = /[äöüß]/i;
  let geaendert = 0;
  for (const r of state.rezepte) {
    const texte = [r.name, ...r.zutaten.map(z => z.name)];
    const englisch = texte.some(t => ENGLISCHE_WOERTER.test(t) || uebersetzen(t).toLowerCase() !== t.toLowerCase());
    if (!englisch) continue;
    const vorher = JSON.stringify(r);
    for (const z of r.zutaten) {
      let n = uebersetzen(z.name);
      if (n.toLowerCase() === z.name.toLowerCase() && !deutsch.test(n)) n = await onlineUebersetzen(n, true);
      z.name = n;
    }
    if (!deutsch.test(r.name)) r.name = await onlineUebersetzen(r.name, true);
    if (r.anleitung && !deutsch.test(r.anleitung) && !NUR_LINK.test(r.anleitung) && ENGLISCHE_WOERTER.test(r.anleitung)) {
      r.anleitung = await textOnlineUebersetzen(r.anleitung);
    }
    if (JSON.stringify(r) !== vorher) geaendert++;
  }
  return geaendert;
}

document.getElementById('rezepte-uebersetzen').addEventListener('click', async ev => {
  const knopf = ev.currentTarget;
  knopf.disabled = true;
  knopf.textContent = 'Übersetze …';
  try {
    const n = await gespeicherteUebersetzen();
    if (n) speichern();
    melde(n ? `${n} Rezept${n === 1 ? '' : 'e'} übersetzt.` : 'Es gab nichts zu übersetzen.');
  } finally {
    knopf.disabled = false;
    knopf.textContent = 'Englische Rezepte übersetzen';
  }
});

let rezeptWirdGespeichert = false;

rezeptForm.addEventListener('submit', async ev => {
  ev.preventDefault();
  if (rezeptWirdGespeichert) return;
  const f = rezeptForm;
  const zutaten = zutatenLesen(f.zutaten.value);
  if (!zutaten.length) { melde('Bitte mindestens eine Zutat eintragen.'); return; }
  const bearbeiteId = rezeptBearbeiten;
  const daten = {
    name: f.name.value.trim(),
    portionen: Math.max(1, Number(f.portionen.value) || 1),
    zutaten,
    anleitung: f.anleitung.value.trim(),
  };

  // Englisches Rezept: alles, was das Wörterbuch nicht kannte, online übersetzen
  if (istEnglisch(zutaten, f.zutaten.value)) {
    rezeptWirdGespeichert = true;
    const knopf = f.querySelector('button[type=submit]');
    knopf.disabled = true;
    knopf.textContent = 'Übersetze …';
    try {
      const deutsch = /[äöüß]/i;
      for (const z of zutaten) {
        const unbekannt = z.original && z.original.toLowerCase() === z.name.toLowerCase();
        if (unbekannt && !deutsch.test(z.name)) z.name = await onlineUebersetzen(z.name, true);
      }
      if (!deutsch.test(daten.name)) daten.name = await onlineUebersetzen(daten.name, true);
      if (daten.anleitung && !deutsch.test(daten.anleitung) && !NUR_LINK.test(daten.anleitung)) {
        daten.anleitung = await textOnlineUebersetzen(daten.anleitung);
      }
    } finally {
      rezeptWirdGespeichert = false;
      knopf.disabled = false;
      knopf.textContent = 'Speichern';
    }
  }
  for (const z of zutaten) delete z.original;

  let text = 'Rezept gespeichert.';
  if (bearbeiteId) {
    Object.assign(state.rezepte.find(r => r.id === bearbeiteId) || {}, daten);
    delete portionenWahl[bearbeiteId];
  } else {
    // Neues Rezept: Fehlendes kommt automatisch auf die Einkaufsliste
    const neu = { id: neueId(), ...daten };
    state.rezepte.push(neu);
    const n = fehlendesEinkaufen(neu);
    text = n
      ? `Rezept gespeichert. ${n} fehlende Zutat${n === 1 ? '' : 'en'} auf die Einkaufsliste gesetzt.`
      : 'Rezept gespeichert. Du hast alles da.';
  }
  rezeptFormZuruecksetzen();
  speichern();
  melde(text);
});
document.getElementById('rezept-abbrechen').addEventListener('click', rezeptFormZuruecksetzen);

einkaufForm.addEventListener('submit', ev => {
  ev.preventDefault();
  const f = einkaufForm;
  const name = f.name.value.trim();
  if (!name) return;
  const menge = f.menge.value === '' ? null : Number(f.menge.value);
  aufEinkaufsliste(name, menge, f.einheit.value, false);
  f.reset();
  speichern();
  f.name.focus();
});

/* ---------- Klicks in den Listen ---------- */

document.addEventListener('click', async ev => {
  const knopf = ev.target.closest('[data-akt]');
  if (!knopf || knopf.tagName === 'INPUT') return;
  const id = knopf.closest('[data-id]')?.dataset.id;
  const akt = knopf.dataset.akt;

  if (akt.startsWith('v-')) {
    const v = state.vorrat.find(x => x.id === id);
    if (!v) return;
    const schritt = (v.einheit === 'g' || v.einheit === 'ml') ? 50 : 1;
    if (akt === 'v-plus') v.menge = Math.round((v.menge + schritt) * 1000) / 1000;
    if (akt === 'v-minus') {
      v.menge = Math.round((v.menge - schritt) * 1000) / 1000;
      if (v.menge <= 0) {
        if (await frage(`„${v.name}“ ist aufgebraucht. Auf die Einkaufsliste setzen?`)) {
          aufEinkaufsliste(v.name, null, v.einheit);
        }
        state.vorrat = state.vorrat.filter(x => x.id !== id);
      }
    }
    if (akt === 'v-kaufen') {
      aufEinkaufsliste(v.name, null, v.einheit);
      melde(`„${v.name}“ steht auf der Einkaufsliste.`);
    }
    if (akt === 'v-loeschen') {
      if (!await frage(`„${v.name}“ aus dem Vorrat löschen?`)) return;
      state.vorrat = state.vorrat.filter(x => x.id !== id);
    }
    if (akt === 'v-bearbeiten') {
      vorratBearbeiten = id;
      const f = vorratForm;
      f.name.value = v.name; f.menge.value = v.menge; f.einheit.value = v.einheit;
      f.ort.value = v.ort; f.mhd.value = v.mhd || '';
      document.getElementById('vorrat-form-titel').textContent = 'Zutat ändern';
      document.getElementById('vorrat-abbrechen').hidden = false;
      f.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    speichern();
  }

  if (akt.startsWith('r-')) {
    const r = state.rezepte.find(x => x.id === id);
    if (!r) return;
    if (akt === 'r-einkauf') {
      const n = fehlendesEinkaufen(r);
      speichern();
      melde(`${n} Zutat${n === 1 ? '' : 'en'} auf die Einkaufsliste gesetzt.`);
    }
    if (akt === 'r-gekocht') {
      if (!await frage(`Zutaten für „${r.name}“ vom Vorrat abziehen?`)) return;
      kochen(r);
      speichern();
      melde('Vorrat aktualisiert. Guten Appetit!');
    }
    if (akt === 'r-loeschen') {
      if (!await frage(`Rezept „${r.name}“ löschen?`)) return;
      state.rezepte = state.rezepte.filter(x => x.id !== id);
      for (const tag of Object.keys(state.plan)) {
        state.plan[tag] = state.plan[tag].filter(e => e.rezeptId !== id);
        if (!state.plan[tag].length) delete state.plan[tag];
      }
      speichern();
    }
    if (akt === 'r-bearbeiten') {
      rezeptBearbeiten = id;
      const f = rezeptForm;
      f.name.value = r.name; f.portionen.value = r.portionen;
      f.zutaten.value = r.zutaten.map(zutatAlsText).join('\n');
      f.anleitung.value = r.anleitung || '';
      document.getElementById('rezept-form-titel').textContent = 'Rezept ändern';
      document.getElementById('rezept-abbrechen').hidden = false;
      f.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  if (akt === 'e-loeschen') {
    state.einkauf = state.einkauf.filter(x => x.id !== id);
    speichern();
  }
});

document.addEventListener('change', ev => {
  const el = ev.target;
  const id = el.closest('[data-id]')?.dataset.id;
  if (el.dataset.akt === 'e-haken') {
    const a = state.einkauf.find(x => x.id === id);
    if (a) { a.erledigt = el.checked; speichern(); }
  }
  if (el.dataset.akt === 'r-portionen') {
    portionenWahl[id] = Math.max(1, Number(el.value) || 1);
    rezepteZeichnen();
  }
});

/* ---------- Einkaufsliste: Knöpfe ---------- */

document.getElementById('einkauf-uebernehmen').addEventListener('click', () => {
  const fertig = state.einkauf.filter(a => a.erledigt);
  if (!fertig.length) { melde('Hake zuerst ab, was du gekauft hast.'); return; }
  for (const a of fertig) {
    const k = kaufmenge(a); // gekauft wird die ganze Packung, nicht nur der Bedarf
    inVorrat(a.name, k.menge ?? 1, k.einheit || 'Stück');
  }
  state.einkauf = state.einkauf.filter(a => !a.erledigt);
  speichern();
  melde(`${fertig.length} Artikel im Vorrat. Neue liegen in der Speisekammer, Ort und Haltbarkeit kannst du dort ändern.`);
});

document.getElementById('einkauf-kopieren').addEventListener('click', async () => {
  const text = state.einkauf.filter(a => !a.erledigt)
    .map(a => {
      const k = kaufmenge(a);
      return (k.menge == null ? '' : `${zahl(k.menge)} ${k.einheit} `) + a.name;
    }).join('\n');
  if (!text) { melde('Nichts zu kopieren.'); return; }
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    const t = document.createElement('textarea');
    t.value = text; document.body.appendChild(t); t.select();
    document.execCommand('copy'); t.remove();
  }
  melde('Einkaufsliste kopiert.');
});

document.getElementById('einkauf-leeren').addEventListener('click', async () => {
  if (!state.einkauf.length || !await frage('Die ganze Einkaufsliste leeren?')) return;
  state.einkauf = [];
  speichern();
});

/* ---------- Reiter, Export, Import ---------- */

document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === tab));
  document.querySelectorAll('.seite').forEach(s => s.classList.toggle('active', s.id === tab.dataset.tab));
}));

document.getElementById('export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `vorrat-sicherung-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

document.getElementById('import-knopf').addEventListener('click', () => document.getElementById('import-datei').click());
document.getElementById('import-datei').addEventListener('change', async ev => {
  const datei = ev.target.files[0];
  ev.target.value = '';
  if (!datei) return;
  try {
    const d = JSON.parse(await datei.text());
    if (!Array.isArray(d.vorrat) || !Array.isArray(d.rezepte) || !Array.isArray(d.einkauf)) throw new Error();
    if (!await frage('Die aktuellen Daten werden durch die Sicherung ersetzt. Fortfahren?')) return;
    if (!d.plan || typeof d.plan !== 'object') d.plan = {};
    state = d;
    speichern();
    melde('Sicherung geladen.');
  } catch (e) {
    melde('Diese Datei ist keine gültige Sicherung.');
  }
});

// REWE-Links in einem eigenen Fenster öffnen (statt in einem neuen Tab).
// Alle Links teilen sich dasselbe Fenster, damit nicht für jeden Artikel eins aufgeht.
document.addEventListener('click', ev => {
  const link = ev.target.closest('a[data-fenster]');
  if (!link || ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.button !== 0) return;
  const b = Math.min(1200, screen.availWidth - 80);
  const h = Math.min(900, screen.availHeight - 80);
  const fenster = window.open(link.href, 'rewe-shop', `popup=yes,width=${b},height=${h},left=60,top=40`);
  if (fenster) {
    ev.preventDefault(); // sonst öffnet der Browser zusätzlich einen Tab
    fenster.focus();
  }
  // Wurde das Fenster blockiert, öffnet sich der Link wie bisher in einem neuen Tab.
});

/* ---------- Wochenplan ---------- */

const WOCHENTAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
let wochenVersatz = 0; // 0 = diese Woche, 1 = nächste …

function isoDatum(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Die sieben Tage (Mo–So) der angezeigten Woche
function wochenTage() {
  const montag = new Date();
  montag.setHours(12, 0, 0, 0);
  montag.setDate(montag.getDate() - ((montag.getDay() + 6) % 7) + wochenVersatz * 7);
  return WOCHENTAGE.map((name, i) => {
    const d = new Date(montag);
    d.setDate(montag.getDate() + i);
    return { name, datum: d, iso: isoDatum(d) };
  });
}

function planZeichnen() {
  const tage = wochenTage();
  const lang = d => d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' });
  document.getElementById('woche-titel').textContent =
    `${lang(tage[0].datum)} – ${lang(tage[6].datum)} ${tage[6].datum.getFullYear()}`;
  const heute = isoDatum(new Date());
  const auswahl = state.rezepte.length
    ? '<option value="">+ Rezept</option>' + [...state.rezepte]
      .sort((a, b) => a.name.localeCompare(b.name, 'de'))
      .map(r => `<option value="${r.id}">${esc(r.name)}</option>`).join('')
    : '';

  document.getElementById('plan-liste').innerHTML = tage.map(t => {
    const eintraege = (state.plan[t.iso] || []).map(e => {
      const r = state.rezepte.find(x => x.id === e.rezeptId);
      if (!r) return '';
      const fehlen = r.zutaten.filter(z => {
        const s = pruefe(z, e.portionen / r.portionen).status;
        return s === 'fehlt' || s === 'teil';
      }).length;
      const marke = fehlen
        ? `<span class="marke fehlt">${fehlen} fehlen</span>`
        : '<span class="marke ok">Alles da</span>';
      return `<div class="eintrag ${fehlen ? 'fehlt' : 'ok'}" data-id="${e.id}">
        <button class="weg" data-akt="p-loeschen" title="Aus dem Plan nehmen">✕</button>
        <div class="name">${esc(r.name)}</div>
        ${marke}
        <label><input type="number" min="1" step="1" value="${e.portionen}" data-akt="p-portionen"> Port.</label>
      </div>`;
    }).join('');
    return `<div class="tag ${t.iso === heute ? 'heute' : ''}" data-tag="${t.iso}">
      <div class="tag-kopf" title="${t.name}, ${t.datum.toLocaleDateString('de-DE')}">
        <span class="wt">${t.name.slice(0, 2)}</span>
        <span class="nr">${t.datum.getDate()}</span>
      </div>
      <div class="tag-inhalt">${eintraege}</div>
      ${auswahl ? `<select data-akt="p-neu" aria-label="Rezept für ${t.name} hinzufügen">${auswahl}</select>` : ''}
    </div>`;
  }).join('');
  document.getElementById('plan-leer').hidden = state.rezepte.length > 0;
}

const planListe = document.getElementById('plan-liste');

planListe.addEventListener('change', ev => {
  const el = ev.target;
  const tag = el.closest('[data-tag]')?.dataset.tag;
  if (!tag) return;
  if (el.dataset.akt === 'p-neu' && el.value) {
    const r = state.rezepte.find(x => x.id === el.value);
    if (!r) return;
    (state.plan[tag] ||= []).push({ id: neueId(), rezeptId: r.id, portionen: r.portionen });
    speichern();
  }
  if (el.dataset.akt === 'p-portionen') {
    const e = (state.plan[tag] || []).find(x => x.id === el.closest('[data-id]').dataset.id);
    if (e) { e.portionen = Math.max(1, Number(el.value) || 1); speichern(); }
  }
});

planListe.addEventListener('click', ev => {
  const knopf = ev.target.closest('[data-akt="p-loeschen"]');
  if (!knopf) return;
  const tag = knopf.closest('[data-tag]').dataset.tag;
  const id = knopf.closest('[data-id]').dataset.id;
  state.plan[tag] = (state.plan[tag] || []).filter(e => e.id !== id);
  if (!state.plan[tag].length) delete state.plan[tag];
  speichern();
});

document.getElementById('woche-zurueck').addEventListener('click', () => { wochenVersatz--; planZeichnen(); });
document.getElementById('woche-vor').addEventListener('click', () => { wochenVersatz++; planZeichnen(); });
document.getElementById('woche-heute').addEventListener('click', () => { wochenVersatz = 0; planZeichnen(); });

// Bedarf aller Rezepte der Woche zusammenzählen und erst dann mit dem Vorrat vergleichen,
// damit eine Zutat, die zwei Rezepte brauchen, nicht doppelt als "vorhanden" zählt.
function wochenBedarf() {
  const liste = [];
  for (const t of wochenTage()) {
    for (const e of state.plan[t.iso] || []) {
      const r = state.rezepte.find(x => x.id === e.rezeptId);
      if (!r) continue;
      for (const z of r.zutaten) {
        const k = schluessel(z.name);
        if (z.menge == null) {
          if (!liste.some(b => b.key === k)) liste.push({ key: k, name: z.name, menge: null, einheit: '' });
          continue;
        }
        const m = z.menge * (e.portionen / r.portionen);
        // In die Einheit der ersten Nennung umrechnen und dazuzählen
        let ziel = null;
        let x = null;
        for (const b of liste) {
          if (b.key !== k) continue;
          if (b.menge == null) { ziel = b; b.menge = 0; b.einheit = z.einheit; x = m; break; }
          x = inEinheit(z.name, m, z.einheit, b.einheit);
          if (x != null) { ziel = b; break; }
        }
        if (ziel) ziel.menge += x;
        else liste.push({ key: k, name: z.name, menge: m, einheit: z.einheit });
      }
    }
  }
  return liste;
}

document.getElementById('woche-einkauf').addEventListener('click', () => {
  const alle = wochenBedarf();
  if (!alle.length) { melde('In dieser Woche ist noch nichts eingeplant.'); return; }
  let n = 0;
  for (const z of alle) {
    const p = pruefe(z, 1);
    if (p.status === 'fehlt' || p.status === 'teil') {
      aufEinkaufsliste(z.name, p.menge ?? null, p.einheit || z.einheit);
      n++;
    }
  }
  speichern();
  melde(n ? `${n} Zutat${n === 1 ? '' : 'en'} für die Woche auf die Einkaufsliste gesetzt.` : 'Für diese Woche ist alles da.');
});

einheitenFuellen();
allesZeichnen();
