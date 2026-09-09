import re
from urllib.parse import urlsplit
from html.parser import HTMLParser
from .source_fetcher import FetchedSource
class SourceQualityError(ValueError): pass
class _Text(HTMLParser):
    def __init__(self): super().__init__(); self.parts=[]; self.skip=0
    def handle_starttag(self,t,a): self.skip += t in ('script','style','noscript')
    def handle_endtag(self,t): self.skip -= t in ('script','style','noscript') and self.skip>0
    def handle_data(self,d):
        if not self.skip: self.parts.append(d)
def clean_text(text: str) -> str:
    text=re.sub(r'(?i)ignore (all |any |the )?(previous|above) instructions?', '[untrusted instruction removed]', text)
    return re.sub(r'\s+',' ',text).strip()
def extract_html(data: bytes) -> str:
    p=_Text(); p.feed(data.decode('utf-8','replace')); return clean_text(' '.join(p.parts))
def extract_pdf(data: bytes) -> str:
    try:
        from pypdf import PdfReader
        import io
        return clean_text(' '.join(page.extract_text() or '' for page in PdfReader(io.BytesIO(data)).pages))
    except Exception as exc: raise ValueError(f'PDF extraction failed: {exc}') from exc
def extract(source: FetchedSource) -> tuple[str,str]:
    pdf='pdf' in source.content_type.lower() or source.url.lower().split('?')[0].endswith('.pdf')
    return (extract_pdf(source.content) if pdf else extract_html(source.content), 'pdf' if pdf else 'html')

def validate_evidence_text(text: str, source_url: str, opportunity_name: str) -> None:
    """Reject error documents and generic hub pages before they reach chunking."""
    lower=text.lower()
    error_markers=('404 page not found', 'page not found', 'error 404', '404 not found', 'the page you requested was not found')
    if any(marker in lower for marker in error_markers):
        raise SourceQualityError('source returned an error/not-found page')
    path_segments=[part for part in urlsplit(source_url).path.split('/') if part]
    is_homepage=len(path_segments) <= 1
    stop_words={'scholarship','scholarships','fellowship','fellowships','need','based','program','programme','and'}
    terms=[term for term in re.findall(r'[a-z0-9]{3,}',opportunity_name.lower()) if term not in stop_words]
    matches=sum(term in lower for term in set(terms))
    exact_name=' '.join(opportunity_name.lower().split()) in lower
    # A root homepage is evidence only when it names the actual opportunity;
    # a single provider name (e.g. DAAD) is not opportunity-specific evidence.
    if is_homepage and not exact_name and matches < 2:
        raise SourceQualityError('source is a generic homepage without opportunity-specific content')
