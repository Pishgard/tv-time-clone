# 📺 TV Time Clone

A modern TV show tracking web app inspired by [TV Time](https://www.tvtime.com), built with **Django 6** + **Next.js 16**, featuring a 2026-style design (dark mode, glassmorphism, bento layouts) and full bilingual support (Persian RTL / English LTR).

## ✨ Features

- 🔐 **Authentication** — Email/password with JWT tokens
- 🎬 **Show discovery** — Browse trending & popular shows via TMDB API
- 📋 **Watchlist** — Track shows as watching / completed / plan to watch / dropped
- ✅ **Episode tracking** — Mark episodes as watched with one tap
- 📊 **Personal stats** — Watch time, episode counts, genre breakdown
- 💬 **Social** — Comment on episodes, like, follow other users
- 🌍 **Bilingual** — Full Persian (RTL) and English (LTR) support
- 🎨 **Modern design** — Dark-first, glassmorphism, bento box dashboard

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Django 6, Django REST Framework, SimpleJWT |
| **Frontend** | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| **Data** | TMDB API + manual entries (hybrid) |
| **State** | Zustand, React Query |
| **i18n** | next-intl |

## 🚀 Getting Started

See detailed setup instructions below. You'll need:
- Python 3.12+
- Node.js 20+ / pnpm
- A free [TMDB API key](https://www.themoviedb.org/settings/api)

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # then edit .env with your settings
python manage.py migrate
python manage.py seed        # optional: load demo data
python manage.py runserver
```

### Frontend

```bash
cd frontend
pnpm install
cp .env.example .env.local   # then edit .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## 📁 Project Structure

```
Tv Time/
├── backend/     # Django REST API
├── frontend/    # Next.js app
└── README.md
```

## 📜 License

MIT
