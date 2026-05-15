# Notes API

Multi-user notes service REST API — Node.js · Express · MongoDB · JWT

---

## Stack

| Layer | Tech |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Validation | express-validator |
| Security | Helmet · CORS · Rate Limiting |
| Docs | Swagger UI (`/api-docs`) |
| Deploy | Render.com · Docker |

---

## Project Structure

```
src/
├── config/        db.js · swagger.js
├── controllers/   auth.controller.js · notes.controller.js
├── middlewares/   auth · error · rateLimiter · validate
├── models/        User.model.js · Note.model.js
├── routes/        auth.routes.js · notes.routes.js · index.js
├── services/      auth.service.js · notes.service.js
├── utils/         AppError.js · logger.js
└── validators/    auth.validator.js · notes.validator.js
server.js
src/app.js
```

---

## API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | ✗ | Register new user |
| POST | `/login` | ✗ | Login → JWT token |

### Notes
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/notes` | ✓ | All notes (owned + shared). Supports `?page`, `?limit`, `?q` |
| GET | `/notes/:id` | ✓ | Get specific note |
| POST | `/notes` | ✓ | Create note |
| PUT | `/notes/:id` | ✓ | Update note (owner only) |
| DELETE | `/notes/:id` | ✓ | Delete note (owner only) |
| POST | `/notes/:id/share` | ✓ | Share with user by email |
| PATCH | `/notes/:id/pin` | ✓ | Toggle pin (owner only) |

### Meta
| Method | Endpoint | Description |
|---|---|---|
| GET | `/about` | Author info and features |
| GET | `/openapi.json` | Raw OpenAPI 3.0 spec |
| GET | `/api-docs` | Swagger UI |

---

## Run Locally

### Option A — Node.js

```bash
git clone https://github.com/GeNeT11X/Multi-User-Notes-Service.git
cd Multi-User-Notes-Service
npm install
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET
npm start           # production
npm run dev         # auto-reload
```

### Option B — Docker (includes MongoDB)

```bash
cp .env.example .env   # set JWT_SECRET at minimum
docker-compose up --build
```

API at `http://localhost:3000` · Swagger at `http://localhost:3000/api-docs`

---

## Deploy to Render.com

1. Create a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster and copy the connection string
2. Push this repo to GitHub
3. Go to [render.com](https://render.com) → **New** → **Web Service** → connect the repo
4. Render detects `render.yaml` automatically
5. Set **MONGODB_URI** in the Render environment dashboard
6. Click **Deploy**

---

## Example Requests

```bash
# Register
curl -X POST https://your-app.onrender.com/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Login
TOKEN=$(curl -s -X POST https://your-app.onrender.com/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' | jq -r .access_token)

# Create note with tags
curl -X POST https://your-app.onrender.com/notes \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"My Note","content":"Hello","tags":["work","urgent"]}'

# Full-text search
curl "https://your-app.onrender.com/notes?q=urgent" \
  -H "Authorization: Bearer $TOKEN"

# Paginate
curl "https://your-app.onrender.com/notes?page=2&limit=10" \
  -H "Authorization: Bearer $TOKEN"

# Share with another user
curl -X POST https://your-app.onrender.com/notes/<id>/share \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"share_with_email":"friend@example.com"}'

# Pin a note
curl -X PATCH https://your-app.onrender.com/notes/<id>/pin \
  -H "Authorization: Bearer $TOKEN"
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✓ | MongoDB connection string |
| `JWT_SECRET` | ✓ | Secret key for signing JWTs |
| `JWT_EXPIRES_IN` | ✗ | Token TTL (default: `24h`) |
| `PORT` | ✗ | Server port (default: `3000`) |
| `NODE_ENV` | ✗ | `development` / `production` |
