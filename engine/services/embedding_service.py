# pyrefly: ignore [missing-import]
from sentence_transformers import SentenceTransformer
from core.config import settings

class EmbeddingService:
    def __init__(self):
        # This will download the model on the first run if it's not cached locally
        self.model = SentenceTransformer(settings.embedding_model)

    def generate_embeddings(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
            
        # SentenceTransformer handles batching under the hood to some degree
        # but we encode them and convert back to Python floats
        embeddings = self.model.encode(texts, show_progress_bar=False)
        return embeddings.tolist()

    def generate_embedding(self, text: str) -> list[float]:
        return self.generate_embeddings([text])[0]

embedding_service = EmbeddingService()
