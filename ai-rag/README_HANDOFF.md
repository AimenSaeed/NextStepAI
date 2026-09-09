# NextStep AI — AI/RAG and Scholarship Analysis Engineering Handoff

## 1. What was built

`ai-rag` is Member B, the evidence and explanation service. It accepts a student profile, asks Member A for deterministic scholarship matches, retrieves and validates official-source content for the selected eligible opportunities, optionally generates grounded explanations with Gemini, and converts the internal analysis into a frontend-safe response.

The implemented request path is:

```text
Frontend
  -> Member B POST /analyze
  -> Member A POST /match
  -> official-source fetch
  -> HTML/PDF extraction and validation
  -> sentence-based chunking
  -> embeddings and Chroma/in-memory vector storage
  -> evidence retrieval for the opportunity
  -> Gemini explanation when evidence exists
  -> frontend presentation formatting
  -> Frontend
```

Member A owns normalized opportunity data, eligibility, scoring, and ranking. Member B does not read the workbook, recalculate eligibility, replace scores, or override Member A's status. Member B adds evidence, explanation, profile-gap context, and presentation formatting around Member A's result.

## 2. Architecture

The system is intentionally split into two FastAPI servers:

| Service | Code | Port | Main endpoints | Responsibility |
| --- | --- | ---: | --- | --- |
| Member A | `backend/app/main.py` | `8000` | `GET /`, `GET /opportunities/count`, `POST /match`, `POST /admin/refresh-data` | Loads normalized opportunities; applies deterministic eligibility, scoring, and ranking. |
| Member B | `ai-rag/app/main.py` | `8001` | `GET /`, `POST /analyze` | Calls Member A, retrieves official evidence, invokes Gemini when evidence exists, and formats the frontend response. |

Member B's `MemberAClient` calls `http://127.0.0.1:8000/match` by default and validates the returned list as `MatchResult` objects. The `MEMBER_A_BASE_URL` environment variable changes that base URL.

Member A remains the source of truth because its `/match` response is produced by `matching.py` from the normalized opportunity dataset, `eligibility.py`, and `scoring.py`. Member B's prompt explicitly instructs Gemini not to override or reinterpret those decisions, and the service copies their status and scores into internal recommendations.

## 3. Codebase: `ai-rag/app`

| Module | Responsibility and lifecycle role |
| --- | --- |
| `main.py` | Creates the FastAPI app, loads `ai-rag/.env`, caches one `AnalysisService` per process with `lru_cache`, defines `/` and `/analyze`, and maps Member A failures to HTTP 503. |
| `models.py` | Defines request models, Member A match models, internal evidence/recommendation/roadmap models, LLM status, and the public presentation models' source types. |
| `member_a_client.py` | Calls Member A `/match` with the `StudentProfile`, validates the list, logs timing, and provides `top_three_eligible()` for the top-three eligible selection. Its HTTP timeout is 15 seconds. |
| `service.py` | Orchestrates the complete Member B analysis: calls Member A, selects eligible results, calculates deterministic profile observations/gaps, runs selected opportunity pipelines concurrently, aggregates internal results, and invokes the LLM only after evidence retrieval. |
| `source_fetcher.py` | Fetches an official URL with `httpx`, redirects enabled, a 20-second timeout, TLS verification, and a service user-agent. |
| `content_extractor.py` | Extracts visible HTML text or PDF text, removes prompt-injection-style instruction phrases, and rejects common 404/error pages or generic homepages without opportunity-specific content. |
| `chunker.py` | Normalizes text and creates sentence-aware chunks with a default size of 900 characters and 150-character overlap. |
| `source_registry.py` | Persists source identity, hashes, status, extraction status, retrieval/verification times, and source versions in SQLite. Unchanged content is not re-ingested. Retrieval is limited to the active successful source version. |
| `embeddings.py` | Defines the embedding interface and implements `HashEmbeddingService`, a deterministic 64-dimensional local hash embedding used by the current startup path. |
| `vector_store.py` | Defines vector storage, provides an in-memory cosine-similarity store, and uses persistent Chroma at `CHROMA_PATH` when Chroma initializes successfully. It falls back to memory if Chroma is unavailable. |
| `retriever.py` | Embeds the evidence query, filters by opportunity and active source versions, and returns `EvidenceItem` objects containing excerpts and internal chunk/source metadata. |
| `profile_analyzer.py` | Produces deterministic profile strengths and general limitations from the submitted profile and Member A matches. |
| `gap_engine.py` | Converts missing profile fields and actionable Member A partial-match reasons into bounded roadmap gap items. It does not re-evaluate eligibility. |
| `prompt_builder.py` | Builds Gemini's grounded JSON prompt from the profile, authoritative Member A match, retrieved evidence, and gap context. |
| `llm_client.py` | Defines the LLM interface, calls Gemini's synchronous SDK from a worker thread, requests the `ExplanationOutput` response schema, applies timeout/retry handling, and logs redacted diagnostics. `service.py` validates the returned JSON with `ExplanationOutput`. |
| `presentation.py` | Converts internal `AnalysisResponse` into the four-section `FrontendAnalysisResponse`; removes evidence and diagnostics from the normal HTTP response and normalizes missing values to `null`. |
| `__init__.py` | Package marker. |

### Configuration

The current `ai-rag/.env.example` contains:

| Variable | Current behavior |
| --- | --- |
| `GEMINI_API_KEY` | Credential required for Gemini. If empty, Gemini is not called successfully and the internal LLM reason becomes `api_key_missing`. The key must not be committed. |
| `LLM_MODEL` | Model passed to `genai.Client(...).models.generate_content(...)`. The current local `.env` value is `gemini-3.6-flash`. |
| `GEMINI_TIMEOUT_SECONDS` | Per-attempt async wait timeout; default `30`. |
| `GEMINI_RETRY_DELAY_SECONDS` | Delay before the single retry; default `0.5` seconds. |
| `MEMBER_A_BASE_URL` | Member A base URL; default `http://127.0.0.1:8000`. |
| `CHROMA_PATH` | Persistent Chroma path; default `./.chroma`. |
| `SOURCE_REGISTRY_PATH` | SQLite source registry path; default `./.source_registry.sqlite3`. |
| `EMBEDDING_PROVIDER` | Present in `.env.example`, but not consulted by the current `main.py`; startup always constructs `HashEmbeddingService`. |
| `LLM_PROVIDER` | Present in `.env.example`, but not consulted by the current startup path; `GeminiClient` is constructed directly. |
| `OPENAI_API_KEY` | Present in `.env.example`, but unused by the current startup path. |

Relative paths are resolved from the process working directory. The `.env` file itself is loaded from `ai-rag/.env` based on the package path.

## 4. Frontend API contract: `POST /analyze`

### Request

The request body is a `StudentProfile`:

```json
{
  "student_id": 42,
  "gpa_or_percentage": 3.6,
  "field": "Computer Science",
  "degree_level": "Masters",
  "budget_pkr": 800000,
  "target_countries": ["Germany", "Türkiye"],
  "career_goals": "Build machine-learning systems",
  "english_test_status": "IELTS 7.0",
  "domicile_province": "Punjab",
  "income_bracket": "Middle"
}
```

Required fields are `gpa_or_percentage`, `field`, `degree_level`, `domicile_province`, and `income_bracket`. `student_id`, `budget_pkr`, `career_goals`, and `english_test_status` may be `null`; `target_countries` defaults to an empty list.

### Response

The normal successful response contains exactly these four top-level sections:

```json
{
  "profile_summary": {
    "academic_profile": "Masters applicant in Computer Science with a reported academic result of 3.6.",
    "target_countries": ["Germany", "Türkiye"],
    "budget": "PKR 800,000",
    "research_summary": "Based on your Masters academic background in Computer Science, target countries (Germany, Türkiye) and stated funding needs, these are your strongest scholarship opportunities."
  },
  "top_scholarships": [
    {
      "rank": 1,
      "name": "Example Scholarship",
      "country": "Germany",
      "institution": "Example Provider",
      "eligibility": "Eligible",
      "match_score": 86.5,
      "deadline": "October 2026",
      "why_suitable": "The opportunity aligns with the applicant's stated academic direction.",
      "how_to_apply": "Review the official eligibility requirements and application instructions.",
      "official_link": "https://official.example/apply"
    }
  ],
  "partial_matches": [
    {
      "name": "Another Scholarship",
      "country": "Germany",
      "institution": "Another Provider",
      "eligibility": "Partially matching",
      "match_score": null,
      "deadline": null,
      "why_not_fully_eligible": ["Degree level mismatch (offers PhD)"],
      "how_to_become_eligible": [],
      "official_link": "https://official.example/another"
    }
  ],
  "application_roadmap": [
    {
      "priority": 1,
      "scholarship": "Example Scholarship",
      "action": "Confirm the current eligibility requirements and begin preparing your application."
    }
  ]
}
```

The example values are illustrative; field names, types, and nullability reflect the current Pydantic presentation models.

#### `profile_summary`

- `academic_profile`: generated from degree level, field, and reported academic result.
- `target_countries`: the submitted list, possibly empty.
- `budget`: formatted as `PKR ...` when `budget_pkr` is supplied; otherwise `null`.
- `research_summary`: a short summary based on the internal analysis and whether eligible recommendations exist.

#### `top_scholarships`

Contains at most three `Eligible` recommendations selected from Member A's result set and sorted by Member A's score. Each item includes `rank`, `name`, `country`, `institution`, `eligibility`, numeric `match_score`, `deadline`, `why_suitable`, `how_to_apply`, and `official_link`.

`deadline`, `country`, `institution`, and `official_link` can be `null` where the underlying data is absent. In the current formatter, `why_suitable` and `how_to_apply` are populated strings for emitted top-scholarship items, including when Gemini is unavailable. `match_score` is required for a top scholarship because these entries come from scored eligible recommendations.

#### `partial_matches`

Contains at most five Member A results whose status is `Partial Match`, ordered by their existing opportunity-level `total_score` when a score breakdown exists. Each item includes `name`, `country`, `institution`, `eligibility` (the presentation value is `Partially matching`), `match_score`, `deadline`, `why_not_fully_eligible`, `how_to_become_eligible`, and `official_link`.

`match_score` is `null` when Member A supplied no score breakdown. A partial score is a fit score for the opportunity; it is not an eligibility probability. `deadline`, `country`, `institution`, and `official_link` can also be `null`.

#### `application_roadmap`

Contains up to three ordered items with `priority`, `scholarship`, and `action`. With recommendations, actions are based on whether an evidence-derived document checklist is available. Without recommendations but with profile gaps, items use `scholarship: "Profile improvement"` and the gap action.

### Missing evidence, Gemini failure, and errors

- Official-source fetch, extraction, validation, registry, or vector errors are captured as internal limitations for the opportunity. The recommendation falls back to deterministic actions and does not assert source-specific details.
- Gemini is attempted only when evidence was retrieved. If there is no evidence, Gemini is skipped and no provider call is made.
- If Gemini fails or returns invalid structured output, the service keeps the deterministic fallback explanation/actions and still returns the normal frontend response.
- Gemini/provider errors, raw evidence, LLM status, limitations, source versions, retrieval timestamps, and chunk IDs are not returned by the normal public response.
- If Member A is unavailable, Member B's route raises HTTP `503` with a detail object containing `code: "member_a_unavailable"` and a message. Request validation errors are handled by FastAPI/Pydantic, normally as HTTP `422`.
- The current route has no explicit catch-all HTTP mapping for source or Gemini errors because those are handled inside the analysis pipeline. A successful analysis therefore normally remains HTTP `200` even when evidence or Gemini is unavailable.

### Intentionally not exposed

The frontend contract intentionally excludes raw evidence excerpts, source versions, retrieval timestamps, chunk IDs, source registry state, vector metadata, score breakdowns, internal limitations, LLM status, provider error details, prompts, and internal reasoning. The four presentation sections are the public response boundary.

## 5. Frontend integration guide

1. Start Member A on port `8000` and Member B on port `8001`.
2. `POST` the intake profile JSON to `http://127.0.0.1:8001/analyze`.
3. While waiting, show a loading state. The first request may be slower because service/vector initialization and source ingestion can occur.
4. Render `profile_summary` as the profile header/context.
5. Render `top_scholarships` as the primary ranked cards. Use `rank`, `name`, `country`, `institution`, `match_score`, `deadline`, `why_suitable`, `how_to_apply`, and `official_link`.
6. Render `partial_matches` separately as improvement/context cards. Show `why_not_fully_eligible` and any `how_to_become_eligible` actions.
7. Render `application_roadmap` as the ordered action list.
8. Render a missing `deadline` as “Deadline not available” or another frontend label; the API value itself is `null`.
9. Render a missing partial `match_score` as “Score unavailable”; do not substitute zero. A top-scholarship score is numeric.
10. If arrays are empty, show an empty-state message rather than treating it as a transport failure. In particular, no eligible recommendations can still produce partial matches and/or profile-improvement roadmap items.
11. For HTTP `422`, show an input-validation message. For HTTP `503`, show that matching is temporarily unavailable and allow retry. For network timeout/failure, show a retryable service-error state.

## 6. Scoring and eligibility

Member A makes these decisions in `backend/app/eligibility.py`, `backend/app/scoring.py`, and `backend/app/matching.py`:

- Every normalized opportunity is checked against the configured hard-rule functions.
- Zero failed rules produces `Eligible`; one produces `Partial Match`; two or more produces `Not Eligible`.
- Eligible and partial opportunities receive a weighted score across academic, field, funding, country, and domicile fit. Member A sorts the complete result list with scored matches first and non-eligible matches at the bottom.

Member B must preserve these outputs. It selects the top three `Eligible` rows using `top_three_eligible()`, copies `eligibility_status`, `total_score`, and `score_breakdown` into internal recommendations, and never re-runs or overrides the eligibility rules. Its gap engine only translates Member A's partial-match reasons into possible actions.

The public response does not expose score breakdowns. `top_scholarships[].match_score` is the numeric Member A `total_score`. `partial_matches[].match_score` is the Member A opportunity-level `total_score` when a score breakdown exists; otherwise it is `null`. Scores are not probabilities.

## 7. RAG/source pipeline

For each selected eligible opportunity with a source URL:

1. `SourceFetcher` retrieves the URL using HTTPS verification, redirects, a 20-second timeout, and an HTTP user-agent.
2. `content_extractor.extract()` chooses PDF extraction when the content type or URL indicates PDF; otherwise it parses visible HTML text. It cleans whitespace and removes common prompt-injection instruction phrases.
3. `validate_evidence_text()` rejects common not-found pages and generic homepages that do not contain enough opportunity-specific text.
4. `SourceRegistry` hashes extracted text and records the source with a version. Unchanged successful content is not re-chunked or re-embedded. New content creates a new source version.
5. `chunk_text()` creates sentence-aware chunks of about 900 characters with 150-character overlap.
6. `HashEmbeddingService` creates deterministic 64-dimensional local embeddings. The current `main.py` always uses this implementation; `EMBEDDING_PROVIDER` is not yet a runtime selector.
7. `ChromaVectorStore` persists chunks in the `nextstep_evidence` collection under `CHROMA_PATH` when available. It retains an in-memory store and uses it for queries if Chroma initialization fails.
8. `Retriever` embeds the query `eligibility application funding documents`, restricts results to the opportunity ID and active successful source versions, and returns up to three evidence items.
9. Retrieved excerpts are included in the Gemini prompt as untrusted evidence. The prompt instructs Gemini to use them only for claims literally supported by the evidence and to preserve Member A's deterministic facts.

Fallback behavior is deliberate: missing source URLs, fetch/extraction/validation failures, too little text, no retrieved chunks, unavailable Chroma, absent API keys, Gemini provider errors, and invalid Gemini output do not replace the Member A match. The service records an internal limitation and uses deterministic fallback actions or explanation text.

## 8. Gemini integration

Gemini is called in `ai-rag/app/llm_client.py` by `GeminiClient._generate_json_sync()`, which uses `google.genai.Client(...).models.generate_content(...)` with JSON response configuration and the `ExplanationOutput` schema. `AnalysisService._analyze_match()` calls it only after source evidence has been retrieved.

Gemini is used for opportunity-specific `why_this_match` text and a non-empty list of grounded `actions`. It does not decide eligibility, calculate scores, select the top opportunities, or provide authoritative facts without retrieved evidence.

Current resilience behavior:

- The synchronous SDK call runs through `asyncio.to_thread()` so it does not block the async event loop.
- Each attempt is bounded by `asyncio.wait_for()` using `GEMINI_TIMEOUT_SECONDS`, default 30 seconds.
- There is one retry (`max_retries=1`) after the first failure, with `GEMINI_RETRY_DELAY_SECONDS`, default 0.5 seconds.
- Invalid JSON and missing SDK errors become internal `LLMError` values without a retry in the current client.
- Final provider and timeout failures become fallback recommendation content; the public response remains frontend-safe.
- Logs include provider, configured model name, attempt, duration, status/error code, and redacted error text. API keys are not logged. The frontend does not receive provider diagnostics.

The current local `.env` configures `LLM_MODEL=gemini-3.6-flash`. `GEMINI_API_KEY` is required for a successful call but is intentionally not documented here or exposed in logs. `LLM_PROVIDER` is present in the example file but does not currently select an implementation.

## 9. Latency and performance work completed

The following changes are implemented in the current code:

- `get_service()` is cached with `lru_cache(maxsize=1)`, so `SourceRegistry`, vector storage, fetcher, and clients are not reconstructed for every request in a process.
- The selected opportunity pipelines run concurrently through `asyncio.gather()`.
- The blocking Gemini SDK call is moved to a worker thread with `asyncio.to_thread()`.
- Timing logs cover request receipt, service initialization, Member A HTTP, source fetch, extraction, ingestion, evidence retrieval, LLM calls, opportunity pipelines, response assembly, formatting, and total request time.

Observed verification timings for the current instrumented implementation were:

| Scenario | Observed time |
| --- | ---: |
| Cold request | 3.539 s |
| Warm request | 0.109 s |
| Cold service/vector initialization | 3,033.5 ms |
| Member A request | 197.6 ms |
| Profile/gap analysis | 0.7 ms |
| Opportunity pipelines | 26.6–153.9 ms each in the recorded run |
| Response assembly | 356.1 ms |
| Formatting | 0.7 ms |
| Controlled sequential opportunity benchmark | 1.296 s |
| Controlled concurrent opportunity benchmark | 0.510 s |

These measurements mean cold startup is dominated by initialization, while warm requests benefit from the cached service. The concurrent benchmark showed 0.786 seconds saved in that controlled run. They do not guarantee provider or network latency for every environment.

## 10. Testing and verification

Current verified status:

- `29 passed` with one existing pytest cache warning.
- `python -m compileall -q backend/app ai-rag/app` passed.
- `git diff --check` passed.
- The warning is a `PytestCacheWarning` caused by the existing cache-path creation conflict under `.pytest_cache`; it does not represent an application test failure.

Known operational issues:

- Only one Uvicorn process may own port `8000` and one may own port `8001`. Duplicate startup attempts produce Windows socket error `10048`.
- Gemini may still return transient provider capacity errors such as `503 UNAVAILABLE`; the bounded retry and fallback behavior keeps `/analyze` available when evidence processing succeeds.
- The staging operation was not completed in the restricted environment because writes to `.git/index` were denied. This is a repository-environment limitation, not an application failure.

## 11. Known limitations and improvements needed

### A. Must fix before production

- Replace or supplement the current deterministic `HashEmbeddingService` with a production-quality semantic embedding provider and make provider selection real. The current `EMBEDDING_PROVIDER` setting is documentation/configuration only.
- Verify the Gemini model, quota, capacity, and account configuration in the deployment environment; a valid model ID does not prevent transient capacity failures.
- Tighten Member A CORS from `allow_origins=["*"]` before exposing the system beyond local development.
- Define deployment-level process supervision so exactly one Member A and one Member B instance owns each configured port.
- Decide and implement production observability/retention policies for source registry, Chroma data, logs, and provider failures without exposing them to the frontend.

### B. Recommended next improvements

- Make `LLM_PROVIDER` select an implementation or remove it from the example configuration until it is functional.
- Make `EMBEDDING_PROVIDER` select the configured embedding implementation or update the configuration contract.
- Add explicit health/readiness checks for Member A, source registry, Chroma, and Gemini configuration.
- Add integration tests covering Member A unavailable, source fetch failure, no evidence, Gemini timeout, and provider retry behavior.
- Add explicit frontend/API contract tests for 422 and 503 responses.

### C. Optional future enhancements

- Add a background refresh/indexing workflow rather than doing source ingestion during a user request.
- Add source freshness policies and scheduled re-verification.
- Add richer provider-specific status metrics and trace correlation IDs.
- Add a semantic evaluation set for evidence grounding and explanation quality.

The already-completed service caching, concurrent opportunity processing, thread offload, deadline-null convention, bounded Gemini retry, and runtime `.chroma` ignore rule are not outstanding issues.

## 12. Runbook

Run commands from PowerShell, with dependencies installed in the relevant environment.

### Start Member A

```powershell
Set-Location E:\myvscode\NextStepAI\backend
uvicorn app.main:app --reload --port 8000
```

### Start Member B

Create `ai-rag/.env` from `.env.example`, set the real `GEMINI_API_KEY` locally if Gemini is required, then run:

```powershell
Set-Location E:\myvscode\NextStepAI\ai-rag
uvicorn app.main:app --reload --port 8001
```

Required runtime configuration is:

```text
MEMBER_A_BASE_URL=http://127.0.0.1:8000
GEMINI_API_KEY=<local secret; do not commit>
LLM_MODEL=gemini-3.6-flash
GEMINI_TIMEOUT_SECONDS=30
GEMINI_RETRY_DELAY_SECONDS=0.5
CHROMA_PATH=./.chroma
SOURCE_REGISTRY_PATH=./.source_registry.sqlite3
```

`EMBEDDING_PROVIDER`, `LLM_PROVIDER`, and `OPENAI_API_KEY` are present in the example file but do not change the current startup behavior.

### Check both services

```powershell
Invoke-WebRequest http://127.0.0.1:8000/ | Select-Object StatusCode, Content
Invoke-WebRequest http://127.0.0.1:8001/ | Select-Object StatusCode, Content
Invoke-WebRequest http://127.0.0.1:8000/opportunities/count | Select-Object StatusCode, Content
```

Each health endpoint should return HTTP 200. The opportunity count endpoint confirms that Member A has loaded data.

### Test `/analyze`

```powershell
$body = @{
  gpa_or_percentage = 3.6
  field = 'Computer Science'
  degree_level = 'Masters'
  budget_pkr = 800000
  target_countries = @('Germany')
  career_goals = 'Build machine-learning systems'
  english_test_status = 'IELTS 7.0'
  domicile_province = 'Punjab'
  income_bracket = 'Middle'
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:8001/analyze `
  -ContentType 'application/json' `
  -Body $body
```

### Avoid duplicate Uvicorn processes

Before starting a second instance, verify ownership of the ports:

```powershell
Get-NetTCPConnection -LocalPort 8000,8001 -State Listen -ErrorAction SilentlyContinue |
  Select-Object LocalPort, OwningProcess
```

Do not start another process when the intended server is already listening. If a stale process must be stopped, identify its PID first and stop only that process:

```powershell
Get-Process -Id <PID>
Stop-Process -Id <PID>
```

Use separate terminals for Member A and Member B. Avoid repeated `--reload` launches for the same app while an existing reloader is active.

## 13. Git and push handoff

Implementation intended for version control includes:

- `ai-rag/app/`
- `ai-rag/tests/`
- `ai-rag/requirements.txt`
- `ai-rag/.env.example`
- `ai-rag/README.md`
- `ai-rag/README_HANDOFF.md`
- The corresponding Member A source files and tests required by the branch.

The following must remain ignored or uncommitted:

- `ai-rag/.env` and all API keys/secrets.
- `ai-rag/.chroma/` and other Chroma/vector runtime state.
- `ai-rag/.source_registry.sqlite3` and other local databases.
- `.pytest_cache/`, `__pycache__/`, compiled Python files, virtual environments, and build output.
- Runtime logs such as `*.log`.
- Temporary local files and credentials.

Review the final `git status` and `git diff --check` before pushing. The application implementation is currently present under `ai-rag/app`; runtime-generated state is not part of the deployable source.

## 14. Team handoff summary

### Complete

Member A provides deterministic scholarship matching. Member B provides the two-server `/analyze` pipeline, official-source retrieval, extraction/chunking, local vector retrieval, grounded Gemini explanations with fallback behavior, concurrent opportunity processing, cached initialization, timing instrumentation, and the stable four-section frontend response.

### Frontend needs to integrate

Call `POST http://127.0.0.1:8001/analyze` with the `StudentProfile` body. Render `profile_summary`, eligible `top_scholarships`, `partial_matches`, and `application_roadmap`. Treat missing deadlines and missing partial scores as `null`, and handle 422, 503, timeout, and empty-array states distinctly.

### Backend teammate must preserve

Member A remains authoritative for eligibility, score calculation, and ranking. Member B must not re-score, reinterpret, or override those decisions. The public response must continue to exclude raw evidence, retrieval metadata, chunk IDs, timestamps, internal reasoning, provider errors, prompts, and score breakdowns.

### Improve later

Production semantic embeddings, real provider-selection configuration, stronger readiness/observability, deployment process supervision, source-refresh scheduling, and broader integration/evaluation coverage remain follow-up work.
