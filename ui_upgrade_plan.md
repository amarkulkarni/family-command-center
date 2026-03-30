# UI Migration: Dashboard V1 → V4

## Context
This is a Next.js 14 app (app directory) with React components in /components 
and Supabase data. The current dashboard is a functional inbox-style view. 
We are upgrading it to a mission-control dashboard. All changes are additive — 
no existing data logic, API routes, or Supabase queries should be touched.

Before starting any step: read the relevant component file fully, state your 
understanding of what it currently does, then propose your change. Make one 
step at a time. After each step, confirm the app runs without errors before 
proceeding.

---

## Step 1 — AI Summary Banner
**File to modify:** The main dashboard/inbox page component (likely app/inbox/page.js 
or a DashboardHeader component in /components)

**What to add:** A full-width dark banner ABOVE all other content.
- Background: #085041 (dark teal)
- Left side: small circular icon + label "AI SUMMARY" in uppercase 10px + 
  summary text in white/light teal
- Below summary text: a red-tinted inline alert chip showing the single most 
  urgent item. It should be clickable and open the relevant message.
- If no AI summary exists yet, hardcode a placeholder: 
  "X items this week across your kids. Tap the alert below to act on the 
  most urgent item."
- The red chip text should come from whichever action item has the earliest 
  deadline.

**Done when:** Banner renders at top of page, above stat cards, in both 
desktop and mobile. App loads without error.

---

## Step 2 — Kid column headers (dark + avatar)
**File to modify:** The component that renders the per-child column header 
(likely KidColumn.js, ChildSection.js, or similar in /components)

**Current state:** Light tint background (pale teal/amber) with child name 
and school.

**What to change:**
- Arjun header background: #085041 (dark teal). All text white or rgba(255,255,255,0.7).
- Priya header background: #633806 (dark amber). All text white or rgba(255,255,255,0.7).
- Add an emoji avatar circle above the name: Arjun = ⚾, Priya = 💃. 
  Avatar circle background: rgba(255,255,255,0.15), size 40x40px, border-radius 50%.
- Add a mini stat row below the school name showing: 
  "[N] items this week · [N] action needed" 
  Pull these counts from the existing data already in scope — do not add 
  new API calls.

**Done when:** Both kid columns have dark headers with avatar, name, meta, 
and counts. Light theme and dark theme both readable. App loads without error.

---

## Step 3 — Category filter pills (filled active state)
**File to modify:** The filter/category pill component used inside each 
kid column (likely in the same KidColumn component or a FilterPills component)

**Current state:** Active state is unclear — pills look similar selected vs unselected.

**What to change:**
- Arjun pills active state: background #085041, text #9FE1CB, border #085041 (solid filled)
- Arjun pills inactive state: background transparent, text #085041, border 1.5px solid #9FE1CB
- Priya pills active state: background #633806, text #FAC775, border #633806 (solid filled)
- Priya pills inactive state: background transparent, text #633806, border 1.5px solid #FAC775
- Add emoji prefix to each pill label: "📚 School", "⚾ Sports" / "⚽ Sports", 
  "🏥 Medical", "💃 Activities"
- Only one pill active at a time per kid. Clicking a pill filters items in 
  that column by category. "All" shows everything.

**Done when:** Pills are visually distinct active vs inactive. Clicking filters 
items correctly. App loads without error.

---

## Step 4 — Item rows: icons + due badges + channel badges
**File to modify:** The component that renders individual message/item rows 
(likely MessageItem.js, ActionItem.js, or similar in /components)

**What to add — three additions to each row:**

A) Category icon tile (left of item title, replace or supplement the dot):
   - 28x28px rounded square (border-radius 8px)
   - School → 📚 on #E6F1FB background
   - Sports → ⚾ or ⚽ on #EAF3DE background  
   - Medical → 🏥 on #FCEBEB background
   - Activities → 💃 on #EEEDFE background
   - Default/admin → 📋 on #FAEEDA background
   - Map from the existing category/tag field already on each item

B) "Due in X days" badge (right side, below the date):
   - Calculate from item's due_date or deadline field
   - 0 days → "Due today" in #A32D2D (red), font-weight 500
   - 1–2 days → "Due in X days" in #854F0B (amber)  
   - 3+ days → "In X days" in var(--color-text-tertiary) (muted)
   - If no deadline, show nothing

C) Channel source badge (inline with item detail text):
   - If source === 'gmail' or 'email': small pill "✉ Email" 
     background #E6F1FB, color #185FA5
   - If source === 'whatsapp' or 'twilio': small pill "💬 WhatsApp" 
     background #EAF3DE, color #3B6D11
   - Pull from the existing source/channel field on the message object. 
     Do not add new fields.

**Done when:** All item rows show icon tile, due badge where applicable, 
and channel badge. No layout breakage. App loads without error.

---

## Step 5 — Coming Up / Horizon tab
**File to modify:** The main dashboard page. Add a tab switcher above 
the kid columns.

**What to add:**
- Two tabs: "This week" (default active) and "Coming up"
- Tab active state: color var(--color-text-primary), 2px solid bottom border
- Tab inactive: var(--color-text-secondary), no bottom border
- "This week" tab shows existing kid columns (current behavior, unchanged)
- "Coming up" tab shows a new HorizonView component (create as new file: 
  components/HorizonView.js)

**HorizonView component:**
- Top: horizontal scrollable strip of week pills (Apr 1–7, Apr 8–14, etc.)
  showing next 6 weeks. Each pill shows colored dots for items in that week 
  (green dot = Arjun item, amber dot = Priya item, red dot = urgent item).
  Clicking a week pill highlights it (border: 1.5px solid #085041).
- Below: list of future items (items with due_date > 7 days from today), 
  each as a card showing:
  - Category icon (same as Step 4)
  - Title, child name tag, channel badge
  - Due date right-aligned
  - If the item needs a lead-time action (i.e. has a separate 
    action_deadline field earlier than due_date), show an amber warning 
    badge: "⚠ [action needed text] — X days away"
- Query: reuse existing data fetching, filter by due_date > today + 7 days. 
  Do not add new API endpoints.

**Done when:** Tab switcher works. Clicking "Coming up" shows horizon view 
with future items. "This week" restores kid columns. App loads without error.

---

## Step 6 — Drawer: channel-aware reply CTA
**File to modify:** The message detail drawer/modal component 
(likely MessageDrawer.js or a slide-in panel in /components)

**What to change:**
- Add channel icon and source line at top of drawer body: 
  "💬 Via WhatsApp · [sender name + number]" or "✉ Via Email · [sender email]"
- Primary action button should reflect channel:
  - Email source → button text "Reply via email", 
    background #E6F1FB, color #185FA5
  - WhatsApp source → button text "Reply on WhatsApp", 
    background #EAF3DE, color #3B6D11
  - WhatsApp reply should open: wa.me/[phone]?text=[url-encoded prefill]
  - Email reply should open: mailto:[address]

**Done when:** Drawer shows channel context. Primary CTA matches source. 
App loads without error.

---

## Verification checklist (run after all steps)
- [ ] App builds with no TypeScript/lint errors: `npm run build`
- [ ] All 6 steps visible in browser at localhost:3000
- [ ] Both kid columns render with dark headers and avatars
- [ ] Filter pills show clear active vs inactive state
- [ ] At least one item row shows icon + due badge + channel badge
- [ ] Tab switcher toggles between This week and Coming up
- [ ] Clicking an attention card opens drawer with channel-aware CTA
- [ ] No console errors in browser devtools

## What NOT to touch
- Any file in /app/api/
- Any Supabase query or lib/ utility
- Authentication/middleware logic
- .env.local or any config files
- The data model or database schema