// Test that simulates the exact parsing logic used in route.ts
// to verify Firecrawl v2 response is handled correctly

const url = 'https://api.firecrawl.dev/v2/search';
const apiKey = 'fc-69180252022348ef8a36979ce823d755';

const payload = {
  query: '(site:boards.greenhouse.io OR site:job-boards.greenhouse.io) "frontend" ("Nigeria" OR "remote")',
  sources: ['web'],
  categories: [],
  limit: 10,
  scrapeOptions: {
    onlyMainContent: true,
    maxAge: 172800000,
    parsers: ['pdf'],
    formats: []
  }
};

console.log('Query:', payload.query);
console.log('---');

fetch(url, {
  method: 'POST',
  headers: {
    Authorization: 'Bearer ' + apiKey,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
}).then(r => r.json()).then(data => {
  console.log('Success:', data.success);

  // Use the FIXED parsing logic (data.data.web)
  let results = [];
  if (data.data?.web && Array.isArray(data.data.web)) {
    results = data.data.web;
    console.log('✅ Found results under data.data.web');
  } else if (Array.isArray(data.data)) {
    results = data.data;
    console.log('Found results under data.data (flat array)');
  }

  console.log('Result count:', results.length);
  console.log('---');

  results.forEach((item, i) => {
    // Simulate isDirectJobUrl for greenhouse
    const pathname = new URL(item.url).pathname;
    const parts = pathname.split('/').filter(Boolean);
    const isJobUrl = parts.includes('jobs') && parts.length >= 3;

    console.log(`Result ${i+1}:`);
    console.log(`  Title: ${item.title}`);
    console.log(`  URL: ${item.url}`);
    console.log(`  isDirectJobUrl: ${isJobUrl}`);
    console.log(`  Desc: ${(item.description || '').substring(0, 120)}`);
    console.log('');
  });
}).catch(e => console.error('Error:', e));
