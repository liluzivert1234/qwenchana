import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { runAskFlow } from "./tools/askFlow.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Supabase client (create only if env vars present)
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  try {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  } catch (e) {
    console.warn('Failed to create Supabase client:', e.message);
    supabase = null;
  }
} else {
  console.warn('SUPABASE_URL or SUPABASE_ANON_KEY not set — running in demo mode without Supabase');
}

// Login endpoint
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: "Username and password required" });

  // If Supabase not configured, allow any credentials for demo/dev mode
  if (!supabase) {
    console.warn('Supabase not configured — accepting demo login');
    return res.json({ success: true, username, demo: true });
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .eq("password", password);
    if (error) return res.status(500).json({ message: error.message });
    if (data.length > 0) {
      res.json({ success: true, username });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Farmer query endpoint implementing the flow
app.post("/api/ask", async (req, res) => {
  const { message, crop, location, messages } = req.body || {};
  if (!message) return res.status(400).json({ ok: false, error: "message required" });
  try {
    const flow = await runAskFlow({ message, crop, location, messages });
    res.json(flow);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Debug endpoint: show which LLM-related env vars are present (no secrets returned)
app.get('/api/keys', (req, res) => {
  res.json({
    QWEN_API_URL: !!process.env.QWEN_API_URL,
    QWEN_API_KEY: !!process.env.QWEN_API_KEY,
    VITE_DASHSCOPE_API_KEY: !!process.env.VITE_DASHSCOPE_API_KEY
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
