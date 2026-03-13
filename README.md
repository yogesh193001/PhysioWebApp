# PhysioFlow — Physiotherapy Exercise Tracker

A Next.js web app for guided physiotherapy exercise routines with countdown timers, rep tracking, and admin management.

## Features

**Client Side:**

- Browse available workout routines
- Full-screen workout player with countdown timer
- Per-rep timer with side switching (Left/Right)
- Auto-advance or manual mode toggle
- Breathing cues displayed during exercises
- Audio beeps on timer completion
- Progress bar for overall workout
- Mobile-first responsive design

**Admin Side:**

- CRUD for exercises (name, category, instructions, breathing cue, image)
- Workout builder with reorder exercises
- Set reps, hold time, sides, and notes per exercise
- Import exercises from the Wger open-source API

## Tech Stack

- **Framework:** Next.js (App Router, Server Components, Server Actions)
- **Database:** Supabase PostgreSQL (free tier)
- **ORM:** Prisma 6
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Deployment:** Vercel (free tier)

## Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to **Project Settings → Database → Connection string**
4. Copy the **Transaction** pooler URI (port 6543)

### 2. Configure Environment

```bash
cd app
cp .env.example .env
```

Edit `.env` and paste your Supabase connection string as `DATABASE_URL`.

### 3. Install & Migrate

```bash
npm install
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Pages

| Route                       | Description                    |
| --------------------------- | ------------------------------ |
| `/`                         | Home — list available workouts |
| `/workout/[id]`             | Workout overview               |
| `/workout/[id]/play`        | Workout player with timers     |
| `/admin`                    | Admin dashboard                |
| `/admin/exercises`          | Exercise management            |
| `/admin/exercises/browse`   | Browse & import from Wger API  |
| `/admin/workouts`           | Workout management             |
| `/admin/workouts/[id]/edit` | Workout builder with ordering  |

## Deploy to Vercel

1. Push to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Set `DATABASE_URL` env var
4. Set root directory to `app`
5. Deploy
