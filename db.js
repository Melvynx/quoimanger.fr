import { dirname, join } from "path";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function initDb() {
  const db = await open({
    filename: join(__dirname, "db", "db.sqlite"),
    driver: sqlite3.Database,
  });

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

  // Insert seed data if no challenges exist
  const existingChallenges = await db.get(
    "SELECT COUNT(*) as count FROM challenges"
  );
  if (existingChallenges.count === 0) {
    await db.run(`
      INSERT INTO challenges (left_label, right_label, left_img_url, right_img_url)
      VALUES
        ('Pizza', 'Sushi', '/images/pizza.jpg', '/images/sushi.jpg'),
        ('Tacos', 'Hamburger', '/images/tacos.jpg', '/images/hamburger.jpg')
    `);
  }

  return db;
}

// Fonction pour générer des votes aléatoires
export async function generateRandomVotes(db, numberOfVotes = 100) {
  // D'abord, récupérer tous les IDs de challenges
  const challenges = await db.all("SELECT id FROM challenges");

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
  console.log(`${numberOfVotes} votes aléatoires ont été générés`);
}
