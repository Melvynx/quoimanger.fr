import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { initDb } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public/
app.use(express.static(path.join(__dirname, "public")));

let db;
initDb().then((database) => {
  db = database;
  console.log("Database initialized");
});

// Utility function to get client IP
function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress
  );
}

// Utility function to count votes for a challenge
async function getVoteCounts(challengeId) {
  const counts = await db.get(
    `SELECT
      SUM(CASE WHEN choice = 'left' THEN 1 ELSE 0 END) AS left_votes,
      SUM(CASE WHEN choice = 'right' THEN 1 ELSE 0 END) AS right_votes
    FROM votes
    WHERE challenge_id = ?`,
    [challengeId]
  );

  return {
    leftVotes: counts.left_votes || 0,
    rightVotes: counts.right_votes || 0,
  };
}

// Get random challenge, prioritizing unvoted ones
app.get("/api/challenges/current", async (req, res) => {
  try {
    const clientIp = getClientIp(req);

    // First try to get an unvoted challenge
    let row = await db.get(
      `
      SELECT c.* 
      FROM challenges c
      WHERE NOT EXISTS (
        SELECT 1 
        FROM votes v 
        WHERE v.challenge_id = c.id 
        AND v.ip_address = ?
      )
      ORDER BY RANDOM() 
      LIMIT 1
    `,
      [clientIp]
    );

    // If no unvoted challenge found, get any random challenge
    if (!row) {
      row = await db.get(`
        SELECT * FROM challenges 
        ORDER BY RANDOM() 
        LIMIT 1
      `);
    }

    res.json(row);
  } catch (error) {
    console.error("Error fetching challenge:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Vote
app.post("/api/vote", async (req, res) => {
  try {
    const { challengeId, choice } = req.body;
    const ipAddress = getClientIp(req);

    // Check if IP has already voted on this challenge
    const existingVote = await db.get(
      `SELECT id FROM votes WHERE challenge_id = ? AND ip_address = ?`,
      [challengeId, ipAddress]
    );

    // If already voted, return current results without counting new vote
    if (existingVote) {
      const counts = await getVoteCounts(challengeId);
      return res.json({ success: true, ...counts });
    }

    // Insert new vote
    await db.run(
      `INSERT INTO votes (challenge_id, ip_address, choice) VALUES (?, ?, ?)`,
      [challengeId, ipAddress, choice]
    );

    // Get updated vote counts
    const counts = await getVoteCounts(challengeId);
    res.json({ success: true, ...counts });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get results
app.get("/api/results/:challengeId", async (req, res) => {
  try {
    const { challengeId } = req.params;
    const counts = await getVoteCounts(challengeId);
    res.json(counts);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
