<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1kAXNoqNLWwEZYOFeCZSIkNOzq-RVigF-

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy as a single server

The FastAPI app is already configured to serve the built frontend from the `dist/` folder. A single process can host both the API and the UI.

1. Build the frontend once:
   `npm install` (if not done)
   `npm run build`
2. Start the API server (serves `/api/*` plus the static UI):
   `uvicorn app.main:app --host 0.0.0.0 --port 8000`

Open http://localhost:8000 to access the UI. API health is at `/api/health`.

Notes:
- Ensure `dist/` exists next to `app/main.py` (from `npm run build`).
- For production, run with a process manager (e.g., systemd, PM2) or a WSGI/ASGI supervisor.
