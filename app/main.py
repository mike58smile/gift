from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel
from typing import Dict
import os
import httpx
from dotenv import load_dotenv

# Load environment variables from .env.local
load_dotenv(".env.local")


class ProcessedPost(BaseModel):
    id: str
    originalImage: str
    transformedImage: str
    outputText: str
    outputPrompt: str
    outputLanguage: str
    stylePrompt: str
    timestamp: int
    minimalView: bool = False


class TTSRequest(BaseModel):
    text: str
    voice: str = "alloy"


app = FastAPI(title="Gemini Style Morph Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


_STORE: Dict[str, ProcessedPost] = {}


@app.get("/api/health")
def health():
    return {"ok": True, "count": len(_STORE)}


@app.post("/api/posts")
def save_post(post: ProcessedPost):
    _STORE[post.id] = post
    return {"status": "ok", "id": post.id}


@app.get("/api/posts/{post_id}")
def get_post(post_id: str):
    if post_id not in _STORE:
        raise HTTPException(status_code=404, detail="Post not found")
    return _STORE[post_id]


@app.post("/api/tts")
async def text_to_speech(req: TTSRequest):
    openai_key = os.environ.get("OPENAI_API_KEY")
    if not openai_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text is required")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.openai.com/v1/audio/speech",
            headers={
                "Authorization": f"Bearer {openai_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "tts-1",
                "input": req.text,
                "voice": req.voice
            },
            timeout=60.0
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="TTS generation failed")
        
        return Response(
            content=response.content,
            media_type="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=speech.mp3"}
        )


_DIST_DIR = "dist"
_INDEX_FILE = os.path.join(_DIST_DIR, "index.html")


@app.get("/{full_path:path}")
def serve_spa(full_path: str):
    if full_path.startswith("api"):
        raise HTTPException(status_code=404, detail="Not found")

    if os.path.isdir(_DIST_DIR):
        if full_path:
            candidate = os.path.join(_DIST_DIR, full_path)
            if os.path.isfile(candidate):
                return FileResponse(candidate)

        if os.path.isfile(_INDEX_FILE):
            return FileResponse(_INDEX_FILE)

    raise HTTPException(status_code=404, detail="Not found")
