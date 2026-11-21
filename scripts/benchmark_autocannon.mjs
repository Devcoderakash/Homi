import autocannon from "autocannon";
import fs from "fs";

async function getTokens() {
  const adminRes = await fetch("http://localhost:4000/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@homi.demo", password: "demo1234" }),
  });
  const adminData = await adminRes.json();

  const custRes = await fetch("http://localhost:4000/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "audit-benchmark@homi.local", password: "BenchmarkPass123!" }),
  });
  const custData = await custRes.json();

  return {
    adminToken: adminData.token,
    customerToken: custData.token,
  };
}

const DURATION_SECONDS = parseInt(process.env.DURATION || "10", 10);
const CONCURRENCY_LEVELS = [10, 50, 100];

async function runBenchmark(outputPath) {
  const tokens = await getTokens();

  const SCENARIOS = [
    { name: "Health Endpoint", path: "/api/health", headers: {} },
    { name: "Service Categories (Public)", path: "/api/v1/categories", headers: {} },
    { name: "Worker Listing (Public)", path: "/api/v1/workers", headers: {} },
    { name: "Customer Requests (Auth)", path: "/api/v1/customer/requests", headers: { Authorization: `Bearer ${tokens.customerToken}` } },
    { name: "Admin Dashboard (Auth)", path: "/api/v1/admin/dashboard", headers: { Authorization: `Bearer ${tokens.adminToken}` } },
  ];
  const allResults = [];
  console.log(`Starting Autocannon Benchmark Suite (Duration: ${DURATION_SECONDS}s per test)...`);

  for (const scenario of SCENARIOS) {
    for (const c of CONCURRENCY_LEVELS) {
      console.log(`Testing [${scenario.name}] with ${c} concurrent connections...`);
      const url = `http://localhost:4000${scenario.path}`;

      const res = await autocannon({
        url,
        connections: c,
        duration: DURATION_SECONDS,
        headers: scenario.headers,
        pipelining: 1,
      });

      const metrics = {
        scenario: scenario.name,
        endpoint: scenario.path,
        connections: c,
        durationSeconds: DURATION_SECONDS,
        requestsTotal: res.requests.total,
        requestsAverage: res.requests.average,
        requestsPerSec: res.requests.mean,
        latencyAverageMs: res.latency.mean,
        latencyP50Ms: res.latency.p50,
        latencyP90Ms: res.latency.p90,
        latencyP97_5Ms: res.latency.p97_5,
        latencyP99Ms: res.latency.p99,
        latencyMaxMs: res.latency.max,
        throughputBytesPerSec: res.throughput.mean,
        errors: res.errors,
        timeouts: res.timeouts,
        non2xx: res.non2xx,
      };

      console.log(`  -> Req/sec: ${metrics.requestsPerSec.toFixed(1)} | Avg Latency: ${metrics.latencyAverageMs.toFixed(1)}ms | p99: ${metrics.latencyP99Ms}ms | Errors: ${metrics.errors}`);
      allResults.push(metrics);
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));
  console.log(`Benchmark completed. Results saved to: ${outputPath}`);
}

const targetPath = process.argv[2] || "docs/audit-reports/baseline-autocannon.json";
runBenchmark(targetPath).catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
