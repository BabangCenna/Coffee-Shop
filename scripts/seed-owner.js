/**
 * scripts/seed-owner.js
 *
 * Creates the first Owner account in the database.
 *
 * Usage:
 *   node scripts/seed-owner.js
 *
 * Or add to package.json:
 *   "scripts": { "seed:owner": "node scripts/seed-owner.js" }
 * Then: npm run seed:owner
 *
 * Required env vars in .env.local:
 *   TURSO_DATABASE_URL=...
 *   TURSO_AUTH_TOKEN=...
 */

import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import * as readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { config } from "dotenv";

// Load .env.local
config({ path: ".env.local" });

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function prompt(rl, question) {
  return (await rl.question(question)).trim();
}

async function main() {
  const rl = readline.createInterface({ input, output });

  console.log("\n╔══════════════════════════════════╗");
  console.log("║   Forêt — Create Owner Account  ║");
  console.log("╚══════════════════════════════════╝\n");

  // Check if an owner already exists
  const existing = await db.execute({
    sql: `
      SELECT u.id, u.full_name FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE r.role_key = 'owner'
      LIMIT 1
    `,
    args: [],
  });

  if (existing.rows.length > 0) {
    console.log(`⚠  Owner already exists: "${existing.rows[0].full_name}"`);
    const proceed = await prompt(rl, "Create another owner anyway? (y/N): ");
    if (proceed.toLowerCase() !== "y") {
      console.log("Aborted.");
      rl.close();
      db.close();
      return;
    }
  }

  // Collect details
  const full_name = "Aulia Uways Al Qorni";
  const username = "Madewa007";
  const phone = "087712411522";
  const password = "Madewa007";

  if (!full_name || !username || !password) {
    console.error("\n✗  Full name, username, and password are required.");
    rl.close();
    db.close();
    return;
  }

  // Check username is unique
  const userCheck = await db.execute({
    sql: `SELECT id FROM users WHERE LOWER(username) = ?`,
    args: [username.toLowerCase()],
  });
  if (userCheck.rows.length > 0) {
    console.error(`\n✗  Username "${username}" is already taken.`);
    rl.close();
    db.close();
    return;
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, 12);

  // Get owner role id
  const roleResult = await db.execute({
    sql: `SELECT id FROM roles WHERE role_key = 'owner' LIMIT 1`,
    args: [],
  });

  if (!roleResult.rows[0]) {
    console.error(
      "\n✗  Owner role not found. Have you run the seed SQL from the schema?",
    );
    rl.close();
    db.close();
    return;
  }

  const role_id = roleResult.rows[0].id;

  // Insert user
  await db.execute({
    sql: `
      INSERT INTO users (full_name, username, phone, password_hash, role_id, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `,
    args: [full_name, username, phone || null, password_hash, role_id],
  });

  console.log("\n✓  Owner account created successfully!");
  console.log(`   Name     : ${full_name}`);
  console.log(`   Username : ${username}`);
  if (phone) console.log(`   Phone    : ${phone}`);
  console.log("\n   You can now log in at /login\n");

  rl.close();
  db.close();
}

main().catch((err) => {
  console.error("\n✗  Seed failed:", err.message);
  process.exit(1);
});
