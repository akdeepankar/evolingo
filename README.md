# 🌌 Etymo

**Etymo** is an immersive, 3D etymological explorer that turns the dry history of words into a vibrant, cinematic journey through time and space.

## 🚀 Live Demo
[etymologic.vercel.app](https://etymologic.vercel.app)

## 🎬 Demo Video 

[![Etymo Demo](https://img.youtube.com/vi/t0RMhiHzhTE/maxresdefault.jpg)](https://www.youtube.com/watch?v=t0RMhiHzhTE)

## 💡 The Problem
Etymology is the hidden DNA of human culture, yet it is often buried in dense dictionaries or static text. 
- **Lacks Visual Context**: Standard dictionaries don't show *where* a word traveled or *how* it morphed geographically.
- **Disconnected Families**: It's hard to visualize the "cousins" (cognates) of a word across neighboring languages.
- **Static Learning**: Language is alive and evolving, but its history is usually presented as a dead list of dates.

## 🚀 The Solution: Etymo
Etymo breathes life into linguistics using state-of-the-art 3D visualizations and AI. It bridges the gap between history, geography, and language, allowing users to **see** the migration of ideas.

### 🌎 Use Cases in Daily Life
*   **For Curious Minds**: Ever wondered why "Mother" sounds similar in 50 languages? Etymo shows you the common root.
*   **For Students & Educators**: A powerful tool for history and language classes to visualize cultural exchange.
*   **For Writers & Poets**: Find deeper meaning and "flavor" for words by understanding their ancient nuances and original scripts.
*   **For Travelers**: Get cultural insights and famous local idioms for words in the region you're visiting.



## ✨ Key Features

### 1. 🌍 interactive Globe View
Visualize the migration of words across a Mapbox-powered 3D globe. Watch as paths form between ancient civilizations and modern nations.

### 2. 🌌 Galaxy View (Language Tree)
Switch to a 3D "Language Constellation." The root stays at the center, while branches (cognates) and the path of evolution spiral outward like a galaxy, showing related words in sister languages.

### 3. ⏳ Path Animation & Time Travel
Use the timeline to "play" the history of a word. Watch it evolve from its earliest known form to its modern usage, step by chronological step.

### 4. 🏮 Cultural Insights
Beyond just definitions, get unique cultural idioms, proverbs, and "origin stories" for every stage of a word's life.

### 5. 🎨 Shareable Posters
Generate beautiful, minimalist posters of a word’s journey to share on social media or save to your personal collection.

### 6. 💬 Collaborative Discussion Groups
Language is social. Connect with other explorers to trace the history of words together.
- **Create & Lead**: Start your own research community. The app generates a unique **6-digit join code** (e.g., `X8J2P`) that you can share with friends or students.
- **Join with Ease**: Enter a group code to instantly jump into an existing conversation and start contributing.
- **Interactive Research Sharing**: Found a fascinating journey for "Robot"? Share it directly into the chat. Other members can see a summary of your findings instantly.
- **Synchronized Exploration**: Any group member can click on a shared word in the chat to instantly load its full 3D journey on their own Globe or Galaxy view, allowing for real-time collaborative analysis.
- **Global Collaboration**: Discuss etymological findings in real-time with people across different cultures and languages.



## 🛠️ Tech Stack
*   **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
*   **3D Rendering**: [Three.js](https://threejs.org/), [@react-three/fiber](https://github.com/pmndrs/react-three-fiber), [@react-three/drei](https://github.com/pmndrs/drei)
*   **Maps**: [Mapbox GL JS](https://www.mapbox.com/)
*   **AI**: [OpenAI GPT-4o](https://openai.com/)
*   **Database & Auth**: [Supabase](https://supabase.com/)
*   **I18n**: [Lingo.dev](https://lingo.dev/)



## 🌍 Internationalization with lingo.dev

Etymo is built to be a truly global platform. To achieve this, we've integrated **lingo.dev** for seamless, real-time localization of both the interface and the dynamic etymological data.

### 🛠️ Implementation Details

We use the `lingo.dev/sdk` on the server-side to handle complex translations while preserving data structures. Our implementation focuses on three key areas:

1.  **Dynamic Data Translation**:
    The etymological data returned by OpenAI (roots, paths, meanings) is often in English. We use `lingoDotDev.localizeObject` to translate these complex JSON structures into the user's target language on-the-fly, ensuring that `meanings` and `cultural_insights` are accessible regardless of the user's native tongue.

2.  **UI Localization**:
    Static UI elements like buttons, placeholders, and tooltips are localized using `lingoDotDev.localizeText`. This allows us to scale to new languages instantly without maintaining massive manual translation files.

3.  **Real-time Chat Translation**:
    In our Discussion Groups, messages can be translated in real-time, allowing users from different linguistic backgrounds to share their discoveries and discuss the evolution of words together.

### 🧩 Example Usage
```typescript
import { lingoDotDev } from "@/lib/lingo";

// Translating complex etymology objects
const translatedData = await lingoDotDev.localizeObject(etymologyResult, {
    sourceLocale: 'en',
    targetLocale: userPreferredLocale,
});
```


## 🛠️ Getting Started

1.  **Clone the repo**:
    ```bash
    git clone https://github.com/your-repo/etymo.git
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Set up Environment Variables**:
    Create a `.env.local` file with:
    - `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`
    - `NEXT_PUBLIC_OPENAI_API_KEY`
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4.  **Run the app**:
    ```bash
    npm run dev
    ```



## 🛸 Dive into the DNA of Language. 
**Explore Etymo today.**
