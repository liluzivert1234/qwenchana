// src/pages/MainMenu.tsx

import { useLocation, useNavigate } from "react-router-dom"; // Removed unused 'React' import

// Define the menu items
const menuItems = [
  { title: "Crop Prices", route: "/chat/price", icon: "💰" },
  { title: "Weather Info", route: "/chat/weather", icon: "☀️" },
  { title: "Farming Techniques", route: "/chat/farming", icon: "🌱" },
];

export default function MainMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const username = (location.state as any)?.username || "Guest";

  const handleMenuClick = (route: string) => {
    // Navigate and pass the username state to the next page
    navigate(route, { state: { username } });
  };

  return (
    <div
      style={{
        padding: 20,
        fontFamily: "Arial",
        maxWidth: 800,
        margin: "auto",
        textAlign: "center",
      }}
    >
      <h2>Welcome, {username}!</h2>
      <p style={{ marginBottom: 40 }}>
        Please select a topic to get started with the Qwen Assistant.
      </p>

      {/* Kiosk-style Grid Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
        }}
      >
        {menuItems.map((item) => (
          <div
            key={item.route}
            onClick={() => handleMenuClick(item.route)}
            style={{
              padding: "40px 20px",
              cursor: "pointer",
              background: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontSize: "1.2em",
              fontWeight: "bold",
              transition: "background 0.3s",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#45a049")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#4CAF50")}
          >
            <span style={{ fontSize: "3em", marginBottom: 10 }}>
              {item.icon}
            </span>
            {item.title}
          </div>
        ))}
      </div>
    </div>
  );
}
