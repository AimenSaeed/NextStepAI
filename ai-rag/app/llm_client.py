from abc import ABC, abstractmethod
import asyncio
import json
import logging
import re
from time import perf_counter
from .models import ExplanationOutput

logger = logging.getLogger('uvicorn.error')
logger.setLevel(logging.INFO)

def _safe_exception_message(exc: Exception, secret: str = '') -> str:
    """Keep provider diagnostics useful without emitting credential material."""
    message = f'{type(exc).__name__}: {exc}'
    if secret:
        message = message.replace(secret, '[REDACTED]')
    return re.sub(r'(?i)(?:AIza|AQ\.)[A-Za-z0-9_\-\.]+', '[REDACTED]', message)

class LLMError(RuntimeError):
    def __init__(self, message: str, code: str = 'provider_error'):
        super().__init__(message)
        self.code = code
class LLMClient(ABC):
    @abstractmethod
    async def generate_json(self,prompt:str)->dict: ...
class GeminiClient(LLMClient):
    def __init__(self, key: str, model: str, timeout_seconds: float = 30.0, retry_delay_seconds: float = 0.5, max_retries: int = 1):
        self.key = key
        self.model = model
        self.timeout_seconds = timeout_seconds
        self.retry_delay_seconds = retry_delay_seconds
        self.max_retries = max(0, max_retries)

    async def generate_json(self,prompt):
        if not self.key: raise LLMError('GEMINI_API_KEY is not configured', 'api_key_missing')
        started = perf_counter()
        attempts = self.max_retries + 1
        for attempt in range(1, attempts + 1):
            try:
                result = await asyncio.wait_for(
                    asyncio.to_thread(self._generate_json_sync, prompt),
                    timeout=self.timeout_seconds,
                )
                logger.info(
                    'llm_call provider=gemini model=%s attempt=%d duration_ms=%.1f status=success',
                    self.model, attempt, (perf_counter() - started) * 1000,
                )
                return result
            except ImportError as exc:
                raise LLMError('Gemini SDK is not installed', 'sdk_unavailable') from exc
            except json.JSONDecodeError as exc:
                raise LLMError('Gemini returned invalid JSON', 'invalid_json') from exc
            except asyncio.TimeoutError as exc:
                code = 'timeout'
                safe_message = f'timed out after {self.timeout_seconds:.1f}s'
            except Exception as exc:
                code = 'provider_error'
                safe_message = _safe_exception_message(exc, self.key)
                status = getattr(exc, 'status_code', None) or getattr(exc, 'status', None) or 'unknown'
                logger.warning(
                    'llm_call provider=gemini model=%s attempt=%d duration_ms=%.1f status=%s error_code=%s error=%s',
                    self.model, attempt, (perf_counter() - started) * 1000, status, code, safe_message,
                )

            if attempt < attempts:
                logger.info(
                    'llm_retry provider=gemini model=%s attempt=%d delay_ms=%.1f error_code=%s',
                    self.model, attempt + 1, self.retry_delay_seconds * 1000, code,
                )
                await asyncio.sleep(self.retry_delay_seconds)
                continue

            logger.error(
                'llm_call provider=gemini model=%s attempts=%d duration_ms=%.1f status=failed error_code=%s error=%s',
                self.model, attempt, (perf_counter() - started) * 1000,
                'timeout' if code == 'timeout' else 'provider_error', safe_message,
            )
            raise LLMError(f'Gemini generation failed: {safe_message}', code) from exc

    def _generate_json_sync(self, prompt):
        from google import genai
        client=genai.Client(api_key=self.key); response=client.models.generate_content(model=self.model,contents=prompt,config={'response_mime_type':'application/json','response_schema':ExplanationOutput})
        return json.loads(response.text)
class OpenAIClient(LLMClient):
    async def generate_json(self,prompt): raise LLMError('OpenAI client is a configured interface stub, not enabled in this MVP.')
class FakeLLMClient(LLMClient):
    def __init__(self,response:dict|None=None, error:Exception|None=None): self.response,self.error=response or {},error
    async def generate_json(self,prompt):
        if self.error: raise self.error
        return self.response
