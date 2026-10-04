from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class DiseasePrediction:
    name: str
    confidence: float
    severity: str
    healthy: bool
    explanation: str
    observed_signs: tuple[str, ...] = ()
    associated_symptoms: tuple[str, ...] = ()


class DiseaseClassifier(Protocol):
    def classify(self, image: bytes, plant_name: str) -> DiseasePrediction:
        """Classify a validated image for a supported plant."""


class UnconfiguredDiseaseClassifier:
    def classify(self, image: bytes, plant_name: str) -> DiseasePrediction:
        raise NotImplementedError(
            "No disease classifier is configured. Connect and validate a model before enabling model mode."
        )
