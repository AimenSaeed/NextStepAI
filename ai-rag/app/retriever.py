from datetime import datetime, timezone
from .embeddings import EmbeddingService
from .models import EvidenceItem
from .vector_store import VectorStore
class Retriever:
    def __init__(self,store:VectorStore,embeddings:EmbeddingService,registry): self.store,self.embeddings,self.registry=store,embeddings,registry
    def retrieve(self,opportunity_id:int,query:str,limit=3)->list[EvidenceItem]:
        chunks=self.store.query(self.embeddings.embed_query(query),opportunity_id,self.registry.active_versions(opportunity_id),limit)
        return [EvidenceItem(source_url=c.metadata['source_url'],source_version=c.metadata['source_version'],retrieved_at=c.metadata['retrieved_at'],excerpt=c.text[:700],chunk_id=c.id) for c in chunks]
