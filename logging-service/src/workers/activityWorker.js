/**
 * Activity Event Worker
 * =====================
 * Consumes events from the Redis `activity_events` queue (pushed by
 * the FastAPI backend via LPUSH) and persists them to MongoDB using
 * the Mongoose ActivityLog model.
 *
 * Uses BRPOP (blocking pop from the right) so events are processed
 * in FIFO order.  The worker runs an infinite loop and automatically
 * reconnects to Redis on transient failures.
 *
 * Start:  npm run worker
 */

require("dotenv").config();

const Redis = require("ioredis");
const connectDatabase = require("../config/database");
const ActivityLog = require("../models/ActivityLog");

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379/0";
const QUEUE_NAME = "activity_events";
const BRPOP_TIMEOUT = 0; // block indefinitely until an item arrives

let redis;

async function processEvent(raw) {
  const event = JSON.parse(raw);

  const doc = {
    log_id: event.log_id,
    student_id: event.student_id,
    course_id: event.course_id,
    event_type: event.event_type,
    timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
    duration: event.duration ?? null,
    page_url: event.page_url ?? event.metadata?.page_url ?? null,
    session_id: event.session_id ?? event.metadata?.session_id ?? null,
    metadata: event.metadata ?? {},
  };

  await ActivityLog.create(doc);
  console.log(
    `[worker] saved ${doc.event_type} for student ${doc.student_id} (${doc.log_id})`,
  );
}

async function pollLoop() {
  console.log(`[worker] listening on queue "${QUEUE_NAME}" …`);

  while (true) {
    try {
      // BRPOP returns [key, value] or null (null shouldn't happen with timeout 0)
      const result = await redis.brpop(QUEUE_NAME, BRPOP_TIMEOUT);
      if (!result) continue;

      const [, raw] = result;
      await processEvent(raw);
    } catch (err) {
      if (err.message?.includes("Connection is closed")) {
        console.error("[worker] Redis connection lost — reconnecting in 3 s …");
        await sleep(3000);
        continue; // ioredis auto-reconnects; the next brpop will retry
      }
      // Log but don't crash on per-event errors (e.g. bad JSON, validation)
      console.error("[worker] error processing event:", err.message);
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function start() {
  // 1. MongoDB
  await connectDatabase();

  // 2. Redis
  redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null, // allow infinite blocking for BRPOP
    enableReadyCheck: true,
  });

  redis.on("connect", () => console.log("[worker] Redis connected"));
  redis.on("error", (err) => console.error("[worker] Redis error:", err.message));

  // 3. Start consuming
  await pollLoop();
}

// Graceful shutdown
function shutdown(signal) {
  console.log(`\n[worker] ${signal} received — shutting down …`);
  if (redis) redis.disconnect();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

start().catch((err) => {
  console.error("[worker] fatal:", err);
  process.exit(1);
});
