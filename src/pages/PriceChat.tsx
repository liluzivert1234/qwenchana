// src/pages/PriceChat.tsx

import { useState } from "react"; // Removed unused 'React' import
import { useLocation, useNavigate } from "react-router-dom";

export default function PriceChat() {
  const location = useLocation();
  const navigate = useNavigate(); // For the back button
  const username = (location.state as any)?.username || "Guest";

  const [userInput, setUserInput] = useState("");
  const [responseText, setResponseText] = useState("");
  const [loading, setLoading] = useState(false);

  const DASHSCOPE_API_KEY = import.meta.env.VITE_DASHSCOPE_API_KEY;

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    // IMPORTANT: Client-side API calls to external services like Qwen
    // should ideally be proxied through your own secure backend (like Node.js/Function Compute)
    // to hide the API key and implement rate limiting.

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
              // Custom, specialized prompt for this specific page
              {
                role: "system",
                content:
                  "You are a helpful assistant specialized in providing real-time commodity and crop price information.",
              },
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
    <div
      style={{
        padding: 20,
        fontFamily: "Arial",
        maxWidth: 700,
        margin: "auto",
      }}
    >
      {/* Back Button */}
      <button
        onClick={() => navigate("/menu", { state: { username } })}
        style={{ marginBottom: 15, padding: "8px 15px", cursor: "pointer" }}
      >
        ← Back to Main Menu
      </button>

      <h2>💰 Crop Price Assistant</h2>
      <p>Logged in as: {username}</p>

      <textarea
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        rows={4}
        placeholder="Ask about the price of rice, corn, or soybeans..."
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
