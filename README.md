# 🌱 EcoMind — Your Carbon Coach

> **AI-powered personal carbon footprint tracker and reduction coach built for PromptWars Challenge 3**

EcoMind helps individuals understand, track, and reduce their carbon footprint through simple daily logging, Gemini-powered personalized insights, and weekly eco-challenges — all tailored to Indian lifestyle and infrastructure.

🔗 **Live Demo:** https://ecomind-177261323794.us-central1.run.app/


---

## 🎯 The Problem

The average Indian generates 11.2 kg of CO2 per day. Most people don't know that. And the ones who do don't know what to change — because generic carbon calculators give you a number, not a plan.

EcoMind gives you a plan.

---

## ✨ Features

### 📊 Daily Activity Tracker (`/track`)
- Log activities across 4 categories: **Transport, Food, Energy, Shopping**
- 25+ activity types with accurate India-specific CO2 factors:
  - Transport: Car (petrol/diesel), Motorcycle, Bus, Train, Auto, Domestic Flight
  - Food: Beef, Chicken, Vegetarian, Vegan meals, Dairy
  - Energy: Electricity (India grid 0.82 kg/kWh), LPG, AC, Fan
  - Shopping: Clothing, Electronics, Online delivery, Plastic bags
- **Live CO2 preview** updates as you type — green/amber/red coded
- **Carbon Gauge** — custom SVG circular dial showing today's total vs 5kg target
- **7-day stacked bar chart** via Recharts, colored by category
- Recent activity log with delete functionality
- All data persisted to Firebase Firestore per user

### 🤖 AI Insights (`/insights`)
- **Gemini 2.5 Flash** analyzes your actual logged weekly data
- Generates **3 personalized InsightCards** with:
  - Specific actionable tip (not generic advice)
  - Estimated weekly CO2 saving in kg
  - Impact level: 🔴 High / 🟡 Medium / 🟢 Low
- **Comparison bars** — Your average vs India average (11.2 kg) vs Global average (15.1 kg)
- **Weekly trend** dual line chart — this week vs last week
- 4 summary stats: total CO2, highest emission day, biggest category, % change

### 🏆 Eco Challenges (`/challenges`)
- **Gemini generates 5 personalized weekly challenges** based on your highest-emission categories
- Challenges tailored to Indian lifestyle (metro, LPG, monsoon commute etc.)
- Difficulty levels: Easy / Medium / Hard
- Mark complete → Framer Motion confetti animation → badge awarded
- Streak counter tracking consecutive days of engagement
- Badge collection: 🌱 First Log · 🚇 Transit Hero · 🥗 Green Eater · ⚡ Energy Saver

### 🏠 Landing + Onboarding (`/`)
- One-question lifestyle onboarding: Transport / Food / Energy / Shopping
- Gemini generates a **personalized opening insight** before you've logged anything
- 3 key stats: India's annual CO2, your 5kg daily target, 40% average reduction potential

### 🔐 Authentication
- Google Sign-In via Firebase Authentication
- Popup-based auth with automatic redirect fallback
- Cross-Origin-Opener-Policy: `same-origin-allow-popups` configured for Cloud Run
- Progress, quiz scores, and challenges all tied to Firebase UID across devices

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS v4, shadcn/ui, Lucide Icons |
| **Animations** | Framer Motion (gauges, stagger, confetti, comparisons) |
| **Charts** | Recharts (stacked bar, dual line) |
| **AI Engine** | Google Gemini 2.5 Flash |
| **Auth & DB** | Firebase Authentication + Firestore |
| **Containerization** | Docker multi-stage (node:20-alpine, non-root user) |
| **Registry** | Google Artifact Registry (asia-south1) |
| **Deployment** | Google Cloud Run (asia-south1, 1Gi memory) |
| **CI/CD** | Google Cloud Build (cloudbuild.yaml) |
| **Secrets** | Google Secret Manager |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── activities/
│   │   │   ├── log/route.ts          # Log activity, calculate CO2, save to Firestore
│   │   │   └── summary/route.ts      # 7-day aggregated summary per user
│   │   ├── insights/
│   │   │   └── generate/route.ts     # Gemini weekly report (3 insights)
│   │   ├── challenges/
│   │   │   └── generate/route.ts     # Gemini challenge generation (5 challenges)
│   │   └── profile/
│   │       └── setup/route.ts        # Lifestyle onboarding upsert
│   ├── track/page.tsx                # Gauge + chart + logger + history
│   ├── insights/page.tsx             # AI report + comparison + trend chart
│   ├── challenges/page.tsx           # Challenges + streak + badges
│   ├── layout.tsx                    # Root layout with navbar
│   └── page.tsx                      # Landing + onboarding
├── components/
│   ├── ui/                           # shadcn/ui base components
│   ├── ActivityCard.tsx              # Per-category log form with live CO2
│   ├── CarbonGauge.tsx               # Custom SVG circular gauge
│   ├── CategoryPicker.tsx            # 4-tab category selector
│   ├── ChallengeCard.tsx             # Challenge with complete animation
│   ├── ComparisonBar.tsx             # Animated horizontal comparison bars
│   ├── EmissionsChart.tsx            # Recharts stacked bar chart
│   └── InsightCard.tsx               # Gemini insight with impact badge
├── lib/
│   ├── hooks/
│   │   ├── useAuth.ts                # Firebase auth + Google OAuth
│   │   ├── useActivities.ts          # Firestore activities listener
│   │   └── useChallenges.ts          # Firestore challenges + markComplete
│   ├── carbonData.ts                 # CO2 factors, calculateCO2(), averages
│   ├── firebase.ts                   # Client SDK
│   ├── firebase-admin.ts             # Server SDK with PRIVATE_KEY fix
│   └── gemini.ts                     # Gemini client + EcoMind system prompt
```

---

## 🌍 Carbon Factors Used

All CO2 values are India-specific:

| Category | Activity | CO2 per unit |
|---|---|---|
| Transport | Car petrol | 0.21 kg/km |
| Transport | Motorcycle | 0.11 kg/km |
| Transport | Train | 0.041 kg/km |
| Transport | Domestic flight | 0.255 kg/km |
| Food | Beef meal | 6.61 kg |
| Food | Vegetarian meal | 0.37 kg |
| Food | Vegan meal | 0.18 kg |
| Energy | Electricity (India grid) | 0.82 kg/kWh |
| Energy | AC usage | 1.25 kg/hour |
| Shopping | Electronics purchase | 70.0 kg |
| Shopping | New clothing item | 10.0 kg |

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 20+
- Google AI Studio API Key (Gemini)
- Firebase Project (Auth + Firestore enabled)

### Installation

```bash
# Clone the repository
git clone https://github.com/saadzaveri26/EcoMind.git
cd EcoMind/app_build

# Install dependencies
npm install

# Configure environment variables
cp .env.local.example .env.local
```

Fill in `.env.local`:

```env
# Firebase Client SDK (safe for client bundle)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_APP_ID=1:xxx:web:xxx

# Gemini API (server-side only)
GEMINI_API_KEY=your-gemini-api-key

# Firebase Admin SDK (server-side only)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"
```

```bash
# Run development server
npm run dev
```

Open http://localhost:3000

### Firebase Setup
1. Create a Firebase project at https://console.firebase.google.com
2. Enable **Authentication** → Google provider
3. Enable **Firestore** → Start in production mode
4. Set Firestore rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
5. Add `localhost` to **Authentication → Settings → Authorized Domains**

---

## ☁️ Deployment (Google Cloud Run)

### Prerequisites
- gcloud CLI installed and authenticated
- Docker Desktop running
- GCP project with billing enabled

### Step 1 — Enable APIs
```bash
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com
```

### Step 2 — Create Artifact Registry
```bash
gcloud artifacts repositories create ecomind --repository-format=docker --location=asia-south1
```

### Step 3 — Store Secrets
```bash
echo -n "your-gemini-key" | gcloud secrets create GEMINI_API_KEY --data-file=-
echo -n "your-firebase-private-key" | gcloud secrets create FIREBASE_PRIVATE_KEY --data-file=-
echo -n "your-client-email" | gcloud secrets create FIREBASE_CLIENT_EMAIL --data-file=-
```

### Step 4 — Build with Firebase Config Baked In
```bash
# Authenticate Docker
gcloud auth configure-docker asia-south1-docker.pkg.dev

# Build with NEXT_PUBLIC_ vars baked at build time
docker build \
  --build-arg NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key \
  --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com \
  --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id \
  --build-arg NEXT_PUBLIC_FIREBASE_APP_ID=1:xxx:web:xxx \
  -t asia-south1-docker.pkg.dev/YOUR_PROJECT/ecomind/ecomind-app:latest .

# Push
docker push asia-south1-docker.pkg.dev/YOUR_PROJECT/ecomind/ecomind-app:latest
```

### Step 5 — Deploy
```powershell
gcloud run deploy ecomind --image=asia-south1-docker.pkg.dev/YOUR_PROJECT/ecomind/ecomind-app:latest --platform=managed --region=asia-south1 --allow-unauthenticated --port=3080 --memory=1Gi --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest,FIREBASE_PRIVATE_KEY=FIREBASE_PRIVATE_KEY:latest,FIREBASE_CLIENT_EMAIL=FIREBASE_CLIENT_EMAIL:latest"
```

### Step 6 — Allow Public Access
```bash
gcloud run services add-iam-policy-binding ecomind \
  --region=asia-south1 \
  --member="allUsers" \
  --role="roles/run.invoker"
```

### Step 7 — Add Cloud Run Domain to Firebase
Firebase Console → Authentication → Settings → Authorized Domains → Add your Cloud Run URL.

---

## 🔒 Security

- `GEMINI_API_KEY` and `FIREBASE_PRIVATE_KEY` are server-side only via Secret Manager — never in the client bundle
- `NEXT_PUBLIC_*` Firebase config is baked at Docker build time via `--build-arg`
- `FIREBASE_PRIVATE_KEY` uses `.replace(/\\n/g, '\n')` to handle Cloud Run escaping
- Firestore rules require `request.auth != null` for all reads/writes
- Docker runs as non-root `nextjs:nodejs` user
- All API routes include Zod input validation and rate limiting
- `.env*` files excluded from version control

---

## 🤖 Built with Google Antigravity

EcoMind was built using a structured agentic skill pipeline inside Google Antigravity:

```
write_specs → generate_code → audit_code → deploy_app → deploy_cloud_run
```

Each skill is a structured `.md` prompt file in `.agents/skills/`. The `startcycle` workflow orchestrates the entire pipeline end-to-end — from Technical Specification to live Cloud Run URL.

---

## 🌐 Chosen Vertical

**Carbon Footprint Coaching** — Design a solution that helps individuals understand, track, and reduce their carbon footprint through simple actions and personalized insights.

### Approach & Logic
1. **Track** — Users log real daily activities. CO2 is calculated server-side using verified India-specific emission factors.
2. **Understand** — Gemini analyzes the week's data and generates 3 specific, actionable insights based on the user's actual highest-emission activities.
3. **Act** — Insights become challenges. Users commit to weekly goals, mark them complete, and earn badges.
4. **Repeat** — Streak tracking and progress persistence build the habit loop.

### Key Assumptions
- India grid electricity emission factor: 0.82 kg CO2/kWh (CEA 2023)
- India average daily footprint: 11.2 kg CO2/person
- Global average daily footprint: 15.1 kg CO2/person
- Sustainable daily target: 5.0 kg CO2 (Paris Agreement alignment)
- Food emissions use average serving sizes for Indian meal portions

---

---

## 🎯 Problem Statement Alignment

The challenge states: *"Help individuals understand, track, and reduce their carbon footprint through simple actions and personalized insights."*

Here is how each feature in EcoMind directly addresses each keyword in the problem statement:

| Problem Statement Keyword | EcoMind Feature | Implementation Details |
|---|---|---|
| **"understand"** | `/insights` page with comparison bars | Compares the user's daily average against India (11.2 kg) and global (15.1 kg) averages. Gemini 2.5 Flash explains WHY certain activities produce more CO2, making the footprint personally meaningful. |
| **"track"** | `/track` page with daily logger | Users log activities across 4 categories (Transport, Food, Energy, Shopping). Each log calculates CO2 using India-specific emission factors and updates a real-time Carbon Gauge and 7-day stacked bar chart. |
| **"reduce"** | `/challenges` page with weekly action plan | Gemini generates 5 personalized weekly eco-challenges targeting the user's highest-emission categories. Completing challenges earns badges and builds streaks. |
| **"simple actions"** | One-tap logging + live CO2 preview | The ActivityCard component shows a live CO2 preview (green/amber/red) as the user adjusts quantity. Logging requires a single tap. Onboarding is a single question. |
| **"personalized insights"** | Gemini analyzes YOUR actual data | Unlike generic carbon calculators, EcoMind sends the user's real weekly breakdown to Gemini 2.5 Flash, which returns 3 specific tips with estimated savings — tailored to Indian lifestyle and infrastructure. |

### Feature → Problem Statement Mapping

```mermaid
graph LR
    A[Log Activity] -->|one-tap| B[Track /track]
    B -->|weekly data| C[Understand /insights]
    C -->|AI analysis| D[Personalized Insights]
    D -->|become| E[Reduce /challenges]
    E -->|streaks & badges| A
```

- **Landing page (`/`)**: One-question onboarding captures lifestyle focus → Gemini immediately generates a personalized opening insight before any data is logged.
- **Track page (`/track`)**: Real-time CO2 calculation with live preview → Carbon Gauge shows progress against 5 kg daily target.
- **Insights page (`/insights`)**: Gemini-powered weekly report with 3 actionable tips + comparison bars + trend charts.
- **Challenges page (`/challenges`)**: 5 AI-generated weekly challenges with difficulty ratings, completion tracking, and badge rewards.

---

### 🇮🇳 India-Specific Carbon Emission Factors

EcoMind utilizes real regional emission factors (expressed in kg CO2 per unit) to ensure carbon footprint estimates are highly localized for Indian citizens:

1. **Energy (Grid & Household)**:
   - **Grid Electricity**: **0.82 kg CO2 / kWh** (source: Central Electricity Authority (CEA) of India average, reflecting India's coal-heavy grid mix).
   - **LPG Cooking**: **0.34 kg CO2 / hour** (adjusted for typical Indian cooking burners and standard cylinder consumption).
   - **AC Usage**: **1.25 kg CO2 / hour** (typical 1.5-ton AC power draw under Indian summer conditions).
   - **Fan Usage**: **0.038 kg CO2 / hour** (power consumption of typical ceiling fans widely used in Indian households).

2. **Transport (Commutes & Travel)**:
   - **Auto Rickshaw**: **0.097 kg CO2 / km** (highly common intermediate public transport in urban India).
   - **Motorcycle / Scooter**: **0.11 kg CO2 / km** (two-wheelers dominate Indian roads).
   - **Petrol Car**: **0.21 kg CO2 / km** (standard passenger vehicle factor).
   - **Diesel Car**: **0.17 kg CO2 / km** (diesel passenger vehicle factor).
   - **Bus**: **0.089 kg CO2 / km** (regional bus transit average).
   - **Train**: **0.041 kg CO2 / km** (Indian Railways electrified/diesel passenger transit average).
   - **Flight (Domestic)**: **0.255 kg CO2 / km** (airline travel average).

3. **Food (Indian Dietary Choices)**:
   - **Vegetarian Meal**: **0.37 kg CO2 / meal** (traditional Indian diet, rich in lentils/grains).
   - **Vegan Meal**: **0.18 kg CO2 / meal** (pure plant-based meal).
   - **Chicken Meal**: **1.24 kg CO2 / meal** (broiler poultry average portion).
   - **Seafood Meal**: **6.61 kg CO2 / meal** (coastal fish and shellfish average portion).
   - **Dairy**: **0.31 kg CO2 / 100ml** (milk/curd/paneer consumption, highly prevalent in Indian culinary habits).

4. **Shopping (Daily Goods & Consumables)**:
   - **Clothing**: **10.0 kg CO2 / item** (average textile manufacture footprint).
   - **Electronics**: **70.0 kg CO2 / item** (average consumer electronics hardware manufacturing footprint).
   - **Delivery**: **0.5 kg CO2 / delivery** (typical regional logistics/e-commerce last-mile shipping).
   - **Plastic Bag**: **0.033 kg CO2 / bag** (standard thin single-use plastic carrier).

---

### 🤖 Gemini-Powered Personalization vs. Static Checklists

Traditional carbon tracking apps present static lists of tips (e.g. "eat less meat" or "use public transit") which users quickly tune out. EcoMind solves this by utilizing **Gemini 2.5 Flash** server-side to generate dynamic, hyper-personalized insights and challenges:
- **Actual User Data**: The Gemini prompt contains the user's *actual* weekly carbon category breakdown and logged activities.
- **Lifestyle Preference Context**: Gemini factors in the user's chosen onboarding lifestyle focus (Transport, Food, Energy, or Shopping).
- **Dynamic Challenges**: If a user's logs reveal high energy usage from AC but their focus is Transport, Gemini intelligently prioritizes energy challenges first while offering a path to reduce transport emissions, targeting the highest real potential savings.
- **Explainability**: Rather than just ordering actions, the model explains *why* the suggestion fits the user's specific context, bridging the gap between tracking and understanding.

---

### ⚡ Mechanics of "Simple Actions"

To lower the barrier to habit formation, EcoMind simplifies the user interface and provides instant feedback loops:
1. **Live CO2 Preview**: As users adjust quantities on the `/track` page, the `ActivityCard` computes and updates the estimated footprint in real time *before* submission. The preview is color-coded:
   - **Green (<1.5 kg CO2)**: Minor daily footprint.
   - **Amber (1.5 - 5.0 kg CO2)**: Moderate footprint.
   - **Red (>5.0 kg CO2)**: High-impact activity.
2. **Dynamic Carbon Gauge**: The circular gauge on the dashboard gives an instant visual health check against the sustainable Paris-aligned **5.0 kg daily CO2 target**:
   - **Green (<5.0 kg)**: Low footprint (Sustainable).
   - **Amber (5.0 - 10.0 kg)**: Approaching/exceeding target.
   - **Red (>10.0 kg)**: High carbon day.
3. **One-Tap Actions**: The category picker, quick tabs, and pre-populated quantities minimize text fields and keystrokes, making carbon logging a 3-second routine.

---

*Built with 💚 for PromptWars Challenge 3 — Virtual PromptWars Challenge, Hack2skill*

