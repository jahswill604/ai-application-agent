const url = 'https://api.firecrawl.dev/v2/search';
const apiKey = 'fc-69180252022348ef8a36979ce823d755';

// Build search query similar to route.ts for Nurse Assistant
// site:boards.greenhouse.io "Nurse Assistant" "Infection control" ("Port Harcourt" OR "Nigeria" OR "remote")
const payload = {
  query: '(site:boards.greenhouse.io OR site:job-boards.greenhouse.io) "Nurse Assistant" ("Port Harcourt" OR "Nigeria" OR "remote")',
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

fetch(url, {
  method: 'POST',
  headers: {
    Authorization: 'Bearer ' + apiKey,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
}).then(r => r.json()).then(data => {
  console.log('Success:', data.success);
  console.log('Results:', data.data?.web?.length || 0);
  if (data.data?.web) {
    data.data.web.forEach((item, i) => {
      console.log(`${i+1}: ${item.title} (${item.url})`);
    });
  }
}).catch(e => console.error(e));
