const { createClient } = require('@supabase/supabase-js');

// Load environment variables manually
const url = 'https://vayofxaysmtpkcldtkrk.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZheW9meGF5c210cGtjbGR0a3JrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQ1NTUwMSwiZXhwIjoyMDk5MDMxNTAxfQ.FonNsKEi1xdVQDlKwpaU2XyrvObpjEshg28z-bmFTM4';

const supabase = createClient(url, serviceKey);

async function run() {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*');
    
  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }
  
  console.log('Found profiles:', profiles.length);
  profiles.forEach(p => {
    console.log('Profile:', {
      id: p.id,
      name: p.full_name || p.name,
      headline: p.headline,
      location: p.location,
      skills: p.skills,
      work_experience: p.work_experience,
      education: p.education
    });
  });
}

run();
