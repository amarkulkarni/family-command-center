// Test email webhook
const payload = {
  familySpaceId: "094a0285-fcb9-4a83-b1b9-bfe5db103c39",
  from: "billing@school.edu",
  to: "family@example.com",
  subject: "URGENT: Tuition payment due TODAY - $2,500",
  message: "Your tuition payment of $2,500 is due TODAY. Please pay immediately to avoid late fees and registration hold.",
  timestamp: new Date().toISOString()
}

fetch('http://localhost:3000/api/webhooks/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})
  .then(r => r.json())
  .then(data => console.log('Response:', data))
  .catch(err => console.error('Error:', err))
