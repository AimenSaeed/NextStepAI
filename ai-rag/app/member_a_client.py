import logging
from time import perf_counter
import httpx
from .models import MatchResult, StudentProfile

logger = logging.getLogger('uvicorn.error')
logger.setLevel(logging.INFO)

class MemberAError(RuntimeError): pass

class MemberAClient:
    def __init__(self, base_url: str, timeout: float = 15): self.base_url, self.timeout = base_url.rstrip('/'), timeout
    async def health(self) -> int:
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as c:
                r = await c.get(f'{self.base_url}/opportunities/count'); r.raise_for_status(); return int(r.json()['count'])
        except (httpx.HTTPError, KeyError, ValueError) as exc: raise MemberAError(f'Member A health check failed: {exc}') from exc
    async def match(self, profile: StudentProfile) -> list[MatchResult]:
        started = perf_counter()
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as c:
                r = await c.post(f'{self.base_url}/match', json=profile.model_dump()); r.raise_for_status(); body = r.json()
            if not isinstance(body, list): raise ValueError('response is not a list')
            results = [MatchResult.model_validate(x) for x in body]
            logger.info('timing stage=member_a_http duration_ms=%.1f result_count=%s', (perf_counter() - started) * 1000, len(results))
            return results
        except (httpx.HTTPError, ValueError) as exc: raise MemberAError(f'Member A /match failed or returned invalid data: {exc}') from exc

def top_three_eligible(results: list[MatchResult]) -> list[MatchResult]:
    return sorted((r for r in results if r.eligibility_status == 'Eligible'), key=lambda r: r.total_score, reverse=True)[:3]
