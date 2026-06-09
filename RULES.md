# ═══════════════════════════════════════════════════════
#  SheetGenie — Project Configuration & Rules
# ═══════════════════════════════════════════════════════

## Architecture Overview
#
#  codex-meetup/
#  ├── frontend/         → Vite + React + Tailwind CSS
#  ├── backend/          → Node.js + Express + SQLite
#  ├── AGENTS.md         → AI agent coding rules
#  └── sheetgenie.config.json  ← This file's companion
#

## Design System
#
#  Theme: Clean white background (#FFFFFF)
#  Primary Accent: Excel Green (#1D6F42)
#  Font: Inter (Google Fonts)
#  Component Library: shadcn/ui (to be added)
#  Chart Library: Recharts (to be added)
#

## Backend Rules
#
#  Database: SQLite via better-sqlite3
#  DB File: backend/data/database.sqlite
#  File Parsing: xlsx library (server-side)
#  Upload Storage: backend/uploads/
#  API Prefix: /api
#  Port: 3001
#

## Frontend Rules
#
#  Framework: React (via Vite)
#  Styling: Tailwind CSS v4 + custom CSS vars
#  Dev Port: 5173 (proxies /api → localhost:3001)
#  Charts: Recharts (to be added)
#

## Debugging & Testing
#
#  Backend Logging: Console-based with prefixed tags
#    [DB], [Upload], [Health], [Files], [Error], [Server]
#  Backend Dev: nodemon auto-restart
#  Backend Health: GET /api/health
#  Frontend Dev: Vite HMR with error overlay
#
