from pathlib import Path


class Settings:
    PROJECT_NAME = "Store Fraud Detection"
    API_V1_PREFIX = "/api/v1"
    DEBUG = False
    BASE_DIR = Path(__file__).resolve().parents[3]
    MODELS_DIR = BASE_DIR / "models" / "production"
    ARTIFACTS_DIR = BASE_DIR / "artifacts"


settings = Settings()
