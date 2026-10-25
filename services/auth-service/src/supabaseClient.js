const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project')) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('[Auth Service] Supabase client initialized.');
} else {
  console.warn('[Auth Service] Supabase credentials not set or using placeholders. Operating in local mock fallback mode.');
}

module.exports = { supabase };
