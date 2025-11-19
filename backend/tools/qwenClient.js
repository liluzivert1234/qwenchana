// Dashscope (Alibaba Cloud) client for Qwen models
// Uses Dashscope compatible-mode endpoint matching the working frontend implementation
// Endpoint: https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions

const DASHSCOPE_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions';

export async function callQwen({ prompt, messages, maxTokens = 600 }) {
  const apiKey = process.env.VITE_DASHSCOPE_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "Missing VITE_DASHSCOPE_API_KEY env var" };
  }
  
  // Build messages array: support both legacy prompt and new messages format
  let messageArray;
  if (messages && Array.isArray(messages)) {
    // Use provided messages array for multi-turn conversation
    messageArray = messages;
  } else if (prompt) {
    // Legacy single-turn format
    messageArray = [
      {
        role: "system",
        content: "You are a helpful assistant specialized in providing agricultural advice to Filipino farmers. Be concise and practical."
      },
      { role: "user", content: prompt }
    ];
  } else {
    return { ok: false, error: "Either prompt or messages array required" };
  }
  
  try {
    const res = await fetch(DASHSCOPE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "qwen-plus",
        messages: messageArray
      })
    });

    const data = await res.json();

    if (res.ok) {
      const text = data.choices?.[0]?.message?.content || '';
      return { ok: true, text, raw: data };
    } else {
      console.error('Dashscope API error:', res.status, data);
      return { ok: false, error: `HTTP ${res.status}: ${data.error?.message || 'Request failed'}`, raw: data };
    }
  } catch (e) {
    console.error('qwenClient call failed:', e.message);
    return { ok: false, error: e.message };
  }
}
