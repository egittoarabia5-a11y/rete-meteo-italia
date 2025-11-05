import express from "express";
import fetch from "node-fetch";
import fs from "fs/promises";

const app = express();
const PORT = process.env.PORT || 3000;

// Servi i file statici (index.html, CSS, ecc.)
app.use(express.static("public"));

app.get("/api/meteo3r", async (req, res) => {
  const url = "https://www.meteo3r.it/dati/mappe/misure.geojson";
  let geojson;

  try {
    console.log("🌍 Tentativo fetch Meteo3R...");
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      },
      timeout: 10000
    });

    if (!response.ok) throw new Error("HTTP " + response.status);
    geojson = await response.json();
    console.log("✅ Dati Meteo3R scaricati correttamente");
  } catch (err) {
    console.warn("⚠️ Errore fetch remoto, uso file locale:", err.message);

    try {
      const raw = await fs.readFile("./public/misure.geojson", "utf-8");
      geojson = JSON.parse(raw);
      console.log("📂 Dati caricati dal file locale ./public/misure.geojson");
    } catch (fileErr) {
      console.error("❌ Errore nel leggere il file locale:", fileErr.message);
      return res.status(500).json({ error: "Impossibile ottenere i dati Meteo3R" });
    }
  }

  try {
    const timestamp = new Date().toISOString();
    const lines = [JSON.stringify({ timestamp })];

    geojson.features.forEach(st => {
      const id = st.properties.IDRETE_CODSTAZ;
      if (!id.startsWith("PIE") && !id.startsWith("VDA")) return;

      const lat = parseFloat(st.geometry.coordinates[1]);
      const lon = parseFloat(st.geometry.coordinates[0]);
      const temp = st.properties.T !== "" ? parseFloat(st.properties.T) : null;
      const tempHigh = st.properties.T_MAX !== "" ? parseFloat(st.properties.T_MAX) : null;
      const tempLow = st.properties.T_MIN !== "" ? parseFloat(st.properties.T_MIN) : null;
      const hum = st.properties.U !== "" ? parseFloat(st.properties.U) : null;
      const humHigh = st.properties.U_MAX !== "" ? parseFloat(st.properties.U_MAX) : null;
      const humLow = st.properties.U_MIN !== "" ? parseFloat(st.properties.U_MIN) : null;
      const wind = st.properties.VV !== "" ? parseFloat(st.properties.VV) : null;
      const windGust = st.properties.VV_MAX !== "" ? parseFloat(st.properties.VV_MAX) : null;
      const rainDaily = st.properties.P_24H !== "" ? parseFloat(st.properties.P_24H) : null;
      const rainRate = st.properties.P !== "" ? parseFloat(st.properties.P) : null;

      const obj = {
        S: (temp == null && hum == null && wind == null && rainDaily == null) ? "1" : "0",
        N: st.properties.STAZIONE || id,
        T: temp, TH: tempHigh, TL: tempLow,
        D: null, DH: null, DL: null,
        H: hum, HH: humHigh, HL: humLow,
        V: wind, G: windGust,
        R: rainDaily, RR: rainRate,
        LAT: lat, LON: lon
      };

      lines.push(JSON.stringify(obj));
    });

    res.setHeader("Content-Type", "application/json");
    res.send(lines.join("\n"));
  } catch (err) {
    console.error("Errore elaborazione Meteo3R:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server attivo su http://localhost:${PORT}`);
});
