from pydantic import BaseModel


class ModelSummary(BaseModel):
    model_name: str
    version: str
    status: str
