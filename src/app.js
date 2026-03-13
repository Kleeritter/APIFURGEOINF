const express = require("express");
const path = require("path");
const app = express();
const cors = require("cors");
const api = require("./api");

app.use(cors());

// JSON und URL-encoded VOR den Routen
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Bilder unter /images/ erreichbar
app.use("/images", express.static(path.join(__dirname, "public", "images")));

app.listen(8000, function () {
  console.log("API listens on PORT 5001");
});

app.get("/markers", api.getMarkers);
app.get("/markers/:id", api.getMarkerById);
app.post("/markers", api.createMarker);
app.put("/markers/:id", api.updateMarker);
app.delete("/markers/:id", api.deleteMarker);

app.get("/markers/:id/notes", api.getNotesByMarkerId);
app.post("/markers/:id/notes", api.addNote);
app.delete("/notes/:id", api.deleteNote);
