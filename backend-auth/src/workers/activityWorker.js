/**
 * Activity Event Worker
 * =====================
 * Consumes events from the Redis `activity_events` queue (pushed by
 * the FastAPI backend via LPUSH) and persists them to MongoDB.
 *
 * Start:  npm run worker
 */

require("dotenv").config();

const Redis = require("ioredis");
const connectDatabase = require("../config/database");
const ActivityLog = require("../models/ActivityLog");

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379/0";
const QUEUE_NAME = "activity_events";

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
      const result = await redis.brpop(QUEUE_NAME, 0);
      if (!result) continue;

      const [, raw] = result;
      await processEvent(raw);
    } catch (err) {
      if (err.message?.includes("Connection is closed")) {
        console.error("[worker] Redis connection lost — reconnecting in 3 s …");
        await sleep(3000);
        continue;
      }
      console.error("[worker] error processing event:", err.message);
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function start() {
  await connectDatabase();

  redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    retryStrategy(times) {
      const delay = Math.min(times * 2000, 30000); // cap at 30 s
      console.warn(`[worker] Redis unavailable — retrying in ${delay / 1000} s (attempt ${times})`);
      return delay;
    },
  });

  redis.on("connect", () => console.log("[worker] Redis connected"));
  // ioredis requires an 'error' listener to avoid unhandled-exception crashes.
  // Actual retry messaging is handled by retryStrategy above — suppress noise here.
  redis.on("error", () => {});
  redis.on("reconnecting", () => {});

  await pollLoop();
}

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
