// Stellt data/catalog.json auf die Werte und Bezeichnungen der Kalkulation / Leistungsbeschreibung
// 09/2026 um (Kalkulationsvorlage 09/2026, Blatt "Kalkulation"). Einmalig am 23.11.2026
// gelaufen; bleibt als Nachweis liegen, welche Position welchem Katalogeintrag zugrunde liegt.
// Aufruf:  node scripts/katalog-auf-kalkulation.js
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../data/catalog.json');
const cat = JSON.parse(fs.readFileSync(file, 'utf8'));
const get = (group, id) => {
  const item = cat[group].find(e => e.id === id);
  if (!item) throw new Error(`Eintrag fehlt: ${group}/${id}`);
  return item;
};
const patch = (group, id, values) => Object.assign(get(group, id), values);

// ---------- Außenwände (Pos. 11.160 / 11.165 / 11.240 / 11.245) ----------
function wand({ id, pos, plus, gf }) {
  const holz = plus ? 'verleimtem Schichtholz' : 'Konstruktionsvollholz (KVH)';
  const rahmen = plus ? 'Verleimtes Schichtholz mit Wärmedämmung' : 'Massivholz-Rahmenkonstruktion aus KVH mit Wärmedämmung';
  const gefach = plus ? 240 : 160;
  const staerke = plus ? '35,0 cm' : '27,0 cm';
  const uWert = plus ? '0,138 bis 0,15 W/(m²K)' : '0,17 W/(m²K)';
  const platte = gf
    ? { name: 'Gipsfaserplatte', value: '12,5 mm' }
    : { name: 'Holzwerkstoffplatte (ESB)', value: '12,0 mm' };
  const optPos = plus ? 'Pos. 11.249' : 'Pos. 11.169';
  const optText = plus
    ? '240 mm Holzfaserdämmung WLG 038 anstelle Wärmedämmung WLG 035'
    : '160 mm Holzfaserdämmung WLG 039 anstelle Wärmedämmung WLG 035';
  patch('walls', id, {
    emotionalHook: plus
      ? 'Die stärker gedämmte Lehner-Außenwand für das Effizienzhaus 40 – 24 cm Dämmung im Gefach und 8 cm Holzfaser außen.'
      : 'Diffusionsoffen, doppelt beplankt und außen mit Holzfaser gedämmt – für ein angenehmes Wohnklima, auch im Sommer.',
    description: `LEHNER-Außenwand CLIMA-tiv${plus ? ' PLUS' : ''}${gf ? ' mit Gipsfaserplatte' : ''} in Holzrahmenbauweise aus ${holz}, diffusionsoffen. Wandstärke ${staerke} einschließlich Holzfaser-Vollwärmedämmsystem und fugenlosem Außenputz. U-Wert ${uWert} im Mittel über Feld- und Balkenanteil.`,
    fireRating: 'F30B/F90B',
    premiumFeatures: [
      gf ? 'Gipsfaserplatte als erste Beplankungsebene – besonders robust' : 'Doppelte Beplankung innen – stabil, schalldämmend, rissarm',
      'Holzfaser-Dämmplatte außen – angenehmes Wohnraumklima auch im Sommer',
      'Diffusionsoffener Wandaufbau in Holzrahmenbauweise',
      'Brandschutzklasse F30B/F90B einschließlich Außenputz'
    ],
    layers: [
      { name: 'Fugenloser Außenputz', value: '' },
      { name: 'Holzfaser-Wärme-Dämmplatten', value: '80,0 mm' },
      { name: rahmen, value: `${gefach},0 mm` },
      platte,
      { name: 'Dampfbremse', value: '' },
      { name: 'Gipsbauplatte', value: '12,5 mm' }
    ],
    totalThickness: { label: 'Wandstärke einschließlich Außenputz', value: staerke },
    technicalDetails: {
      uValue: uWert,
      wallThickness: `${staerke} einschließlich Außenputz`,
      insulation: `${gefach} mm Wärmedämmung WLG 035 im Gefach + 80 mm Holzfaser-Dämmplatte`,
      fireRating: 'F30B/F90B',
      rawHeight: '2,60 m',
      position: pos
    },
    options: [{ position: optPos, description: optText }],
    advantages: [
      `U-Wert ${uWert} im Mittel über Feld- und Balkenanteil`,
      'Hoher Holzanteil – sehr gute Befestigungsmöglichkeiten, auch für schwere Einrichtungsgegenstände',
      gf ? 'Doppelte Beplankung aus Gipsfaser- und Gipsbauplatte' : 'Holzwerkstoffplatte ESB als erste Beplankungsebene',
      'Montage im Mörtelbett für gleichmäßige Lastabtragung',
      `Auf Wunsch mit Holzfaserdämmung im Gefach (${optPos})`
    ],
    comparisonNotes: [
      'Fragen Sie gezielt nach diesen Punkten:',
      '1. Wie ist die Wand von außen nach innen aufgebaut, mit Maß je Schicht? (Lehner Haus: siehe Technische Daten – so steht es auch in der Leistungsbeschreibung)',
      `2. Welcher U-Wert steht in der Leistungsbeschreibung? (Lehner Haus: ${uWert} im Mittel über Feld- und Balkenanteil)`,
      `3. Ist die Wand innen einfach oder doppelt beplankt? (Lehner Haus: doppelt – ${gf ? 'Gipsfaserplatte' : 'Holzwerkstoffplatte'} plus Gipsbauplatte)`,
      '4. Ist der Wandaufbau diffusionsoffen? (Lehner Haus: ja)',
      `5. Wie dick ist die fertige Wand einschließlich Putz? (Lehner Haus: ${staerke})`
    ].join('\n\n')
  });
}
wand({ id: 'climativ', pos: 'Pos. 11.160' });
wand({ id: 'climativ-gf', pos: 'Pos. 11.165', gf: true });
wand({ id: 'climativ-plus', pos: 'Pos. 11.240', plus: true });
wand({ id: 'climativ-plus-gf', pos: 'Pos. 11.245', plus: true, gf: true });
get('walls', 'climativ').name = 'CLIMA-tiv';
get('walls', 'climativ-plus').name = 'CLIMA-tiv PLUS';
get('walls', 'climativ-plus-gf').name = 'CLIMA-tiv PLUS (GF)';

// ---------- Innenwände (Pos. 15.020 / 15.030) ----------
function innenwand(id, gf) {
  const platte = gf
    ? { name: 'Gipsfaserplatte', value: '12,5 mm' }
    : { name: 'Holzwerkstoffplatte (ESB)', value: '12,0 mm' };
  patch('innerwalls', id, {
    description: `LEHNER-Innenwand IW 80${gf ? ' mit Gipsfaserplatte' : ''} in Holzrahmenbauweise, auf beiden Seiten doppelt beplankt. Wandstärke rund 13 cm.`,
    layers: [
      { name: 'Gipsbauplatte', value: '12,5 mm' },
      platte,
      { name: 'Massivholz-Rahmenkonstruktion', value: '80,0 mm' },
      { name: 'Wärme-/Schalldämmung im Gefach', value: '40,0 mm' },
      platte,
      { name: 'Gipsbauplatte', value: '12,5 mm' }
    ]
  });
  const tech = get('innerwalls', id).technicalDetails;
  tech.wallThickness = gf ? '130 mm' : '129 mm';
  tech.rawHeight = '2,60 m';
  get('innerwalls', id).options[0].description = '40 mm Holzfaserdämmung WLG 039 anstelle Mineralfaserdämmung WLG 040';
}
innenwand('iw80', false);
innenwand('iw80-gf', true);
patch('innerwalls', 'iw80', {
  emotionalHook: 'Auf beiden Seiten doppelt beplankt – stabil genug für Hängeschränke und angenehm für das Raumklima.',
  premiumFeatures: [
    'Doppelte Beplankung auf beiden Seiten',
    'Gipsbauplatte in der zweiten Ebene – feuchteregulierend',
    'Sehr gute Befestigungsmöglichkeiten, zum Beispiel für Hängeschränke in der Küche'
  ],
  advantages: [
    'Massivholz-Rahmenkonstruktion 80 mm',
    '40 mm Wärme- und Schalldämmung im Gefach',
    'Holzwerkstoffplatte ESB als erste Beplankungsebene',
    'Auf Wunsch mit Holzfaserdämmung (Pos. 15.190)'
  ],
  comparisonNotes: [
    'Fragen Sie gezielt nach diesen Punkten:',
    '1. Sind die Innenwände einfach oder doppelt beplankt? (Lehner Haus: doppelt, auf beiden Seiten)',
    '2. Welche Platten werden verwendet, mit welcher Stärke? (Lehner Haus: Holzwerkstoffplatte 12,0 mm plus Gipsbauplatte 12,5 mm)',
    '3. Sind die Innenwände gedämmt? (Lehner Haus: 40 mm Wärme- und Schalldämmung im Gefach)'
  ].join('\n\n')
});

// ---------- Decken (Pos. 20.120 mit 23.125 / 20.520) ----------
patch('decken', 'holzbalkendecke', {
  emotionalHook: 'Massives Holzgebälk, gedämmt und vor Ort verkleidet – die bewährte Lehner-Decke.',
  description: 'LEHNER-Decke über dem Erdgeschoss: massives Holzgebälk nach statischer Berechnung mit 160 mm Wärmedämmung, unterseitig vor Ort mit Dampfsperrbahn und Gipsbauplatten verkleidet.',
  premiumFeatures: [
    '160 mm Wärmedämmung im Gefach',
    'Verkleidung vor Ort – Schallbrücken werden vermieden'
  ],
  layers: [
    { name: 'Holzwerkstoffplatte', value: '22,0 mm' },
    { name: 'Deckenbalken nach statischer Berechnung', value: '240,0 mm' },
    { name: 'Wärmedämmung im Gefach', value: '160,0 mm' },
    { name: 'Unterkonstruktion', value: '21,0 mm' },
    { name: 'Dampfsperrbahn', value: '' },
    { name: 'Gipsbauplatte', value: '12,5 mm' }
  ],
  advantages: [
    'Massives Holzgebälk nach statischer Berechnung',
    'Hohe Maßgenauigkeit durch Verkleidung vor Ort',
    'Flexible Installationsführung möglich',
    'Auf Wunsch mit Holzfaserdämmung (Pos. 20.210)'
  ],
  comparisonNotes: [
    'Fragen Sie gezielt nach diesen Punkten:',
    '1. Wie dick ist die Dämmung in der Decke? (Lehner Haus: 160 mm)',
    '2. Wie hoch sind die Deckenbalken? (Lehner Haus: 240 mm nach statischer Berechnung)',
    '3. Wird die Decke im Werk oder vor Ort verkleidet? (Lehner Haus: vor Ort – das vermeidet Schallbrücken)'
  ].join('\n\n')
});
get('decken', 'holzbalkendecke').options[0].description = 'Holzfaserdämmung WLG 039/038 anstelle Wärmedämmung WLG 040';
patch('decken', 'massivholzdecke', {
  description: 'LEHNER-Massivholzdecke aus 140 mm starken, mehrfach verleimten Fichteholzplatten mit Leimholzunterzügen aus Brettschichtholz nach statischer Berechnung. Die Untersicht bleibt sichtbar, naturbelassen und unbehandelt; Schleifen und eine farbliche Anpassung gehören zu den Malerarbeiten.'
});
get('decken', 'massivholzdecke').layers[2].name = 'Massivholzplatte aus mehrfach verleimter Fichte (60 cm breit mit 6 mm Fugen)';

// ---------- Fenster (Gewerk 45, Text 45.000) ----------
// Ug-Wert des Standardglases: 0,6 W/(m²K) laut Geschäftsführung (23.11.2026). Der Text der
// Kalkulationsvorlage 09/2026 nennt noch 0,5 – dort nachziehen, damit beides übereinstimmt.
patch('windows', 'kunststoff', {
  emotionalHook: 'Dreifach verglast, im Werk passgenau eingebaut – Fenster für Wärme, Ruhe und Sicherheit.',
  description: 'Fenster und Terrassentüren aus weißem Mehrkammer-Kunststoffprofil mit Stahlkern und Mehrfachfalz, im Werk passgenau in die Wand eingebaut. 3-fach Wärmeschutzglas mit Ug-Wert 0,6 W/(m²K). Beschlagstechnik in Anlehnung an RC2.',
  securityClass: 'in Anlehnung an RC2',
  premiumFeatures: [
    '3-fach Wärmeschutzglas mit Ug-Wert 0,6 W/(m²K) im Standard',
    'Im Werk passgenau in die Wand eingebaut',
    'Beschlagstechnik in Anlehnung an RC2 im Standard',
    'Außensimse aus eloxiertem Aluminium, Innensimse aus Naturstein'
  ],
  layers: [
    { name: 'Mehrkammer-Kunststoffprofil mit Stahlkern und Mehrfachfalz', value: 'weiß' },
    { name: '3-fach Wärmeschutzglas', value: 'Ug 0,6' },
    { name: 'Einhebelbeschlag, Beschlagstechnik in Anlehnung an RC2', value: '' },
    { name: 'Rollläden mit Aluminiumprofilen', value: '' }
  ],
  totalThickness: false,
  technicalDetails: {
    ugValue: '0,6 W/(m²K)',
    profile: 'Mehrkammer-Kunststoffprofil mit Stahlkern und Mehrfachfalz',
    glazing: '3-fach Wärmeschutzglas; der Ug-Wert kann je nach Glasart (z. B. VSG, ESG, Schallschutz) abweichen',
    securityFeatures: 'Beschlagstechnik in Anlehnung an RC2',
    position: 'Gewerk 45'
  },
  advantages: [
    'Ein- oder beidseitig farbig beschichtet nach Lehner-Haus-Farbkarte, preisgleich',
    'Ornamentverglasungen aus dem Lehner-Haus-Sortiment preisgleich',
    'Rollläden an Fenstern und Terrassentüren, wo konstruktiv möglich',
    'Farbe der Außensimse und Steinart der Innensimse wählen Sie im Bemusterungsgespräch'
  ],
  comparisonNotes: [
    'Fragen Sie gezielt nach diesen Punkten:',
    '1. Welchen Ug-Wert hat das Glas im Standard? (Lehner Haus: 0,6 W/(m²K) bei 3-fach Wärmeschutzglas)',
    '2. Werden die Fenster im Werk oder auf der Baustelle eingebaut? (Lehner Haus: im Werk, passgenau in die Wand)',
    '3. Welche Sicherheitsbeschläge sind im Standard enthalten? (Lehner Haus: Beschlagstechnik in Anlehnung an RC2)',
    '4. Sind Rollläden, Außen- und Innensimse im Preis enthalten? (Lehner Haus: ja, laut Leistungsbeschreibung)'
  ].join('\n\n')
});
patch('windows', 'holz-alu', {
  description: 'Fenster mit Echtholz-Innenseite und witterungsbeständiger Aluminium-Außenschale. 3-fach Wärmeschutzglas mit Ug-Wert 0,6 W/(m²K). Beschlagstechnik in Anlehnung an RC2.',
  securityClass: 'in Anlehnung an RC2',
  totalThickness: false,
  comparisonNotes: [
    'Fragen Sie gezielt nach diesen Punkten:',
    '1. Ist die Innenseite aus Leimholz oder nur furniert?',
    '2. Wie dick ist die Aluminium-Außenschale?',
    '3. Welchen Ug-Wert hat das Glas? (Lehner Haus: 0,6 W/(m²K))',
    '4. Welche Sicherheitsbeschläge sind im Standard enthalten? (Lehner Haus: Beschlagstechnik in Anlehnung an RC2)'
  ].join('\n\n')
});
get('windows', 'holz-alu').technicalDetails.securityFeatures = 'Beschlagstechnik in Anlehnung an RC2';
get('windows', 'holz-alu').technicalDetails.ugValue = '0,6 W/(m²K)';
get('windows', 'holz-alu').layers[2].value = 'Ug 0,6';
get('windows', 'holz-alu').layers[3].name = 'Einhebelbeschlag, Beschlagstechnik in Anlehnung an RC2';

// ---------- Dacheindeckung (Pos. 35.000 / 35.010 / 35.035 / 35.040) ----------
patch('tiles', 'beton', {
  emotionalHook: 'Dachsteine von Nelskamp in Ihrer Wunschfarbe – mit 30 Jahren Herstellergarantie.',
  description: 'Dachsteine von Nelskamp in den Formen Sigma, Finkenberger oder S-Pfanne, Oberfläche Longlife matt oder TOP 2000 S. Mit Sturmklammern nach Windlastzone gesichert. 30 Jahre Herstellergarantie.',
  premiumFeatures: [
    '30 Jahre Herstellergarantie auf die Dachsteine',
    'Mit Sturmklammern nach Windlastzone gesichert',
    'Drei Formen: Sigma, Finkenberger, S-Pfanne',
    'Farben Rot, Braun oder Granit/Schiefergrau'
  ],
  layers: [
    { name: 'Nelskamp Dachsteine (Sigma, Finkenberger oder S-Pfanne)', value: '' },
    { name: 'Oberfläche Longlife matt oder TOP 2000 S', value: '' },
    { name: 'Sturmklammern nach Windlastzone', value: '' },
    { name: 'Lüftungsgitter und Abtropfblech aus Aluminium', value: '' }
  ],
  totalThickness: false,
  advantages: [
    'Form und Oberfläche wählen Sie in unserem Leistungsstudio',
    'Die Dachkonstruktion ist für profilierte Dachsteine bemessen',
    'Die Schneelast wird für Ihren Bauort berechnet',
    'Dachziegel aus Ton sind auf Wunsch möglich'
  ],
  comparisonNotes: [
    'Fragen Sie gezielt nach diesen Punkten:',
    '1. Welches Fabrikat und welche Form sind im Preis enthalten? (Lehner Haus: Nelskamp Sigma, Finkenberger oder S-Pfanne)',
    '2. Wie lange gilt die Herstellergarantie? (Lehner Haus: 30 Jahre)',
    '3. Ist die Sturmsicherung enthalten? (Lehner Haus: Sturmklammern nach Windlastzone)',
    '4. Ist die Schneelast für den Bauort berücksichtigt? (Lehner Haus: ja, ohne Mehrkosten)'
  ].join('\n\n')
});
patch('tiles', 'ton', {
  emotionalHook: 'Dachziegel aus gebranntem Ton – naturrot oder engobiert, für das klassische Ziegeldach.',
  description: 'Dachziegel aus gebranntem Ton: Flachdachziegel F12 Ü-Süd in Naturrot oder engobiert, alternativ Tonglattziegel G10 engobiert. Farben laut Prospekt.',
  premiumFeatures: [
    'Gebrannter Ton – naturrot oder engobiert',
    'Flachdachziegel F12 Ü-Süd oder Tonglattziegel G10',
    'Mit Sturmklammern nach Windlastzone gesichert'
  ],
  layers: [
    { name: 'Dachziegel F12 Ü-Süd (naturrot oder engobiert)', value: '' },
    { name: 'alternativ Tonglattziegel G10 engobiert', value: '' },
    { name: 'Sturmklammern nach Windlastzone', value: '' }
  ],
  totalThickness: false,
  technicalDetails: { material: 'Gebrannter Ton, naturrot oder engobiert', position: 'Pos. 35.035 / 35.040' },
  advantages: [
    'Natürlicher Baustoff aus gebranntem Ton',
    'Edelengobierte und glasierte Oberflächen auf Wunsch',
    'Farben laut Prospekt, Auswahl im Leistungsstudio'
  ],
  comparisonNotes: 'Dachziegel aus Ton sind die Mehrpreis-Variante zu den Dachsteinen im Standard.\n\nFragen Sie gezielt:\n\n1. Welches Ziegelmodell ist angeboten, naturrot oder engobiert?\n\n2. Ist die Sturmsicherung enthalten? (Lehner Haus: Sturmklammern nach Windlastzone)'
});

// ---------- Heizung (Pos. 78.110 / 78.120 und 78.210 / 78.220, Fußbodenheizung 78.960) ----------
const waermepumpeFragen = [
  'Fragen Sie gezielt nach diesen Punkten:',
  '1. Welches Fabrikat und welches Modell sind im Preis enthalten? (Lehner Haus: steht mit Typ in der Leistungsbeschreibung)',
  '2. Welches Kältemittel wird verwendet? (Lehner Haus: natürliches Kältemittel R290)',
  '3. Sind Warmwasserspeicher, Regelung, Inbetriebnahme und Einweisung enthalten? (Lehner Haus: ja)',
  '4. Wer berechnet den Wärmebedarf? (Lehner Haus: Ingenieure nach DIN 4701, Auslegung monoenergetisch)',
  '5. Ist die Fußbodenheizung im Preis enthalten? (Lehner Haus: laut Leistungsbeschreibung)'
].join('\n\n');
patch('heizung', 'vaillant', {
  name: 'Vaillant aroTHERM pro Wärmepumpe',
  emotionalHook: 'Wärme aus der Außenluft – mit natürlichem Kältemittel und vorbereitet für Ihren Solarstrom.',
  description: 'Luft-Wasser-Wärmepumpe Vaillant aroTHERM pro (VWL 55/7.1 oder 75/7.1), SG-Ready, mit Außengerät, Hydraulikstation, Warmwasserspeicher 250 Liter, Kompaktpufferspeicher und Vaillant Heizungsregelung. Natürliches Kältemittel R290. Energieeffizienz Heizen A++ (W55) und A+++ (W35).',
  layers: [
    { name: 'Außengerät Vaillant aroTHERM pro', value: 'VWL 55/7.1 oder 75/7.1' },
    { name: 'Hydraulikstation und Vaillant Heizungsregelung', value: '' },
    { name: 'Warmwasserspeicher Vaillant VIH RW', value: '250 Liter' },
    { name: 'Kompaktpufferspeicher Vaillant VP RW 45/2 B', value: '' },
    { name: 'Kältemittel', value: 'R290' },
    { name: 'Fußbodenheizung mit Etagenverteiler und Stellmotoren', value: '' }
  ],
  totalThickness: false,
  technicalDetails: {
    refrigerant: 'R290 – natürliches Kältemittel',
    efficiency: 'Heizen W55 A++ / W35 A+++',
    power: '4,84 kW bei A-7/W35 (VWL 55/7.1)',
    position: 'Pos. 78.110 / 78.120'
  },
  advantages: [
    'Natürliches Kältemittel R290',
    'SG-Ready – vorbereitet für die Einbindung von Solarstrom',
    'Energieeffizienz Heizen A++ (W55) und A+++ (W35)',
    'Garantieverlängerung durch Vaillant möglich',
    'Inbetriebnahme und Einweisung enthalten'
  ],
  comparisonNotes: waermepumpeFragen
});
patch('heizung', 'viessmann', {
  name: 'Viessmann Vitocal 150-A Wärmepumpe',
  emotionalHook: 'Wärme aus der Außenluft – mit natürlichem Kältemittel und Energieeffizienz A+++.',
  description: 'Luft-Wasser-Wärmepumpe Viessmann Vitocal 150-A, SG-Ready, mit Außengerät, Innengerät und nebenstehendem Warmwasserspeicher mit 250 Litern. Natürliches Kältemittel R290. Energieeffizienz Heizen A+++ (W55 und W35).',
  layers: [
    { name: 'Außengerät Viessmann Vitocal 150-A', value: '9,7 oder 11,1 kW' },
    { name: 'Innengerät mit Regelung', value: '' },
    { name: 'Nebenstehender Warmwasserspeicher', value: '250 Liter' },
    { name: 'Kältemittel', value: 'R290' },
    { name: 'Fußbodenheizung mit Etagenverteiler und Stellmotoren', value: '' }
  ],
  totalThickness: false,
  technicalDetails: {
    refrigerant: 'R290 – natürliches Kältemittel',
    efficiency: 'Heizen W55 A+++ / W35 A+++',
    power: '9,7 kW oder 11,1 kW bei A-7/W35',
    position: 'Pos. 78.210 / 78.220'
  },
  advantages: [
    'Natürliches Kältemittel R290',
    'SG-Ready – vorbereitet für die Einbindung von Solarstrom',
    'Energieeffizienz Heizen A+++ (W55 und W35)',
    'Inbetriebnahme und Einweisung enthalten'
  ],
  comparisonNotes: waermepumpeFragen
});

// ---------- Lüftung (Pos. 78.969 dezentral, 78.971 / 78.973 zentral, 78.978 Feuchterückgewinnung) ----------
patch('lueftung', 'keine', {
  comparisonNotes: 'Bei KfW 55 ist die Lüftung über die Fenster möglich; ein Lüftungskonzept nach DIN 1946-6 gehört dazu. Eine Lüftungsanlage mit Wärmerückgewinnung bringt zusätzlichen Komfort: frische Luft auch bei geschlossenen Fenstern und volle Anrechnung der Wärmegewinne beim Gebäudeenergiegesetz.'
});
patch('lueftung', 'dezentral', {
  name: 'Dezentrale Lüftung mit Wärmerückgewinnung',
  emotionalHook: 'Frische Luft ohne Rohrleitungen – Lüftungsgeräte mit Wärmerückgewinnung direkt in der Außenwand.',
  description: 'Dezentrale Lüftungsanlage mit Wärmerückgewinnung für Wohnräume bis 50 m² Wohnfläche: zwei Lüftungsgeräte mit Außenhaube und Steuerung sowie ein Einrohrlüfter für innenliegende Bäder oder WCs. Erweiterbar je weiterem Raum.',
  layers: [
    { name: 'Dezentrale Lüftungsgeräte mit Wärmerückgewinnung', value: '2 Stück' },
    { name: 'Außenhauben und Steuerung', value: '' },
    { name: 'Einrohrlüfter für innenliegende Bäder oder WCs', value: '' },
    { name: 'Erweiterung je weiterem Raum (bis 20 m²)', value: 'Pos. 78.970' }
  ],
  totalThickness: false,
  technicalDetails: { position: 'Pos. 78.969 / 78.970' },
  advantages: [
    'Kein Rohrleitungssystem im Haus',
    'Leicht zu reinigende Einzelkomponenten',
    'Volle Anrechnung der Wärmegewinne beim Gebäudeenergiegesetz (GEG)',
    'Raum für Raum erweiterbar'
  ],
  comparisonNotes: [
    'Fragen Sie gezielt nach diesen Punkten:',
    '1. Wie viele Lüftungsgeräte sind im Preis enthalten, und für welche Wohnfläche?',
    '2. Sind Steuerung und Außenhauben enthalten? (Lehner Haus: ja)',
    '3. Wie werden innenliegende Bäder entlüftet? (Lehner Haus: Einrohrlüfter enthalten)',
    '4. Lässt sich die Anlage um weitere Räume erweitern? (Lehner Haus: ja, je Raum)'
  ].join('\n\n')
});
patch('lueftung', 'zentral', {
  name: 'Zentrale Wohnraumlüftung mit Wärmerückgewinnung',
  emotionalHook: 'Gleichmäßig frische Luft in allen Räumen – mit Wärmerückgewinnung über ein zentrales Markengerät.',
  description: 'Kontrollierte Be- und Entlüftung der Wohnräume mit Wärmerückgewinnung über Kreuz-Gegenstrom-Wärmetauscher: Viessmann Vitovent 300-W oder Vaillant recoVair (oder gleichwertiges Markenfabrikat) mit Zuluftventilen in den Wohn- und Schlafräumen und Abluftventilen in Bad, Küche, Hauswirtschaftsraum und WC.',
  layers: [
    { name: 'Zentralgerät Viessmann Vitovent 300-W oder Vaillant recoVair', value: '' },
    { name: 'Kreuz-Gegenstrom-Wärmetauscher', value: '' },
    { name: 'Zuluftventile (Wohnen, Essen, Kinder, Schlafen)', value: '5 bis 6' },
    { name: 'Abluftventile (Bad, Küche, HWR, WC)', value: '4 bis 5' },
    { name: 'Feuchterückgewinnung (Enthalpiewärmetauscher)', value: 'Option' }
  ],
  totalThickness: false,
  technicalDetails: { position: 'Pos. 78.971 / 78.973, Feuchterückgewinnung Pos. 78.978' },
  advantages: [
    'Markengerät von Viessmann oder Vaillant',
    'Frische Luft in allen Räumen, auch bei geschlossenen Fenstern',
    'Wärmerückgewinnung über Kreuz-Gegenstrom-Wärmetauscher',
    'Auf Wunsch mit Feuchterückgewinnung (Pos. 78.978)',
    'Ausgelegt bis 190 m² oder bis 290 m² belüftete Wohnfläche'
  ],
  comparisonNotes: [
    'Fragen Sie gezielt nach diesen Punkten:',
    '1. Welches Fabrikat ist im Preis enthalten? (Lehner Haus: Viessmann Vitovent 300-W oder Vaillant recoVair)',
    '2. Wie viele Zu- und Abluftventile sind enthalten? (Lehner Haus: 5 Zuluft- und 4 Abluftventile bis 190 m²)',
    '3. Für welche Wohnfläche ist die Anlage ausgelegt?',
    '4. Ist eine Feuchterückgewinnung enthalten oder Option? (Lehner Haus: Option)'
  ].join('\n\n')
});

// ---------- Dach (Pos. 25.120 mit 25.125 / 25.445) ----------
patch('daecher', 'dachelemente', {
  description: 'LEHNER-Sattel- oder Pultdach für das ausgebaute Dachgeschoss: Sparren nach Statik mit mehrfach verleimten Pfetten und Stützen, im Werk auf CNC-gesteuerten Abbundanlagen gefertigt. Dachschrägen im Wohnbereich mit 200 mm Wärmedämmung, Holzwerkstoffplatte und Gipsbauplatte.',
  premiumFeatures: [
    'Pfetten und Stützen aus mehrfach verleimtem Fichtenholz',
    '200 mm Wärmedämmung in der Dachschräge, auf Wunsch 240 oder 280 mm',
    'Schneelast für Ihren Bauort berechnet'
  ],
  layers: [
    { name: 'Dachlattung und Konterlattung', value: '' },
    { name: 'Dachunterspannbahn inklusive Nageldichtband', value: '' },
    { name: 'Dachsparren nach Statik mit Wärmedämmung', value: '200,0 mm' },
    { name: 'Holzwerkstoffplatte', value: '15,0 mm' },
    { name: 'Dampfdiffusionssperre', value: '' },
    { name: 'Gipsbauplatte', value: '12,5 mm' }
  ],
  totalThickness: false,
  technicalDetails: {
    construction: 'Sparrendach mit mehrfach verleimten Pfetten und Stützen',
    insulation: '200 mm Wärmedämmung, Erhöhung auf 240 mm (Pos. 25.130) oder 280 mm (Pos. 25.140)',
    position: 'Pos. 25.120 und 25.125'
  },
  advantages: [
    'Im Werk auf CNC-gesteuerten Abbundanlagen gefertigt',
    'Zusätzliche Aussteifung des Dachstuhls durch verleimte Pfetten',
    'Lüftungsgitter und Abtropfblech aus Aluminium im Standard',
    'Sparren und Dämmung auf 240 oder 280 mm erhöhbar'
  ],
  comparisonNotes: [
    'Fragen Sie gezielt nach diesen Punkten:',
    '1. Wie dick ist die Dämmung in der Dachschräge? (Lehner Haus: 200 mm, auf Wunsch 240 oder 280 mm)',
    '2. Ist die Schneelast für den Bauort berücksichtigt? (Lehner Haus: ja, ohne Mehrkosten)',
    '3. Sind die Dachschrägen fertig gedämmt und verkleidet? (Lehner Haus: mit Holzwerkstoffplatte und Gipsbauplatte)'
  ].join('\n\n')
});
patch('daecher', 'nagelplattenbinder', {
  name: 'Nagelbinderdach',
  emotionalHook: 'Das Dach für Häuser ohne ausgebautes Dachgeschoss – die Dämmung liegt in der Decke, der Dachraum bleibt als Lager nutzbar.',
  description: 'Nagelbinder-Dachkonstruktion nach statischer Berechnung für Häuser mit nicht ausgebautem Dachgeschoss. Die Wärmedämmung liegt mit 200 mm in der Deckenebene; der Dachraum ist mit einem Laufsteg teilweise begehbar und als Lagerfläche nutzbar.',
  premiumFeatures: [
    'Massive Nagelbinder nach statischer Berechnung',
    '200 mm Wärmedämmung in der Deckenebene, auf Wunsch 240 oder 280 mm',
    'Dachraum mit Laufsteg als Lagerfläche nutzbar (Pos. 20.410)'
  ],
  layers: [
    { name: 'Konterlattung 40/60 und Dachlattung', value: '' },
    { name: 'Dachunterspannbahn inklusive Nageldichtband', value: '' },
    { name: 'Massive Nagelbinder nach statischer Berechnung', value: '' },
    { name: 'Wärmedämmung in der Deckenebene', value: '200,0 mm' },
    { name: 'Unterkonstruktion 21×76 und 30×80 mm', value: '' }
  ],
  totalThickness: false,
  technicalDetails: {
    construction: 'Nagelbinder nach statischer Berechnung',
    insulation: '200 mm Wärmedämmung in der Deckenebene',
    position: 'Pos. 25.445'
  },
  advantages: [
    'Große Spannweiten ohne tragende Innenwände',
    'Schneelast für Ihren Bauort berechnet',
    'Untergurt und Dämmung auf 240 oder 280 mm erhöhbar',
    'Lüftungsgitter und Abtropfblech aus Aluminium im Standard'
  ],
  comparisonNotes: [
    'Fragen Sie gezielt nach diesen Punkten:',
    '1. Wo liegt die Dämmung, und wie dick ist sie? (Lehner Haus: 200 mm in der Deckenebene)',
    '2. Ist der Dachraum begehbar? (Lehner Haus: mit Laufsteg teilweise, als Lagerfläche)',
    '3. Wird der Dachstuhl für das Haus statisch berechnet? (Lehner Haus: ja)'
  ].join('\n\n')
});

// ---------- Treppen (Pos. 61.021 ff. Holz, 61.201 ff. Beton) ----------
patch('treppen', 'holztreppe', {
  name: 'Holztreppe in Buche',
  emotionalHook: 'Massive Buche, oberflächenfertig – die Treppe als Blickpunkt Ihres Hauses.',
  description: 'Massivholztreppe mit Trittstufen aus keilgezinkter Buche, gerade oder gewendelt, oberflächenfertig auf zwei Wangen aus massiver Buche aufgesattelt. Geländer mit rechteckigem Handlauf und runden Buche-Stäben. Bis 16 Steigungen je Geschoss im Standard.',
  premiumFeatures: [
    'Trittstufen und Wangen aus massiver Buche',
    'Gerade, viertel- oder halbgewendelt',
    'Oberflächenfertig mit Geländer'
  ],
  layers: [
    { name: 'Trittstufen aus Buche, keilgezinkt', value: '' },
    { name: 'Zwei Wangen aus massiver Buche, Stufen aufgesattelt', value: '' },
    { name: 'Geländer mit Handlauf und runden Buche-Stäben', value: '' },
    { name: 'Steigungen je Geschoss im Standard', value: 'bis 16' }
  ],
  totalThickness: false,
  technicalDetails: { position: 'Pos. 61.021 / 61.022' },
  advantages: [
    'Auf Wunsch halb- oder vollgestemmt, vollgestemmt mit Setzstufen',
    'Auf Wunsch in Eiche anstelle Buche (Pos. 61.060)',
    'Geländerstäbe auf Wunsch in Edelstahl',
    'Auch als Flachwangentreppe erhältlich'
  ],
  comparisonNotes: [
    'Fragen Sie gezielt nach diesen Punkten:',
    '1. Aus welchem Holz sind Stufen und Wangen? (Lehner Haus: massive Buche, auf Wunsch Eiche)',
    '2. Ist die Treppe oberflächenfertig und mit Geländer angeboten? (Lehner Haus: ja)',
    '3. Mit oder ohne Setzstufen? (Lehner Haus: im Standard ohne, vollgestemmt mit Setzstufen)'
  ].join('\n\n')
});
get('treppen', 'betontreppe').technicalDetails = { position: 'Pos. 61.201 ff.' };
get('treppen', 'betontreppe').totalThickness = false;

// ---------- Flachdach (Pos. 25.470, Abdichtung 35.410, Begrünung 35.420) ----------
// "dachform" verknüpft Dachaufbau und Dacheindeckung im Formular (public/js/dach-options.js):
// Zum Flachdach werden nur Abdichtungen angeboten, zum geneigten Dach nur Dachsteine und Ziegel.
const upsert = (group, entry) => {
  const idx = cat[group].findIndex(e => e.id === entry.id);
  if (idx >= 0) cat[group][idx] = entry; else cat[group].push(entry);
};
get('daecher', 'dachelemente').dachform = 'geneigt';
get('daecher', 'nagelplattenbinder').dachform = 'geneigt';
get('tiles', 'beton').dachform = 'geneigt';
get('tiles', 'ton').dachform = 'geneigt';

upsert('daecher', {
  id: 'flachdach',
  name: 'Flachdach',
  dachform: 'flachdach',
  emotionalHook: 'Klare Linie, volle Raumhöhe im Obergeschoss – das Flachdach mit Dämmung in und auf der Konstruktion.',
  kfwCompatible: ['KFW55', 'KFW40'],
  description: 'Flachdachkonstruktion mit Dämmung: Holzkonstruktion nach Statik mit 200 mm Wärmedämmung, darüber Holzwerkstoffplatte, 100 mm EPS-Aufdachdämmung und EPS-Gefälledämmung. Abdichtung und Belag wählen Sie unter Dacheindeckung.',
  premiumFeatures: [
    '200 mm Wärmedämmung in der Konstruktion plus 100 mm Aufdachdämmung',
    'Gefälledämmung für den Wasserablauf',
    'Holzkonstruktion nach statischer Berechnung'
  ],
  layers: [
    { name: 'Abdichtung und Belag (siehe Dacheindeckung)', value: '' },
    { name: 'EPS-Gefälledämmung, im Mittel', value: '70,0 mm' },
    { name: 'EPS-Aufdachdämmung', value: '100,0 mm' },
    { name: 'Holzwerkstoffplatte', value: '18,0 mm' },
    { name: 'Holzkonstruktion nach Statik mit Wärmedämmung', value: '200,0 mm' },
    { name: 'Unterkonstruktion', value: '21,0 mm' }
  ],
  totalThickness: false,
  technicalDetails: {
    construction: 'Flachdachkonstruktion mit Dämmung',
    insulation: '200 mm Wärmedämmung + 100 mm EPS-Aufdachdämmung + Gefälledämmung',
    position: 'Pos. 25.470'
  },
  advantages: [
    'Volle Raumhöhe im Obergeschoss, keine Dachschrägen',
    'Mit Kiesschüttung oder extensiver Begrünung',
    'Schneelast für Ihren Bauort berechnet',
    'Untersicht mit Gipsbauplatten verkleidet (Gewerk 23)'
  ],
  comparisonNotes: [
    'Fragen Sie gezielt nach diesen Punkten:',
    '1. Wie ist das Flachdach gedämmt, in der Konstruktion und darüber? (Lehner Haus: 200 mm plus 100 mm Aufdachdämmung plus Gefälledämmung)',
    '2. Wie wird das Gefälle hergestellt? (Lehner Haus: mit Gefälledämmung)',
    '3. Welche Abdichtung ist im Preis enthalten? (Lehner Haus: Kunststoffdachbahn mit Schutzvlies, siehe Dacheindeckung)'
  ].join('\n\n'),
  filePath: null,
  technicalDrawing: null
});

upsert('tiles', {
  id: 'flachdach-kies',
  name: 'Flachdachabdichtung mit Kies',
  dachform: 'flachdach',
  emotionalHook: 'Kunststoffdachbahn, Schutzvlies und Kies – die bewährte Abdichtung für das Flachdach.',
  description: 'Flachdachabdichtung: Trennlagenvlies, eine Lage thermoplastische Kunststoffdachbahn, Schutzvlies gegen mechanische Beschädigung und 50 mm Kiesschüttung aus Rollkies (Körnung 16–32 mm).',
  premiumFeatures: [
    'Thermoplastische Kunststoffdachbahn als Dachhaut',
    'Schutzvlies gegen mechanische Beschädigung',
    '50 mm Kiesschüttung als Auflast und Schutz'
  ],
  layers: [
    { name: 'Kiesschüttung aus Rollkies, Körnung 16–32 mm', value: '50 mm' },
    { name: 'Schutzvlies', value: '' },
    { name: 'Thermoplastische Kunststoffdachbahn, lose verlegt', value: '' },
    { name: 'Trennlagenvlies, lose verlegt', value: '' }
  ],
  totalThickness: false,
  technicalDetails: { material: 'Kunststoffdachbahn mit Kiesschüttung', position: 'Pos. 35.410' },
  advantages: [
    'Bewährter Aufbau mit wenigen Schichten',
    'Auf Wunsch mit extensiver Begrünung statt Kies'
  ],
  comparisonNotes: 'Fragen Sie gezielt:\n\n1. Welche Dachbahn wird verwendet, und ist ein Schutzvlies enthalten? (Lehner Haus: Kunststoffdachbahn mit Schutzvlies)\n\n2. Ist die Kiesschüttung im Preis enthalten? (Lehner Haus: ja, 50 mm)',
  filePath: null,
  technicalDrawing: null
});

upsert('tiles', {
  id: 'flachdach-begruenung',
  name: 'Flachdach mit Begrünung',
  dachform: 'flachdach',
  emotionalHook: 'Sedum, Gräser und Stauden auf dem Dach – die extensive Begrünung für Ihr Flachdach.',
  description: 'Flachdach mit extensiver Begrünung: Kunststoffdachbahn auf Trennlagenvlies, darüber Speichervlies, Speichermatte und Filtervlies, 10 cm mineralisches Pflanzsubstrat und Handeinsaat mit Sedum, Gräsern und Stauden. Kiesstreifen in den Anschlussbereichen.',
  premiumFeatures: [
    'Extensive Begrünung mit Sedum, Gräsern und Stauden',
    '10 cm mineralisches Pflanzsubstrat',
    'Kiesstreifen an allen Anschlüssen'
  ],
  layers: [
    { name: 'Begrünung, Handeinsaat (Sedum, Gräser, Stauden)', value: '' },
    { name: 'Pflanzsubstrat, 100 % mineralisch', value: '10 cm' },
    { name: 'Speichervlies, Speichermatte und Filtervlies', value: '' },
    { name: 'Thermoplastische Kunststoffdachbahn, lose verlegt', value: '' },
    { name: 'Trennlagenvlies, lose verlegt', value: '' },
    { name: 'Kiesstreifen in den Anschlussbereichen', value: '40 cm' }
  ],
  totalThickness: false,
  technicalDetails: { material: 'Kunststoffdachbahn mit extensiver Begrünung', position: 'Pos. 35.420' },
  advantages: [
    'Wasserspeicher und Dränschicht im Aufbau',
    'Pflegeleichte, niedrig wachsende Bepflanzung'
  ],
  comparisonNotes: 'Fragen Sie gezielt:\n\n1. Extensive oder intensive Begrünung, und wie hoch ist das Substrat? (Lehner Haus: extensiv, 10 cm)\n\n2. Ist die Einsaat enthalten? (Lehner Haus: ja, Handeinsaat)',
  filePath: null,
  technicalDrawing: null
});

// ---------- Lüftung ist bei KfW 55 optional wählbar (Entscheidung 23.11.2026) ----------
get('lueftung', 'keine').description = 'Lüftung über die Fenster. Bei KfW 55 möglich, wenn ein Lüftungskonzept erstellt wird; eine Lüftungsanlage können Sie zusätzlich wählen.';

// Zeilenenden wie im Repo belassen (LF) und mit abschließender Leerzeile schreiben
fs.writeFileSync(file, JSON.stringify(cat, null, 2) + '\n', 'utf8');
console.log('catalog.json auf Kalkulation 09/2026 umgestellt.');
