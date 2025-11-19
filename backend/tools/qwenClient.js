// Dashscope (Alibaba Cloud) client for Qwen models
// Uses Dashscope compatible-mode endpoint matching the working frontend implementation
// Endpoint: https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions

const DASHSCOPE_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions';

export async function callQwen({ prompt, maxTokens = 600 }) {
  const apiKey = process.env.VITE_DASHSCOPE_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "Missing VITE_DASHSCOPE_API_KEY env var" };
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
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant specialized in providing agricultural advice to Filipino farmers. Be concise and practical."
          },
          { role: "user", content: prompt }
        ]
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
