// Extract farming techniques from locally parsed PDF guide KB
// Heuristic approach: scan KB chunks for agricultural action keywords and derive concise titles + steps.
// Returns a structure similar to Supabase techniques fetcher to minimize downstream changes.

import { loadKB } from './localKb.js';

// Keywords indicating actionable technique content (Tagalog + English)
const TECH_KEYWORDS = [
  'pataba','fertilizer','topdress','irigasyon','irrigation','peste','pest','binhi','seed','ani','harvest',
  'compost','mulch','pagkontrol','control','management','spacing','pag-aani','pagpapatubig','microbial','inoculant','nutrient'
];

function sentenceSplit(text) {
  // Split into sentences; keep moderate length sentences
  return text
    .replace(/\s+/g,' ') // normalize whitespace
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 40 && s.length < 220);
}

function containsKeyword(sentLower) {
  return TECH_KEYWORDS.some(k => sentLower.includes(k));
}

function deriveSteps(fromText) {
  // Simple step derivation: split by semicolon or period, filter medium length
  const rawPieces = fromText.split(/[.;](?:\s+|)/).map(p => p.trim());
  const steps = [];
  for (const p of rawPieces) {
    if (p.length < 20 || p.length > 140) continue;
    if (!containsKeyword(p.toLowerCase()) && steps.length === 0) continue; // ensure first is relevant
    steps.push(p);
    if (steps.length >= 5) break;
  }
  // If too few steps, attempt to further split by ' - ' or ': '
  if (steps.length < 2) {
    const alt = fromText.split(/[-:]/).map(a => a.trim()).filter(a => a.length > 25 && a.length < 160);
    for (const a of alt) {
      if (steps.length >= 5) break;
      if (!steps.includes(a) && containsKeyword(a.toLowerCase())) steps.push(a);
    }
  }
  // Truncate step count to 3 for brevity in prompt context
  return steps.slice(0,3);
}

export function fetchLocalPdfTechniques({ crop }) {
  const kb = loadKB();
  if (!kb.length) return { ok: true, source: 'local-pdf-empty', crop, techniques: [] };
  const cropLower = (crop || '').toLowerCase();

  // Aggregate candidate sentences from all chunks
  const candidates = [];
  for (const entry of kb) {
    const lowerChunk = entry.text.toLowerCase();
    // Prefer chunks mentioning the crop (if provided); otherwise allow any
    if (cropLower && !lowerChunk.includes(cropLower)) continue;
    const sentences = sentenceSplit(entry.text);
    for (const s of sentences) {
      const sl = s.toLowerCase();
      if (containsKeyword(sl)) {
        candidates.push({ sentence: s, source: entry.source, full: entry.text });
      }
    }
  }

  // Deduplicate by normalized sentence start
  const seen = new Set();
  const techniques = [];
  for (const c of candidates) {
    const key = c.sentence.slice(0,80).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const title = c.sentence.length > 110 ? c.sentence.slice(0,107) + '...' : c.sentence;
    const steps = deriveSteps(c.full);
    if (!steps.length) continue;
    techniques.push({ title, steps, source: c.source });
    if (techniques.length >= 6) break; // cap for prompt size
  }

  return { ok: true, source: 'local-pdf', crop, techniques };
}
