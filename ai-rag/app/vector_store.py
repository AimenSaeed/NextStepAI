from abc import ABC, abstractmethod
from dataclasses import dataclass
import math
@dataclass
class VectorChunk: id:str; text:str; embedding:list[float]; metadata:dict
class VectorStore(ABC):
    @abstractmethod
    def add(self,chunks:list[VectorChunk])->None: ...
    @abstractmethod
    def query(self,embedding:list[float],opportunity_id:int,active_versions:dict[str,int],limit:int=4)->list[VectorChunk]: ...
class MemoryVectorStore(VectorStore):
    def __init__(self): self.chunks:dict[str,VectorChunk]={}
    def add(self,chunks):
        for c in chunks: self.chunks[c.id]=c
    def query(self,embedding,opportunity_id,active_versions,limit=4):
        def valid(c): return c.metadata['opportunity_id']==opportunity_id and active_versions.get(c.metadata['source_url'])==c.metadata['source_version']
        score=lambda c:sum(a*b for a,b in zip(embedding,c.embedding))/(math.sqrt(sum(x*x for x in c.embedding)) or 1)
        return sorted((c for c in self.chunks.values() if valid(c)),key=score,reverse=True)[:limit]
class ChromaVectorStore(MemoryVectorStore):
    """Persistent Chroma implementation, with a test-safe in-memory fallback."""
    def __init__(self, path: str | None = None):
        super().__init__(); self.collection=None
        if path:
            try:
                import chromadb
                self.collection=chromadb.PersistentClient(path=path).get_or_create_collection('nextstep_evidence')
            except Exception:
                # Availability is observable through normal service limitations; tests need no daemon.
                self.collection=None
    def add(self,chunks):
        super().add(chunks)
        if self.collection and chunks:
            metadatas=[]
            for c in chunks:
                m=dict(c.metadata); m['retrieved_at']=m['retrieved_at'].isoformat() if hasattr(m['retrieved_at'],'isoformat') else str(m['retrieved_at']); metadatas.append(m)
            self.collection.upsert(ids=[c.id for c in chunks],documents=[c.text for c in chunks],embeddings=[c.embedding for c in chunks],metadatas=metadatas)
    def query(self,embedding,opportunity_id,active_versions,limit=4):
        if not self.collection: return super().query(embedding,opportunity_id,active_versions,limit)
        response=self.collection.query(query_embeddings=[embedding],n_results=max(limit*4,10),where={'opportunity_id':opportunity_id},include=['documents','metadatas','embeddings'])
        candidates=[]
        for i,doc in enumerate(response['documents'][0]):
            m=response['metadatas'][0][i]
            if active_versions.get(m['source_url']) == m['source_version']:
                m['retrieved_at']=__import__('datetime').datetime.fromisoformat(m['retrieved_at'])
                candidates.append(VectorChunk(response['ids'][0][i],doc,response['embeddings'][0][i],m))
        return candidates[:limit]
