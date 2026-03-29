// Test Gmail sync endpoint (manual trigger)
// Usage: node test-gmail-sync.js

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const cronSecret = process.env.CRON_SECRET

if (!cronSecret) {
  console.error('Error: CRON_SECRET not found in .env.local')
  process.exit(1)
}

console.log('Testing Gmail sync endpoint...')

fetch('http://localhost:3000/api/cron/sync-gmail', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${cronSecret}`,
  },
})
  .then(async r => {
    const text = await r.text()
    try {
      const data = JSON.parse(text)
      console.log('Response:', JSON.stringify(data, null, 2))
    } catch (e) {
      console.log('Response (not JSON):', text)
      console.log('Status:', r.status)
    }
  })
  .catch(err => console.error('Error:', err))
