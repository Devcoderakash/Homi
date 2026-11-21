import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlFile = path.join(__dirname, "clear-demo-data.sql");

const dbUser = process.env.DB_USER || "akashlodhi";
const dbName = process.env.DB_NAME || "homi";

console.log(`Connecting to PostgreSQL database: ${dbName} (User: ${dbUser})...`);

try {
  const output = execSync(`psql -U "${dbUser}" -d "${dbName}" -f "${sqlFile}"`, {
    encoding: "utf-8",
  });
  console.log(output);
  console.log("COMPLETE DATA WIPE SUCCESSFUL!");
} catch (err) {
  console.error("Error executing data wipe:", err.message);
  process.exit(1);
}
