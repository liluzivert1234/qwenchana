// src/pages/MainMenu.tsx

import { useState } from "react"; // <-- Import useState
import { useLocation, useNavigate } from "react-router-dom";

// Define the menu items
const menuItems = [
  // Prompting for general knowledge, not real-time data
  {
    title: "Crop Prices",
    route: "/chat/price",
    icon: "💰",
    initialQuery: "Current market price and historical trends for ",
  },
  {
    title: "Weather Info",
    route: "/chat/weather",
    icon: "☀️",
    initialQuery: "Typical climate and major weather risks for ",
  },
  {
    title: "Farming Techniques",
    route: "/chat/farming",
    icon: "🌱",
    initialQuery: "Best practice management advice for ",
  },
];

export default function MainMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const username = (location.state as any)?.username || "Guest";

  // 1. New state for Crop and Location inputs
  const [crop, setCrop] = useState("");
  const [locationInput, setLocationInput] = useState("");

  // 3. Logic to check if both fields are complete
  const isFormComplete = crop.trim() !== "" && locationInput.trim() !== "";

  const handleMenuClick = (item: (typeof menuItems)[0]) => {
    if (!isFormComplete) return;

    // Construct the context string and the initial, automated query
    const context = `${crop} in ${locationInput}`;
    const fullInitialQuery = `${item.initialQuery}${context}?`;

    // Navigate to the specific chat page, passing the full context and query
    navigate(item.route, {
      state: {
        username,
        crop, // Pass the context data
        location: locationInput,
        initialQuery: fullInitialQuery, // Pass the pre-constructed query
      },
    });
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
      {/* TEMP APP TITLE: PLANT HERO */}
      <h1
        style={{
          color: "#4CAF50",
          fontSize: "3.5em",
          marginBottom: 10,
        }}
      >
        PLANT HERO
      </h1>

      <h2>Welcome, {username}!</h2>
      <p style={{ marginBottom: 30 }}>
        Please define your **Crop** and **Location** to unlock the assistant.
      </p>

      {/* 2. New Input Fields */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "15px",
          marginBottom: "30px",
        }}
      >
        <input
          type="text"
          placeholder="Crop (e.g., Rice, Corn)"
          value={crop}
          onChange={(e) => setCrop(e.target.value)}
          style={{
            padding: "10px",
            fontSize: "1em",
            borderRadius: 4,
            border: "1px solid #ccc",
            width: "40%",
          }}
        />
        <input
          type="text"
          placeholder="Location (City/Province/Municipality)"
          value={locationInput}
          onChange={(e) => setLocationInput(e.target.value)}
          style={{
            padding: "10px",
            fontSize: "1em",
            borderRadius: 4,
            border: "1px solid #ccc",
            width: "40%",
          }}
        />
      </div>

      {/* Kiosk-style Grid Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          opacity: isFormComplete ? 1 : 0.4, // Dim if not complete
          pointerEvents: isFormComplete ? "auto" : "none", // Disable clicks if not complete
        }}
      >
        {menuItems.map((item) => (
          <div
            key={item.route}
            // Pass the entire item object to handleMenuClick
            onClick={() => handleMenuClick(item)}
            style={{
              padding: "40px 20px",
              cursor: isFormComplete ? "pointer" : "not-allowed",
              background: isFormComplete ? "#4CAF50" : "#A5A5A5", // Grey out if not complete
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
            onMouseOver={(e) =>
              isFormComplete && (e.currentTarget.style.background = "#45a049")
            }
            onMouseOut={(e) =>
              isFormComplete && (e.currentTarget.style.background = "#4CAF50")
            }
          >
            <span style={{ fontSize: "3em", marginBottom: 10 }}>
              {item.icon}
            </span>
            {item.title}
          </div>
        ))}
      </div>
      {!isFormComplete && (
        <p style={{ color: "red", marginTop: "15px" }}>
          Please fill in both **Crop** and **Location** to activate the tools.
        </p>
      )}
    </div>
  );
}
