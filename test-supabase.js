const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read environment variables manually
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key] = value;
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test basic connection
    const { data, error } = await supabase.from('Profiles').select('count').limit(1);
    
    if (error) {
      console.error('Database connection error:', error);
    } else {
      console.log('Database connection successful');
    }
    
    // Test auth configuration
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Auth configuration error:', authError);
    } else {
      console.log('Auth configuration successful');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testConnection(); 