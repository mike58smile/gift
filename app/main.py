from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Dict
import os


class ProcessedPost(BaseModel):
    id: str
    originalImage: str
    transformedImage: str
    outputText: str
    outputPrompt: str
    outputLanguage: str
    stylePrompt: str
    timestamp: int


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
