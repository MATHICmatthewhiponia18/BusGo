const { createClient } = require('@supabase/supabase-js');

const url = 'https://cvibkzbdwcvqmtnxgjer.supabase.co';
const key = 'sb_publishable_9rqqZQUXq3S8IIqPJV0v1Q_etL0oLX_';
const supabase = createClient(url, key);

async function testTables() {
  const tableNames = ['bookings', 'booking', 'tickets', 'ticket', 'reservations', 'reservation', 'users', 'profiles', 'busses'];
  for (const name of tableNames) {
    const { data, error } = await supabase.from(name).select('*').limit(1);
    if (error) {
      console.log(`Table ${name}: ERROR -> ${error.message} (${error.code})`);
    } else {
      console.log(`Table ${name}: EXISTS! Sample:`, data);
    }
  }

  // Also fetch all rows in busses to see how many and what data is there
  const { data: allBusses } = await supabase.from('busses').select('*');
  console.log('All busses count:', allBusses ? allBusses.length : 0);
  console.log('All busses:', JSON.stringify(allBusses, null, 2));
}

testTables().catch(console.error);
