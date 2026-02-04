import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-861a1fb5/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Test endpoint to check KV store
app.get("/make-server-861a1fb5/test", async (c) => {
  try {
    await kv.set("test-key", { value: "test", timestamp: new Date().toISOString() });
    const testData = await kv.get("test-key");
    return c.json({ 
      status: "ok", 
      message: "KV store is working",
      testData 
    });
  } catch (error) {
    return c.json({ 
      status: "error", 
      message: `KV store error: ${error}` 
    }, 500);
  }
});

// Initialize vote data if not exists
async function initializeVotes() {
  const locationVotes = await kv.get("location-votes");
  const dateVotes = await kv.get("date-votes");
  
  if (!locationVotes) {
    await kv.set("location-votes", {
      "Bebek Kaleo Jababeka": 0,
      "Tana Bambu Cibubur": 0,
      "Sudut Kedai Metland": 0,
      "Ayam Taliwang Kotwis": 0
    });
  }
  
  if (!dateVotes) {
    await kv.set("date-votes", {
      "7 Maret 2026": 0,
      "8 Maret 2026": 0,
      "14 Maret 2026": 0
    });
  }
}

// Get all votes
app.get("/make-server-861a1fb5/votes", async (c) => {
  try {
    await initializeVotes();
    const locationVotes = await kv.get("location-votes");
    const dateVotes = await kv.get("date-votes");
    
    return c.json({
      locationVotes: locationVotes || {},
      dateVotes: dateVotes || {}
    });
  } catch (error) {
    console.log(`Error getting votes: ${error}`);
    return c.json({ error: "Failed to get votes" }, 500);
  }
});

// Vote for location
app.post("/make-server-861a1fb5/vote/location", async (c) => {
  try {
    const { location } = await c.req.json();
    
    if (!location) {
      return c.json({ error: "Location is required" }, 400);
    }
    
    await initializeVotes();
    const votes = await kv.get("location-votes");
    
    if (votes && location in votes) {
      votes[location] = (votes[location] || 0) + 1;
      await kv.set("location-votes", votes);
      return c.json({ success: true, votes });
    }
    
    return c.json({ error: "Invalid location" }, 400);
  } catch (error) {
    console.log(`Error voting for location: ${error}`);
    return c.json({ error: "Failed to vote" }, 500);
  }
});

// Vote for date
app.post("/make-server-861a1fb5/vote/date", async (c) => {
  try {
    const { date } = await c.req.json();
    
    if (!date) {
      return c.json({ error: "Date is required" }, 400);
    }
    
    await initializeVotes();
    const votes = await kv.get("date-votes");
    
    if (votes && date in votes) {
      votes[date] = (votes[date] || 0) + 1;
      await kv.set("date-votes", votes);
      return c.json({ success: true, votes });
    }
    
    return c.json({ error: "Invalid date" }, 400);
  } catch (error) {
    console.log(`Error voting for date: ${error}`);
    return c.json({ error: "Failed to vote" }, 500);
  }
});

Deno.serve(app.fetch);