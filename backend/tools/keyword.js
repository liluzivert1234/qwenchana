// Simple keyword extraction utility
// Extract crop, location, and intent keywords from a user sentence.
// Fallback to provided crop/location from request body if not found.

const KNOWN_CROPS = ["rice", "palay", "corn", "maize", "banana", "mango"];

export function extractKeywords({ message = "", crop, location }) {
  const lower = message.toLowerCase();
  let foundCrop = KNOWN_CROPS.find(c => lower.includes(c)) || (crop ? crop.toLowerCase() : null);
  let foundLocation = location || null; // Could be enhanced with a geo lookup or regex

  // Simple intent detection
  let intent = "general";
  if (/presyo|price|benta|sell/.test(lower)) intent = "price";
  else if (/ulan|weather|forecast|bagyo|rain/.test(lower)) intent = "weather";
  else if (/ani|harvest|pataba|fertilizer|peste|technique|practice|tanong/.test(lower)) intent = "technique";

  return { crop: foundCrop, location: foundLocation, intent };
}
