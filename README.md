# TalkBridge AI Workspace

This repository is organized as a small monorepo:

- `frontend/` - Next.js web app
- `backend/` - Express API and webhook server

## Running the web app

```bash
npm run dev
```

## Running the backend

```bash
npm run dev:backend
```

## Structure

```text
frontend/
backend/
```

Each package keeps its own dependencies and scripts, so the web app, backend, and mobile app can be worked on independently.