import sys
from datetime import datetime, timezone
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parents[1]))
from app.embeddings import HashEmbeddingService
from app.member_a_client import top_three_eligible
from app.models import MatchResult
from app.vector_store import MemoryVectorStore, VectorChunk

def match(i,status,score): return MatchResult(opportunity_id=i,name=str(i),eligibility_status=status,total_score=score)
def test_top_three_excludes_higher_scoring_partial():
    raw=[match(1,'Partial Match',99),match(2,'Eligible',70),match(3,'Eligible',90),match(4,'Eligible',80),match(5,'Eligible',60)]
    assert [x.opportunity_id for x in top_three_eligible(raw)]==[3,4,2]
def test_zero_eligible_is_valid(): assert top_three_eligible([match(1,'Not Eligible',0),match(2,'Partial Match',90)])==[]
def test_shared_url_cannot_cross_opportunities():
    e=HashEmbeddingService(); store=MemoryVectorStore(); now=datetime.now(timezone.utc)
    store.add([VectorChunk('a','A specific condition',e.embed_query('condition'),{'opportunity_id':1,'source_url':'https://shared','source_version':1,'retrieved_at':now}),VectorChunk('b','B specific condition',e.embed_query('condition'),{'opportunity_id':2,'source_url':'https://shared','source_version':1,'retrieved_at':now})])
    result=store.query(e.embed_query('condition'),1,{'https://shared':1})
    assert [x.id for x in result]==['a']
