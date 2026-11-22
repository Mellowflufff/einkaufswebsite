'use strict';

// Umrechnung zwischen Einheiten derselben Zutat:
// Zehe <-> Knolle Knoblauch, EL <-> Gramm, Stück Zwiebel <-> Gramm, Glas Brühe <-> Liter …
//
// Je Zutat: Gramm pro Einheit (Durchschnittswerte) und "dichte" = Gramm pro Milliliter.
// Der Name passt auch auf Zusammensetzungen: "Zwiebel" gilt für "rote Zwiebel".
// Neue Zutaten oder bessere Werte einfach als weitere Zeile ergänzen.
const GEWICHTE_ROH = {
  // Öl, Fett, Flüssiges
  'Olivenöl': { dichte: 0.92 }, 'Sonnenblumenöl': { dichte: 0.92 }, 'Rapsöl': { dichte: 0.92 },
  'Pflanzenöl': { dichte: 0.92 }, 'Sesamöl': { dichte: 0.92 }, 'Öl': { dichte: 0.92 },
  'Butter': { dichte: 0.95, Packung: 250, Stück: 250 },
  'Milch': { dichte: 1.03, Packung: 1000, Flasche: 1000 },
  'Sahne': { dichte: 1, Becher: 200, Packung: 200 },
  'Honig': { dichte: 1.4, Glas: 500 },
  'Sojasauce': { dichte: 1.15, Flasche: 250 },
  'Essig': { dichte: 1, Flasche: 500 }, 'Balsamico': { dichte: 1.1, Flasche: 500 },
  'Zitronensaft': { dichte: 1, Flasche: 200 }, 'Limettensaft': { dichte: 1, Flasche: 200 },
  // 1 Glas Instant-Brühe ergibt etwa 6 Liter, 1 Würfel etwa 0,5 Liter
  'Brühe': { Glas: 6000, Packung: 3000, Stück: 500 },
  'Kokosmilch': { Dose: 400 },
  // Trockenes
  'Mehl': { dichte: 0.55, Packung: 1000 },
  'Zucker': { dichte: 0.85, Packung: 1000 }, 'brauner Zucker': { dichte: 0.8, Packung: 500 },
  'Puderzucker': { dichte: 0.56, Packung: 250 },
  'Salz': { dichte: 1.2, Prise: 0.4, Packung: 500 },
  'Reis': { dichte: 0.85, Packung: 500 },
  'Haferflocken': { dichte: 0.4, Packung: 500 },
  'Nudeln': { Packung: 500 }, 'Spaghetti': { Packung: 500 }, 'Risoni': { Packung: 500 },
  'Speisestärke': { dichte: 0.6, Packung: 400 },
  'Backpulver': { dichte: 0.9, Packung: 15 }, 'Hefe': { Packung: 7 },
  'Kakaopulver': { dichte: 0.45 }, 'Semmelbrösel': { dichte: 0.45 },
  'Sesam': { dichte: 0.6, Packung: 100 },
  // Gewürze (Packung = Streuer/Tütchen)
  'Pfeffer': { dichte: 0.5, Prise: 0.2, Packung: 40 },
  'Kreuzkümmel': { dichte: 0.5, Prise: 0.3, Packung: 40 },
  'Koriander': { dichte: 0.5, Prise: 0.3, Packung: 40, Bund: 30 },
  'Paprikapulver': { dichte: 0.5, Prise: 0.3, Packung: 40 },
  'Kurkuma': { dichte: 0.5, Prise: 0.3, Packung: 40 },
  'Zimt': { dichte: 0.5, Prise: 0.3, Packung: 40 },
  'Muskatnuss': { dichte: 0.5, Prise: 0.2, Packung: 40, Stück: 7 },
  'Currypulver': { dichte: 0.5, Prise: 0.3, Packung: 40 },
  'Chilipulver': { dichte: 0.5, Prise: 0.3, Packung: 40 },
  'Chiliflocken': { dichte: 0.4, Prise: 0.2, Packung: 40 },
  'Lorbeerblatt': { Stück: 0.2, Packung: 5 },
  // Kräuter (getrocknet: dichte und Packung; frisch: Bund)
  'Oregano': { dichte: 0.25, Packung: 15, Bund: 30 }, 'Thymian': { dichte: 0.25, Packung: 15, Bund: 30 },
  'Rosmarin': { dichte: 0.25, Packung: 15, Bund: 30 }, 'Basilikum': { dichte: 0.25, Packung: 15, Bund: 30 },
  'Petersilie': { Bund: 30, Packung: 15 }, 'Minze': { Bund: 30 }, 'Dill': { Bund: 30, Packung: 15 },
  'Schnittlauch': { Bund: 30 },
  // Gemüse & Obst (Stück = eins mittelgroß)
  'Zwiebel': { Stück: 70, Packung: 1000 }, 'Frühlingszwiebel': { Stück: 20, Bund: 120 },
  'Schalotte': { Stück: 30 },
  'Knoblauch': { Zehe: 5, Stück: 50 }, // Stück = eine ganze Knolle mit ca. 10 Zehen
  'Ingwer': { Stück: 50, dichte: 0.6 },
  'Paprika': { Stück: 160 }, 'Tomate': { Stück: 100 }, 'Kirschtomate': { Stück: 15, Packung: 250 },
  'Kartoffel': { Stück: 150 }, 'Süßkartoffel': { Stück: 300 },
  'Karotte': { Stück: 80 }, 'Möhre': { Stück: 80 },
  'Gurke': { Stück: 400 }, 'Zucchini': { Stück: 250 }, 'Aubergine': { Stück: 300 },
  'Champignons': { Stück: 20 }, 'Brokkoli': { Stück: 400 }, 'Blumenkohl': { Stück: 800 },
  'Lauch': { Stück: 250 }, 'Staudensellerie': { Stück: 50 }, 'Kürbis': { Stück: 1200 },
  'Avocado': { Stück: 200 }, 'Chili': { Stück: 10 },
  'Spinat': { Packung: 250 }, 'Babyspinat': { Packung: 125 },
  'Zitrone': { Stück: 100 }, 'Limette': { Stück: 60 }, 'Orange': { Stück: 180 },
  'Apfel': { Stück: 150 }, 'Banane': { Stück: 120 },
  // Kühlregal, Fleisch, Fisch
  'Eier': { Stück: 60, Packung: 360 },
  'Joghurt': { dichte: 1.03, Becher: 150, Glas: 500 }, 'Schmand': { dichte: 1, Becher: 200 },
  'Frischkäse': { Packung: 200 }, 'Mozzarella': { Stück: 125, Packung: 125 }, 'Feta': { Packung: 200 },
  'Käse': { Scheibe: 20, Packung: 200 }, 'Parmesan': { Stück: 100 },
  'Bacon': { Scheibe: 15, Packung: 100 }, 'Schinken': { Scheibe: 20, Packung: 100 },
  'Hähnchenbrust': { Stück: 180 }, 'Hähnchenschenkel': { Stück: 120 }, 'Wurst': { Stück: 100 },
  'Brot': { Scheibe: 40 }, 'Toast': { Scheibe: 25 },
  // Dosen, Gläser, Saucen
  'Dosentomaten': { Dose: 400 }, 'gehackte Tomaten': { Dose: 400 }, 'passierte Tomaten': { Packung: 500 },
  'Tomatenmark': { dichte: 1.1, Dose: 70, Packung: 200 },
  'Kichererbsen': { Dose: 400 }, 'Kidneybohnen': { Dose: 400 }, 'Mais': { Dose: 285 },
  'Thunfisch': { Dose: 185 }, 'Thunfisch im eigenen Saft': { Dose: 185 },
  'Senf': { dichte: 1.1, Glas: 200 }, 'Ketchup': { dichte: 1.1, Flasche: 500 },
  'Mayonnaise': { dichte: 0.95, Glas: 250 }, 'Erdnussbutter': { dichte: 1.1, Glas: 350 },
  'Nori': { Stück: 3, Packung: 30 },
};

const BEHAELTER = ['Packung', 'Dose', 'Glas', 'Flasche', 'Becher'];
let gewichtsListe = null;

function zutatGewichte(name) {
  if (!gewichtsListe) {
    gewichtsListe = Object.entries(GEWICHTE_ROH).map(([n, werte]) => ({ key: schluessel(n), werte }));
  }
  const k = schluessel(String(name).replace(/\(.*?\)/g, ' '));
  let beste = null;
  for (const r of gewichtsListe) {
    const passt = r.key === k || (r.key.length >= 3 && k.endsWith(r.key));
    if (passt && (!beste || r.key.length > beste.key.length)) beste = r;
  }
  return beste ? beste.werte : {};
}

// Gramm, die 1 <einheit> dieser Zutat entspricht – oder null, wenn unbekannt
function grammJe(name, einheit) {
  const info = einheitInfo(einheit);
  const w = zutatGewichte(name);
  if (info.basis === 'g') return info.f;
  if (info.basis === 'ml') return info.f * (w.dichte || 1);
  if (w[info.basis] != null) return w[info.basis];
  if (info.basis === 'Prise') return 0.4;
  // Behälter ohne eigenen Eintrag: Größe aus der Packungstabelle (packungen.js)
  if (BEHAELTER.includes(info.basis) && typeof packRegel === 'function') {
    const regel = packRegel(name);
    if (regel && regel.einheit === 'g') return regel.groessen[0];
    if (regel && regel.einheit === 'ml') return regel.groessen[0] * (w.dichte || 1);
  }
  return null;
}

// Rechnet eine Menge von einer Einheit in eine andere um. null = nicht umrechenbar.
// Beispiel: inEinheit('Knoblauch', 3, 'Zehe', 'Stück') -> 0,3
function inEinheit(name, menge, von, zu) {
  if (menge == null) return null;
  if ((von || '') === (zu || '')) return menge;
  const a = einheitInfo(von);
  const b = einheitInfo(zu);
  if (a.basis === b.basis) return menge * a.f / b.f;
  const gVon = grammJe(name, von);
  const gZu = grammJe(name, zu);
  if (!gVon || !gZu) return null;
  return menge * gVon / gZu;
}
