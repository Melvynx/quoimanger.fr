import { existsSync, mkdirSync, statSync } from "fs";
import { dirname, join } from "path";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure the db directory exists
const dbDir = join(__dirname, "db");
const dbPath = join(dbDir, "db.sqlite");

export async function initDb() {
  console.log("Initializing database...");
  console.log(`Database directory: ${dbDir}`);
  console.log(`Database path: ${dbPath}`);

  // Create db directory if it doesn't exist
  if (!existsSync(dbDir)) {
    console.log("Creating database directory...");
    mkdirSync(dbDir, { recursive: true });
  }

  // Check if we can access the directory
  try {
    const dirStats = statSync(dbDir);
    console.log(
      `Database directory exists and is ${
        dirStats.isDirectory() ? "a directory" : "not a directory"
      }`
    );
  } catch (err) {
    console.error(`Error accessing database directory: ${err.message}`);
    throw new Error("Cannot access database directory");
  }

  // If db file exists, check if it's accessible
  if (existsSync(dbPath)) {
    try {
      const fileStats = statSync(dbPath);
      console.log(`Database file exists (size: ${fileStats.size} bytes)`);
    } catch (err) {
      console.error(`Error accessing database file: ${err.message}`);
      throw new Error("Cannot access database file");
    }
  } else {
    console.log("Database file does not exist, it will be created");
  }

  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
      mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
    });

    console.log("Database connection established");

    await db.exec(`
      CREATE TABLE IF NOT EXISTS challenges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        left_label TEXT NOT NULL,
        right_label TEXT NOT NULL,
        left_img_url TEXT NOT NULL,
        right_img_url TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        challenge_id INTEGER NOT NULL,
        ip_address TEXT NOT NULL,
        choice TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    console.log("Database tables created/verified");

    // Insert seed data if no challenges exist
    const existingChallenges = await db.get(
      "SELECT COUNT(*) as count FROM challenges"
    );

    if (existingChallenges.count === 0) {
      console.log("Inserting seed data...");
      await db.run(`
        INSERT INTO challenges (left_label, right_label, left_img_url, right_img_url)
        VALUES
          ('Pizza', 'Sushi', '/images/pizza.jpg', '/images/sushi.jpg'),
          ('Tacos', 'Hamburger', '/images/tacos.jpg', '/images/hamburger.jpg')
      `);
      console.log("Seed data inserted");
    } else {
      console.log(`Database contains ${existingChallenges.count} challenges`);
    }

    return db;
  } catch (err) {
    console.error("Database initialization error:", err);
    throw err;
  }
}

// Fonction pour générer des votes aléatoires
export async function generateRandomVotes(db, numberOfVotes = 100) {
  try {
    console.log(`Generating ${numberOfVotes} random votes...`);

    // D'abord, récupérer tous les IDs de challenges
    const challenges = await db.all("SELECT id FROM challenges");

    if (challenges.length === 0) {
      throw new Error("No challenges found in database");
    }

    // Préparer la requête d'insertion
    const stmt = await db.prepare(`
      INSERT INTO votes (challenge_id, ip_address, choice, created_at)
      VALUES (?, ?, ?, datetime('now', '-' || ? || ' minutes'))
    `);

    // Générer les votes
    for (let i = 0; i < numberOfVotes; i++) {
      const challengeId =
        challenges[Math.floor(Math.random() * challenges.length)].id;
      const ipParts = Array.from({ length: 4 }, () =>
        Math.floor(Math.random() * 256)
      );
      const ipAddress = ipParts.join(".");
      const choice = Math.random() < 0.5 ? "left" : "right";
      const minutesAgo = Math.floor(Math.random() * 10080); // Random time within last week

      await stmt.run(challengeId, ipAddress, choice, minutesAgo);
    }

    await stmt.finalize();
    console.log(`Successfully generated ${numberOfVotes} random votes`);
  } catch (err) {
    console.error("Error generating random votes:", err);
    throw err;
  }
}
