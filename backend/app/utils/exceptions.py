class FraudDetectionError(Exception):
    """Base exception for fraud detection errors."""


class ModelLoadError(FraudDetectionError):
    """Raised when a model cannot be loaded or trained."""
