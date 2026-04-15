import os

from fastapi import FastAPI

from backend.routers.assessments import router as assessments_router
from backend.routers.pages import router as pages_router
from backend.routers.shops import router as shops_router


app = FastAPI(title="SkiWare")

app.include_router(pages_router)
app.include_router(assessments_router)
app.include_router(shops_router)


if __name__ == "__main__":
    from uvicorn import run

    port = int(os.environ.get("PORT", 8080))
    run("backend.main:app", host="0.0.0.0", port=port)
