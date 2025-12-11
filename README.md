# Reddit Mastermind 🧠

**The Ultimate Reddit Marketing Strategist**

Reddit Mastermind is a Next.js application that autonomously generates high-fidelity, human-like Reddit content calendars using a sophisticated 2-Pass AI architecture ("The Architect" + "The Critic"). It allows marketing teams to plan, visualize, and export authentic Reddit discussions that blend seamlessly into target subreddits.



[![Watch the Demo](https://img.shields.io/badge/Watch_Demo_Video-Google_Drive-blue?style=for-the-badge&logo=google-drive)](https://drive.google.com/drive/folders/1ELC3l3EmNyVEDRvLehokCwklKt9GKgN4?usp=sharing)
*Click the badge above to watch the project demo.*

## 🚀 Key Features

*   **2-Pass "Critic" AI Engine**:
    *   **Phase 1 (The Architect)**: Generates creative drafts based on strict persona rules and Reddit culture.
    *   **Phase 2 (The Critic)**: An adversarial QA model that reviews the draft for "salesy" tone, verifies persona consistency, and injects imperfections (slang, typos) for maximum realism.
*   **Strict Persona Management**: Enforces custom Usernames and distinct personality voices. Prevents "self-replies" and ensures diverse character interactions.
*   **Multi-Week Campaign Planning**: Generates infinite content weeks with context awareness (remembers previous topics to avoid repetition).
*   **Advanced Data Export**:
    *   **Excel (`.xlsx`)**: Single-sheet master view with separated Posts and Comments tables.
    *   **Supabase**: Automatically archives every generated campaign to a PostgreSQL database for historical tracking.
*   **Premium Glassmorphism UI**: A dark-mode, Reddit-inspired interface with realistic post cards, nested comment threads, and vote simulations.

## 🛠️ Tech Stack

*   **Framework**: Next.js (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS + Lucide Icons + Custom Glassmorphism
*   **AI**: DeepSeek V3 (via OpenAI SDK compatibility)
*   **Database**: Supabase (PostgreSQL)
*   **Utilities**: `xlsx` (Excel Export), `zod` (Schema Validation), `canvas-confetti` (UX Delights)

## 📂 Project Structure

```bash
📦 reddit-mastermind
├── 📂 app
│   ├── 📂 api/generate/route.ts  # 🧠 The Brain: 2-Pass AI Logic & Supabase Save
│   ├── layout.tsx                # Root layout & Metadata
│   ├── page.tsx                  # Main Controller: State Management & Logic
│   └── globals.css               # Global Styles & Animations
├── 📂 components
│   ├── ContentCalendar.tsx       # 📅 The UI: Reddit Post Cards, Comments, Export Logic
│   └── GeneratorForm.tsx         # ⚙️ Input Form: Personas, Company Info, Settings
├── 📂 lib
│   ├── supabase.ts               # Database Client Initialization
│   └── types.ts                  # TypeScript Interfaces (Post, Comment, Personas)
├── .env.local                    # API Keys & Secrets
└── package.json
```

## 🧠 Core Algorithms

### 1. The "Architect" & "Critic" Loop (`route.ts`)
Instead of a single prompt, we use a pipeline:
1.  **Drafting**: The AI receives a "Reddit Architect" system prompt to create raw content.
2.  **Review**: The output is passed to "The Critic", which checks against a checklist:
    *   *Is it salesy?* -> Rewrite as a rant/question.
    *   *Persona Match?* -> Verify usernames against the allowlist.
    *   *Realism?* -> Add "idk", "ngl", and sentence variety.
3.  **Enrichment**: The server injects UUIDs and realistic timestamps (randomized distribution 9AM-9PM) before returning.

### 2. Export Logic (`ContentCalendar.tsx`)
We don't just dump JSON. The export function:
*   Flattens the hierarchical data into two relational tables.
*   Generates a "Content Master" worksheet.
*   Appends the **Comments** table *below* the **Posts** table with a clear section header, maintaining `post_id` foreign keys for easy tracking.

## 🚀 Setup & Installation

1.  **Clone the repo**:
    ```bash
    git clone https://github.com/your-username/reddit-mastermind.git
    cd reddit-mastermind
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment**:
    Create `.env.local` and add:
    ```env
    DEEPSEEK_API_KEY=your_key_here
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
    ```

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000).

## 💾 Database Schema (Supabase)

Run this SQL in your Supabase Query Editor to set up the history table:

```sql
create table content_generations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  company_info text,
  week_start text,
  quality_score int,
  full_response jsonb
);
```
