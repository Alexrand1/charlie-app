# Charlie

**Charlie** is an AI personal finance assistant for iOS. Connect your bank accounts and Charlie watches your money for you — chatting about your actual balances and spending, flagging subscriptions you forgot about, and nudging you when a spending pattern drifts, via one well-timed push notification a day at most.

Built with React Native (Expo Router). Backend: [charlie-api](https://github.com/Alexrand1/charlie-api) — Express/TypeScript, DynamoDB, Plaid, and Claude.

<!-- TODO: screenshots / demo GIF
![Home](docs/screens/home.png) ![Chat](docs/screens/chat.png) ![Insight card](docs/screens/insight.png)
-->

## What it does

- **Bank connection** via Plaid Link (transactions, balances, recurring charges)
- **Chat with Charlie** — grounded in a computed snapshot of your real finances; responses can embed tappable action cards
- **Proactive insight cards** — cancel-a-subscription, move-money, and fix-a-habit flows, each with a dedicated win screen
- **Goals** with progress tracking
- **Referrals** with deep-link attribution
- **Push notifications** — insight delivery with quiet hours and daily dedup (handled server-side)

## App structure

```
app/                 Expo Router routes
  onboarding/        first-run flow
  auth/              sign-in (Clerk + Sign in with Apple)
  link-accounts/     Plaid Link flow
  tabs/              home, accounts, chat, goals
  actions/           insight action flows (cancel, move money, fix habit)
  invite|referral/   referral flows
components/          shared UI (cards, rows, chat bubbles, onboarding)
services/            API client (axios), auth, chat, plaid, goals,
                     insights, notifications, referrals
shared/              snapshot types shared with the API
```

## Running locally

```bash
npm install
# Point the app at your API (see charlie-api README to run it):
EXPO_PUBLIC_API_URL=http://<your-ip>:3000 npx expo start
```

**Firebase:** push notifications require your own `GoogleService-Info.plist` from a Firebase project — the file is intentionally not committed. Drop it in the repo root.

## Status

Personal project, actively developed. Built solo — design, app, API, and infra.
