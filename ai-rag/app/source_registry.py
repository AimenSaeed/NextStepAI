import hashlib, sqlite3
from datetime import datetime, timezone
from pathlib import Path
from .models import SourceRecord
class SourceRegistry:
    def __init__(self,path:str):
        self.conn=sqlite3.connect(Path(path)); self.conn.row_factory=sqlite3.Row
        self.conn.execute('''create table if not exists source_registry (opportunity_id integer, opportunity_name text, source_url text, source_type text, retrieval_time text, verification_time text, content_hash text, source_version integer, status text, extraction_status text, error_message text, primary key(opportunity_id,source_url,source_version))'''); self.conn.commit()
    def active(self,opp:int,url:str):
        r=self.conn.execute('select * from source_registry where opportunity_id=? and source_url=? order by source_version desc limit 1',(opp,url)).fetchone(); return SourceRecord.model_validate(dict(r)) if r else None
    def record(self,opp:int,name:str,url:str,typ:str,text:str|None,status='ok',extraction='success',error=None)->tuple[SourceRecord,bool]:
        now=datetime.now(timezone.utc); old=self.active(opp,url); digest=hashlib.sha256(text.encode()).hexdigest() if text else None
        if old and old.content_hash==digest and status=='ok':
            self.conn.execute('update source_registry set verification_time=? where opportunity_id=? and source_url=? and source_version=?',(now.isoformat(),opp,url,old.source_version)); self.conn.commit(); return old,False
        version=(old.source_version+1) if old else 1
        rec=SourceRecord(opportunity_id=opp,opportunity_name=name,source_url=url,source_type=typ,retrieval_time=now,verification_time=now,content_hash=digest,source_version=version,status=status,extraction_status=extraction,error_message=error)
        self.conn.execute('insert or replace into source_registry values (?,?,?,?,?,?,?,?,?,?,?)',(rec.opportunity_id,rec.opportunity_name,rec.source_url,rec.source_type,rec.retrieval_time.isoformat(),rec.verification_time.isoformat(),rec.content_hash,rec.source_version,rec.status,rec.extraction_status,rec.error_message)); self.conn.commit(); return rec,True
    def active_versions(self,opp:int)->dict[str,int]:
        # Only the newest version may be retrieved. A newly unavailable/error
        # fetch must deactivate older, previously accepted chunks.
        rows=self.conn.execute('''select r.source_url, r.source_version from source_registry r
            where r.opportunity_id=? and r.source_version=(select max(i.source_version)
            from source_registry i where i.opportunity_id=r.opportunity_id and i.source_url=r.source_url)
            and r.status="ok"''',(opp,)); return {r[0]:r[1] for r in rows}
