# Multi-User Notes Service API

A REST API backend for a multi-user notes service, similar to Google Keep or Apple Notes.

**Tech Stack:** Node.js · Express.js · SQLite · JWT · bcryptjs · Docker

---

## Features

| Feature | Details |
|---|---|
| User Registration & Login | JWT-based auth, bcrypt password hashing |
| Note CRUD | Create, read, update, delete — owner-only write access |
| Note Sharing | Share any note with another user by email; they get read access |
| Note Categories | Assign a category to notes; filter with `GET /notes/category/:name` |
| Full-Text Search | `GET /search?q=keyword` across all accessible notes |
| Pagination | `GET /notes?page=1&limit=20` |
| OpenAPI Docs | Swagger UI at `/`, raw spec at `/openapi.json` |
| Docker | `docker-compose up` for one-command local run |

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Register a new user |
| POST | `/login` | Login — returns JWT `access_token` |

### Notes  _(require `Authorization: Bearer <token>`)_
| Method | Endpoint | Description |
|---|---|---|
| GET | `/notes` | All notes (owned + shared), paginated |
| GET | `/notes/:id` | Get a note by ID |
| POST | `/notes` | Create a note |
| PUT | `/notes/:id` | Update a note (owner only) |
| DELETE | `/notes/:id` | Delete a note (owner only) |
| POST | `/notes/:id/share` | Share with another user by email |
| GET | `/notes/category/:name` | Filter notes by category (case-insensitive) |
| GET | `/search?q=keyword` | Full-text search across title and content |

### Meta
| Method | Endpoint | Description |
|---|---|---|
| GET | `/about` | Author info and features |
| GET | `/openapi.json` | OpenAPI 3.0 specification |

---

## Run Locally

**Prerequisites:** Node.js 18+

```bash
# 1. Clone
git clone https://github.com/GeNeT11X/Multi-User-Notes-Service.git
cd Multi-User-Notes-Service

# 2. Install dependencies
npm install

# 3. (Optional) configure environment
cp .env.example .env
# set a strong JWT_SECRET in .env

# 4. Start
npm start          # production
npm run dev        # auto-reload (requires nodemon)
```

Open `http://localhost:3000` — redirects to the Swagger UI.

### Run with Docker

```bash
docker-compose up --build
```

API available at `http://localhost:3000`.

---

## Deploy to Render.com (Free Tier)

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New** → **Web Service**
3. Connect the GitHub repo — Render auto-detects `render.yaml`
4. Add environment variable `JWT_SECRET` = any random 32-char string
5. Click **Deploy**

> **Before deploying:** open `src/app.js` and replace `YOUR_NAME_HERE` with your actual name.

---

## Quick Example

```bash
# Register
curl -X POST https://your-app.onrender.com/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"password123"}'

# Login → get token
TOKEN=$(curl -s -X POST https://your-app.onrender.com/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"password123"}' | jq -r .access_token)

# Create a note
curl -X POST https://your-app.onrender.com/notes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Note","content":"Hello World","category":"personal"}'

# Share with another user
curl -X POST https://your-app.onrender.com/notes/<note-id>/share \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"share_with_email":"friend@example.com"}'
```
