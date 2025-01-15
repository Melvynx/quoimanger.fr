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
          ('Pizza', 'Sushi', 'https://www.themealdb.com/images/media/meals/x0lk931587671540.jpg', 'https://www.themealdb.com/images/media/meals/g046bb1663960946.jpg'),
          ('Tacos', 'Hamburger', 'https://www.themealdb.com/images/media/meals/ypxvwv1505333929.jpg', 'https://www.themealdb.com/images/media/meals/k420tj1585565244.jpg'),
          ('Pasta', 'Ramen', 'https://www.themealdb.com/images/media/meals/wvqpwt1468339226.jpg', 'https://images.unsplash.com/photo-1591325418441-ff678baf78ef?q=80&w=3474&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),
          ('Steak', 'Falafel', 'https://images.unsplash.com/photo-1504973960431-1c467e159aa4?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 'https://images.unsplash.com/photo-1558458601-0d69a278b8e6?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),
          ('Kebab', 'Couscous', 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?q=80&w=3552&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 'https://images.unsplash.com/photo-1582576163090-09d3b6f8a969?q=80&w=3571&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),
          ('Moussaka', 'Raclette', 'https://www.themealdb.com/images/media/meals/ctg8jd1585563097.jpg', 'https://images.unsplash.com/photo-1657828514361-e95409cac913?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),
          ('BBQ Ribs', 'Poutine', 'https://images.unsplash.com/photo-1623174479658-79fb603acf60?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 'https://images.unsplash.com/photo-1586805608485-add336722759?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),
          ('Shakshuka', 'Fish and Chips', 'https://images.unsplash.com/photo-1584278859380-c94d92e083dd?q=80&w=3571&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 'https://images.unsplash.com/photo-1553557202-e8e60357f061?q=80&w=3474&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),
          ('Pasta', 'Steak', 'https://www.themealdb.com/images/media/meals/wvqpwt1468339226.jpg', 'https://images.unsplash.com/photo-1504973960431-1c467e159aa4?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),
          ('Ramen', 'Kebab', 'https://images.unsplash.com/photo-1591325418441-ff678baf78ef?q=80&w=3474&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?q=80&w=3552&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),
          ('Falafel', 'Moussaka', 'https://images.unsplash.com/photo-1558458601-0d69a278b8e6?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 'https://www.themealdb.com/images/media/meals/ctg8jd1585563097.jpg'),
          ('Couscous', 'BBQ Ribs', 'https://images.unsplash.com/photo-1582576163090-09d3b6f8a969?q=80&w=3571&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 'https://images.unsplash.com/photo-1623174479658-79fb603acf60?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),
          ('Raclette', 'Shakshuka', 'https://images.unsplash.com/photo-1657828514361-e95409cac913?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 'https://images.unsplash.com/photo-1584278859380-c94d92e083dd?q=80&w=3571&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),
          ('Poutine', 'Fish and Chips', 'https://images.unsplash.com/photo-1586805608485-add336722759?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 'https://images.unsplash.com/photo-1553557202-e8e60357f061?q=80&w=3474&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),
          ('Steak', 'Ramen', 'https://images.unsplash.com/photo-1504973960431-1c467e159aa4?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 'https://images.unsplash.com/photo-1591325418441-ff678baf78ef?q=80&w=3474&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),
          ('Kebab', 'Falafel', 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?q=80&w=3552&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 'https://images.unsplash.com/photo-1558458601-0d69a278b8e6?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),
          ('Moussaka', 'Couscous', 'https://www.themealdb.com/images/media/meals/ctg8jd1585563097.jpg', 'https://images.unsplash.com/photo-1582576163090-09d3b6f8a969?q=80&w=3571&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),
          ('BBQ Ribs', 'Raclette', 'https://images.unsplash.com/photo-1623174479658-79fb603acf60?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 'https://images.unsplash.com/photo-1657828514361-e95409cac913?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),
          ('Raclette', 'Pizza', 'https://images.unsplash.com/photo-1657828514361-e95409cac913?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 'https://www.themealdb.com/images/media/meals/x0lk931587671540.jpg'),
          ('Sushi', 'Tacos', 'https://www.themealdb.com/images/media/meals/g046bb1663960946.jpg', 'https://www.themealdb.com/images/media/meals/ypxvwv1505333929.jpg'),
          ('Hamburger', 'Fish and Chips', 'https://www.themealdb.com/images/media/meals/k420tj1585565244.jpg', 'https://images.unsplash.com/photo-1553557202-e8e60357f061?q=80&w=3474&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),
          ('Pasta', 'Poutine', 'https://www.themealdb.com/images/media/meals/wvqpwt1468339226.jpg', 'https://images.unsplash.com/photo-1586805608485-add336722759?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),
          ('BBQ Ribs', 'Sushi', 'https://images.unsplash.com/photo-1623174479658-79fb603acf60?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 'https://www.themealdb.com/images/media/meals/g046bb1663960946.jpg'),
          ('Shakshuka', 'Couscous', 'https://images.unsplash.com/photo-1584278859380-c94d92e083dd?q=80&w=3571&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 'https://images.unsplash.com/photo-1582576163090-09d3b6f8a969?q=80&w=3571&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),
          ('Pizza', 'Moussaka', 'https://www.themealdb.com/images/media/meals/x0lk931587671540.jpg', 'https://www.themealdb.com/images/media/meals/ctg8jd1585563097.jpg'),
          ('Hamburger', 'Kebab', 'https://www.themealdb.com/images/media/meals/k420tj1585565244.jpg', 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?q=80&w=3552&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')
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
