import { useState } from "react";

export default function App() {
  const [userInput, setUserInput] = useState(
    "can you help me write a poem about the sea?"
  );
  const [responseText, setResponseText] = useState("");
  const [loading, setLoading] = useState(false);

  const DASHSCOPE_API_KEY = import.meta.env.DASHSCOPE_API_KEY;

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    setLoading(true);
    setResponseText("");

    try {
      const res = await fetch(
        "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
          },
          body: JSON.stringify({
            model: "qwen-plus",
            messages: [
              { role: "system", content: "You are a helpful assistant." },
              { role: "user", content: userInput },
            ],
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        const reply = data.choices?.[0]?.message?.content || "No response.";
        setResponseText(reply);
      } else {
        setResponseText(`Error: ${data.error?.message || "Request failed"}`);
      }
    } catch (err: any) {
      setResponseText("Error: " + err.message);
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial", maxWidth: 700, margin: "auto" }}>
      <h1>Qwen Chat Assistant</h1>
      <textarea
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        rows={4}
        style={{ width: "100%", padding: 8, marginBottom: 12 }}
      />
      <button
        onClick={sendMessage}
        disabled={loading}
        style={{
          padding: "10px 20px",
          cursor: "pointer",
          background: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: 4,
          marginBottom: 20,
        }}
      >
        {loading ? "Sending..." : "Send Message"}
      </button>
      {responseText && (
        <div>
          <h3>Response:</h3>
          <div style={{ whiteSpace: "pre-wrap" }}>{responseText}</div>
        </div>
      )}
    </div>
  );
}
