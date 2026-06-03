from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from core.config import settings

UPSERT_BATCH_SIZE = 100

class QdrantService:
    def __init__(self):
        self.client = QdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key,
            timeout=60,
        )
        self.collection_name = settings.qdrant_collection_name
        self._ensure_collection()

    def _ensure_collection(self):
        try:
            self.client.get_collection(self.collection_name)
        except Exception:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=qmodels.VectorParams(
                    size=settings.embedding_dimension,
                    distance=qmodels.Distance.COSINE
                )
            )
            # Create payload index for fast filtering by repoId
            self.client.create_payload_index(
                collection_name=self.collection_name,
                field_name="repoId",
                field_schema=qmodels.PayloadSchemaType.KEYWORD,
            )

    def upsert_chunks(self, vectors: list, payloads: list, ids: list):
        for i in range(0, len(ids), UPSERT_BATCH_SIZE):
            self.client.upsert(
                collection_name=self.collection_name,
                points=qmodels.Batch(
                    ids=ids[i:i + UPSERT_BATCH_SIZE],
                    vectors=vectors[i:i + UPSERT_BATCH_SIZE],
                    payloads=payloads[i:i + UPSERT_BATCH_SIZE],
                )
            )

    def search(self, repo_id: str, query_vector: list, limit: int = 5):
        return self.client.search(
            collection_name=self.collection_name,
            query_vector=query_vector,
            query_filter=qmodels.Filter(
                must=[
                    qmodels.FieldCondition(
                        key="repoId",
                        match=qmodels.MatchValue(value=repo_id)
                    )
                ]
            ),
            limit=limit
        )

    def delete_repository(self, repo_id: str):
        self.client.delete(
            collection_name=self.collection_name,
            points_selector=qmodels.FilterSelector(
                filter=qmodels.Filter(
                    must=[
                        qmodels.FieldCondition(
                            key="repoId",
                            match=qmodels.MatchValue(value=repo_id)
                        )
                    ]
                )
            )
        )

qdrant_service = QdrantService()
