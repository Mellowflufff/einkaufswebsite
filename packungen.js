'use strict';

// Handelsübliche Packungsgrößen: Name -> [Einheit, Größe, weitere Größen …]
// Einheit ist g, ml oder eine Zähleinheit (Stück, Packung, Glas …).
// Der Name passt auch auf Zusammensetzungen: "Hackfleisch" gilt für "Rinderhackfleisch".
// Neue Zeilen einfach ergänzen oder Größen anpassen.
const PACKUNGEN_ROH = {
  // Backen & Trockenes
  'Mehl': ['g', 1000], 'Zucker': ['g', 1000], 'brauner Zucker': ['g', 500], 'Puderzucker': ['g', 250],
  'Salz': ['g', 500], 'Reis': ['g', 500, 1000], 'Basmatireis': ['g', 500, 1000], 'Jasminreis': ['g', 500, 1000],
  'Nudeln': ['g', 500], 'Spaghetti': ['g', 500], 'Haferflocken': ['g', 500], 'Couscous': ['g', 500],
  'Linsen': ['g', 500], 'Speisestärke': ['g', 400], 'Semmelbrösel': ['g', 400], 'Honig': ['g', 250, 500],
  'Mandeln': ['g', 200], 'Walnüsse': ['g', 200], 'Erdnüsse': ['g', 200], 'Pinienkerne': ['g', 50],
  'Rosinen': ['g', 250], 'Schokolade': ['g', 100], 'Kakaopulver': ['g', 250], 'Kakao': ['g', 250],
  'Backpulver': ['Packung', 1], 'Hefe': ['Packung', 1],
  // Kühlregal
  'Milch': ['ml', 1000], 'Sahne': ['ml', 200], 'Schmand': ['g', 200], 'Joghurt': ['g', 150, 500],
  'Butter': ['g', 250], 'Eier': ['Stück', 6, 10], 'Käse': ['g', 200, 400], 'Frischkäse': ['g', 200],
  'Parmesan': ['g', 100], 'Mozzarella': ['g', 125], 'Feta': ['g', 200],
  'Hackfleisch': ['g', 500], 'Hähnchenbrust': ['g', 500], 'Bacon': ['g', 100], 'Schinken': ['g', 100],
  'Lachs': ['g', 250],
  // Öl, Essig, Saucen
  'Öl': ['ml', 1000], 'Olivenöl': ['ml', 500, 750], 'Pflanzenöl': ['ml', 1000], 'Sonnenblumenöl': ['ml', 1000],
  'Rapsöl': ['ml', 1000], 'Sesamöl': ['ml', 250], 'Essig': ['ml', 500], 'Balsamico': ['ml', 500],
  'Weißweinessig': ['ml', 500], 'Sojasauce': ['ml', 150, 250], 'Zitronensaft': ['ml', 200],
  'Limettensaft': ['ml', 200], 'Senf': ['Glas', 1], 'Ketchup': ['Flasche', 1], 'Mayonnaise': ['Glas', 1],
  'Brühe': ['Glas', 1], 'Tomatenmark': ['g', 200], 'passierte Tomaten': ['g', 500],
  'Dosentomaten': ['g', 400], 'gehackte Tomaten': ['g', 400], 'Kokosmilch': ['ml', 400],
  'Kichererbsen': ['g', 400], 'Kidneybohnen': ['g', 400], 'Erdnussbutter': ['g', 350],
  // Gemüse
  'Kartoffeln': ['g', 1000, 2000], 'Knoblauch': ['Stück', 1], 'Ingwer': ['Stück', 1],
  'Champignons': ['g', 250, 400], 'Spinat': ['g', 250], 'Kirschtomaten': ['g', 250],
  // Gewürze – immer eine Packung
  'Pfeffer': ['Packung', 1], 'Kreuzkümmel': ['Packung', 1], 'Koriander': ['Packung', 1],
  'Paprikapulver': ['Packung', 1], 'Kurkuma': ['Packung', 1], 'Zimt': ['Packung', 1],
  'Muskatnuss': ['Packung', 1], 'Oregano': ['Packung', 1], 'Thymian': ['Packung', 1],
  'Rosmarin': ['Packung', 1], 'Basilikum': ['Packung', 1], 'Currypulver': ['Packung', 1],
  'Chilipulver': ['Packung', 1], 'Chiliflocken': ['Packung', 1], 'Lorbeerblatt': ['Packung', 1],
  'Vanilleextrakt': ['Packung', 1], 'Vanille': ['Packung', 1], 'Sesam': ['Packung', 1],
};

// Größen für Zutaten ohne eigenen Eintrag
const STANDARD_G = [100, 125, 150, 200, 250, 400, 500, 750, 1000];
const STANDARD_ML = [100, 200, 250, 500, 750, 1000];

let packungsListe = null;

function packRegel(name) {
  if (!packungsListe) {
    packungsListe = Object.entries(PACKUNGEN_ROH)
      .map(([n, [einheit, ...groessen]]) => ({ key: schluessel(n), einheit, groessen }));
  }
  const k = schluessel(String(name).replace(/\(.*?\)/g, ' '));
  let beste = null;
  for (const r of packungsListe) {
    const passt = r.key === k || (r.key.length >= 4 && k.endsWith(r.key));
    if (passt && (!beste || r.key.length > beste.key.length)) beste = r;
  }
  return beste;
}

// Kleinste Gesamtmenge aus ganzen Packungen, die den Bedarf deckt
function aufPackungen(bedarf, groessen) {
  let beste = null;
  for (const g of groessen) {
    const gesamt = Math.max(1, Math.ceil(bedarf / g - 1e-9)) * g;
    if (beste === null || gesamt <= beste) beste = gesamt;
  }
  return beste;
}

function ohneRegel(bedarf, basis) {
  if (bedarf == null) return { menge: null, einheit: basis };
  if (basis === 'Prise') return { menge: 1, einheit: 'Packung' };
  if (basis === 'g' || basis === 'ml') {
    // Löffelmengen: man kauft einfach eine Packung
    if (bedarf < (basis === 'g' ? 20 : 50)) return { menge: 1, einheit: 'Packung' };
    const liste = basis === 'g' ? STANDARD_G : STANDARD_ML;
    const passend = liste.find(g => g >= bedarf - 1e-9);
    return schoen(passend || Math.ceil(bedarf / 500) * 500, basis);
  }
  return { menge: Math.ceil(bedarf - 1e-9), einheit: basis };
}

// Was man für einen Artikel der Einkaufsliste tatsächlich kauft
function kaufmenge(artikel) {
  if (artikel.auto === false) return { menge: artikel.menge, einheit: artikel.einheit };
  const info = einheitInfo(artikel.einheit);
  const bedarf = artikel.menge == null ? null : artikel.menge * info.f;
  const regel = packRegel(artikel.name);
  if (!regel) return ohneRegel(bedarf, info.basis);
  if (bedarf != null && regel.einheit === info.basis) {
    return schoen(aufPackungen(bedarf, regel.groessen), regel.einheit);
  }
  // Gewürz-Packung, aber Bedarf z. B. in Bund: das ist die frische Ware
  const gemessen = ['g', 'ml', 'Prise'].includes(info.basis);
  if (bedarf != null && regel.einheit === 'Packung' && !gemessen) return ohneRegel(bedarf, info.basis);
  // Andere Einheit als die Packung (EL Öl, Zehe Knoblauch, ml Brühe): eine kleinste Packung
  return schoen(regel.groessen[0], regel.einheit);
}
