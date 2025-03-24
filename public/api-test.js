// Simple script to test Supabase API connection
const SUPABASE_URL = 'https://jvhgdidaoasgxqqixywl.supabase.co/rest/v1';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGdkaWRhb2FzZ3hxcWl4eXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1MDA3OTYsImV4cCI6MjA1ODA3Njc5Nn0.2qrrNC2bKichC63SvUhNgXlcG0ElViRsqM5CYU3QSfg';

// Make a simple fetch request to the players endpoint
fetch(`${SUPABASE_URL}/players?select=*`, {
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`
  }
})
.then(response => {
  console.log('Response status:', response.status);
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }
  return response.json();
})
.then(data => {
  console.log('Data retrieved successfully:', data);
})
.catch(error => {
  console.error('API request error:', error);
}); 