const map = L.map("map").setView([44.4, 8.9], 8);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

fetch("/dati")
  .then(res => res.json())
  .then(data => {
    console.log("Dati ricevuti:", data);
    L.geoJSON(data, {
      pointToLayer: (feature, latlng) =>
        L.circleMarker(latlng, {
          radius: 6,
          fillColor: "#007bff",
          color: "#fff",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
        }).bindPopup(`<b>${feature.properties?.nome || "Stazione"}</b>`)
    }).addTo(map);
  })
  .catch(err => console.error("Errore caricamento dati:", err));
