const { createClient } = require('@supabase/supabase-js');

const url = 'https://cvibkzbdwcvqmtnxgjer.supabase.co';
const key = 'sb_publishable_9rqqZQUXq3S8IIqPJV0v1Q_etL0oLX_';
const supabase = createClient(url, key);

async function testAuth() {
  console.log('Testing Supabase Auth responses:');
  
  // 1. Invalid login
  const res1 = await supabase.auth.signInWithPassword({
    email: 'nonexistent_user_test@example.com',
    password: 'password123',
  });
  console.log('Nonexistent user signIn error:', res1.error?.message, '| status:', res1.error?.status);

  // 2. Malformed email (what warning does Supabase give?)
  const res2 = await supabase.auth.signInWithPassword({
    email: 'not-an-email',
    password: 'password123',
  });
  console.log('Malformed email signIn error:', res2.error?.message, '| status:', res2.error?.status);
}

testAuth().catch(console.error);
