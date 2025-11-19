// Supabase techniques fetcher
// Attempts to fetch technique documents by crop. Falls back to static examples if table absent.

import { createClient } from "@supabase/supabase-js";

let supabase = null;
export function initSupabase() {
  if (supabase) return supabase;
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.warn('Supabase env vars missing — techniques will use fallback content');
    supabase = null;
    return null;
  }
  try {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    return supabase;
  } catch (e) {
    console.warn('Failed to init Supabase client for techniques:', e.message);
    supabase = null;
    return null;
  }
}

const FALLBACK = {
  rice: [
    {
      title: "Pag-aapply ng Pataba (Unang Topdress)",
      steps: ["Suriin muna ang lupa", "Maglagay ng tamang dami ng urea", "Panatilihing 2-3cm ang tubig"]
    },
    {
      title: "Alternating Wet and Dry (AWD)",
      steps: ["Patuyuin ang palayan hanggang makita ang bitak", "Magpasok muli ng tubig 2cm", "Ulitin sa susunod na linggo"]
    }
  ],
  corn: [
    {
      title: "Maagang Weed Control",
      steps: ["Gamitin ang pre-emergent herbicide kung kinakailangan", "Manual na bunot sa 2 linggo", "Mulch kung posible"]
    }
  ]
};

export async function fetchTechniques({ crop }) {
  const client = initSupabase();
  if (!client) {
    return { ok: true, source: "supabase-fallback", crop, techniques: FALLBACK[crop?.toLowerCase()] || [] };
  }
  try {
    const { data, error } = await client
      .from("techniques")
      .select("title, steps")
      .ilike("crop", crop);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) {
      return { ok: true, source: "supabase-fallback", crop, techniques: FALLBACK[crop?.toLowerCase()] || [] };
    }
    return { ok: true, source: "supabase", crop, techniques: data };
  } catch (e) {
    return { ok: true, source: "fallback-error", crop, techniques: FALLBACK[crop?.toLowerCase()] || [], error: e.message };
  }
}
