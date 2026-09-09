from dataclasses import dataclass
import ssl
import logging
from time import perf_counter
import httpx

logger = logging.getLogger('uvicorn.error')
logger.setLevel(logging.INFO)

@dataclass
class FetchedSource: url: str; content: bytes; content_type: str
class SourceFetchError(RuntimeError): pass
class SourceFetcher:
    def __init__(self, timeout: float=20):
        self.timeout=timeout
        # httpx's bundled CA file can omit a locally installed enterprise or
        # platform trust root. Use the OS store while keeping TLS verification on.
        try:
            import truststore
            self.ssl_context=truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        except ImportError:
            self.ssl_context=ssl.create_default_context()
    async def fetch(self, url: str) -> FetchedSource:
        started = perf_counter()
        try:
            async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True, verify=self.ssl_context, headers={'User-Agent':'NextStepAI evidence bot/1.0'}) as c:
                r=await c.get(url); r.raise_for_status()
            result = FetchedSource(str(r.url),r.content,r.headers.get('content-type',''))
            logger.info('timing stage=external_source_http url=%s duration_ms=%.1f status=%s', url, (perf_counter() - started) * 1000, r.status_code)
            return result
        except httpx.HTTPError as exc: raise SourceFetchError(str(exc)) from exc
