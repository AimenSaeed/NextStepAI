from abc import ABC, abstractmethod
import hashlib
class EmbeddingService(ABC):
    @abstractmethod
    def embed_texts(self, texts:list[str])->list[list[float]]: ...
    @abstractmethod
    def embed_query(self, text:str)->list[float]: ...
class HashEmbeddingService(EmbeddingService):
    """Deterministic offline embedding for tests/dev; configure a semantic provider in production."""
    dimensions=64
    def embed_query(self,text):
        v=[0.0]*self.dimensions
        for word in text.lower().split(): v[int(hashlib.sha256(word.encode()).hexdigest(),16)%self.dimensions]+=1
        norm=sum(x*x for x in v)**.5 or 1; return [x/norm for x in v]
    def embed_texts(self,texts): return [self.embed_query(t) for t in texts]
