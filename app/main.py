from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Dict
import os


class ProcessedPost(BaseModel):
    id: str
    originalImage: str
    transformedImage: str
    description: str
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


if os.path.isdir("dist"):
    app.mount("/", StaticFiles(directory="dist", html=True), name="static")
