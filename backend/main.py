import os
import warnings
from io import BytesIO

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError

try:
    from .services.provider import DemoProvider, ModelProvider
except ImportError:
    from services.provider import DemoProvider, ModelProvider

MAX_IMAGE_BYTES = 10 * 1024 * 1024
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}
EXPECTED_FORMATS = {
    ".jpg": "JPEG",
    ".jpeg": "JPEG",
    ".png": "PNG",
    ".webp": "WEBP",
}
Image.MAX_IMAGE_PIXELS = 25_000_000

provider_name = os.getenv("PLANTIX_PROVIDER", "demo").strip().lower()
if provider_name == "demo":
    provider = DemoProvider()
elif provider_name == "model":
    provider = ModelProvider()
else:
    raise RuntimeError("PLANTIX_PROVIDER must be either 'demo' or 'model'.")

app = FastAPI(title="PLANTIX API", version="1.0.0")
allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "PLANTIX_ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/analyze")
async def analyze(image: UploadFile = File(...)) -> dict:
    filename = image.filename or ""
    extension = os.path.splitext(filename.lower())[1]
    if extension not in EXPECTED_FORMATS:
        raise HTTPException(status_code=415, detail="Unsupported image format. Choose JPG, PNG or WEBP.")

    content = await image.read(MAX_IMAGE_BYTES + 1)
    if len(content) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image is too large. Please choose an image below 10 MB.")
    if not content:
        raise HTTPException(status_code=400, detail="The selected image is empty.")

    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(BytesIO(content)) as decoded:
                if (
                    decoded.format not in ALLOWED_FORMATS
                    or decoded.format != EXPECTED_FORMATS[extension]
                ):
                    raise HTTPException(
                        status_code=415,
                        detail="Unsupported image format. Choose JPG, PNG or WEBP.",
                    )
                decoded.verify()
    except HTTPException:
        raise
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError, Image.DecompressionBombWarning):
        raise HTTPException(
            status_code=422,
            detail="This image could not be opened. Please choose a different photo.",
        ) from None

    try:
        return provider.analyze(content)
    except NotImplementedError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
