from io import BytesIO

from fastapi.testclient import TestClient
from PIL import Image

from main import app
from services.provider import ModelProvider

client = TestClient(app)


def make_image(format_name: str = "JPEG") -> bytes:
    buffer = BytesIO()
    Image.new("RGB", (32, 32), color=(70, 130, 80)).save(buffer, format=format_name)
    return buffer.getvalue()


def test_health_endpoint() -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_demo_analysis_is_explicitly_labelled() -> None:
    response = client.post(
        "/api/analyze",
        files={"image": ("leaf.jpg", make_image(), "image/jpeg")},
    )
    assert response.status_code == 200
    result = response.json()
    assert result["provider"] == "demo"
    assert result["diagnosis"]["name"] == "Early blight (demo sample)"
    assert result["symptoms"]["observed"] == []
    assert "not analyzed by a trained model" in result["warning"]
    assert result["nutrition"]


def test_unsupported_extension_is_rejected() -> None:
    response = client.post(
        "/api/analyze",
        files={"image": ("notes.pdf", b"not an image", "application/pdf")},
    )
    assert response.status_code == 415


def test_corrupt_image_is_rejected() -> None:
    response = client.post(
        "/api/analyze",
        files={"image": ("leaf.png", b"not a valid image", "image/png")},
    )
    assert response.status_code == 422


def test_image_extension_and_actual_format_must_match_allowed_format() -> None:
    response = client.post(
        "/api/analyze",
        files={"image": ("leaf.png", make_image("JPEG"), "image/png")},
    )
    assert response.status_code == 415


def test_oversized_image_is_rejected() -> None:
    response = client.post(
        "/api/analyze",
        files={"image": ("leaf.jpg", b"x" * (10 * 1024 * 1024 + 1), "image/jpeg")},
    )
    assert response.status_code == 413


def test_unconfigured_model_does_not_return_demo_results() -> None:
    try:
        ModelProvider().analyze(make_image())
    except NotImplementedError as error:
        assert "No plant detector is configured" in str(error)
    else:
        raise AssertionError("Model mode must fail explicitly until an inference adapter is configured.")
