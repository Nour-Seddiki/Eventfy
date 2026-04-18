from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.db.session import engine
from app.db.base import Base
from app.routes import auth, events, users, tickets, payments, notifications, review, saving_events, admin, recommendations


Base.metadata.create_all(bind=engine)

app = FastAPI(title="Eventfy API", version="1.0.0")

# ── CORS — allow frontend origins ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(events.router)
app.include_router(tickets.router)
app.include_router(payments.router)
app.include_router(notifications.router)
app.include_router(review.router)
app.include_router(saving_events.router)
app.include_router(admin.router)
app.include_router(recommendations.router)

# ── Static files (uploaded event images, etc.) ──
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/")
async def root():
    return {"message": "Welcome to Eventfy API", "docs": "/docs"}
