import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const prefix = process.argv[2] || "baseline";
const outputDir = "docs/audit-reports";

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const AUDITS = [
  {
    name: "Customer App (Desktop)",
    url: "http://localhost:3000",
    preset: "desktop",
    baseFilename: `${prefix}-lighthouse-customer-desktop`,
  },
  {
    name: "Customer App (Mobile)",
    url: "http://localhost:3000",
    preset: "mobile",
    baseFilename: `${prefix}-lighthouse-customer-mobile`,
  },
  {
    name: "Admin Panel (Desktop)",
    url: "http://localhost:3001",
    preset: "desktop",
    baseFilename: `${prefix}-lighthouse-admin-desktop`,
  },
  {
    name: "Admin Panel (Mobile)",
    url: "http://localhost:3001",
    preset: "mobile",
    baseFilename: `${prefix}-lighthouse-admin-mobile`,
  },
];

console.log(`=== Starting Lighthouse Audit Suite (${prefix.toUpperCase()}) ===\n`);

const summary = [];

for (const audit of AUDITS) {
  console.log(`Auditing ${audit.name} at ${audit.url} (${audit.preset})...`);
  const outputPath = path.join(outputDir, audit.baseFilename);

  const presetFlag = audit.preset === "desktop" ? "--preset=desktop" : "";
  const cmd = `npx lighthouse ${audit.url} --output=json,html --output-path=${outputPath} ${presetFlag} --chrome-flags="--headless --no-sandbox" --only-categories=performance,accessibility,best-practices,seo`;

  try {
    execSync(cmd, { stdio: "ignore" });

    // Read the generated JSON report to extract summary scores
    const jsonPath = `${outputPath}.report.json`;
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
      const perf = Math.round((data.categories.performance?.score || 0) * 100);
      const a11y = Math.round((data.categories.accessibility?.score || 0) * 100);
      const bp = Math.round((data.categories["best-practices"]?.score || 0) * 100);
      const seo = Math.round((data.categories.seo?.score || 0) * 100);

      const fcp = data.audits["first-contentful-paint"]?.displayValue || "N/A";
      const lcp = data.audits["largest-contentful-paint"]?.displayValue || "N/A";
      const tbt = data.audits["total-blocking-time"]?.displayValue || "N/A";
      const cls = data.audits["cumulative-layout-shift"]?.displayValue || "N/A";

      const scoreEntry = {
        name: audit.name,
        preset: audit.preset,
        scores: { performance: perf, accessibility: a11y, bestPractices: bp, seo: seo },
        vitals: { fcp, lcp, tbt, cls },
        reportJson: `${outputPath}.report.json`,
        reportHtml: `${outputPath}.report.html`,
      };

      summary.push(scoreEntry);
      console.log(`  -> Scores: Perf: ${perf} | A11y: ${a11y} | Best Practices: ${bp} | SEO: ${seo}`);
      console.log(`  -> Vitals: FCP: ${fcp} | LCP: ${lcp} | TBT: ${tbt} | CLS: ${cls}\n`);
    }
  } catch (err) {
    console.error(`  -> Failed auditing ${audit.name}:`, err.message);
  }
}

const summaryPath = path.join(outputDir, `${prefix}-lighthouse-summary.json`);
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
console.log(`Lighthouse suite finished. Summary saved to: ${summaryPath}`);
