import asyncio

from app.llm_client import GeminiClient


def test_gemini_retries_once_after_provider_error():
    client = GeminiClient('test-key', 'test-model', retry_delay_seconds=0, max_retries=1)
    attempts = 0

    def generate(_prompt):
        nonlocal attempts
        attempts += 1
        if attempts == 1:
            raise RuntimeError('503 UNAVAILABLE')
        return {'why_this_match': 'Grounded.', 'actions': ['Review the official source.']}

    client._generate_json_sync = generate

    result = asyncio.run(client.generate_json('prompt'))

    assert attempts == 2
    assert result['actions'] == ['Review the official source.']
