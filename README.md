# Handy Man Buea

Find trusted local workers in Buea, Cameroon. Connect with skilled plumbers, electricians, carpenters, cleaners, and other service professionals in your area.

## Live Site

🔗 [Coming soon - Vercel deployment in progress]

## Features

- **Search & Browse** — Find workers by category, skill, or location
- **Worker Profiles** — View ratings, reviews, and contact details
- **Direct Contact** — Message or call workers directly
- **Join as a Worker** — Create your own service profile
- **User Authentication** — Secure login and registration

## Pages

| Page | File | Description |
|------|------|-------------|
| Home | `index.html` | Search and browse categories |
| Find Workers | `workers.html` | Search and filter workers |
| Worker Profile | `worker.html` | View worker details and contact |
| Login/Register | `login.html` | User authentication |
| Join as Worker | `join.html` | Create worker profile |

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript (vanilla)
- **Backend:** Supabase (database, authentication, storage)
- **Hosting:** Vercel

## Getting Started

### Prerequisites

- A modern web browser
- A Supabase account (free tier)
- A Vercel account (free tier)

### Environment Variables

Create a `.env` file in your project root with the following variables:

```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
