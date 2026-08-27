🔧 Handy Man Buea
Find trusted local workers in Buea, Cameroon. Connect with skilled plumbers, electricians, carpenters, cleaners, and hundreds of other service professionals in your area.
🌐 Live Site: https://handyman-buea.vercel.app
________________________________________
📋 Table of Contents
•	Overview
•	Live Demo
•	Features
•	Pages
•	Screenshots
•	Tech Stack
•	Database Schema
•	Getting Started
–	Prerequisites
–	Installation
–	Environment Variables
–	Supabase Setup
•	Deployment
•	Security
•	Roadmap
•	Contributing
•	License
•	Contact
________________________________________
🎯 Overview
Handy Man Buea is a two-sided digital marketplace that connects service seekers (households, students, businesses) with skilled local workers (plumbers, electricians, cleaners, mechanics, and more) across Buea and surrounding areas in Cameroon.
The platform is designed to work reliably on mobile devices with low-bandwidth connections, making it accessible to the widest possible audience in Cameroon.
Geographic Coverage
Phase	Cities	Status
Phase 1	Buea, Limbe	✅ Active
Phase 2	Douala, Yaoundé, Bamenda	✅ Supported (job posting)
Phase 3	Kribi, Bafoussam + nationwide	✅ Supported (custom town input)
________________________________________
🌐 Live Demo
Production URL: https://handyman-buea.vercel.app
The site is fully deployed and operational. You can: - Browse worker profiles without signing in - Search and filter by category - Post jobs (requires free registration) - Create a worker profile (requires free registration)
________________________________________
✨ Features
For Service Seekers (Clients)
•	🔍 Search & Browse — Find workers by category, skill, or location
•	⭐ Ratings & Reviews — View verified ratings and read client reviews
•	📞 Direct Contact — One-click WhatsApp or phone call to any worker
•	📝 Post Jobs — Describe what you need and let workers come to you
•	🔔 Notifications — Get alerts when workers respond or jobs update
•	📍 Multi-City Support — Buea, Douala, Yaoundé, Bamenda, Limbe, Kribi, Bafoussam
For Service Providers (Workers)
•	🛠️ Create Profile — Showcase your skills, experience, and portfolio
•	📸 Portfolio Photos — Upload up to 2 photos of your past work
•	📱 WhatsApp Integration — Clients contact you directly via WhatsApp
•	🔔 Job Alerts — Get notified instantly when a job is posted in your category
•	📊 Dashboard — Manage your profile and track your posted jobs
For Administrators
•	📊 Analytics Dashboard — Live visitor stats, registration counts, job counts
•	👥 User Management — View all users, filter by type, direct contact buttons
•	📢 Broadcast Messaging — Send notifications to all users, workers only, or clients only
•	🚩 Dispute Resolution — View and manage reports with resolve workflow
•	🐛 Bug Tracking — Internal case reporting tool
•	🗑️ Content Moderation — Delete workers, jobs, or disputes
Platform-Wide
•	📱 Mobile-First Design — Fully responsive, works on any screen size
•	📷 Camera Upload — Take photos directly from your phone camera
•	🔒 Secure Authentication — Email/password via Supabase Auth
•	🔔 Real-Time Notifications — Bell icon with unread count, 30-second polling
•	🔗 Social Sharing — One-click share to WhatsApp, Facebook, Twitter
•	🛡️ Report System — Report fake profiles, scams, or inappropriate behavior
•	🌙 Fast Loading — Vanilla JS, no heavy frameworks, optimized for slow networks
________________________________________
📄 Pages
#	Page	File	Description	Auth Required
1	Home	index.html	Hero carousel, popular categories, featured workers, how-it-works	No
2	Find Workers	workers.html	Search and filter workers by category or text	No
3	Worker Profile	worker.html	Full profile with portfolio, reviews, WhatsApp/Call links, report button	No
4	Find Jobs	jobs.html	Browse open job postings by category	No
5	Job Details	job.html	Full job view with client contact, reference photos, status, tips	No
6	Post a Job	post-job.html	Client job posting form (19 categories, 7+ cities)	Yes
7	Login / Register	login.html	Dual-tab authentication, client vs worker registration	No
8	Join as Worker	join.html	Worker profile creation with photo + portfolio upload	Yes
9	My Dashboard	dashboard.html	User’s posted jobs + worker profile overview	Yes
10	Admin Panel	admin.html	Full admin control panel with stats, users, disputes, broadcast	Admin Only
11	Report Issue	report.html	Structured reporting form for workers or jobs	No
12	Shared Logic	app.js	Supabase client, auth, uploads, notifications, carousel, helpers	—
13	Styles	style.css	Complete responsive stylesheet	—
________________________________________
📸 Screenshots
Screenshots will be added here. To generate: 1. Visit https://handyman-buea.vercel.app 2. Take screenshots of Home, Workers, Profile, and Job pages 3. Save to /screenshots/ folder and update this section
________________________________________
🛠️ Tech Stack
Layer	Technology	Purpose
Frontend	HTML5, CSS3, Vanilla JavaScript	Fast, lightweight, no build step needed
Backend	Supabase	Database, authentication, file storage, real-time subscriptions
Hosting	Vercel	Global CDN, automatic deployments from GitHub
Database	PostgreSQL (via Supabase)	Relational data with Row Level Security
Storage	Supabase Storage	Profile photos, portfolio images, job reference photos
Auth	Supabase Auth	Email/password with JWT sessions
Maps	Text-based locations	GPS integration planned for Phase C
Why Vanilla JS?
We chose vanilla HTML/CSS/JS over React/Next.js for three reasons: 1. Speed — No build step, no heavy bundles. Pages load instantly even on slow Cameroonian mobile networks. 2. Simplicity — Anyone with basic web knowledge can read, understand, and contribute to the code. 3. Cost — Zero build-time dependencies. The entire site is static files that Vercel serves for free.
________________________________________
🗄️ Database Schema
Tables
profiles
Stores user account information linked to Supabase Auth.
Column	Type	Description
id	UUID (PK)	Links to auth.users.id
full_name	Text	User’s display name
phone	Text	Cameroon phone number (used for WhatsApp/Call)
is_worker	Boolean	True if user is a service provider
is_admin	Boolean	True if user has admin privileges
location	Text	Town/area (e.g., “Molyko, Buea”)
avatar_url	Text	Public URL to profile photo
portfolio	JSONB	Array of image URLs
created_at	Timestamp	Registration date
worker_details
Extended profile data for service providers.
Column	Type	Description
id	UUID (PK)	Same as profiles.id
category	Text	Primary service category
description	Text	Bio / service description
experience_years	Integer	Years of experience
contact_phone	Text	Phone for calls
whatsapp_number	Text	WhatsApp number
availability	Text	“Available” or “Busy”
portfolio	JSONB	Array of work photos
rating	Numeric	Average rating (0-5)
review_count	Integer	Number of reviews received
verified	Boolean	Admin verification badge
job_posts
Client-submitted job requests.
Column	Type	Description
id	UUID (PK)	Unique job ID
client_id	UUID (FK)	References profiles.id
title	Text	Job title
category	Text	Service category needed
description	Text	Detailed job description
location	Text	Full location (town + quarter)
budget	Text	Budget or “Negotiable”
status	Text	“Open” or “Taken”
images	JSONB	Reference photos
created_at	Timestamp	Posting date
reviews
Client ratings and feedback for workers.
Column	Type	Description
id	UUID (PK)	Unique review ID
worker_id	UUID (FK)	References worker_details.id
rating	Integer	1-5 star rating
comment	Text	Written feedback
notifications
In-app notification system.
Column	Type	Description
id	UUID (PK)	Unique notification ID
user_id	UUID (FK)	Recipient
title	Text	Notification heading
message	Text	Notification body
job_id	UUID (FK, optional)	Related job
read	Boolean	Read status
created_at	Timestamp	Notification date
disputes
User reports and admin bug tracking.
Column	Type	Description
id	UUID (PK)	Unique dispute ID
reporter_id	UUID (FK, optional)	Who reported
reporter_name	Text	Display name
target_type	Text	“worker”, “job”, or “Bug”
target_id	Text	ID of reported item
target_name	Text	Name of reported item
reason	Text	Report category
details	Text	Full description
status	Text	“Open” or “Resolved”
created_at	Timestamp	Report date
categories
Service category definitions.
Column	Type	Description
name	Text (PK)	Category name
icon	Text	Emoji icon
description	Text	Short description
site_stats
Platform analytics.
Column	Type	Description
id	Integer (PK)	Always 1
total_visitors	Integer	All-time unique visitors
visitors_today	Integer	Today’s visitor count
visitors_today_date	Date	Date of today’s count
last_updated	Timestamp	Last update time
Storage Buckets
Bucket	Purpose	Access
handyman-files	Profile photos, portfolio images, job reference photos	Upload: authenticated users; Read: public
________________________________________
🚀 Getting Started
Prerequisites
•	A modern web browser (Chrome, Firefox, Safari, Edge)
•	A Supabase account (free tier)
•	A Vercel account (free tier)
•	Git installed locally
•	Node.js (optional, for local testing with a simple server)
Installation
1.	Clone the repository
 	git clone https://github.com/handymancameroon/handyman-buea.git
cd handyman-buea
2.	Set up Supabase (see Supabase Setup below)
3.	Configure environment variables
 	cp .env.example .env
# Edit .env with your Supabase credentials
4.	Run locally (optional)
 	# Option 1: Python simple server
python -m http.server 8000

# Option 2: Node.js live-server
npx live-server --port=8000

# Option 3: VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
 	Then open http://localhost:8000
5.	Deploy to Vercel
 	# Connect your GitHub repo to Vercel
# Vercel will auto-deploy on every push to main
Environment Variables
Create a .env file in the project root:
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Admin Configuration
ADMIN_EMAIL=your-admin-email@example.com
⚠️ Security Note: The SUPABASE_ANON_KEY is a publishable key designed for client-side use. It is safe to expose in frontend code only if your Row Level Security (RLS) policies are correctly configured. Never expose your SUPABASE_SERVICE_ROLE_KEY.
Supabase Setup
Follow these steps to configure your Supabase project:
1. Create Project
•	Go to supabase.com and create a new project
•	Note your Project URL and Anon Key (Settings → API)
2. Run the SQL Setup
In the Supabase SQL Editor, run the following setup script:
-- ============================================================
-- HANDY MAN BUEA — DATABASE SETUP
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create tables
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  is_worker BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  location TEXT DEFAULT 'Buea',
  avatar_url TEXT,
  portfolio JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS worker_details (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT,
  description TEXT,
  experience_years INTEGER DEFAULT 0,
  contact_phone TEXT,
  whatsapp_number TEXT,
  availability TEXT DEFAULT 'Available',
  portfolio JSONB DEFAULT '[]',
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS job_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT,
  description TEXT,
  location TEXT DEFAULT 'Buea',
  budget TEXT DEFAULT 'Not specified',
  status TEXT DEFAULT 'Open',
  images JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES worker_details(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  message TEXT NOT NULL,
  job_id UUID REFERENCES job_posts(id) ON DELETE SET NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reporter_name TEXT DEFAULT 'Anonymous',
  target_type TEXT,
  target_id TEXT,
  target_name TEXT,
  reason TEXT,
  details TEXT,
  status TEXT DEFAULT 'Open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  name TEXT PRIMARY KEY,
  icon TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS site_stats (
  id INTEGER PRIMARY KEY DEFAULT 1,
  total_visitors INTEGER DEFAULT 0,
  visitors_today INTEGER DEFAULT 0,
  visitors_today_date DATE DEFAULT CURRENT_DATE,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert default categories
INSERT INTO categories (name, icon, description) VALUES
  ('Plumbing', '🔧', 'Leak repairs, installations, toilets, water heaters'),
  ('Electrical', '⚡', 'Wiring, sockets, lighting, electrical repairs'),
  ('Carpentry', '🪚', 'Woodwork, furniture, fittings'),
  ('Cleaning', '🧹', 'Domestic, office, deep cleaning'),
  ('Painting', '🎨', 'Interior and exterior painting'),
  ('Masonry', '🧱', 'Bricklaying, concrete work, construction'),
  ('Auto Mechanics', '🚗', 'Car and motorcycle repairs'),
  ('Phone/Laptop Repair', '💻', 'Device repairs and troubleshooting'),
  ('Hairdressing', '💇', 'Hair styling, barbing, braiding'),
  ('Catering', '🍲', 'Event cooking and food services'),
  ('Others', '✨', 'Other services not listed above')
ON CONFLICT (name) DO NOTHING;

-- 3. Insert initial site stats
INSERT INTO site_stats (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_stats ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies

-- profiles: public read, self write
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- worker_details: public read, self write
CREATE POLICY "Worker details are viewable by everyone"
  ON worker_details FOR SELECT USING (true);

CREATE POLICY "Workers can update own details"
  ON worker_details FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Workers can insert own details"
  ON worker_details FOR INSERT WITH CHECK (auth.uid() = id);

-- job_posts: public read, owner write
CREATE POLICY "Job posts are viewable by everyone"
  ON job_posts FOR SELECT USING (true);

CREATE POLICY "Clients can manage own jobs"
  ON job_posts FOR ALL USING (auth.uid() = client_id);

-- reviews: public read, authenticated write
CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add reviews"
  ON reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- notifications: self only
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- disputes: public insert, admin select
CREATE POLICY "Anyone can create disputes"
  ON disputes FOR INSERT WITH CHECK (true);

CREATE POLICY "Only admins can view disputes"
  ON disputes FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Only admins can update disputes"
  ON disputes FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- categories: public read only
CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT USING (true);

-- site_stats: admin read only
CREATE POLICY "Stats are viewable by admins"
  ON site_stats FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 6. Create storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('handyman-files', 'handyman-files', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Storage RLS policies
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND bucket_id = 'handyman-files'
  );

CREATE POLICY "Public can view files"
  ON storage.objects FOR SELECT USING (bucket_id = 'handyman-files');

CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE USING (
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 8. Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, is_worker)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    (NEW.raw_user_meta_data->>'is_worker')::boolean
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
3. Configure Auth Settings
•	Go to Authentication → Settings
•	Enable “Email” provider
•	Set “Confirm email” to your preference (recommended: ON for production)
•	Add your site URL to “Site URL” and “Redirect URLs”
4. Set Admin User
After registering your first admin account, run:
UPDATE profiles SET is_admin = true WHERE email = 'your-admin-email@example.com';
________________________________________
🚀 Deployment
Vercel (Recommended)
1.	Push your code to GitHub
2.	Go to vercel.com → “Add New Project”
3.	Import your GitHub repository
4.	Framework Preset: Other (static HTML)
5.	Add Environment Variables (if using a build step for env injection)
6.	Deploy
Vercel will automatically redeploy on every push to the main branch.
Manual Deployment
Simply upload all files to any static hosting service: - Vercel - Netlify - GitHub Pages - Firebase Hosting - Any web server (Apache, Nginx)
Note: Since this is vanilla HTML/CSS/JS, no build step is required. The files can be served directly as static assets.
________________________________________
🔒 Security
Current Security Measures
•	✅ Row Level Security (RLS) enabled on all tables
•	✅ Authentication required for write operations
•	✅ File uploads restricted to authenticated users
•	✅ Admin panel protected by email check + is_admin flag
•	✅ Input escaping for HTML content
Known Limitations
•	⚠️ Client-side admin check — The isAdmin() function runs in the browser. RLS policies are the true security layer. Never rely on client-side checks alone.
•	⚠️ No rate limiting — Currently no protection against brute-force login attempts or spam submissions. Consider adding rate limiting via Supabase Edge Functions.
•	⚠️ No email verification enforcement — Users can currently use the platform immediately after registration. Consider requiring email confirmation.
•	⚠️ File type validation is client-side — The accept="image/*" attribute and file.type.startsWith('image/') check can be bypassed. Server-side validation is recommended.
Security Best Practices
1.	Never commit .env files — Add .env to your .gitignore
2.	Never expose SUPABASE_SERVICE_ROLE_KEY — This key bypasses RLS entirely
3.	Regularly review RLS policies — Ensure they match your application’s access patterns
4.	Monitor the disputes table — Check regularly for scam reports or abuse
5.	Keep Supabase dependencies updated — Check for security updates to @supabase/supabase-js
________________________________________
🗺️ Roadmap
Phase A: Security & Stability (Current Priority)
•	☒ Fix outdated README
•	☐ Move Supabase credentials to environment variables
•	☐ Remove hardcoded admin email from client code
•	☐ Add missing CSS for dashboard, admin, and report pages
•	☐ Fix race condition in worker.html and job.html
•	☐ Verify and document all RLS policies
•	☐ Add input validation and sanitization
Phase B: Code Quality (Week 1)
•	☐ Centralize category definitions (single source of truth)
•	☐ Add SEO meta tags to all pages
•	☐ Add loading skeletons instead of “Loading…” text
•	☐ Implement proper error boundaries for Supabase failures
•	☐ Add password strength indicator on registration
Phase C: Feature Enhancements (Weeks 2-4)
•	☐ French language support — Critical for Cameroon market
•	☐ Verification workflow — Document upload + admin approval for “Verified” badge
•	☐ Worker analytics — Profile views, contact clicks, job applications
•	☐ PWA support — Service worker, manifest.json, offline browsing
•	☐ Email verification — Require confirmation before full platform access
•	☐ Location autocomplete — Suggest quarters/neighborhoods per city
Phase D: Growth & Monetization (Month 2+)
•	☐ Mobile Money integration — MTN MoMo, Orange Money
•	☐ Featured listings — Paid promotion for worker profiles
•	☐ Lead fees — Charge workers for job lead access
•	☐ Push notifications — Web Push API for real-time alerts
•	☐ GPS-based search — Find workers near your location
•	☐ In-app messaging — Replace/supplement WhatsApp with native chat
•	☐ Subscription plans — Premium features for workers
________________________________________
🤝 Contributing
We welcome contributions! Here’s how to get started:
1.	Fork the repository
2.	Create a feature branch
 	git checkout -b feature/your-feature-name
3.	Make your changes
4.	Test locally
 	python -m http.server 8000
5.	Commit and push
 	git commit -m "Add: your feature description"
git push origin feature/your-feature-name
6.	Open a Pull Request
Contribution Guidelines
•	Keep the code vanilla (no frameworks unless absolutely necessary)
•	Maintain mobile-first responsive design
•	Test on slow networks (use Chrome DevTools → Network → Slow 3G)
•	Ensure all user-facing text is clear and simple
•	Add comments for complex logic
•	Update this README if you add new features
________________________________________
📄 License
This project is licensed under the MIT License.
MIT License

Copyright (c) 2026 Handy Man Buea

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
________________________________________
📞 Contact
Handy Man Buea - 🌐 Website: https://handyman-buea.vercel.app - 📧 Email: internationalpimerchant@gmail.com - 📱 WhatsApp: Contact Admin - 🐛 Issues: GitHub Issues
________________________________________
🙏 Acknowledgments
•	Built for the people of Buea and Cameroon
•	Powered by Supabase and Vercel
•	Icons and emojis used throughout the UI
•	Unsplash images for the hero carousel
________________________________________
🔧 Handy Man Buea — Connecting People with Skilled Workers  Made with ❤️ in Buea, Cameroon
