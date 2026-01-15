# AI Visibility Tracker

Track and analyze your brand's visibility across AI-powered search platforms like ChatGPT, Gemini, and Perplexity.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![React](https://img.shields.io/badge/react-18.3-blue.svg)

## Overview

As AI-powered search becomes increasingly dominant, understanding how AI models recommend and mention your brand is critical. AI Visibility Tracker helps you:

- **Monitor brand mentions** across AI-generated responses
- **Track competitor visibility** and share of voice
- **Analyze sentiment** of how AI describes your brand
- **Discover citation sources** that AI models trust
- **Identify optimization opportunities** for AI search

## Features

### 🎯 Brand Visibility Tracking
- Track how often your brand appears in AI responses
- Monitor position (1st, 2nd, 3rd mentioned)
- Identify which prompts trigger brand mentions

### 📊 Competitive Analysis
- Compare visibility against competitors
- Share of voice metrics
- Head-to-head position analysis

### 💬 Sentiment Analysis
- Automatic sentiment detection (positive/neutral/negative)
- Context snippet extraction
- Recommendation tracking

### 🔗 Citation Intelligence
- Track which domains AI models cite most
- Identify high-authority sources in your category
- Discover content opportunities

### 📈 Trend Analysis
- Historical visibility tracking
- Performance changes over time
- Multi-run comparisons

## Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **ORM**: Prisma
- **AI**: Google Gemini 2.0 Flash with Google Search grounding

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query
- **Charts**: Recharts
- **Icons**: Lucide React

## Project Structure

```
ai-visibility-tracker/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── src/
│   │   ├── index.js           # Express server entry
│   │   ├── routes/
│   │   │   ├── projects.js    # Project CRUD endpoints
│   │   │   ├── analysis.js    # Analysis run endpoints
│   │   │   └── dashboard.js   # Dashboard data endpoints
│   │   └── services/
│   │       ├── geminiService.js    # Gemini AI integration
│   │       ├── promptGenerator.js  # Auto prompt generation
│   │       └── analysisRunner.js   # Analysis orchestration
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui.jsx         # Reusable UI components
│   │   │   ├── Charts.jsx     # Data visualization
│   │   │   └── Layout.jsx     # App layout
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── ProjectsPage.jsx
│   │   │   ├── NewProjectPage.jsx
│   │   │   └── ProjectDetailPage.jsx
│   │   ├── hooks/
│   │   │   └── useApi.js      # TanStack Query hooks
│   │   ├── lib/
│   │   │   ├── api.js         # API client
│   │   │   └── utils.js       # Utility functions
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── tailwind.config.js
│   └── package.json
├── package.json               # Root package with scripts
└── README.md
```

## Installation

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

### Quick Start

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd ai-visibility-tracker
   npm run install:all
   ```

2. **Configure environment variables**
   ```bash
   cp backend/.env.example backend/.env
   ```
   
   Edit `backend/.env`:
   ```env
   DATABASE_URL="file:./dev.db"
   GEMINI_API_KEY="your-gemini-api-key-here"
   PORT=3001
   ```

3. **Initialize the database**
   ```bash
   cd backend
   npx prisma migrate dev --name init
   npx prisma generate
   cd ..
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Usage

### Creating a Project

1. Click **"Create Project"** on the homepage
2. Enter project details:
   - **Project Name**: e.g., "CRM Brand Tracking"
   - **Category**: e.g., "CRM software" (used for prompt generation)
   - **Your Brand**: The brand you want to track
   - **Competitors**: Add 3-5 competitor brands
3. Click **"Create Project"**

The system automatically generates 25 relevant search prompts based on your category.

### Running an Analysis

1. Navigate to your project
2. Click **"Run Analysis"**
3. Watch real-time progress as each prompt is analyzed
4. View results in the dashboard

### Understanding the Dashboard

#### Overview Tab
- **AI Visibility**: Percentage of prompts where your brand was mentioned
- **Share of Voice**: Your mentions vs. total brand mentions
- **Avg Position**: Average ranking when mentioned (1 = first)
- **Charts**: Visual comparisons and trends

#### Prompts Tab
- See all prompts and filter by mention status
- View position, sentiment, and context for each
- Identify which prompt types work best

#### Citations Tab
- Top cited domains by AI
- Most referenced pages
- Citation share percentages

#### Competitors Tab
- Side-by-side visibility comparison
- Sentiment breakdown per competitor
- Visibility gap analysis

## API Reference

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all projects |
| GET | `/api/projects/:id` | Get project details |
| POST | `/api/projects` | Create new project |
| DELETE | `/api/projects/:id` | Delete project |

### Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analysis/:projectId/run` | Start analysis run |
| GET | `/api/analysis/:projectId/runs` | List analysis runs |
| GET | `/api/analysis/:projectId/stream/:runId` | SSE progress stream |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/:projectId` | Get dashboard summary |
| GET | `/api/dashboard/:projectId/prompts` | Get prompt-level data |
| GET | `/api/dashboard/:projectId/citations` | Get citation analysis |
| GET | `/api/dashboard/:projectId/trends` | Get historical trends |
| GET | `/api/dashboard/:projectId/competitors` | Get competitor data |

### Key Models

| Model | Purpose |
|-------|---------|
| **Project** | Container for tracking configuration |
| **Brand** | Brands being tracked (user's + competitors) |
| **Prompt** | Search queries to test against AI |
| **AnalysisRun** | Single analysis session |
| **PromptResult** | AI response for a specific prompt |
| **BrandMention** | When/how a brand appeared in response |
| **Citation** | URLs cited by AI in responses |
| **MetricsSnapshot** | Aggregated metrics per brand per run |

### Using Citation Data

- **Content Strategy**: Create content on high-citation domains
- **Link Building**: Target sources that AI trusts
- **Gap Analysis**: Find domains citing competitors but not you

## Key Metrics Explained

| Metric | Description | Calculation |
|--------|-------------|-------------|
| **Visibility Score** | How often your brand is mentioned | (Prompts with mention / Total prompts) × 100 |
| **Share of Voice** | Your presence vs competitors | (Your mentions / All brand mentions) × 100 |
| **Average Position** | Typical ranking when mentioned | Sum of positions / Number of mentions |
| **First Position Rate** | How often mentioned first | (First positions / Total mentions) × 100 |
| **Recommendation Rate** | How often explicitly recommended | (Recommendations / Total prompts) × 100 |

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `file:./dev.db` |
| `GEMINI_API_KEY` | Google Gemini API key | Required |
| `PORT` | Backend server port | `3001` |

### Switching to PostgreSQL

1. Update `backend/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. Update `backend/.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/ai_visibility"
   ```

3. Run migrations:
   ```bash
   cd backend
   npx prisma migrate dev --name init
   ```

## Cost Estimation

The application uses **Gemini 2.0 Flash** with Google Search grounding:

| Usage | Cost |
|-------|------|
| Per prompt analysis | ~$0.0008 |
| Per full run (25 prompts) | ~$0.02 |
| 100 runs/month | ~$2.00 |

*Costs are estimates based on Gemini pricing as of 2024.*

## Development

### Running in Development

```bash
# Start both frontend and backend
npm run dev

# Or run separately
npm run dev:backend
npm run dev:frontend
```

### Building for Production

```bash
# Build frontend
cd frontend
npm run build

# The build output will be in frontend/dist/
```

### Database Management

```bash
# View database in Prisma Studio
cd backend
npx prisma studio

# Reset database
npx prisma migrate reset

# Generate Prisma client after schema changes
npx prisma generate
```

