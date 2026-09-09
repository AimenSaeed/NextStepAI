import re
def chunk_text(text: str, size: int=900, overlap: int=150) -> list[str]:
    text=' '.join(text.split())
    if not text: return []
    sentences=re.split(r'(?<=[.!?])\s+',text); chunks=[]; current=''
    for s in sentences:
        if current and len(current)+len(s)+1 > size:
            chunks.append(current); current=(current[-overlap:]+' '+s).strip()
        else: current=(current+' '+s).strip()
    if current: chunks.append(current)
    return chunks
