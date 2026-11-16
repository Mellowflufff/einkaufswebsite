'use strict';

// Englische Zutaten -> Deutsch. Schlüssel klein und in der Einzahl schreiben.
// Neue Wörter einfach als weitere Zeile ergänzen.
const WOERTERBUCH = {
  // Fleisch & Fisch
  'beef mince': 'Rinderhackfleisch', 'minced beef': 'Rinderhackfleisch', 'ground beef': 'Rinderhackfleisch',
  'pork mince': 'Schweinehackfleisch', 'lamb mince': 'Lammhackfleisch', 'mince': 'Hackfleisch',
  'beef': 'Rindfleisch', 'pork': 'Schweinefleisch', 'lamb': 'Lammfleisch', 'steak': 'Steak',
  'chicken': 'Hähnchen', 'chicken breast': 'Hähnchenbrust', 'chicken thigh': 'Hähnchenschenkel',
  'turkey': 'Pute', 'bacon': 'Bacon', 'ham': 'Schinken', 'sausage': 'Wurst',
  'salmon': 'Lachs', 'tuna': 'Thunfisch', 'prawn': 'Garnelen', 'shrimp': 'Garnelen', 'fish': 'Fisch',
  // Gemüse
  'onion': 'Zwiebel', 'brown onion': 'Zwiebel', 'yellow onion': 'Zwiebel', 'white onion': 'Zwiebel',
  'red onion': 'rote Zwiebel', 'spring onion': 'Frühlingszwiebel', 'shallot': 'Schalotte', 'leek': 'Lauch',
  'garlic': 'Knoblauch', 'ginger': 'Ingwer',
  'capsicum': 'Paprika', 'bell pepper': 'Paprika',
  'green capsicum': 'grüne Paprika', 'yellow capsicum': 'gelbe Paprika', 'red capsicum': 'rote Paprika',
  'green bell pepper': 'grüne Paprika', 'yellow bell pepper': 'gelbe Paprika', 'red bell pepper': 'rote Paprika',
  'green pepper': 'grüne Paprika', 'yellow pepper': 'gelbe Paprika', 'red pepper': 'rote Paprika',
  'tomato': 'Tomate', 'cherry tomato': 'Kirschtomate', 'tomato paste': 'Tomatenmark',
  'chopped tomato': 'gehackte Tomaten', 'tinned tomato': 'Dosentomaten', 'canned tomato': 'Dosentomaten',
  'passata': 'passierte Tomaten',
  'potato': 'Kartoffel', 'sweet potato': 'Süßkartoffel', 'carrot': 'Karotte', 'celery': 'Staudensellerie',
  'cucumber': 'Gurke', 'zucchini': 'Zucchini', 'courgette': 'Zucchini', 'eggplant': 'Aubergine', 'aubergine': 'Aubergine',
  'mushroom': 'Champignons', 'spinach': 'Spinat', 'lettuce': 'Salat', 'cabbage': 'Kohl', 'broccoli': 'Brokkoli',
  'cauliflower': 'Blumenkohl', 'pumpkin': 'Kürbis', 'corn': 'Mais', 'sweetcorn': 'Mais', 'pea': 'Erbsen',
  'green bean': 'grüne Bohnen', 'bean': 'Bohnen', 'kidney bean': 'Kidneybohnen', 'chickpea': 'Kichererbsen',
  'lentil': 'Linsen', 'chilli': 'Chili', 'chili': 'Chili', 'avocado': 'Avocado', 'beetroot': 'Rote Bete',
  // Obst
  'lemon': 'Zitrone', 'lime': 'Limette', 'orange': 'Orange', 'apple': 'Apfel', 'banana': 'Banane',
  'strawberry': 'Erdbeeren', 'blueberry': 'Heidelbeeren', 'raspberry': 'Himbeeren',
  'lemon juice': 'Zitronensaft', 'lime juice': 'Limettensaft',
  // Kräuter & Gewürze
  'salt': 'Salz', 'pepper': 'Pfeffer', 'black pepper': 'schwarzer Pfeffer',
  'cumin': 'Kreuzkümmel', 'ground cumin': 'Kreuzkümmel (gemahlen)',
  'coriander': 'Koriander', 'ground coriander': 'Koriander (gemahlen)', 'cilantro': 'Koriander',
  'paprika powder': 'Paprikapulver', 'sweet paprika': 'Paprikapulver', 'smoked paprika': 'geräuchertes Paprikapulver', 'turmeric': 'Kurkuma',
  'cinnamon': 'Zimt', 'nutmeg': 'Muskatnuss', 'oregano': 'Oregano', 'thyme': 'Thymian', 'rosemary': 'Rosmarin',
  'basil': 'Basilikum', 'parsley': 'Petersilie', 'mint': 'Minze', 'dill': 'Dill', 'chive': 'Schnittlauch',
  'bay leaf': 'Lorbeerblatt', 'bay leave': 'Lorbeerblatt', 'curry powder': 'Currypulver',
  'chilli powder': 'Chilipulver', 'chili powder': 'Chilipulver', 'chilli flake': 'Chiliflocken',
  'vanilla': 'Vanille', 'vanilla extract': 'Vanilleextrakt',
  // Milchprodukte & Eier
  'milk': 'Milch', 'butter': 'Butter', 'cream': 'Sahne', 'sour cream': 'Schmand', 'yoghurt': 'Joghurt',
  'yogurt': 'Joghurt', 'greek yoghurt': 'griechischer Joghurt', 'greek yogurt': 'griechischer Joghurt',
  'cheese': 'Käse', 'parmesan': 'Parmesan', 'mozzarella': 'Mozzarella', 'feta': 'Feta',
  'cream cheese': 'Frischkäse', 'egg': 'Eier',
  // Vorrat
  'rice': 'Reis', 'basmati rice': 'Basmatireis', 'jasmine rice': 'Jasminreis', 'pasta': 'Nudeln',
  'spaghetti': 'Spaghetti', 'noodle': 'Nudeln', 'flour': 'Mehl', 'plain flour': 'Mehl',
  'sugar': 'Zucker', 'brown sugar': 'brauner Zucker', 'icing sugar': 'Puderzucker', 'honey': 'Honig',
  'baking powder': 'Backpulver', 'yeast': 'Hefe', 'cornflour': 'Speisestärke', 'cornstarch': 'Speisestärke',
  'bread': 'Brot', 'breadcrumb': 'Semmelbrösel', 'oat': 'Haferflocken', 'couscous': 'Couscous',
  'oil': 'Öl', 'olive oil': 'Olivenöl', 'vegetable oil': 'Pflanzenöl', 'sunflower oil': 'Sonnenblumenöl',
  'sesame oil': 'Sesamöl', 'vinegar': 'Essig', 'balsamic vinegar': 'Balsamico',
  'white wine vinegar': 'Weißweinessig', 'soy sauce': 'Sojasauce', 'mustard': 'Senf', 'ketchup': 'Ketchup',
  'mayonnaise': 'Mayonnaise', 'worcestershire sauce': 'Worcestersauce',
  'stock': 'Brühe', 'beef stock': 'Rinderbrühe', 'chicken stock': 'Hühnerbrühe', 'vegetable stock': 'Gemüsebrühe',
  'broth': 'Brühe', 'beef broth': 'Rinderbrühe', 'chicken broth': 'Hühnerbrühe', 'vegetable broth': 'Gemüsebrühe',
  'coconut milk': 'Kokosmilch', 'water': 'Wasser', 'white wine': 'Weißwein', 'red wine': 'Rotwein',
  'almond': 'Mandeln', 'walnut': 'Walnüsse', 'peanut': 'Erdnüsse', 'peanut butter': 'Erdnussbutter',
  'pine nut': 'Pinienkerne', 'sesame seed': 'Sesam', 'raisin': 'Rosinen', 'chocolate': 'Schokolade',
  'cocoa': 'Kakao', 'cocoa powder': 'Kakaopulver', 'olive': 'Oliven',
};

// Beschreibungen, die für den Einkauf egal sind
const FUELLWOERTER = new Set(['fresh', 'large', 'small', 'medium', 'ripe', 'dried', 'chopped', 'diced',
  'sliced', 'grated', 'crushed', 'finely', 'roughly', 'whole', 'organic', 'extra', 'virgin', 'boneless',
  'skinless', 'ground', 'frozen', 'cooked', 'raw', 'peeled', 'of', 'a', 'the']);

function nachschlagen(s) {
  const formen = [s, s.replace(/ies$/, 'y'), s.replace(/oes$/, 'o'), s.replace(/es$/, ''), s.replace(/s$/, '')];
  for (const f of formen) {
    if (Object.prototype.hasOwnProperty.call(WOERTERBUCH, f)) return WOERTERBUCH[f];
  }
  return null;
}

function einfachUebersetzen(text) {
  const woerter = text.toLowerCase().trim().split(/\s+/);
  while (woerter.length) {
    const treffer = nachschlagen(woerter.join(' '));
    if (treffer) return treffer;
    if (!FUELLWOERTER.has(woerter[0])) return null;
    woerter.shift();
  }
  return null;
}

// Gibt den deutschen Namen zurück – oder den Originalnamen, wenn nichts passt.
function uebersetzen(name) {
  const direkt = einfachUebersetzen(name);
  if (direkt) return direkt;
  // "beef or chicken stock" / "salt and pepper"
  const m = name.match(/^(.+?)\s+(or|and)\s+(.+)$/i);
  if (m) {
    const rechts = einfachUebersetzen(m[3]);
    // linke Seite darf sich das letzte Wort von rechts leihen: "beef" + "stock"
    const letztes = m[3].trim().split(/\s+/).pop();
    const links = einfachUebersetzen(m[1] + ' ' + letztes) || einfachUebersetzen(m[1]);
    if (links && rechts) return `${links} ${m[2].toLowerCase() === 'or' ? 'oder' : 'und'} ${rechts}`;
  }
  return name;
}
