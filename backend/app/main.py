"""
Nova Robotics - 빗물받이 관리 플랫폼 Backend
Data Ingestion → DB Storage → LLM Orchestration
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import chat, drainage, health, ingestion
from app.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    # cleanup if needed


app = FastAPI(
    title="Nova Robotics - Storm Drain Backend",
    description="휴대폰 포인트 클라우드 기반 빗물받이 관리 플랫폼 API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingestion.router)
app.include_router(chat.router)
app.include_router(drainage.router)
app.include_router(health.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
    )
