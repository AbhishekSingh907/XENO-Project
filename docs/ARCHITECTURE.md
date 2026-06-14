# XENO CRM Architecture

## System Overview

XENO is a full-stack, AI-powered marketing automation platform built with a monorepo structure.

```
┌────────────────────────────────────────────────────────────────────┐
│                      XENO AI CRM SYSTEM                         │
├────────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────┐      ┌──────────────────────┐               │
│  │   React Frontend │      │  Node.js Backend │               │
│  │  (Vite + React)  │◄────►│  (Express)       │               │
│  └──────────────────────┘      └──────────────────────┘               │
│         │                          │                           │
│         │ WebSocket               │ Database                  │
│         │ (Socket.io)             │ (MongoDB)                │
│         │                          │                           │
│         ▼                          ▼                           │
│  ┌────────────────────────────────────────────────────────────┐                  │
│  │      Real-time Events & Analytics      │                  │
│  │  (Campaigns, Delivery, Engagement)     │                  │
│  └────────────────────────────────────────────────────────────┘                  │
│         │                                                      │
│         ▼                                                      │
│  ┌────────────────────────────────────────────────────────────┐                  │
│  │   AI Integration Layer (Gemini/NLP)    │                  │
│  │  (Campaign Gen, Segmentation, Insights)│                  │
│  └────────────────────────────────────────────────────────────┘                  │
│         │                                                      │
│         ▼                                                      │
│  ┌────────────────────────────────────────────────────────────┐                  │
│  │   Mock Channel Delivery Engine          │                  │
│  │  (WhatsApp, SMS, Email, RCS)            │                  │
│  └────────────────────────────────────────────────────────────┘                  │
│                                                                 │
└────────────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Pages
- `Dashboard` — Main landing page with KPI cards
- `AICommandCenter` — ChatGPT-style interface
- `SegmentBuilder` — Visual audience segmentation
- `CampaignControl` — Campaign workflow
- `Analytics` — Realtime metrics dashboard
- `ShopperDatabase` — Shopper list & details

### Components
- **AI Components:** ChatInput, MessageBubble, Suggestions
- **Campaign:** CampaignForm, Preview, Schedule
- **Segments:** FilterBuilder, FilterChip, AudiencePreview
- **Analytics:** MetricCard, ChartContainer, RealtimeUpdates
- **Shared:** Header, Sidebar, Modal, Toast, LoadingSkeleton

### State Management (Zustand)
- `campaignStore` — Campaign creation & history
- `segmentStore` — Segment filters & audience
- `analyticsStore` — Realtime metrics
- `aiStore` — AI conversation & suggestions
- `shopperStore` — Shopper data & filters
- `uiStore` — Modal, toast, theme state

### Services
- `api/shoppers.ts` — Shopper CRUD
- `api/campaigns.ts` — Campaign management
- `api/ai.ts` — AI integration
- `api/analytics.ts` — Metrics fetching
- `socket/realtime.ts` — WebSocket connection

## Backend Architecture

### Controllers
Handle HTTP requests and delegate to services:
- `ShopperController` — CRUD operations
- `CampaignController` — Campaign lifecycle
- `AIController` — AI generation requests
- `AnalyticsController` — Metrics aggregation
- `WebhookController` — Delivery callbacks

### Services
Core business logic:
- `ShopperService` — Shopper management & queries
- `CampaignService` — Campaign creation & state transitions
- `AIService` — Gemini API & offline NLP integration
- `SegmentService` — Audience filtering & calculations
- `DeliveryService` — Mock delivery simulation
- `AnalyticsService` — Event aggregation & metrics

### Models (Mongoose)
- `Shopper` — Demographics, order history, engagement
- `Campaign` — Details, segments, channel, status
- `CampaignEvent` — Delivery status updates
- `Segment` — Saved audience filters
- `Message` — Individual message records
- `AIInsight` — Cached predictions & recommendations

### Queues (BullMQ)
- `CampaignQueue` — Async campaign processing
- `DeliveryQueue` — Mock delivery simulation
- `AnalyticsQueue` — Event aggregation jobs

### Socket.io Events
**Client → Server:**
- `join:campaign` — Subscribe to campaign updates
- `join:analytics` — Subscribe to analytics updates

**Server → Client:**
- `campaign:event` — Delivery status update
- `analytics:update` — Metrics change
- `ai:suggestion` — AI recommendation

### Middleware
- `auth` — JWT verification
- `errorHandler` — Global error handling
- `requestLogger` — Request logging
- `rateLimiter` — Rate limiting

### Utils
- `nlp.ts` — Offline NLP for intent parsing
- `faker.ts` — Realistic data generation
- `validators.ts` — Input validation
- `formatters.ts` — Data formatting
- `constants.ts` — Enums & constants

## Data Flow

### Campaign Creation Flow

```
1. User types AI command
   ↓
2. Frontend sends to /api/ai/generate-campaign
   ↓
3. Backend: AIService.generateCampaign()
   - Call Gemini API (or fallback to offline NLP)
   - Parse intent (audience, channel, messaging)
   ↓
4. Backend returns suggested campaign
   ↓
5. User previews & confirms
   ↓
6. Frontend sends to /api/campaigns/create
   ↓
7. Backend: CampaignService.create()
   - Create campaign document
   - Enqueue delivery simulation
   - Emit Socket event to dashboard
   ↓
8. DeliveryService simulates:
   - Queued (0-5s)
   - Sent (5-15s)
   - Delivered (15-60s)
   - Opened (60-300s)
   - Clicked (optional)
   ↓
9. Each event emitted via Socket.io
   ↓
10. Frontend updates analytics dashboard in realtime
```

### Segment Building Flow

```
1. User adds filter (e.g., "last_purchase > 45 days")
   ↓
2. Frontend updates filter chips & Zustand store
   ↓
3. Frontend sends to /api/segments/preview
   ↓
4. Backend: SegmentService.preview(filters)
   - Query MongoDB with filter criteria
   - Count matching shoppers
   - Calculate segment stats
   ↓
5. Return audience size & demographics
   ↓
6. Frontend displays real-time preview
```

### Analytics Flow

```
1. Campaign is sent
   ↓
2. DeliveryService enqueues fake events
   ↓
3. Each event emitted via Socket.io
   ↓
4. AnalyticsService aggregates:
   - Delivery rate
   - Open rate
   - Click rate
   - Conversion
   ↓
5. Socket broadcasts to all connected dashboards
   ↓
6. Frontend charts update with animation
```

## Database Schema

### Shopper Collection
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string",
  "phone": "string",
  "city": "string",
  "country": "string",
  "signupDate": "Date",
  "lastPurchaseDate": "Date",
  "totalSpend": "number",
  "orderCount": "number",
  "averageOrderValue": "number",
  "preferredCategory": "string",
  "engagementScore": "number",
  "churnRisk": "number",
  "preferredChannels": "[string]",
  "orders": "[ObjectId]",
  "campaigns": "[ObjectId]",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Campaign Collection
```json
{
  "_id": "ObjectId",
  "name": "string",
  "status": "enum[draft, scheduled, sent, completed]",
  "segmentId": "ObjectId",
  "channel": "enum[whatsapp, sms, email, rcs]",
  "subject": "string",
  "body": "string",
  "cta": "string",
  "ctaUrl": "string",
  "sendTime": "Date",
  "shoppers": "[ObjectId]",
  "stats": {
    "sent": "number",
    "delivered": "number",
    "opened": "number",
    "clicked": "number",
    "converted": "number",
    "failed": "number"
  },
  "events": "[ObjectId]",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## Security

- **Authentication:** JWT tokens (future implementation)
- **Authorization:** Role-based access control
- **Data Validation:** Input sanitization & schema validation
- **Rate Limiting:** API endpoint rate limiting
- **CORS:** Configured for frontend origin only
- **Environment:** Sensitive keys in .env files

## Performance Optimization

- **Frontend:**
  - Code splitting with React lazy()
  - Vite for fast HMR
  - Image optimization
  - Virtual scrolling for large lists

- **Backend:**
  - MongoDB indexing on common queries
  - Caching with Redis (future)
  - Request/response compression
  - Background job queues
  - WebSocket for realtime updates

## Deployment

- **Frontend:** Vercel (automatic CI/CD from main)
- **Backend:** Railway or Render (Docker containerized)
- **Database:** MongoDB Atlas (cloud)
- **Environment:** Production environment variables configured

## Monitoring

- **Logs:** Winston logger integration
- **Error Tracking:** Sentry (future)
- **APM:** New Relic (future)
- **Uptime:** Pingdom monitoring (future)
