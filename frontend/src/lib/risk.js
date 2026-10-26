// Maps labels.json risk text (and backend RiskLevel names) to one display scale.
export const RISK = {
  high: {
    tone: 'high',
    label: 'Serious skin cancer',
    advice: 'Melanoma can spread quickly. Show this lesion to a dermatologist soon.',
  },
  malignant: {
    tone: 'malignant',
    label: 'Skin cancer',
    advice: 'This type is a cancer that usually grows slowly. Book a dermatologist visit.',
  },
  pre: {
    tone: 'pre',
    label: 'Can become cancer',
    advice: 'This type can turn into skin cancer over time. Have a dermatologist check it.',
  },
  benign: {
    tone: 'benign',
    label: 'Usually harmless',
    advice: 'This type is usually not dangerous. See a doctor if it changes in size, shape or colour, bleeds or itches.',
  },
};

export function riskOf(value = '') {
  const v = value.toLowerCase();
  if (v.startsWith('high')) return RISK.high;
  if (v.startsWith('malignant')) return RISK.malignant;
  if (v.startsWith('pre')) return RISK.pre;
  return RISK.benign;
}

export const LOW_CONFIDENCE = 0.4;
