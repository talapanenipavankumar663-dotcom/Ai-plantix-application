from dataclasses import asdict

from .disease_classifier import DiseasePrediction, UnconfiguredDiseaseClassifier
from .plant_detector import PlantPrediction, UnconfiguredPlantDetector
from .recommendation_service import recommendations_for


class DemoProvider:
    """Explicit, non-diagnostic example provider for UI and integration testing."""

    is_demo = True

    def analyze(self, image: bytes) -> dict:
        plant = PlantPrediction(
            name="Tomato (demo sample)",
            confidence=0.72,
            scientific_name="Solanum lycopersicum",
            category="Fruit vegetable",
            growth_stage=None,
        )
        diagnosis = DiseasePrediction(
            name="Early blight (demo sample)",
            confidence=0.68,
            severity="moderate",
            healthy=False,
            explanation=(
                "This is fixed demonstration content to exercise the report interface. "
                "The submitted photo was not classified by a trained model."
            ),
            observed_signs=(),
            associated_symptoms=("Brown leaf spots", "Yellowing around lesions", "Leaf drying"),
        )
        return _build_response(plant, diagnosis, is_demo=True)


class ModelProvider:
    """Adapter seam for a separately validated computer-vision model."""

    is_demo = False

    def __init__(self) -> None:
        self.plant_detector = UnconfiguredPlantDetector()
        self.disease_classifier = UnconfiguredDiseaseClassifier()

    def analyze(self, image: bytes) -> dict:
        plant = self.plant_detector.detect(image)
        diagnosis = self.disease_classifier.classify(image, plant.name)
        return _build_response(plant, diagnosis, is_demo=False)


def _build_response(
    plant: PlantPrediction, diagnosis: DiseasePrediction, is_demo: bool
) -> dict:
    care = recommendations_for(diagnosis.name, diagnosis.healthy)
    return {
        "plant": asdict(plant),
        "diagnosis": asdict(diagnosis),
        "symptoms": {
            "observed": list(diagnosis.observed_signs),
            "associated": list(diagnosis.associated_symptoms),
        },
        **care,
        "provider": "demo" if is_demo else "model",
        "warning": (
            "DEMO OUTPUT — example only; this image was not analyzed by a trained model."
            if is_demo
            else None
        ),
    }
