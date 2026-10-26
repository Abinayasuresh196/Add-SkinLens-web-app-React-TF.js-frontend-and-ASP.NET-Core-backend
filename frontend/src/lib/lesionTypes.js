// The seven HAM10000 classes, in plain language, for the About and home pages.
export const LESION_TYPES = [
  { code: 'mel', name: 'Melanoma', risk: 'High', looks: 'Uneven colour and border, often dark brown, black, red or blue areas.' },
  { code: 'bcc', name: 'Basal cell carcinoma', risk: 'Malignant', looks: 'Pearly or shiny bump, sometimes with small visible blood vessels.' },
  { code: 'akiec', name: 'Actinic keratosis', risk: 'Pre', looks: 'Rough, scaly red patch on sun-exposed skin.' },
  { code: 'bkl', name: 'Benign keratosis', risk: 'Benign', looks: 'Brown, waxy, stuck-on spot, common with age.' },
  { code: 'df', name: 'Dermatofibroma', risk: 'Benign', looks: 'Small firm bump, often on the legs.' },
  { code: 'nv', name: 'Melanocytic nevus', risk: 'Benign', looks: 'An ordinary mole with even colour and shape.' },
  { code: 'vasc', name: 'Vascular lesion', risk: 'Benign', looks: 'Red or purple spot made of small blood vessels.' },
];

// Model output order (labels.json / backend ClassCatalog); saved probabilities use this order
const MODEL_ORDER = ['akiec', 'bcc', 'bkl', 'df', 'mel', 'nv', 'vasc'];
const BY_CODE = Object.fromEntries(LESION_TYPES.map((t) => [t.code, t]));

/** Saved probabilities -> [{ code, name, risk, probability }], highest first. */
export function rankProbabilities(probabilities = []) {
  return MODEL_ORDER
    .map((code, i) => ({ ...BY_CODE[code], probability: probabilities[i] ?? 0 }))
    .sort((a, b) => b.probability - a.probability);
}
