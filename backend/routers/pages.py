from fastapi import APIRouter
from fastapi.responses import HTMLResponse


router = APIRouter()


ROOT_PAGE = """
<!DOCTYPE html>
<html>
<head><title>Hello World</title>
<style>
    body { font-family: system-ui, sans-serif; display: flex; justify-content: center;
           align-items: center; min-height: 100vh; margin: 0; background: #f0f4f8; }
    .card { background: white; padding: 3rem; border-radius: 12px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.1); text-align: center; }
    h1 { color: #1a73e8; margin-bottom: 0.5rem; }
    p { color: #5f6368; }
    code { background: #e8f0fe; padding: 2px 8px; border-radius: 4px; }
</style>
</head>
<body>
    <div class="card">
        <h1>Hello World!</h1>
        <p>Running on <code>Cloud Run</code></p>
        <p style="font-size:0.85rem; color:#999;">Edit <code>backend/</code> and push to GitHub to auto-deploy</p>
    </div>
</body>
</html>
"""


@router.get("/", response_class=HTMLResponse)
async def hello() -> str:
    return ROOT_PAGE


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
