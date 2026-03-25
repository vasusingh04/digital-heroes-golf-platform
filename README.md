# Golf Charity Subscription Platform ⛳️

A full-stack, subscription-based web application combining golf performance tracking, charitable giving, and a monthly draw-based reward engine. Built as a technical assignment for the Digital Heroes Full-Stack Developer PRD.

## 🚀 Live Demo
**Live Platform:** [Insert Your Vercel URL Here]

## 🛠 Tech Stack
* **Frontend:** Next.js 15 (App Router), React, Tailwind CSS, TypeScript
* **Backend/Database:** Supabase (PostgreSQL, Row Level Security, Auth)
* **Payments:** Stripe API (Test Mode Checkout & Webhooks)
* **Deployment:** Vercel

## ✨ Core Features

### 1. Subscription Engine
* Integrated Stripe Checkout for Monthly ($10) and discounted Yearly ($100) plans.
* Secure subscription validation preventing unauthorized access to core platform features.

### 2. Score Management System ("Rolling 5" Logic)
* Users can log their golf scores in Stableford format (1-45 range).
* **Algorithmic Data Management:** The database strictly retains only the 5 most recent scores per user. Whenever a 6th score is entered, the oldest score is automatically identified and deleted to maintain the rolling average.

### 3. Charity Contribution System
* Interactive slider allowing users to allocate a portion of their subscription fee to a chosen charity.
* Hardcoded validation enforcing a mandatory minimum 10% contribution rate.
* Dynamic dropdown populated from a relational `charities` table in the database.

### 4. Admin Control Center & Draw Engine
* Role-based access control protecting the `/admin` route.
* Real-time dashboard displaying total users, active subscribers, and platform metrics.
* **Monthly Draw Simulation:** A custom engine that generates 5 unique random winning numbers (1-45) and dynamically calculates the monthly prize pool based on the current active subscriber count.

## 💻 Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-username/digital-heroes-golf-platform.git](https://github.com/your-username/digital-heroes-golf-platform.git)
   cd digital-heroes-golf-platform