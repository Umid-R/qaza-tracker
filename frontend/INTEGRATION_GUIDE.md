# Telegram Mini App + FastAPI Integration Guide

This guide explains how your Telegram Mini App integrates with your FastAPI backend.

## How It Works

### 1. Telegram User Authentication

The app uses `window.Telegram.WebApp` to get the user's Telegram ID:

```typescript
// src/utils/telegram.ts
const userId = getTelegramUserId(); // Returns the Telegram user ID
```

### 2. API Integration

All API calls are centralized in `src/services/api.ts`:

```typescript
// Example: Fetch total qaza count
const totalQaza = await api.getTotalQaza(userId);

// Example: Log ada prayers
await api.logAdaPrayer(userId, { prayers: dataToSave });
```

### 3. API Endpoints Used

Your FastAPI backend should provide these endpoints:

- `GET /qaza/total/{userId}` - Get total qaza count
- `GET /qaza/breakdown/{userId}` - Get qaza breakdown by prayer
- `GET /stats/{userId}` - Get prayer statistics
- `GET /activity/weekly/{userId}` - Get weekly activity
- `GET /calendar/summary/{userId}?year={year}&month={month}` - Get monthly summary
- `POST /log/ada` - Log ada prayers
- `POST /log/qaza` - Log qaza prayers

### 4. Data Flow

1. User opens the Telegram Mini App
2. App initializes Telegram WebApp and gets user ID
3. App fetches user data from FastAPI backend using the user ID
4. User logs prayers, which are saved to the backend
5. Stats update automatically based on backend data

### 5. Expected Data Formats

#### Qaza Total Response
```json
{
  "total_qazas": 158
}
```

#### Qaza Breakdown Response
```json
{
  "fajr": 45,
  "dhuhr": 28,
  "asr": 32,
  "maghrib": 15,
  "isha": 38
}
```

#### Prayer Stats Response
```json
{
  "completed_today": 2,
  "daily_goal": 4,
  "cleared_this_week": 7,
  "total_prayers_logged": 1248,
  "current_streak": 12
}
```

#### Weekly Activity Response
```json
[
  { "day": "S", "active": true },
  { "day": "M", "active": true },
  { "day": "T", "active": false },
  { "day": "W", "active": true },
  { "day": "T", "active": false },
  { "day": "F", "active": true },
  { "day": "S", "active": false }
]
```

## Testing Locally

Since Telegram WebApp API only works inside Telegram, for local testing you can:

1. Deploy to a test server
2. Create a test bot with @BotFather
3. Set up your Mini App URL in BotFather
4. Open your bot in Telegram to test

## File Structure

```
src/
├── utils/
│   └── telegram.ts          # Telegram WebApp utilities
├── services/
│   └── api.ts               # API service layer
└── pages/
    ├── HomePage.tsx         # Main dashboard
    ├── LogPage.tsx          # Log prayers
    ├── StatsPage.tsx        # Statistics view
    ├── CalendarPage.tsx     # Calendar view
    └── ProfilePage.tsx      # User profile
```

## Notes

- The API base URL is hardcoded as `https://fast-api-p3ci.onrender.com`
- All API calls include proper error handling
- Loading and error states are shown to users
- User data is refreshed when navigating between pages
