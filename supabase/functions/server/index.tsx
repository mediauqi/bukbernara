import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";

const app = new Hono();

// Create Supabase client with error handling
let supabase;
try {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
  } else {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized successfully');
  }
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
}

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
  return c.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    supabaseConnected: !!supabase
  });
});

// Default vote structure
const DEFAULT_VOTES = {
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
};

// Get aggregated vote counts
app.get("/make-server-861a1fb5/votes", async (c) => {
  try {
    if (!supabase) {
      console.log('Supabase not initialized, returning defaults');
      return c.json(DEFAULT_VOTES);
    }

    // Get all votes from database
    const { data: votes, error } = await supabase
      .from('polls')
      .select('poll_type, option_name');

    if (error) {
      console.error('Error fetching votes from Supabase:', error);
      return c.json(DEFAULT_VOTES);
    }

    // Aggregate votes
    const locationVotes = { ...DEFAULT_VOTES.locationVotes };
    const dateVotes = { ...DEFAULT_VOTES.dateVotes };

    if (votes && votes.length > 0) {
      votes.forEach((vote: any) => {
        if (vote.poll_type === 'location' && vote.option_name in locationVotes) {
          locationVotes[vote.option_name]++;
        } else if (vote.poll_type === 'date' && vote.option_name in dateVotes) {
          dateVotes[vote.option_name]++;
        }
      });
    }

    return c.json({
      locationVotes,
      dateVotes
    });
  } catch (error) {
    console.error(`Error getting votes: ${error}`);
    return c.json(DEFAULT_VOTES);
  }
});

// Get user's current vote for a poll type
app.get("/make-server-861a1fb5/my-vote/:pollType/:userId", async (c) => {
  try {
    if (!supabase) {
      return c.json({ hasVoted: false, option: null });
    }

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
      .maybeSingle();

    if (error) {
      console.error('Error fetching user vote:', error);
      return c.json({ hasVoted: false, option: null });
    }

    return c.json({
      hasVoted: !!data,
      option: data?.option_name || null
    });
  } catch (error) {
    console.error(`Error getting user vote: ${error}`);
    return c.json({ hasVoted: false, option: null });
  }
});

// Upsert vote (insert or update)
app.post("/make-server-861a1fb5/vote/:pollType", async (c) => {
  try {
    if (!supabase) {
      return c.json({ error: "Database not available" }, 503);
    }

    const pollType = c.req.param('pollType');
    const body = await c.req.json();
    const { anonymousUserId, option } = body;

    console.log(`Vote request: pollType=${pollType}, userId=${anonymousUserId}, option=${option}`);

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
      return c.json({ error: `Failed to save vote: ${upsertError.message}` }, 500);
    }

    console.log(`Vote saved successfully for ${pollType}: ${option}`);

    // Get updated vote counts
    const { data: votes, error: fetchError } = await supabase
      .from('polls')
      .select('poll_type, option_name');

    if (fetchError) {
      console.error('Error fetching updated votes:', fetchError);
      return c.json({ error: "Failed to get updated votes" }, 500);
    }

    // Aggregate votes
    const locationVotes = { ...DEFAULT_VOTES.locationVotes };
    const dateVotes = { ...DEFAULT_VOTES.dateVotes };

    if (votes && votes.length > 0) {
      votes.forEach((vote: any) => {
        if (vote.poll_type === 'location' && vote.option_name in locationVotes) {
          locationVotes[vote.option_name]++;
        } else if (vote.poll_type === 'date' && vote.option_name in dateVotes) {
          dateVotes[vote.option_name]++;
        }
      });
    }

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
    return c.json({ error: `Failed to vote: ${error}` }, 500);
  }
});

// Delete vote (cancel vote)
app.delete("/make-server-861a1fb5/vote/:pollType/:userId", async (c) => {
  try {
    if (!supabase) {
      return c.json({ error: "Database not available" }, 503);
    }

    const pollType = c.req.param('pollType');
    const userId = c.req.param('userId');

    console.log(`Delete vote request: pollType=${pollType}, userId=${userId}`);

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
      return c.json({ error: `Failed to delete vote: ${deleteError.message}` }, 500);
    }

    console.log(`Vote deleted successfully for ${pollType}`);

    // Get updated vote counts
    const { data: votes, error: fetchError } = await supabase
      .from('polls')
      .select('poll_type, option_name');

    if (fetchError) {
      console.error('Error fetching updated votes:', fetchError);
      return c.json({ error: "Failed to get updated votes" }, 500);
    }

    // Aggregate votes
    const locationVotes = { ...DEFAULT_VOTES.locationVotes };
    const dateVotes = { ...DEFAULT_VOTES.dateVotes };

    if (votes && votes.length > 0) {
      votes.forEach((vote: any) => {
        if (vote.poll_type === 'location' && vote.option_name in locationVotes) {
          locationVotes[vote.option_name]++;
        } else if (vote.poll_type === 'date' && vote.option_name in dateVotes) {
          dateVotes[vote.option_name]++;
        }
      });
    }

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
    return c.json({ error: `Failed to delete vote: ${error}` }, 500);
  }
});

Deno.serve(app.fetch);
