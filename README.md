# Gamification

A personal productivity tracker that turns your daily habits into a points system. Log what you did, see it on a calendar heatmap, and actually feel good about your day.

Built for personal use — single user, no auth, hooked up to a Supabase database.

---

## What it does

The app lives in a single three-panel view:

**Calendar** — A monthly calendar where each day is colored by how many points you earned. Hover over a day to see a breakdown by domain. Scroll through past months and see monthly totals, active day counts, and a per-domain bar chart at the bottom.

**Task list** — Your task templates, grouped by domain. Click one to activate it for logging on the timeline.

**Day timeline** — A 24-hour scrollable timeline showing everything you logged on the selected day. Blocks are colored by domain and render side-by-side when they overlap. A red line shows the current time when you're on today.

---

## Logging tasks

There are two ways to log something:

**Click on the timeline** — Select a task template from the list, then click a time slot on the timeline. For completion-type tasks this creates an entry immediately. For duration tasks, click and drag to define how long you worked.

**Quick Add (⌥A)** — A keyboard-driven dialog that opens anywhere. Type to search for a task, hit Enter or Tab to select it, then type modifiers:
- `@8pm` or `@14:30` — sets the start time (smart AM/PM guessing based on current time)
- `$1.5` — duration in hours
- anything else — saved as a note on the log

Hit Enter to submit. The preview shows time, duration, and points before you commit.

---

## Points system

Tasks earn points based on type:

- **Duration tasks** — points scale with time. A task set to 12 pts/hr earns 6 pts for 30 minutes.
- **Completion tasks** — flat points per log entry, regardless of time.

Points roll up to the heatmap. The calendar goes from light gray (zero) through shades of red to a deep red for high-point days.

---

## Setup

You need a Supabase project. Once you have one:

1. Run [supabase/schema.sql](supabase/schema.sql) in the Supabase SQL editor — this creates the tables and seeds some example domains and tasks.
2. Copy `.env.local.example` to `.env.local` and fill in your Supabase URL and anon key.
3. `npm install && npm run dev`

The app runs at `http://localhost:3000`.

---

## Configuration

Open Settings (gear icon in the task panel header) to manage:

- **Domains** — life categories like Fitness, Coding, Music. Each has a name, color, and icon.
- **Task Templates** — the tasks you can log. Each belongs to a domain and is either a duration task (scales with time) or a completion task (fixed points). You set the points per unit and the default duration.

---

## Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Zustand (client state)
- Recharts (pie chart in day hover modal)
- Supabase (PostgreSQL)
