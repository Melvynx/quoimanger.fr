import { generateRandomVotes, initDb } from "../db.js";

async function main() {
  const db = await initDb();
  await generateRandomVotes(db, 500); // Génère 500 votes aléatoires
  process.exit(0);
}

main().catch(console.error);
