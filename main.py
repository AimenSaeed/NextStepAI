import os, sys, logging
from pathlib import Path
from functools import lru_cache

ROOT = Path(__file__).resolve().parent

# ── Import both packages under distinct top-level names ──────────────────────
# Add the repo ROOT to path so we can import 'backend.app' and 'ai_rag.app'
# instead of both being imported as 'app' (which would collide).
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv
load_dotenv(dotenv_path=ROOT / '.env')

# Backend package: backend/app/
import backend.app.models as _b_models
import backend.app.matching as _b_matching
import backend.app.data_loader as _b_loader

StudentProfile = _b_models.StudentProfile
MatchResult    = _b_models.MatchResult
get_matches    = _b_matching.get_matches
refresh_cache  = _b_loader.refresh_cache
get_opportunities = _b_loader.get_opportunities

# ai-rag package lives in 'ai-rag/' - the hyphen makes it unimportable by name.
# Solution: add ai-rag/ to sys.path so 'app' resolves to ai-rag/app.
# We load these AFTER backend so backend.app is already cached under 'backend.app',
# and ai-rag/app loads cleanly as plain 'app'.
_rag_root = str(ROOT / 'ai-rag')
if _rag_root not in sys.path:
    sys.path.append(_rag_root)

from app.embeddings import HashEmbeddingService
from app.llm_client import GeminiClient
from app.member_a_client import MemberAClient, MemberAError
from app.presentation import FrontendAnalysisResponse, format_analysis_response
from app.service import AnalysisService
from app.source_fetcher import SourceFetcher
from app.source_registry import SourceRegistry
from app.vector_store import ChromaVectorStore

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('nextstep')

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI(title='NextStep AI', version='1.0.0', docs_url='/api/docs', redoc_url='/api/redoc')

_cors_origins = [o.strip() for o in os.getenv('CORS_ORIGINS', '*').split(',')]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_methods=['*'],
    allow_headers=['*'],
    allow_credentials=True,
)

@lru_cache(maxsize=1)
def _rag_service() -> AnalysisService:
    member_a_url  = os.getenv('MEMBER_A_BASE_URL', 'http://127.0.0.1:8000')
    chroma_path   = os.getenv('CHROMA_PATH', str(ROOT / 'data' / 'chroma'))
    registry_path = os.getenv('SOURCE_REGISTRY_PATH', str(ROOT / 'data' / 'source_registry.sqlite3'))
    timeout       = float(os.getenv('GEMINI_TIMEOUT_SECONDS', '30'))
    retry_delay   = float(os.getenv('GEMINI_RETRY_DELAY_SECONDS', '0.5'))
    llm_model     = os.getenv('LLM_MODEL', 'gemini-2.0-flash')
    Path(chroma_path).mkdir(parents=True, exist_ok=True)
    return AnalysisService(
        MemberAClient(member_a_url),
        SourceFetcher(),
        SourceRegistry(registry_path),
        ChromaVectorStore(chroma_path),
        HashEmbeddingService(),
        GeminiClient(os.getenv('GEMINI_API_KEY', ''), llm_model,
                     timeout_seconds=timeout, retry_delay_seconds=retry_delay, max_retries=1),
    )

@app.get('/health')
def health():
    return {'status': 'ok', 'opportunities': len(get_opportunities())}

@app.get('/api')
def api_root():
    return {'status': 'NextStep AI matching engine is running'}

@app.get('/api/opportunities/count')
def opportunities_count():
    return {'count': len(get_opportunities())}

@app.post('/api/match', response_model=list[MatchResult])
def match_student(student: StudentProfile):
    return get_matches(student)

@app.post('/admin/refresh-data')
def refresh_data():
    opportunities = refresh_cache()
    return {'status': 'refreshed', 'count': len(opportunities)}

@app.post('/api/analyze', response_model=FrontendAnalysisResponse)
async def analyze(profile: StudentProfile):
    from time import perf_counter
    started = perf_counter()
    try:
        service = _rag_service()
        analysis = await service.analyze(profile)
        response = format_analysis_response(analysis)
        logger.info('analyze completed in %.1fms', (perf_counter() - started) * 1000)
        return response
    except MemberAError as exc:
        from fastapi import HTTPException
        raise HTTPException(503, detail={'code': 'member_a_unavailable', 'message': str(exc)}) from exc

_DIST = ROOT / 'frontend' / 'dist'
if _DIST.exists():
    app.mount('/assets', StaticFiles(directory=str(_DIST / 'assets')), name='static-assets')

    @app.get('/{full_path:path}', include_in_schema=False)
    def spa_fallback(full_path: str):
        return FileResponse(str(_DIST / 'index.html'))
else:
    logger.warning('frontend/dist/ not found -- run npm run build inside frontend/ first.')
