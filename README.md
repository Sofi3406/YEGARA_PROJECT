# Yegara — Community Reporting and Event Management System

A full-stack web platform for local community governance in Addis Ababa. Residents report issues, track resolution, and join community events; woreda and sub-city administrators coordinate officers, analytics, announcements, and meetings.

**Live demo:** [https://yegara-vercel-frontend-7tko.vercel.app](https://yegara-vercel-frontend-7tko.vercel.app)

## Group Members

| Name | Student ID |
|------|------------|
| Sofiya Yasin | UGR/7314/15 |
| Yasmin Anwar | UGR/7449/15 |
| Rumeysa Abdellah | UGR/6877/15 |

## Features

- **Role-based access** — Resident, Officer, Woreda Admin, Sub-City Admin
- **Issue reporting** — Submit, track, and resolve community reports by category and woreda
- **Events** — Create and register for woreda and sub-city events (with entrance codes)
- **Announcements & resources** — Official notices and shared documents
- **Virtual meetings** — Schedule and join online meetings
- **Analytics** — Dashboards with charts, year filters, and woreda performance
- **Real-time notifications** — Socket.IO updates for admins and residents
- **Public landing page** — Community events, announcements, and chatbot support

## Tech Stack

| Layer | Technologies |
|-------|----------------|
| Frontend | React, React Router, Tailwind CSS, Axios, Recharts, Socket.IO Client |
| Backend | Node.js, Express, MongoDB, Mongoose, JWT, Socket.IO, Nodemailer |
| Deployment | Vercel (frontend) |

## Project Structure

```text
community-reporting-and-event-management/
└── yegara-community-system/
    ├── backend/          # REST API + Socket.IO
    ├── frontend/         # React SPA
    └── README.md         # Detailed setup guide
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- MongoDB (local or Atlas)

### Installation

```bash
git clone <repository-url>
cd community-reporting-and-event-management/yegara-community-system

# Backend
cd backend
npm install
cp .env.example .env   # if available; otherwise create .env (see below)

# Frontend
cd ../frontend
npm install
```

### Environment Variables

**Backend** (`yegara-community-system/backend/.env`):

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/yegara
JWT_SECRET=your_secure_secret
JWT_EXPIRE=30d
FRONTEND_URL=http://localhost:3000
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_user
SMTP_PASS=your_password
FROM_EMAIL=no-reply@example.com
```

**Frontend** (`yegara-community-system/frontend/.env`):

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Run Locally

```bash
# Terminal 1 — API
cd yegara-community-system/backend
npm run dev

# Terminal 2 — UI
cd yegara-community-system/frontend
npm start
```

- Frontend: http://localhost:3000  
- Backend: http://localhost:5000  
- Health check: `GET http://localhost:5000/api/health`

## API Overview

Base path: `/api`

| Route group | Purpose |
|-------------|---------|
| `/api/auth` | Login, register, password reset |
| `/api/reports` | Community reports |
| `/api/users` | User management |
| `/api/events` | Events and registration |
| `/api/announcements` | Announcements |
| `/api/meetings` | Virtual meetings |
| `/api/resources` | Shared resources |
| `/api/analytics` | Sub-city analytics |
| `/api/notifications` | Notifications |
| `/api/public` | Public landing data |
| `/api/chatbot` | Resident chatbot |

## User Roles

| Role | Main capabilities |
|------|-------------------|
| Resident | Report issues, view updates, register for events |
| Officer | Manage department reports, register for events |
| Woreda Admin | Manage officers, events, reports, and analytics for one woreda |
| Sub-City Admin | City-wide users, events, analytics, and woreda oversight |

## Scripts

**Backend**

```bash
npm start      # Production
npm run dev    # Development (nodemon)
```

**Frontend**

```bash
npm start      # Development server
npm run build  # Production build
npm test       # Run tests
```

