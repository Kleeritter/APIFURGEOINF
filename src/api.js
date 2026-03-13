const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
// PostgreSQL Verbindungspool erstellen
const DATABASE_HOST =
  "https://ep-plain-boat-agwxdval.c-2.eu-central-1.pg.koyeb.app";
const DATABASE_USER = "postgres";
const DATABASE_PASSWORD = "npg_nZdMF2q7NEoC";
const DATABASE_NAME = "koyebdb";
const pool = new Pool({
  host: DATABASE_HOST,
  port: 5432,
  user: DATABASE_USER,
  password: DATABASE_PASSWORD,
  database: DATABASE_NAME,
  ssl: {
    rejectUnauthorized: false, // Wichtig für viele Cloud-Anbieter wie Koyeb/Heroku/Render
  },
});

// Test Datenbankverbindung
pool.on("connect", () => {
  console.log("Successfully connected to PostgreSQL");
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

/**
 * GET /markers
 * Alle Marker abrufen als GeoJSON
 */
const getMarkers = async (req, res) => {
  try {
    const query = `
       SELECT
         id, name, description, latitude, longitude, created_at,
         ST_AsGeoJSON(geometry) as geometry,
         klim_well, sec,
         user_score, laerm_score, image_score, final_score,
         q1, q2, q3, q4, q5, q6, q7, q8, q9, q10,
         laerm_well, aesthatic_well, secure_well,image
       FROM markers
       ORDER BY created_at DESC
     `;
    const result = await pool.query(query);

    const geoJSON = {
      type: "FeatureCollection",
      features: result.rows.map((row) => ({
        type: "Feature",
        properties: {
          id: row.id,
          name: row.name,
          description: row.description,
          created_at: row.created_at,
          klim_well: row.klim_well,
          sec: row.sec,
          user_score: row.user_score,
          laerm_score: row.laerm_score,
          image_score: row.image_score,
          final_score: row.final_score,
          q1: row.q1,
          q2: row.q2,
          q3: row.q3,
          q4: row.q4,
          q5: row.q5,
          q6: row.q6,
          q7: row.q7,
          q8: row.q8,
          q9: row.q9,
          q10: row.q10,
          laerm_well: row.laerm_well,
          aesthatic_well: row.aesthatic_well,
          secure_well: row.secure_well,
          image: row.image,
        },
        geometry: JSON.parse(row.geometry),
      })),
    };
    res.status(200).json(geoJSON);
  } catch (err) {
    console.error("Error fetching markers:", err);
    res.status(500).json({ error: "Error fetching markers" });
  }
};

/**
 * POST /markers
 * Neuen Marker erstellen
 */
const createMarker = async (req, res) => {
  try {
    const {
      name,
      description,
      latitude,
      longitude,
      klim_well,
      sec,
      user_score,
      laerm_score,
      image_score,
      final_score,
      q1,
      q2,
      q3,
      q4,
      q5,
      q6,
      q7,
      q8,
      q9,
      q10,
      laerm_well,
      aesthatic_well,
      secure_well,
      image,
    } = req.body;

    if (!name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: "Invalid latitude or longitude" });
    }

    // Schritt 1: Marker ohne Bild einfügen → ID bekommen
    const insertQuery = `
       INSERT INTO markers (
         name, description, latitude, longitude,
         geometry, klim_well, sec,
         user_score, laerm_score, image_score, final_score,
         q1, q2, q3, q4, q5, q6, q7, q8, q9, q10,
         laerm_well, aesthatic_well, secure_well
       )
       VALUES (
         $1, $2, $3::numeric, $4::numeric,
         ST_SetSRID(ST_Point($4::numeric, $3::numeric), 4326), $5, $6,
         $7, $8, $9, $10,
         $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
         $21, $22, $23
       )
       RETURNING id
     `;

    const insertValues = [
      name,
      description || "",
      lat,
      lng,
      klim_well ?? 0,
      sec ?? null,
      user_score ?? null,
      laerm_score ?? null,
      image_score ?? null,
      final_score ?? null,
      q1 ?? null,
      q2 ?? null,
      q3 ?? null,
      q4 ?? null,
      q5 ?? null,
      q6 ?? null,
      q7 ?? null,
      q8 ?? null,
      q9 ?? null,
      q10 ?? null,
      laerm_well ?? null,
      aesthatic_well ?? null,
      secure_well ?? null,
    ];

    const insertResult = await pool.query(insertQuery, insertValues);
    const newId = insertResult.rows[0].id;

    // Schritt 2: Bild mit ID als Dateiname speichern
    let imageUrl = null;
    if (image) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const imagesDir = path.join(__dirname, "public", "images");
      console.log("Base64 Länge:", base64Data.length);
      console.log("Base64 Anfang:", base64Data.substring(0, 30));

      const buffer = Buffer.from(base64Data, "base64");
      console.log("Buffer Größe:", buffer.length);

      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }

      fs.writeFileSync(
        path.join(imagesDir, `${newId}.jpg`),
        Buffer.from(base64Data, "base64"),
      );
      imageUrl = `/images/${newId}.jpg`;
    }

    // Schritt 3: Image-URL in DB updaten und finalen Marker zurückgeben
    const updateQuery = `
       UPDATE markers SET image = $1 WHERE id = $2
       RETURNING
         id, name, description, latitude, longitude, created_at,
         klim_well, sec, user_score, laerm_score, image_score, final_score,
         q1, q2, q3, q4, q5, q6, q7, q8, q9, q10,
         laerm_well, aesthatic_well, secure_well, image
     `;

    const finalResult = await pool.query(updateQuery, [imageUrl, newId]);
    res.status(201).json(finalResult.rows[0]);
  } catch (err) {
    console.error("Error creating marker:", err);
    res.status(500).json({ error: "Error creating marker" });
  }
};

/**
 * GET /markers/:id
 * Einzelnen Marker mit Notizen abrufen
 */
const getMarkerById = async (req, res) => {
  try {
    const { id } = req.params;

    const markerQuery = `
       SELECT
         id, name, description, latitude, longitude, created_at,
         klim_well, sec,
         user_score, laerm_score, image_score, final_score,
         q1, q2, q3, q4, q5, q6, q7, q8, q9, q10,
         laerm_well, aesthatic_well, secure_well, image
       FROM markers
       WHERE id = $1
     `;
    const markerResult = await pool.query(markerQuery, [id]);

    if (markerResult.rows.length === 0) {
      return res.status(404).json({ error: "Marker not found" });
    }

    const marker = markerResult.rows[0];

    res.status(200).json(marker);
  } catch (err) {
    console.error("Error fetching marker:", err);
    res.status(500).json({ error: "Error fetching marker" });
  }
};

/**
 * PUT /markers/:id
 * Marker aktualisieren
 */
const updateMarker = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      latitude,
      longitude,
      klim_well,
      sec,
      user_score,
      laerm_score,
      image_score,
      final_score,
      q1,
      q2,
      q3,
      q4,
      q5,
      q6,
      q7,
      q8,
      q9,
      q10,
      laerm_well,
      aesthatic_well,
      secure_well,
      image,
    } = req.body;

    const lat = latitude !== undefined ? parseFloat(latitude) : null;
    const lng = longitude !== undefined ? parseFloat(longitude) : null;
    if ((lat !== null && isNaN(lat)) || (lng !== null && isNaN(lng))) {
      return res.status(400).json({ error: "Invalid latitude or longitude" });
    }

    let imageUrl = null;
    if (image === "") {
      // Bild löschen falls vorhanden
      const imagePath = path.join(__dirname, "public", "images", `${id}.jpg`);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log(`Bild gelöscht: ${imagePath}`);
      }
      imageUrl = null;
    } else if (image) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const imagesDir = path.join(__dirname, "public", "images");
      console.log("Base64 Länge:", base64Data.length);
      console.log("Base64 Anfang:", base64Data.substring(0, 30));

      const buffer = Buffer.from(base64Data, "base64");
      console.log("Buffer Größe:", buffer.length);

      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }

      fs.writeFileSync(
        path.join(imagesDir, `${id}.jpg`),
        Buffer.from(base64Data, "base64"),
      );
      imageUrl = `/images/${id}.jpg`;
    }

    const query = `
       UPDATE markers
       SET
         name            = COALESCE($1,  name),
         description     = COALESCE($2,  description),
         latitude        = COALESCE($3::numeric,  latitude),
         longitude       = COALESCE($4::numeric,  longitude),
         geometry        = CASE
                             WHEN $3::numeric IS NOT NULL AND $4::numeric IS NOT NULL
                             THEN ST_SetSRID(ST_Point($4::numeric, $3::numeric), 4326)
                             ELSE geometry
                           END,
         klim_well       = COALESCE($5,  klim_well),
         sec             = COALESCE($6,  sec),
         user_score      = COALESCE($7,  user_score),
         laerm_score     = COALESCE($8,  laerm_score),
         image_score     = COALESCE($9,  image_score),
         final_score     = COALESCE($10, final_score),
         q1              = COALESCE($11, q1),
         q2              = COALESCE($12, q2),
         q3              = COALESCE($13, q3),
         q4              = COALESCE($14, q4),
         q5              = COALESCE($15, q5),
         q6              = COALESCE($16, q6),
         q7              = COALESCE($17, q7),
         q8              = COALESCE($18, q8),
         q9              = COALESCE($19, q9),
         q10             = COALESCE($20, q10),
         laerm_well      = COALESCE($21, laerm_well),
         aesthatic_well  = COALESCE($22, aesthatic_well),
         secure_well     = COALESCE($23, secure_well),
         updated_at      = CURRENT_TIMESTAMP,
         image           = $25
       WHERE id = $24
       RETURNING
         id, name, description, latitude, longitude, updated_at,
         klim_well, sec,
         user_score, laerm_score, image_score, final_score,
         q1, q2, q3, q4, q5, q6, q7, q8, q9, q10,
         laerm_well, aesthatic_well, secure_well, image
     `;

    const values = [
      name ?? null,
      description ?? null,
      lat,
      lng,
      klim_well ?? null,
      sec ?? null,
      user_score ?? null,
      laerm_score ?? null,
      image_score ?? null,
      final_score ?? null,
      q1 ?? null,
      q2 ?? null,
      q3 ?? null,
      q4 ?? null,
      q5 ?? null,
      q6 ?? null,
      q7 ?? null,
      q8 ?? null,
      q9 ?? null,
      q10 ?? null,
      laerm_well ?? null,
      aesthatic_well ?? null,
      secure_well ?? null,
      id,
      imageUrl,
    ];

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Marker not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error updating marker:", err);
    res.status(500).json({ error: "Error updating marker" });
  }
};

/**
 * DELETE /markers/:id
 * Marker löschen (Notizen werden automatisch durch CASCADE gelöscht)
 */
const deleteMarker = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `DELETE FROM markers WHERE id = $1 RETURNING id`;
    const result = await pool.query(query, [id]);
    // delete auch image
    const imagePath = path.join(__dirname, "public", "images", `${id}.jpg`);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      console.log(`Bild gelöscht: ${imagePath}`);
    }
    imageUrl = null;
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Marker not found" });
    }

    res.status(200).json({ message: "Marker deleted successfully" });
  } catch (err) {
    console.error("Error deleting marker:", err);
    res.status(500).json({ error: "Error deleting marker" });
  }
};

/**
 * POST /markers/:id/notes
 * Notiz zu einem Marker hinzufügen
 */
const addNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note_text } = req.body;

    if (!note_text) {
      return res.status(400).json({ error: "Note text is required" });
    }

    // Überprüfe, ob Marker existiert
    const markerCheck = await pool.query(
      "SELECT id FROM markers WHERE id = $1",
      [id],
    );
    if (markerCheck.rows.length === 0) {
      return res.status(404).json({ error: "Marker not found" });
    }

    const query = `
            INSERT INTO notes (marker_id, note_text)
            VALUES ($1, $2)
            RETURNING id, marker_id, note_text, created_at
        `;

    const result = await pool.query(query, [id, note_text]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error adding note:", err);
    res.status(500).json({ error: "Error adding note" });
  }
};

/**
 * GET /markers/:id/notes
 * Alle Notizen für einen Marker abrufen
 */
const getNotesByMarkerId = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
            SELECT id, marker_id, note_text, created_at
            FROM notes
            WHERE marker_id = $1
            ORDER BY created_at DESC
        `;

    const result = await pool.query(query, [id]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching notes:", err);
    res.status(500).json({ error: "Error fetching notes" });
  }
};

/**
 * DELETE /notes/:id
 * Einzelne Notiz löschen
 */
const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `DELETE FROM notes WHERE id = $1 RETURNING id`;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.status(200).json({ message: "Note deleted successfully" });
  } catch (err) {
    console.error("Error deleting note:", err);
    res.status(500).json({ error: "Error deleting note" });
  }
};

module.exports = {
  getMarkers,
  createMarker,
  getMarkerById,
  updateMarker,
  deleteMarker,
  addNote,
  getNotesByMarkerId,
  deleteNote,
};
