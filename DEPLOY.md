# Deployment Guide — Vercel + Render

Deploy **frontend** to [Vercel](https://vercel.com) and **backend** to [Render](https://render.com).

---

## Before you start

1. Push your code to a **public GitHub repository**
2. Repo structure must look like this:

```
Signal/
├── frontend/     ← Vercel deploys this
├── backend/      ← Render deploys this
├── render.yaml   ← optional (Render blueprint)
└── README.md
```

3. Create free accounts:
   - [github.com](https://github.com)
   - [render.com](https://render.com)
   - [vercel.com](https://vercel.com)

---

# Part 1 — Deploy Backend on Render

## Step 1: Push code to GitHub

```powershell
cd E:\Signal
git init
git add .
git commit -m "Signal clone - initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/signal-clone.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## Step 2: Create Render Web Service

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect your **GitHub** account
4. Select your **signal-clone** repository
5. Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | `signal-clone-api` |
| **Region** | Singapore (or closest to you) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | Free |

---

## Step 3: Add Environment Variables on Render

In Render → your service → **Environment** → add:

| Key | Value |
|-----|-------|
| `SECRET_KEY` | A long random string, e.g. `my-super-secret-key-abc123xyz` |
| `CORS_ORIGINS` | `https://your-app.vercel.app` (comma-separated, no JSON) |
| `PYTHON_VERSION` | `3.12.0` |

Click **Save Changes**.

---

## Step 4: Deploy Backend

1. Click **Create Web Service** (or **Manual Deploy** → **Deploy latest commit**)
2. Wait 3–5 minutes for the build
3. When status is **Live**, copy your URL, e.g.:

```
https://signal-clone-api.onrender.com
```

---

## Step 5: Test Backend

Open in browser:

```
https://signal-clone-api.onrender.com/api/health
```

You should see:

```json
{"status":"ok"}
```

API docs:

```
https://signal-clone-api.onrender.com/docs
```

> **Note:** Free Render apps sleep after 15 min of inactivity. First request may take ~30 seconds to wake up.

---

# Part 2 — Deploy Frontend on Vercel

## Step 6: Import project on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository**
3. Connect **GitHub** and select **signal-clone**
4. Configure project:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Next.js |
| **Root Directory** | `frontend` ← click **Edit** and set this |
| **Build Command** | `npm run build` (default) |
| **Output Directory** | `.next` (default) |

---

## Step 7: Add Environment Variables on Vercel

Before clicking Deploy, expand **Environment Variables** and add:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://signal-clone-api.onrender.com/api` |
| `NEXT_PUBLIC_WS_URL` | `wss://signal-clone-api.onrender.com/ws` |

Replace `signal-clone-api` with your actual Render service name.

> Use **`wss://`** (not `ws://`) for production WebSockets.

---

## Step 8: Deploy Frontend

1. Click **Deploy**
2. Wait 2–3 minutes
3. Copy your Vercel URL, e.g.:

```
https://signal-clone.vercel.app
```

---

## Step 9: Update CORS on Render (IMPORTANT)

Go back to **Render** → **Environment** → update `CORS_ORIGINS`:

```
https://signal-clone.vercel.app
```

Use your **exact** Vercel URL (no trailing slash).

If you have a custom domain, add it comma-separated:

```
https://signal-clone.vercel.app,https://www.yourdomain.com
```

Click **Save Changes** — Render will redeploy automatically.

---

## Step 10: Redeploy Vercel (if you changed env vars)

If you updated env vars after first deploy:

1. Vercel Dashboard → your project → **Deployments**
2. Click **⋯** on latest deployment → **Redeploy**

---

# Part 3 — Verify Everything Works

## Checklist

| Test | URL / Action | Expected |
|------|----------------|----------|
| Backend health | `https://YOUR-API.onrender.com/api/health` | `{"status":"ok"}` |
| Frontend loads | `https://YOUR-APP.vercel.app` | Login page appears |
| Login | `alice` / `password123` | Chat screen loads |
| Real-time chat | Open 2 browsers, login as alice & bob | Messages appear live |
| WebSocket | Browser DevTools → Network → WS | Connection to `wss://...` |

---

# Submission Links

For your assignment, submit:

1. **GitHub:** `https://github.com/YOUR_USERNAME/signal-clone`
2. **Live demo:** `https://YOUR-APP.vercel.app`

---

# Troubleshooting

## Login fails / CORS error

- Check `CORS_ORIGINS` on Render matches your Vercel URL **exactly**
- Must include `https://` prefix
- Redeploy Render after changing CORS

## WebSocket not connecting

- Use `wss://` not `ws://` in `NEXT_PUBLIC_WS_URL`
- Render free tier supports WebSockets on web services
- Check browser console for connection errors

## "Failed to fetch" on first load

- Render free tier was sleeping — wait 30 seconds and retry

## Port 3000 issue (local only)

- Not related to deployment — use `start.bat` locally

## Database empty after Render redeploy

- SQLite on Render free tier resets on redeploy
- Demo data auto-seeds on startup when DB is empty
- Demo login: `alice` / `password123`

## Vercel build fails

```powershell
cd frontend
npm run build
```

Fix any errors locally first, then push to GitHub.

## Render build fails

- Confirm **Root Directory** is `backend`
- Confirm **Start Command** uses `$PORT` not `8000`

---

# Quick Reference

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | `https://your-app.vercel.app` |
| Backend API | Render | `https://your-api.onrender.com/api` |
| WebSocket | Render | `wss://your-api.onrender.com/ws` |
| API Docs | Render | `https://your-api.onrender.com/docs` |

### Environment Variables Summary

**Vercel (frontend):**
```
NEXT_PUBLIC_API_URL=https://your-api.onrender.com/api
NEXT_PUBLIC_WS_URL=wss://your-api.onrender.com/ws
```

**Render (backend):**
```
SECRET_KEY=your-random-secret-key
CORS_ORIGINS=https://your-app.vercel.app
PYTHON_VERSION=3.12.0
```

---

# Optional: Deploy with Render Blueprint

If `render.yaml` is in your repo root:

1. Render Dashboard → **New +** → **Blueprint**
2. Connect repo → Render reads `render.yaml` automatically
3. Still set `CORS_ORIGINS` manually after Vercel deploy

---

# Demo Accounts (after deploy)

| Username | Password |
|----------|----------|
| alice | password123 |
| bob | password123 |
| carol | password123 |

Mock OTP for registration: `123456`
