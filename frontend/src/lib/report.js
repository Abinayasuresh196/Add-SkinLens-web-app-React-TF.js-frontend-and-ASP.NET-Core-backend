// Builds a one-page A4 PDF of a saved scan. jsPDF is loaded on demand to keep the main bundle small.
import { riskOf } from './risk.js';
import { rankProbabilities } from './lesionTypes.js';

const TONE_RGB = { high: [208, 36, 44], malignant: [217, 83, 30], pre: [182, 121, 0], benign: [18, 135, 92] };
const ACCENT = [44, 88, 208];
const INK = [15, 27, 46];
const DIM = [82, 98, 122];
const LINE = [217, 225, 237];

export async function downloadScanReport(scan) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const M = 18;
  const when = new Date(scan.createdAt);
  const ranked = rankProbabilities(scan.probabilities);
  const top = ranked[0];
  const risk = riskOf(top.risk);

  // Header band
  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, W, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold').setFontSize(18).text('SkinLens scan report', M, 15);
  doc.setFont('helvetica', 'normal').setFontSize(10)
    .text(`Saved ${when.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}, ${when.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`, M, 23);

  // Thumbnail + headline result
  let y = 42;
  const textX = scan.thumbnail ? M + 50 : M;
  if (scan.thumbnail) {
    const fmt = scan.thumbnail.startsWith('data:image/png') ? 'PNG' : 'JPEG';
    doc.addImage(scan.thumbnail, fmt, M, y, 42, 42);
    doc.setDrawColor(...TONE_RGB[risk.tone]).setLineWidth(0.8).rect(M, y, 42, 42);
  }
  doc.setTextColor(...DIM).setFontSize(10).text('Most likely', textX, y + 4);
  doc.setTextColor(...INK).setFont('helvetica', 'bold').setFontSize(20).text(top.name, textX, y + 13);
  doc.setTextColor(...TONE_RGB[risk.tone]).setFontSize(11).text(risk.label, textX, y + 21);
  doc.setFont('helvetica', 'normal').setFontSize(28).text(`${(scan.confidence * 100).toFixed(0)}%`, textX, y + 36);
  doc.setTextColor(...DIM).setFontSize(9).text('model confidence', textX + 26, y + 36);

  y += 54;
  doc.setTextColor(...INK).setFontSize(11);
  const advice = doc.splitTextToSize(risk.advice, W - 2 * M);
  doc.text(advice, M, y);
  y += advice.length * 5.5 + 6;

  // Details
  const details = [
    ['Body site', scan.bodySite],
    ['Note', scan.note],
    ['Model', scan.modelVersion],
  ].filter(([, v]) => v);
  details.forEach(([k, v]) => {
    doc.setTextColor(...DIM).setFontSize(9).text(k, M, y);
    const lines = doc.splitTextToSize(String(v), W - 2 * M - 30);
    doc.setTextColor(...INK).setFontSize(10).text(lines, M + 30, y);
    y += lines.length * 5 + 2;
  });

  // All seven scores as bars
  y += 6;
  doc.setDrawColor(...LINE).setLineWidth(0.3).line(M, y, W - M, y);
  y += 10;
  doc.setTextColor(...INK).setFont('helvetica', 'bold').setFontSize(12).text('All seven types', M, y);
  doc.setFont('helvetica', 'normal');
  y += 8;
  const barX = M + 62;
  const barW = W - M - barX - 18;
  ranked.forEach((c) => {
    const tone = riskOf(c.risk).tone;
    doc.setTextColor(...INK).setFontSize(10).text(c.name, M, y + 3);
    doc.setFillColor(...LINE).roundedRect(barX, y, barW, 3.5, 1.7, 1.7, 'F');
    doc.setFillColor(...TONE_RGB[tone]).roundedRect(barX, y, Math.max(barW * c.probability, 1.5), 3.5, 1.7, 1.7, 'F');
    doc.text(`${(c.probability * 100).toFixed(1)}%`, W - M, y + 3, { align: 'right' });
    y += 9;
  });

  // Disclaimer
  const pageH = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...LINE).line(M, pageH - 30, W - M, pageH - 30);
  doc.setTextColor(...DIM).setFontSize(8.5);
  doc.text(doc.splitTextToSize(
    'SkinLens is an educational tool, not a medical device, and this report is not a diagnosis. The model can miss skin cancers. ' +
    'See a dermatologist about any lesion that worries you, changes, bleeds or itches.',
    W - 2 * M,
  ), M, pageH - 23);

  doc.save(`skinlens-${top.code}-${when.toISOString().slice(0, 10)}.pdf`);
}
