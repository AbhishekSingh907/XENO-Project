# XENO AI CRM — AI-Native D2C Shopper Engagement Platform

**An enterprise-grade marketing operating system for brands to manage shoppers, create intelligent audience segments, generate AI-powered campaigns, simulate delivery, and track realtime analytics.**

## ✨ Vision

XENO is not a traditional sales CRM. It's a **marketing and shopper engagement OS** that empowers D2C brands to:

- 🏢 Manage and understand shoppers at scale
- 🧠 Create intelligent, AI-driven audience segments
- ✍️ Generate campaign copy with AI in seconds
- 📊 Simulate and track campaign delivery realtime
- 📈 Analyze engagement metrics with animated dashboards
- 🤖 Automate workflows using AI insights

## 🏗️ Tech Stack

### Frontend
- **React 18** with Vite for lightning-fast builds
- **TailwindCSS v4** for modern, responsive design
- **Framer Motion** for smooth animations
- **Zustand** for state management
- **Recharts** for interactive data visualization
- **Lucide React** for beautiful icons

### Backend
- **Node.js + Express.js** for scalable API
- **MongoDB + Mongoose** for flexible data models
- **Socket.io** for realtime updates
- **Bullmq** for background job queues
- **Faker.js** for realistic seed data

### AI & Deployment
- **Gemini API** for intelligent campaign generation
- **Offline NLP** fallback for local processing
- **Vercel** for frontend deployment
- **Railway/Render** for backend
- **MongoDB Atlas** for cloud database

## 📁 Project Structure

```
XENO-Project/
├── frontend/                 # React + Vite application
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── components/      # Reusable UI components
│   │   ├── layouts/         # Layout wrappers
│   │   ├── charts/          # Chart components
│   │   ├── ai/              # AI command center
│   │   ├── campaign/        # Campaign management
│   │   ├── shoppers/        # Shopper database
│   │   ├── store/           # Zustand store
│   │   ├── services/        # API calls
│   │   ├── utils/           # Helpers & utilities
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── backend/                  # Node.js + Express server
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── models/          # MongoDB schemas
│   │   ├── middleware/      # Express middleware
│   │   ├── queues/          # Background jobs
│   │   ├── webhooks/        # Webhook handlers
│   │   ├── sockets/         # Socket.io events
│   │   ├── utils/           # Helper functions
│   │   ├── config/          # Configuration
│   │   ├── ai/              # AI integration
│   │   └── server.ts
│   ├── seeds/               # Seed data scripts
│   ├── package.json
│   └── .env.example
├── docs/                     # Documentation
├── .github/                  # GitHub workflows
└── package.json              # Monorepo root
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Gemini API Key (optional, falls back to offline NLP)

### Installation

```bash
# Clone the repository
git clone https://github.com/AbhishekSingh907/XENO-Project.git
cd XENO-Project

# Install dependencies
npm install

# Setup environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Run seed data
npm run seed:data

# Start development servers
npm run dev
```

## 🎯 Core Features

### 1. AI Command Center
- ChatGPT-style interface for marketers
- Natural language campaign generation
- Intelligent audience suggestions
- Real-time campaign recommendations

### 2. Advanced Segment Builder
- Visual filter builder
- Realtime audience preview
- AI segment suggestions
- Support for: purchase date, spend, AOV, location, category, churn risk, etc.

### 3. Campaign Control Tower
- Multi-channel support (WhatsApp, SMS, Email, RCS)
- AI-powered copy generation
- Campaign scheduling
- Preview & send workflow

### 4. Mock Delivery Engine
- Realistic delivery simulation
- Webhook-based event callbacks
- Multi-state tracking (queued → sent → delivered → opened → clicked)
- Retry logic and error handling

### 5. Realtime Analytics
- Live dashboard with animated charts
- Delivery, open, and click rates
- Conversion funnel tracking
- Channel performance comparison
- Revenue attribution

### 6. Shopper Database
- 100+ realistic shopper profiles
- Rich demographic & behavioral data
- Order history and lifetime value
- Engagement scores and churn predictions
- Activity timeline

### 7. AI Insights Engine
- Churn risk predictions
- Optimal send time recommendations
- Channel performance forecasting
- Discount effectiveness analysis
- Campaign success scoring

## 🎨 Design System

**Theme:** Dark mode with purple-blue gradients and neon accents

**Components:**
- Glassmorphism cards with blur effects
- Animated gradients on CTAs
- Glowing borders on active elements
- Smooth micro-interactions
- Floating and hover animations
- Loading skeletons
- Staggered list animations

**Inspiration:** Linear, Vercel, Stripe, Notion AI, Retool

## 📊 API Endpoints

### Shoppers
- `GET /api/shoppers` — List all shoppers
- `POST /api/shoppers` — Create shopper
- `GET /api/shoppers/:id` — Get shopper details
- `PUT /api/shoppers/:id` — Update shopper

### Campaigns
- `POST /api/campaigns/create` — Create campaign
- `POST /api/campaigns/send` — Send campaign
- `GET /api/campaigns/:id` — Get campaign details
- `GET /api/campaigns/:id/analytics` — Campaign analytics

### AI
- `POST /api/ai/generate-campaign` — Generate campaign copy
- `POST /api/ai/segment-suggestion` — AI segment recommendations
- `POST /api/ai/insights` — Generate insights for shoppers

### Analytics
- `GET /api/analytics/dashboard` — Dashboard metrics
- `GET /api/analytics/campaigns` — Campaign performance
- `GET /api/analytics/channels` — Channel analytics

### Webhooks
- `POST /api/webhooks/channel-events` — Receive delivery events

## 🌱 Seed Data

The project includes a seed script that generates:
- 100+ realistic shoppers
- Diverse order histories
- Realistic engagement patterns
- Multiple product categories
- Varied spending behavior

```bash
npm run seed:data
```

## 🔐 Environment Variables

```
# Backend
MONGO_URI=mongodb+srv://...
GEMINI_API_KEY=...
JWT_SECRET=your-secret-key
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# Frontend
VITE_API_URL=http://localhost:5000
```

## 🎬 Demo Experience

The first 30 seconds wow factor:

1. **Open Dashboard** → Animated hero section with floating particles
2. **Show AI Assistant** → ChatGPT-style typing animation
3. **Generate Segment** → Real-time shopper count updates
4. **Launch Campaign** → Multi-step workflow with smooth transitions
5. **Watch Analytics** → Realtime chart animations
6. **Explore Insights** → AI-generated recommendations

## 📈 Roadmap

- [ ] Phase 1: Core MVP (segments, campaigns, basic analytics)
- [ ] Phase 2: Advanced AI (LLM fine-tuning, predictive churn)
- [ ] Phase 3: Multi-channel orchestration (Email, SMS, WhatsApp, RCS)
- [ ] Phase 4: Team collaboration (roles, permissions, audit logs)
- [ ] Phase 5: API marketplace (3rd-party integrations)

## 🤝 Contributing

This is a production-grade project. All contributions should:
- Follow the existing code structure
- Include unit tests
- Use TypeScript
- Follow ESLint/Prettier standards

## 📝 License

MIT License — Built with ❤️ for the next generation of marketing

---

**Built by:** Abhishek Singh  
**For:** Xeno Engineering Assignment  
**Status:** 🚀 In active development
