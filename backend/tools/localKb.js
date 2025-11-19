// Local Knowledge Base (KB) for farming guides
// Parses PDF or TXT guides into text chunks with simple keyword scoring retrieval.
// For hackathon simplicity we avoid embeddings; we use keyword frequency scoring.
// The parser prefers `pdfjs-dist` and falls back to `pdf-parse` if available.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const GUIDES_DIR = path.resolve('backend', 'farming-guides');
const DATA_DIR = path.resolve('backend', 'data');
const KB_PATH = path.join(DATA_DIR, 'kb.json');

// Configuration
const CHUNK_SIZE = 1000; // characters
const CHUNK_OVERLAP = 150; // characters overlap

function chunkText(text, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const out = [];
  let i = 0;
  while (i < text.length) {
    const slice = text.slice(i, i + size);
    out.push(slice.trim());
    i += size - overlap;
  }
  return out.filter(c => c.length > 30); // drop extremely small chunks
}

function extractTxtText(filePath) {
  return fs.readFileSync(filePath, 'utf8').replace(/\s+/g, ' ').trim();
}

async function extractPdfText(filePath) {
  // Try several possible pdfjs-dist import paths (package layouts vary)
  const pdfjsCandidates = [
    'pdfjs-dist/legacy/build/pdf.js',
    'pdfjs-dist/legacy/build/pdf.mjs',
    'pdfjs-dist/legacy/build/pdf.min.js',
    'pdfjs-dist/build/pdf.js',
    'pdfjs-dist/es5/build/pdf.js',
    'pdfjs-dist/es5/build/pdf.node.js'
  ];
  for (const candidate of pdfjsCandidates) {
    try {
      const imported = await import(candidate);
      const pdfjs = imported && (imported.default || imported);
      if (!pdfjs || typeof pdfjs.getDocument !== 'function') {
        throw new Error('not a pdfjs build');
      }
      // Ensure workerSrc present (no-op in Node but defensive)
      try {
        if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
          pdfjs.GlobalWorkerOptions.workerSrc = '';
        }
      } catch (w) {}

      const data = new Uint8Array(fs.readFileSync(filePath));
      const loadingTask = pdfjs.getDocument({ data });
      const pdf = await loadingTask.promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map(item => (item.str || ''));
        fullText += strings.join(' ') + ' ';
      }
      console.log('pdfjs candidate succeeded:', candidate, 'for', path.basename(filePath));
      return (fullText || '').replace(/\s+/g, ' ').trim();
    } catch (e) {
      console.warn('pdfjs candidate failed:', candidate, 'for', path.basename(filePath), '-', e && e.message);
      // try next candidate
    }
  }
  // Fallback to pdf-parse if available
  try {
    const pdfParse = await import('pdf-parse');
    const data = fs.readFileSync(filePath);
    const pdfParseFn = (pdfParse && (pdfParse.default || pdfParse)) || null;
    if (typeof pdfParseFn === 'function') {
      const parsed = await pdfParseFn(data);
      return (parsed.text || '').replace(/\s+/g, ' ').trim();
    }
  } catch (e2) {
    // ignore
  }
  console.warn('No workable pdf parser available; skipping', filePath);
  return '';
}

async function processFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  let text = '';
  if (ext === '.pdf') text = await extractPdfText(filePath);
  else if (ext === '.txt' || ext === '.md') text = extractTxtText(filePath);
  else return []; // unsupported type
  if (!text) return [];
  const chunks = chunkText(text);
  return chunks.map((chunk, idx) => ({
    id: `${path.basename(filePath)}::${idx}`,
    source: path.basename(filePath),
    chunk_index: idx,
    text: chunk,
    length: chunk.length,
    ts: new Date().toISOString()
  }));
}

export async function buildLocalKB() {
  if (!fs.existsSync(GUIDES_DIR)) {
    console.warn('Guides directory missing:', GUIDES_DIR);
    return [];
  }
  const files = fs.readdirSync(GUIDES_DIR);
  const all = [];
  for (const f of files) {
    const full = path.join(GUIDES_DIR, f);
    try {
      const entries = await processFile(full);
      if (entries.length) {
        all.push(...entries);
        console.log(`Processed ${f} -> ${entries.length} chunks`);
      }
    } catch (e) {
      console.error('Error processing', f, e.message);
    }
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(KB_PATH, JSON.stringify(all, null, 2));
  console.log(`KB written with ${all.length} chunks to ${KB_PATH}`);
  return all;
}

let _kbCache = null;
export function loadKB() {
  // Always reload from disk to pick up external builds (no long-lived cache).
  if (!fs.existsSync(KB_PATH)) {
    console.warn('KB file not found; returning empty KB');
    _kbCache = [];
    return _kbCache;
  }
  try {
    _kbCache = JSON.parse(fs.readFileSync(KB_PATH, 'utf8'));
  } catch (e) {
    console.error('Failed reading KB file:', e && e.message);
    _kbCache = [];
  }
  return _kbCache;
}

function scoreChunk(chunkText, terms) {
  const lower = chunkText.toLowerCase();
  let score = 0;
  for (const t of terms) {
    if (!t) continue;
    const regex = new RegExp(`\\b${t.toLowerCase()}\\b`, 'g');
    const matches = lower.match(regex);
    if (matches) score += matches.length;
  }
  // Length penalty (prefer medium chunks)
  if (chunkText.length > 1600) score *= 0.7;
  return score;
}

export function searchKB({ query, crop, topK = 3 }) {
  const kb = loadKB();
  if (!kb.length) return [];
  const terms = [query, crop].flatMap(t => (t ? t.split(/\s+/) : []));
  const scored = kb.map(entry => ({ entry, score: scoreChunk(entry.text, terms) }));
  return scored
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(r => ({ id: r.entry.id, source: r.entry.source, text: r.entry.text.slice(0, 400) + '...', score: r.score }));
}

// Optional CLI usage: node localKB.js build
const THIS_FILE = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === THIS_FILE) {
  const cmd = process.argv[2];
  if (cmd === 'build') {
    buildLocalKB()
      .then(() => { console.log('KB build completed'); process.exit(0); })
      .catch(e => { console.error('KB build failed:', e); process.exit(1); });
  } else if (cmd === 'search') {
    const q = process.argv.slice(3).join(' ');
    console.log(searchKB({ query: q, crop: 'rice' }));
    process.exit(0);
  } else {
    console.log('Usage: node localKB.js build|search <query>');
    process.exit(0);
  }
}