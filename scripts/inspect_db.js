const { createClient } = require('@supabase/supabase-js');

const url = 'https://cvibkzbdwcvqmtnxgjer.supabase.co';
const key = 'sb_publishable_9rqqZQUXq3S8IIqPJV0v1Q_etL0oLX_';

const supabase = createClient(url, key);

async function inspect() {
  console.log('--- Inspecting busses / buses ---');
  const resBusses = await supabase.from('busses').select('*').limit(3);
  console.log('busses res:', resBusses.error ? resBusses.error.message : resBusses.data);

  const resBuses = await supabase.from('buses').select('*').limit(3);
  console.log('buses res:', resBuses.error ? resBuses.error.message : resBuses.data);

  console.log('--- Inspecting bookings ---');
  const resBookings = await supabase.from('bookings').select('*').limit(5);
  console.log('bookings res:', resBookings.error ? resBookings.error.message : resBookings.data);

  console.log('--- Inspecting tickets ---');
  const resTickets = await supabase.from('tickets').select('*').limit(5);
  console.log('tickets res:', resTickets.error ? resTickets.error.message : resTickets.data);
}

inspect().catch(console.error);
