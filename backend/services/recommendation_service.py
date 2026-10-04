def recommendations_for(diagnosis: str, healthy: bool) -> dict[str, list[str]]:
    if healthy:
        return {
            "care": [
                "Maintain watering appropriate to the crop and local conditions.",
                "Provide suitable sunlight and avoid prolonged waterlogging.",
                "Remove damaged leaves with clean tools and monitor new growth.",
            ],
            "nutrition": [
                "Base nutrient choices on the crop, growth stage, and a soil test.",
                "Use locally suitable mature compost where appropriate.",
            ],
            "prevention": [
                "Check plants regularly, including the undersides of leaves.",
                "Keep tools clean and maintain suitable spacing and airflow.",
            ],
        }

    return {
        "care": [
            "Inspect several plants and compare newer and older leaves.",
            "Remove severely affected plant material where appropriate and dispose of it according to local guidance.",
            "Avoid overhead watering when practical and maintain suitable soil moisture.",
        ],
        "nutrition": [
            "Do not apply fertilizer solely on the basis of an image diagnosis.",
            "Use a soil test and crop-stage guidance to choose suitable nutrients.",
        ],
        "prevention": [
            "Improve airflow and avoid working with wet foliage where practical.",
            "Clean tools between plants and monitor nearby crops for changes.",
            "Consult local agricultural guidance if symptoms spread or the crop is valuable.",
        ],
    }
