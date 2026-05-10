const { PrismaClient } = require("@prisma/client");
const { subDays, startOfDay } = require("date-fns");

const prisma = new PrismaClient();

async function runBenchmark() {
  console.log("⏱️ STARTING LIVE BACKEND LATENCY BENCHMARK...");
  
  // We'll pick an org ID to test. Let's grab the first one in the DB.
  const firstOrg = await prisma.organization.findFirst();
  if (!firstOrg) {
    console.log("No organization found in DB to test with.");
    process.exit(1);
  }
  const orgId = firstOrg.id;
  console.log(`Using sample Org ID: ${orgId}`);

  console.log("\n----------------------------------------------------");
  console.log("🔬 TESTING NEW PARALLEL LOGIC...");
  
  const startTime = performance.now();

  try {
    // REPLICATING THE EXACT FIX CODE:
    const [
      totalAudience, totalDispatched, openCount, clickCount, bounceCount, deliveredCount, recentEvents, latestCampaigns
    ] = await Promise.all([
      prisma.contact.count({ where: { status: "active", org_id: orgId } }),
      prisma.campaignSend.count({ where: { campaign: { org_id: orgId } } }),
      prisma.emailEvent.count({ where: { event_type: "opened", campaign: { org_id: orgId } } }),
      prisma.emailEvent.count({ where: { event_type: "clicked", campaign: { org_id: orgId } } }),
      prisma.campaignSend.count({ where: { status: "bounced", campaign: { org_id: orgId } } }),
      prisma.campaignSend.count({ where: { status: "delivered", campaign: { org_id: orgId } } }),
      prisma.emailEvent.findMany({ where: { campaign: { org_id: orgId } }, take: 5 }),
      prisma.campaign.findMany({ where: { status: "sent", org_id: orgId }, take: 3 }),
    ]);

    const chartRanges = Array.from({ length: 7 }).map((_, i) => {
      const day = subDays(new Date(), 6 - i);
      const start = startOfDay(day);
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      return { day, start, end };
    });

    const performanceData = await Promise.all(
      chartRanges.map(async ({ start, end }) => {
        const [sent, opens, clicks] = await Promise.all([
          prisma.campaignSend.count({ where: { sent_at: { gte: start, lt: end }, campaign: { org_id: orgId } } }),
          prisma.emailEvent.count({ where: { event_type: "opened", occurred_at: { gte: start, lt: end }, campaign: { org_id: orgId } } }),
          prisma.emailEvent.count({ where: { event_type: "clicked", occurred_at: { gte: start, lt: end }, campaign: { org_id: orgId } } })
        ]);
        return { sent, opens, clicks };
      })
    );

    const endTime = performance.now();
    const parallelTimeMs = (endTime - startTime).toFixed(0);
    
    console.log(`✅ SUCCESS! All 29 Queries Completed in Parallel.`);
    console.log(`🚀 TOTAL LATENCY: ${parallelTimeMs}ms`);
    console.log("----------------------------------------------------");

    // ESTIMATING PREVIOUS SEQUENTIAL EXECUTION TIME:
    // Based on average query time in this network:
    const avgSingleQueryTime = parallelTimeMs; // Actually it's less, but let's assume each parallel block had a base wait.
    
    // Let's do ONE tiny sample query to get the single network hop RTT.
    const hopStart = performance.now();
    await prisma.contact.count({ where: { id: "nonexistent" } });
    const hopEnd = performance.now();
    const rtt = (hopEnd - hopStart);
    
    console.log(`📈 Network Ping to Supabase (Tokyo): ~${rtt.toFixed(0)}ms RTT`);
    console.log("\n⚖️ COMPARISON ESTIMATE:");
    console.log(`🔴 OLD Sequential Runtime (29 queries * ${rtt.toFixed(0)}ms) = ~${(29 * rtt).toFixed(0)}ms`);
    console.log(`🟢 NEW Parallel Runtime = ${parallelTimeMs}ms`);
    
    const multiplier = ((29 * rtt) / parallelTimeMs).toFixed(1);
    console.log(`⚡️ THEORETICAL SPEED GAIN: ${multiplier}x FASTER!`);

  } catch (e) {
    console.error("Test error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

runBenchmark();
