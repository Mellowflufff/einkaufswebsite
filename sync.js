'use strict';

// Online-Speichern mit Supabase: Anmeldung per E-Mail und Passwort,
// danach liegen alle Daten in einer Zeile der Tabelle "haushalt".
// Ohne ausgefüllte config.js arbeitet die Seite wie bisher nur lokal.
(function () {
  const cfg = window.SUPABASE_CONFIG || {};
  const konto = document.getElementById('konto');
  const eingerichtet = /^https:\/\//.test(cfg.url || '') && cfg.key && !/DEIN/.test(cfg.key);
  if (!eingerichtet || !window.supabase) return;
  konto.hidden = false;

  // Nur die Basisadresse verwenden, falls jemand z. B. ".../rest/v1/" mitkopiert hat
  const db = window.supabase.createClient(new URL(cfg.url).origin, cfg.key);
  const OFFEN = 'vorrat-einkauf-ungesichert'; // gesetzt, solange lokale Änderungen noch nicht online sind
  const statusEl = document.getElementById('sync-status');
  const knopf = document.getElementById('konto-knopf');
  const dlg = document.getElementById('anmelden');
  const form = document.getElementById('anmelden-form');
  const hinweis = document.getElementById('anmelden-hinweis');

  let nutzer = null;
  let stand = null;          // Zeitstempel der zuletzt bekannten Online-Version
  let timer = null;
  let laedtHoch = false;
  let nochmal = false;
  let frischAngemeldet = false;

  const status = text => { statusEl.textContent = text; };
  const istLeer = d => !d || (!(d.vorrat || []).length && !(d.rezepte || []).length &&
    !(d.einkauf || []).length && !Object.keys(d.plan || {}).length);

  function normal(d) {
    return {
      vorrat: Array.isArray(d.vorrat) ? d.vorrat : [],
      rezepte: Array.isArray(d.rezepte) ? d.rezepte : [],
      einkauf: Array.isArray(d.einkauf) ? d.einkauf : [],
      plan: d.plan && typeof d.plan === 'object' ? d.plan : {},
    };
  }

  async function hochladen() {
    if (!nutzer) return;
    if (laedtHoch) { nochmal = true; return; }
    laedtHoch = true;
    clearTimeout(timer);
    status('Speichert …');
    const { data, error } = await db.from('haushalt')
      .upsert({ user_id: nutzer.id, daten: state, geaendert: new Date().toISOString() })
      .select('geaendert').single();
    laedtHoch = false;
    if (error) {
      status('Nicht online gespeichert – wird später erneut versucht');
    } else {
      stand = data.geaendert;
      if (!nochmal) localStorage.removeItem(OFFEN);
      status('Online gespeichert ✓');
    }
    if (nochmal) { nochmal = false; hochladen(); }
  }

  function uebernehmen(zeile) {
    state = normal(zeile.daten);
    localStorage.setItem(SPEICHER, JSON.stringify(state));
    localStorage.removeItem(OFFEN);
    stand = zeile.geaendert;
    allesZeichnen();
    status('Online gespeichert ✓');
  }

  async function holen() {
    if (!nutzer || laedtHoch) return;
    const frisch = frischAngemeldet;
    frischAngemeldet = false;
    const { data, error } = await db.from('haushalt')
      .select('daten, geaendert').eq('user_id', nutzer.id).maybeSingle();
    if (error) { status('Keine Verbindung – Daten nur auf diesem Gerät'); return; }
    if (!data || (istLeer(data.daten) && !istLeer(state))) { await hochladen(); return; }
    if (frisch && !istLeer(state) && JSON.stringify(normal(data.daten)) !== JSON.stringify(normal(state))) {
      // Gerät hatte schon eigene Daten: nicht stillschweigend überschreiben
      const online = await frage('Auf diesem Gerät sind andere Daten gespeichert als in deinem Konto. ' +
        'Die Daten aus dem Konto verwenden? Bei „Abbrechen“ werden stattdessen die Daten dieses Geräts ins Konto hochgeladen.');
      if (online) uebernehmen(data); else await hochladen();
      return;
    }
    if (localStorage.getItem(OFFEN)) { await hochladen(); return; } // lokale Änderungen warten noch
    if (data.geaendert !== stand) uebernehmen(data); else status('Online gespeichert ✓');
  }

  // Wird von speichern() in app.js nach jeder Änderung aufgerufen
  window.syncGeaendert = () => {
    if (!nutzer) return;
    localStorage.setItem(OFFEN, '1');
    status('Speichert …');
    clearTimeout(timer);
    timer = setTimeout(hochladen, 800);
  };

  function kontoZeigen() {
    if (nutzer) {
      knopf.textContent = 'Abmelden';
      knopf.title = nutzer.email || '';
    } else {
      knopf.textContent = 'Anmelden';
      knopf.title = '';
      status('Nicht angemeldet – Daten nur auf diesem Gerät');
    }
  }

  db.auth.onAuthStateChange((ereignis, sitzung) => {
    const neu = sitzung ? sitzung.user : null;
    const gewechselt = (neu && neu.id) !== (nutzer && nutzer.id);
    nutzer = neu;
    kontoZeigen();
    if (!nutzer) { stand = null; return; }
    // Nicht direkt im Callback auf Supabase warten (kann sich sonst selbst blockieren)
    if (gewechselt) setTimeout(holen, 0);
  });

  // Änderungen von anderen Geräten abholen
  document.addEventListener('visibilitychange', () => { if (!document.hidden) holen(); });
  window.addEventListener('online', holen);
  setInterval(() => { if (!document.hidden) holen(); }, 60000);

  /* ----- Anmelden / Abmelden ----- */

  knopf.addEventListener('click', async () => {
    if (!nutzer) {
      hinweis.textContent = '';
      dlg.showModal();
      return;
    }
    if (localStorage.getItem(OFFEN)) await hochladen();
    if (!await frage('Abmelden? Die Daten bleiben in deinem Konto und zusätzlich auf diesem Gerät gespeichert.')) return;
    await db.auth.signOut();
  });

  function fehlerText(error) {
    const m = (error && error.message) || '';
    if (/invalid login/i.test(m)) return 'E-Mail oder Passwort stimmt nicht.';
    if (/not confirmed/i.test(m)) return 'Bitte bestätige zuerst den Link in der E-Mail von Supabase.';
    if (/already registered/i.test(m)) return 'Für diese E-Mail gibt es schon ein Konto. Klicke auf „Anmelden“.';
    if (/password/i.test(m)) return 'Das Passwort braucht mindestens 6 Zeichen.';
    if (/fetch|network/i.test(m)) return 'Keine Verbindung zum Server.';
    return 'Das hat nicht geklappt: ' + m;
  }

  async function anmelden(neuesKonto) {
    if (!form.reportValidity()) return;
    const zugang = { email: form.email.value.trim(), password: form.passwort.value };
    hinweis.textContent = 'Einen Moment …';
    frischAngemeldet = true;
    const { data, error } = neuesKonto
      ? await db.auth.signUp(zugang)
      : await db.auth.signInWithPassword(zugang);
    if (error) { frischAngemeldet = false; hinweis.textContent = fehlerText(error); return; }
    if (!data.session) {
      frischAngemeldet = false;
      hinweis.textContent = 'Konto angelegt. Bestätige den Link in der E-Mail und melde dich dann hier an.';
      return;
    }
    form.passwort.value = '';
    dlg.close();
    melde('Angemeldet. Deine Daten werden jetzt online gespeichert.');
  }

  form.addEventListener('submit', ev => { ev.preventDefault(); anmelden(false); });
  document.getElementById('anmelden-neu').addEventListener('click', () => anmelden(true));
  document.getElementById('anmelden-zu').addEventListener('click', () => dlg.close());

  kontoZeigen();
})();
