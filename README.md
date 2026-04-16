# Upwork Automation — AI-Powered Job Matching

A local-first Next.js application + Chrome extension that automates your Upwork job search. The extension scrapes job postings directly from your browser (using your real Upwork session), AI scores each job against your freelancer profile, and the dashboard lets you review, track, and generate proposals — so you spend time applying, not scrolling.

---

## Table of Contents

- [What Does This App Do?](#what-does-this-app-do)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Chrome Extension Setup](#chrome-extension-setup)
- [Configuration](#configuration)
- [Running the App](#running-the-app)
- [Usage Guide](#usage-guide)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Customization](#customization)
- [Troubleshooting](#troubleshooting)

---

## What Does This App Do?

It's a **personal job-finding assistant** that does the work of scrolling through Upwork for you.

**In 3 steps:**

1. **Click the extension** — The Chrome extension searches Upwork across all your selected skills (PHP, Laravel, WordPress, React, etc.) using your real browser session. No headless browser, no Cloudflare issues.

2. **Click "AI Match"** — AI reads every job description, compares it against your profile, and scores each job **0 to 100** with a reason.

3. **Click "Generate Proposal"** — AI writes a personalized proposal for any job, complete with estimated hours, budget, and key talking points.

**Each job card shows:**
- Title, description, required skills
- Budget, job type (Hourly/Fixed), experience level
- Proposals count, duration, weekly hours
- Client info — payment verified, amount spent, country
- AI match score and reason

---

## How It Works

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Chrome Extension│────>│  /api/import     │────>│  SQLite DB      │
│  (real browser)  │     │  (Next.js API)   │     │  (Prisma)       │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
┌─────────────────┐     ┌──────────────────┐              │
│  Your Profile   │────>│  Groq AI         │<─────────────┘
│  (skills, bio)  │     │  (Llama 3.3 70B) │
└─────────────────┘     └────────┬─────────┘
                                 │
                        ┌────────▼─────────┐
                        │  Score 0-100     │
                        │  + Match Reason  │
                        │  + Proposal Gen  │
                        └────────┬─────────┘
                                 │
                        ┌────────▼─────────┐
                        │  Dashboard UI    │
                        │  (Next.js)       │
                        └──────────────────┘
```

1. **Scrape** — Chrome extension opens Upwork pages in a background tab using your logged-in session, extracts job data, and sends it to the dashboard
2. **Store** — Jobs are saved to a local SQLite database, with deduplication and update detection
3. **Match** — AI scores each job against your profile (skills, experience, rate)
4. **Propose** — AI generates personalized proposals with time estimates
5. **Track** — Dashboard shows ranked results with filters and status tracking

---

## Tech Stack

| Layer        | Technology                          | Purpose                              |
|------------- |------------------------------------ |------------------------------------- |
| Framework    | Next.js 16 (App Router)             | Full-stack React framework           |
| Language     | TypeScript                          | Type safety                          |
| Styling      | Tailwind CSS 4                      | Utility-first CSS                    |
| Database     | SQLite + Prisma 7                   | Local database, zero setup           |
| AI           | Groq (Llama 3.3 70B Versatile)      | Job matching, scoring, proposals     |
| Scraping     | Chrome Extension (Manifest V3)      | Real browser scraping, no Cloudflare |
| Icons        | Lucide React                        | UI icons                             |
| Date Utils   | date-fns                            | Relative timestamps                  |

---

## Prerequisites

- **Node.js** 18+ (recommended: 20+)
- **npm** (comes with Node.js)
- **Google Chrome** — with an Upwork account logged in
- **Groq API Key** — Get one at [console.groq.com](https://console.groq.com/) (free tier available)

No external database setup needed. SQLite runs locally as a file.

---

## Installation

```bash
# 1. Navigate to the project
cd upwork-automation

# 2. Install dependencies
npm install

# 3. Generate the Prisma client
npx prisma generate

# 4. Push database schema (creates the SQLite database)
npx prisma db push

# 5. Set up your environment variables (see Configuration below)
```

---

## Chrome Extension Setup

The extension scrapes Upwork using your real Chrome browser session — no login automation, no Cloudflare issues.

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `extension/` folder from this project
5. The extension icon appears in your Chrome toolbar
6. Make sure you're logged into Upwork in Chrome

**Extension features:**
- Multi-select skill dropdown — choose which skills to search
- Add/remove custom skills
- Filters: posted within, job type, experience level, budget range, payment verified, client hire history
- Live progress log during scraping
- Auto-opens/refreshes dashboard after scraping

---

## Configuration

Edit the `.env` file in the project root:

```env
# Database (default is fine for local use)
DATABASE_URL="file:./dev.db"

# Groq API key (for AI matching and proposals)
# Using same variable name so switching back to Anthropic is easy
ANTHROPIC_API_KEY="gsk_your-groq-key-here"

# Anthropic key (uncomment when token is renewed)
# ANTHROPIC_API_KEY="sk-ant-api03-your-anthropic-key-here"
```

### Getting a Groq API Key

1. Go to [console.groq.com](https://console.groq.com/)
2. Sign up or log in
3. Create an API key
4. Paste it into `.env` as `ANTHROPIC_API_KEY`

The app uses **Llama 3.3 70B Versatile** via Groq, which is fast and free-tier friendly.

---

## Running the App

### Development Mode

```bash
npm run dev
```

Opens at **http://localhost:3000**

### Production Build

```bash
npm run build
npm start
```

---

## Usage Guide

### Step 1: Set Up Your Profile

Navigate to **http://localhost:3000/profile** and fill in:

| Field              | Required | Description                                        |
|------------------- |--------- |--------------------------------------------------- |
| Name               | Yes      | Your full name                                     |
| Professional Title | Yes      | e.g., "Full Stack Web Developer"                   |
| Skills             | Yes      | Comma-separated list: "React, PHP, Laravel"        |
| Hourly Rate        | No       | Your rate in USD (used to filter budget fit)        |
| Bio                | No       | Short description of your expertise                |
| Experience         | No       | Summary of your work history and notable projects  |

The more detail you provide, the better the AI matching will be.

### Step 2: Scrape Jobs

**Option A — From Extension:**
Click the extension icon in Chrome toolbar → select skills → set filters → click **Scrape Jobs Now**

**Option B — From Dashboard:**
Click **Scrape Now** on the dashboard — this triggers the extension directly.

The extension:
- Opens Upwork pages in a background tab
- Searches each selected skill query with your filters
- Extracts job title, description, skills, budget, proposals, client info
- Sends everything to the dashboard
- Auto-refreshes the dashboard when done

### Step 3: AI Match

Click the **"AI Match"** button on the Dashboard.

AI analyzes each unscored job against your profile and assigns:
- **Score (0-100)** — How well the job matches
- **Reason** — Brief explanation of the score

### Step 4: Generate Proposals

Click **"Generate Proposal"** on any job card. AI creates:
- A personalized cover letter (3-4 paragraphs)
- Estimated hours and days
- Suggested bid amount
- Complexity rating
- Key selling points

The proposal includes the estimated timeline and addresses the client by name if available.

### Step 5: Track and Apply

- Mark jobs as **Saved** (apply later), **Applied** (submitted), or **Skipped** (not interested)
- Use the **Jobs page** (/jobs) for full search, filter, and sort
- **Delete all** button to clear and re-scrape fresh

---

## Project Structure

```
upwork-automation/
├── extension/                  # Chrome Extension (Manifest V3)
│   ├── manifest.json           # Extension config + permissions
│   ├── background.js           # Scraping logic + Upwork data extraction
│   ├── popup.html              # Extension popup UI
│   ├── popup.js                # Popup interaction + skill management
│   ├── content.js              # Dashboard ↔ Extension bridge
│   └── icon16.png / icon48.png # Extension icons
│
├── prisma/
│   ├── schema.prisma           # Database models (Profile, Job)
│   └── dev.db                  # SQLite database file
│
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with sidebar
│   │   ├── page.tsx            # Dashboard — stats + top matches
│   │   ├── globals.css         # Global styles (Tailwind)
│   │   ├── jobs/
│   │   │   └── page.tsx        # Jobs list — search, filter, sort
│   │   ├── profile/
│   │   │   └── page.tsx        # Profile setup form
│   │   ├── proposal/
│   │   │   └── [id]/page.tsx   # AI proposal generation page
│   │   └── api/
│   │       ├── profile/route.ts   # GET/POST profile
│   │       ├── jobs/route.ts      # GET/DELETE jobs
│   │       ├── jobs/[id]/route.ts # PATCH job status
│   │       ├── import/route.ts    # POST jobs from extension
│   │       ├── scrape/route.ts    # POST scrape trigger
│   │       ├── match/route.ts     # POST AI matching
│   │       ├── proposal/route.ts  # POST AI proposal generation
│   │       └── cron/route.ts      # Auto-match scheduler
│   │
│   ├── components/
│   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   ├── JobCard.tsx         # Job card with full details
│   │   └── StatsCard.tsx       # Statistics display card
│   │
│   └── lib/
│       ├── db.ts               # Prisma client singleton
│       ├── scraper.ts          # Type definitions (scraping via extension)
│       └── ai.ts               # Groq AI matching + chat helper
│
├── .env                        # Environment variables
├── package.json
└── README.md
```

---

## API Reference

### Import (used by Chrome Extension)

#### `POST /api/import`
Receives scraped jobs from the extension. Handles deduplication and updates.

**Body:**
```json
{
  "jobs": [
    {
      "upworkId": "~01abc123",
      "title": "React Developer Needed",
      "description": "We need a React developer...",
      "link": "https://www.upwork.com/jobs/~01abc123",
      "budget": "$2,500",
      "skills": ["React", "TypeScript", "Node.js"],
      "proposals": "20 to 50",
      "jobType": "Fixed-price",
      "experienceLevel": "Intermediate",
      "duration": "1 to 3 months",
      "weeklyHours": "Less than 30 hrs/week",
      "clientCountry": "United States",
      "clientSpent": "$60K+ spent",
      "clientVerified": true
    }
  ]
}
```

**Response:**
```json
{
  "message": "Scraped 45 jobs — 30 new, 5 updated, 10 unchanged",
  "created": 30,
  "updated": 5,
  "unchanged": 10,
  "total": 45
}
```

### Jobs

#### `GET /api/jobs?sort=score&status=new&minScore=50`
Returns jobs with optional filters.

#### `DELETE /api/jobs`
Deletes all jobs.

#### `PATCH /api/jobs/:id`
Update a job's status (`new`, `saved`, `applied`, `skipped`).

### Match

#### `POST /api/match`
Runs AI matching on all unscored jobs.

### Proposal

#### `POST /api/proposal`
Generates an AI proposal for a specific job.

**Body:** `{ "jobId": "clx..." }`

---

## Database Schema

### Job

| Column          | Type     | Description                                  |
|---------------- |--------- |--------------------------------------------- |
| id              | String   | Primary key (CUID)                           |
| upworkId        | String   | Unique Upwork job identifier                 |
| title           | String   | Job title                                    |
| description     | String   | Job description                              |
| budget          | String?  | Budget or hourly range                       |
| skills          | String?  | Required skills (comma-separated)            |
| link            | String   | Direct link to Upwork listing                |
| proposals       | String?  | Proposal count (e.g. "20 to 50")             |
| jobType         | String?  | "Hourly" or "Fixed-price"                    |
| experienceLevel | String?  | "Entry", "Intermediate", or "Expert"         |
| duration        | String?  | Estimated project duration                   |
| weeklyHours     | String?  | Weekly commitment                            |
| clientCountry   | String?  | Client's country                             |
| clientSpent     | String?  | Client's total spend on Upwork               |
| clientVerified  | Boolean  | Whether payment method is verified           |
| matchScore      | Float?   | AI match score (0-100)                       |
| matchReason     | String?  | AI explanation of the score                  |
| status          | String   | new / saved / applied / skipped              |

---

## Customization

### Change AI Provider

The app currently uses Groq (Llama 3.3 70B). To switch back to Anthropic:

1. Uncomment the Anthropic code in `src/lib/ai.ts` and `src/app/api/proposal/route.ts`
2. Update `ANTHROPIC_API_KEY` in `.env` with your Anthropic key
3. Comment out the Groq `groqChat` calls

### Add/Remove Search Skills

Click the extension icon → open the skills dropdown → use **+ Add** to add new skills or **x** to remove existing ones. Changes persist between sessions.

### Reset the Database

```bash
rm prisma/dev.db
npx prisma db push
```

---

## Troubleshooting

### Extension shows "0 jobs found"
Make sure you're logged into Upwork in Chrome. The extension uses your real browser session.

### "Cannot connect to Chrome" error on Scrape Now
The dashboard's Scrape Now button requires the extension to be installed. Install it from `chrome://extensions/` → Load unpacked → select `extension/` folder.

### AI matching or proposal fails
Check that your Groq API key is valid in `.env`. Test with: `curl -s https://api.groq.com/openai/v1/models -H "Authorization: Bearer YOUR_KEY"`

### Skills not showing on job cards
The extension extracts skills from Upwork's UI. If Upwork changes their HTML structure, the selectors in `extension/background.js` may need updating.

### "Please set up your profile first"
Fill in your profile at `/profile` before running AI matching or generating proposals.

---

## License

This project is for personal use. Built with Next.js, Prisma, Groq AI, and a Chrome Extension.
