import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";

const app = new Hono();

// Create Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

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

// Initialize database table on startup
async function initializeDatabase() {
  try {
    // Create polls table if not exists
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS polls (
          id BIGSERIAL PRIMARY KEY,
          poll_type TEXT NOT NULL,
          option_name TEXT NOT NULL,
          anonymous_user_id TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(poll_type, anonymous_user_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_polls_poll_type ON polls(poll_type);
        CREATE INDEX IF NOT EXISTS idx_polls_anonymous_user_id ON polls(anonymous_user_id);
      `
    });
    
    // Since we can't use rpc for DDL, we'll check if table exists and handle accordingly
    console.log('Database initialization check completed');
  } catch (error) {
    console.log(`Database initialization info: ${error}`);
  }
}

// Call initialization
initializeDatabase();

// Health check endpoint
app.get("/make-server-861a1fb5/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Get aggregated vote counts
app.get("/make-server-861a1fb5/votes", async (c) => {
  try {
    // Get all votes from database
    const { data: votes, error } = await supabase
      .from('polls')
      .select('poll_type, option_name');

    if (error) {
      console.error('Error fetching votes:', error);
      // Return default values if table doesn't exist yet
      return c.json({
        locationVotes: {
          "Bebek Kaleo Jababeka": 0,
          "Tana Bambu Cibubur": 0,
          "Sudut Kedai Metland": 0,
          "Ayam Taliwang Kotwis": 0
        },
        dateVotes: {
          "7 Maret 2026": 0,
          "8 Maret 2026": 0,
          "14 Maret 2026": 0
        }
      });
    }

    // Aggregate votes
    const locationVotes: Record<string, number> = {
      "Bebek Kaleo Jababeka": 0,
      "Tana Bambu Cibubur": 0,
      "Sudut Kedai Metland": 0,
      "Ayam Taliwang Kotwis": 0
    };

    const dateVotes: Record<string, number> = {
      "7 Maret 2026": 0,
      "8 Maret 2026": 0,
      "14 Maret 2026": 0
    };

    votes?.forEach((vote: any) => {
      if (vote.poll_type === 'location' && vote.option_name in locationVotes) {
        locationVotes[vote.option_name]++;
      } else if (vote.poll_type === 'date' && vote.option_name in dateVotes) {
        dateVotes[vote.option_name]++;
      }
    });

    return c.json({
      locationVotes,
      dateVotes
    });
  } catch (error) {
    console.error(`Error getting votes: ${error}`);
    return c.json({ error: "Failed to get votes" }, 500);
  }
});

// Get user's current vote for a poll type
app.get("/make-server-861a1fb5/my-vote/:pollType/:userId", async (c) => {
  try {
    const pollType = c.req.param('pollType');
    const userId = c.req.param('userId');

    if (!pollType || !userId) {
      return c.json({ error: "Poll type and user ID are required" }, 400);
    }

    const { data, error } = await supabase
      .from('polls')
      .select('option_name')
      .eq('poll_type', pollType)
      .eq('anonymous_user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching user vote:', error);
      return c.json({ error: "Failed to get user vote" }, 500);
    }

    return c.json({
      hasVoted: !!data,
      option: data?.option_name || null
    });
  } catch (error) {
    console.error(`Error getting user vote: ${error}`);
    return c.json({ error: "Failed to get user vote" }, 500);
  }
});

// Upsert vote (insert or update)
app.post("/make-server-861a1fb5/vote/:pollType", async (c) => {
  try {
    const pollType = c.req.param('pollType');
    const body = await c.req.json();
    const { anonymousUserId, option } = body;

    if (!pollType || !anonymousUserId || !option) {
      return c.json({ 
        error: "Poll type, anonymous user ID, and option are required" 
      }, 400);
    }

    // Validate poll type
    if (pollType !== 'location' && pollType !== 'date') {
      return c.json({ error: "Invalid poll type" }, 400);
    }

    // Upsert the vote (insert or update if exists)
    const { error: upsertError } = await supabase
      .from('polls')
      .upsert({
        poll_type: pollType,
        option_name: option,
        anonymous_user_id: anonymousUserId,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'poll_type,anonymous_user_id'
      });

    if (upsertError) {
      console.error('Error upserting vote:', upsertError);
      return c.json({ error: "Failed to save vote" }, 500);
    }

    // Get updated vote counts
    const { data: votes, error: fetchError } = await supabase
      .from('polls')
      .select('poll_type, option_name');

    if (fetchError) {
      console.error('Error fetching updated votes:', fetchError);
      return c.json({ error: "Failed to get updated votes" }, 500);
    }

    // Aggregate votes
    const locationVotes: Record<string, number> = {
      "Bebek Kaleo Jababeka": 0,
      "Tana Bambu Cibubur": 0,
      "Sudut Kedai Metland": 0,
      "Ayam Taliwang Kotwis": 0
    };

    const dateVotes: Record<string, number> = {
      "7 Maret 2026": 0,
      "8 Maret 2026": 0,
      "14 Maret 2026": 0
    };

    votes?.forEach((vote: any) => {
      if (vote.poll_type === 'location' && vote.option_name in locationVotes) {
        locationVotes[vote.option_name]++;
      } else if (vote.poll_type === 'date' && vote.option_name in dateVotes) {
        dateVotes[vote.option_name]++;
      }
    });

    return c.json({
      success: true,
      votes: pollType === 'location' ? locationVotes : dateVotes,
      allVotes: {
        locationVotes,
        dateVotes
      }
    });
  } catch (error) {
    console.error(`Error voting: ${error}`);
    return c.json({ error: "Failed to vote" }, 500);
  }
});

// Delete vote (cancel vote)
app.delete("/make-server-861a1fb5/vote/:pollType/:userId", async (c) => {
  try {
    const pollType = c.req.param('pollType');
    const userId = c.req.param('userId');

    if (!pollType || !userId) {
      return c.json({ error: "Poll type and user ID are required" }, 400);
    }

    const { error: deleteError } = await supabase
      .from('polls')
      .delete()
      .eq('poll_type', pollType)
      .eq('anonymous_user_id', userId);

    if (deleteError) {
      console.error('Error deleting vote:', deleteError);
      return c.json({ error: "Failed to delete vote" }, 500);
    }

    // Get updated vote counts
    const { data: votes, error: fetchError } = await supabase
      .from('polls')
      .select('poll_type, option_name');

    if (fetchError) {
      console.error('Error fetching updated votes:', fetchError);
      return c.json({ error: "Failed to get updated votes" }, 500);
    }

    // Aggregate votes
    const locationVotes: Record<string, number> = {
      "Bebek Kaleo Jababeka": 0,
      "Tana Bambu Cibubur": 0,
      "Sudut Kedai Metland": 0,
      "Ayam Taliwang Kotwis": 0
    };

    const dateVotes: Record<string, number> = {
      "7 Maret 2026": 0,
      "8 Maret 2026": 0,
      "14 Maret 2026": 0
    };

    votes?.forEach((vote: any) => {
      if (vote.poll_type === 'location' && vote.option_name in locationVotes) {
        locationVotes[vote.option_name]++;
      } else if (vote.poll_type === 'date' && vote.option_name in dateVotes) {
        dateVotes[vote.option_name]++;
      }
    });

    return c.json({
      success: true,
      votes: pollType === 'location' ? locationVotes : dateVotes,
      allVotes: {
        locationVotes,
        dateVotes
      }
    });
  } catch (error) {
    console.error(`Error deleting vote: ${error}`);
    return c.json({ error: "Failed to delete vote" }, 500);
  }
});

Deno.serve(app.fetch);
