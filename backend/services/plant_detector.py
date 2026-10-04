from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class PlantPrediction:
    name: str
    confidence: float
    scientific_name: str | None = None
    category: str | None = None
    growth_stage: str | None = None


class PlantDetector(Protocol):
    def detect(self, image: bytes) -> PlantPrediction:
        """Identify a supported plant from validated image bytes."""


class UnconfiguredPlantDetector:
    def detect(self, image: bytes) -> PlantPrediction:
        raise NotImplementedError(
            "No plant detector is configured. Connect and validate a model before enabling model mode."
        )
