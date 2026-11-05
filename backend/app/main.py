from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints.tone import router as tone_router

app = FastAPI(
    title="Autotoner API",
    version="1.0.0",
    description="Backend of audio analysis and setting extraction for amp and pedals."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(tone_router, prefix="/api/v1/tone", tags=["Tone"])

@app.get("/health")
def health_check():
    return {"status": "ok"}