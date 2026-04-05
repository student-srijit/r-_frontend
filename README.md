# Research Plus - Research Platform

A comprehensive platform for organizing, analyzing, and learning from research works with AI-powered insights.

## Features

### Phase 1: Core Infrastructure (Completed ✅)

#### Backend
- **Database**: MongoDB schemas for Users, ResearchWorks, Interviews, VoiceSummaries, and Trending
- **Authentication**: JWT-based auth with secure password hashing (bcryptjs)
- **API Routes**:
  - `/api/auth` - Register, login, logout
  - `/api/research` - Create, read, update, delete research works
  - `/api/analyze/link` - Analyze links with user's LLM API key
  - `/api/interviews` - Generate and manage interviews
  - `/api/voice` - Generate voice summaries
  - `/api/discover` - Trending research and filtering

#### Frontend (Web)
- **Auth Pages**: Login and registration with form validation
- **Dashboard**: List all research works with pagination
- **Research Management**: Create new research works with metadata
- **API Client**: Fully typed API communication layer
- **State Management**: Zustand stores for auth and filters
- **Toast Notifications**: User feedback system

### Phase 2: Research Work Management & Analysis (In Progress 🔄)

#### To Build
- Research detail page with link management
- Link analysis interface with API key input
- Analysis history and results display
- Interview question generation
- Company difficulty mapping
- Voice summary generation and playback
- Trending research discovery

### Architecture

```
research-plus/
├── backend/
│   ├── config/      - Database and environment config
│   ├── models/      - MongoDB schemas
│   ├── routes/      - API endpoints
│   ├── controllers/ - Business logic
│   ├── services/    - LLM and parsing services
│   ├── middleware/  - Auth and error handling
│   └── server.js    - Express app
│
└── app/ (Next.js)
    ├── (auth)/      - Login and registration pages
    ├── dashboard/   - Research works dashboard
    ├── research/    - Research detail and analysis
    ├── interview/   - Interview prep
    ├── discover/    - Trending and filtering
    └── lib/         - API client, auth, store, types
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Groq/DeepInfra API key (for user analysis)

### Backend Setup

1. Create `.env` in `/backend`:
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/research_plus
JWT_SECRET=your_secret_key
PORT=5000
FRONTEND_URL=http://localhost:3000
```

2. Install dependencies:
```bash
cd backend
npm install
npm run dev
```

3. Server runs on `http://localhost:5000`

### Frontend Setup

1. Create `.env.local` in root:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

2. Install dependencies:
```bash
npm install
npm run dev
```

3. Access at `http://localhost:3000`

## API Key Handling

Users provide their own Groq/DeepInfra API keys during:
- Link analysis (session-based)
- Interview generation (session-based)
- Answer feedback (session-based)

Keys are **never stored** in the database - transmitted securely via HTTPS only.

## Security

- ✅ JWT tokens with 1-hour expiration
- ✅ Password hashing with bcryptjs (10-salt rounds)
- ✅ CORS enabled for frontend origin only
- ✅ Input validation on all endpoints
- ✅ Rate limiting ready to add
- ✅ API keys not logged or stored
- ✅ MongoDB connection pooling

## Next Steps

1. **Phase 2**: Research detail page and link analysis UI
2. **Phase 3**: Interview generation and company difficulty system
3. **Phase 4**: Voice summary and voice integration
4. **Phase 5**: Trending/discovery with field-based filtering
5. **Phase 6**: Browser extension (Manifest V3)
6. **Phase 7**: Mobile app (React Native)

## Tech Stack

- **Backend**: Express.js, MongoDB, JWT, Groq/DeepInfra
- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS, shadcn/ui
- **State**: Zustand, TanStack Query (SWR pattern)
- **Forms**: React Hook Form, Zod
- **Content Parsing**: Cheerio, Axios

## Notes

- All data is real, user-driven - no hardcoding
- API keys provided per-request, not stored
- Trending algorithm uses: views (40%) + shares (30%) + analysis count (30%)
- Company difficulty maps Google/Meta as "hard", TCS/Infosys as "easy"
- Supports blog, research paper, vlog, and other link types
