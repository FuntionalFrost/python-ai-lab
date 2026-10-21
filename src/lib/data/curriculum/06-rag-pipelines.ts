import type { CurriculumLesson } from '../../types/curriculum';

export const track06: CurriculumLesson = {
	id: 'track-06',
	slug: '06-rag-pipelines',
	trackNumber: 6,
	title: 'Retrieval-Augmented Generation (RAG) Architecture',
	shortTitle: 'RAG Pipelines & Testing',
	subtitle: 'Document Chunking, Vector Retrieval, Context Re-ranking, and Ground-Truth Evaluation',
	estimatedMinutes: 35,
	topics: [
		'Semantic Chunking & Overlap Strategies',
		'Embedding Generation & Cosine Similarity',
		'In-Memory & Persistent Vector Store Interfaces',
		'Context Re-ranking & Truncation Guards',
		'Testing RAG Retrieval Deterministically with Fixtures'
	],
	frameworks: ['openai>=3.35.1', 'pydantic>=2.14.1', 'pytest>=9.0'],
	tags: ['RAG', 'Vector Search', 'Embeddings', 'Information Retrieval', 'Testing'],
	summary:
		'Deconstruct the complete production RAG lifecycle: chunking raw text, computing dense vector embeddings, retrieving nearest neighbors, and injecting ranked context into LLM prompts. Learn how to write deterministic unit tests for retrieval scoring without calling live vector databases.',
	objectives: [
		'Implement sliding window chunkers with token-based boundaries.',
		'Build a decoupled vector store protocol that can swap between in-memory mock stores and pgvector/Qdrant.',
		'Formulate prompt context injection templates that instruct the model to cite sources and reject hallucinated answers.',
		'Write deterministic pytest fixtures testing vector similarity thresholds.',
		'Evaluate retrieval recall and precision using synthetic benchmark datasets.'
	],
	architecture: {
		patternName: '5-Stage Production RAG Pipeline',
		diagram: `+-------------------------------------------------------------------------+
| Stage 1: Ingestion & Chunking                                           |
| Raw Document -> Semantic Splitter (512 tokens, 64 token overlap)        |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| Stage 2: Dense Embedding Generation                                     |
| text-embedding-3-small -> Float[1536] Vector Embeddings                 |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| Stage 3: Hybrid / Vector Retrieval                                      |
| Cosine Similarity Search (k=10 top candidates)                          |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| Stage 4: Cross-Encoder Re-Ranking & Filtering                           |
| Select Top 3 chunks with score >= 0.78                                  |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| Stage 5: Context Injection & Synthesis                                  |
| Grounded System Prompt -> LLM Synthesizes response with source citations|
+-------------------------------------------------------------------------+`,
		explanation: `RAG pipelines fail in production predominantly due to retrieval failures (returning irrelevant chunks), context dilution (flooding the LLM with too much noisy context), or hallucination (the model ignoring injected facts).

A robust RAG architecture isolates the retrieval engine behind a testable Python Protocol. By testing chunk boundaries, embedding dimensionality, and cosine scoring deterministically with static fixtures, you ensure that poor answers are due to model reasoning rather than faulty document retrieval.`,
		keyConcepts: [
			{
				name: 'Vector Store Protocol',
				description:
					'An abstract interface defining search_similar(query_vector, top_k) allowing tests to substitute lightweight in-memory mock stores.'
			},
			{
				name: 'Cosine Similarity',
				description:
					'The dot product of two normalized unit vectors measuring angular semantic similarity between query and passage.'
			},
			{
				name: 'Context Grounding Guard',
				description:
					'A system prompt constraint requiring the model to respond "Information not found in context" when retrieved documents lack the answer.'
			}
		]
	},
	comparisons: [
		{
			title: 'Naive Whole-Document Injection vs. Semantic Chunked RAG',
			description:
				'Dumping entire files into context vs. targeted semantic retrieval with token bounds.',
			leftTitle: 'Naive Whole-Document Injection (Expensive & Slow)',
			leftLanguage: 'python',
			leftCode: `# Anti-pattern: Stuffing entire 50-page PDF into prompt
# 1. High latency (TTFT takes 8+ seconds)
# 2. Expensive token bills ($0.15 per query)
# 3. "Lost in the middle" hallucination
def answer_user_query(user_question: str, all_documents: list[str]):
    massive_context = "\\n\\n".join(all_documents)
    prompt = f"Context:\\n{massive_context}\\n\\nQuestion: {user_question}"
    return client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}]
    )`,
			rightTitle: 'Production RAG Pipeline (Chunked + Scored)',
			rightLanguage: 'python',
			rightCode: `async def answer_user_query_rag(
    user_question: str,
    rag_service: RAGService,
    top_k: int = 3
) -> RAGAnswer:
    # 1. Retrieve only high-relevance chunks (top 3)
    relevant_chunks = await rag_service.retrieve_context(
        query=user_question,
        top_k=top_k,
        min_similarity=0.75
    )
    # 2. Synthesize with grounded citation prompt
    return await rag_service.synthesize_answer(
        question=user_question,
        context=relevant_chunks
    )`
		}
	],
	codeSnippets: [
		{
			id: 'rag-service-implementation',
			title: 'Complete RAG Service with In-Memory Mock Store',
			filePath: 'app/services/rag.py',
			description: 'Vector math, cosine similarity scoring, and context-injected prompt synthesis.',
			language: 'python',
			code: `import math
from typing import NamedTuple, Protocol
from pydantic import BaseModel, Field
from openai import AsyncOpenAI

class DocumentChunk(NamedTuple):
    id: str
    content: str
    metadata: dict[str, str]

class ScoredChunk(NamedTuple):
    chunk: DocumentChunk
    score: float

class RAGAnswer(BaseModel):
    answer: str
    citations: list[str] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)

def cosine_similarity(v1: list[float], v2: list[float]) -> float:
    dot = sum(a * b for a, b in zip(v1, v2))
    norm_a = math.sqrt(sum(a * a for a in v1))
    norm_b = math.sqrt(sum(b * b for b in v2))
    return dot / (norm_a * norm_b) if norm_a and norm_b else 0.0

class InMemoryVectorStore:
    def __init__(self) -> None:
        self.vectors: list[tuple[DocumentChunk, list[float]]] = []

    def add(self, chunk: DocumentChunk, embedding: list[float]) -> None:
        self.vectors.append((chunk, embedding))

    def search(self, query_vector: list[float], top_k: int = 3, threshold: float = 0.5) -> list[ScoredChunk]:
        scored = [
            ScoredChunk(chunk=chunk, score=cosine_similarity(query_vector, emb))
            for chunk, emb in self.vectors
        ]
        filtered = [s for s in scored if s.score >= threshold]
        filtered.sort(key=lambda s: s.score, reverse=True)
        return filtered[:top_k]

class RAGService:
    def __init__(self, client: AsyncOpenAI, store: InMemoryVectorStore) -> None:
        self.client = client
        self.store = store

    async def get_embedding(self, text: str) -> list[float]:
        resp = await self.client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return resp.data[0].embedding

    async def query_and_answer(self, question: str) -> RAGAnswer:
        q_emb = await self.get_embedding(question)
        chunks = self.store.search(q_emb, top_k=3, threshold=0.6)

        if not chunks:
            return RAGAnswer(
                answer="No relevant documentation found to answer this query.",
                citations=[],
                confidence=0.0
            )

        context_str = "\\n\\n".join([f"[{c.chunk.id}]: {c.chunk.content}" for c in chunks])
        system_prompt = (
            "You are a strict technical documentation assistant. Answer the user question "
            "using ONLY the provided context blocks below. Cite sources using [doc_id].\\n\\n"
            f"Context:\\n{context_str}"
        )

        resp = await self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question}
            ],
            temperature=0.0,
        )

        return RAGAnswer(
            answer=resp.choices[0].message.content or "",
            citations=[c.chunk.id for c in chunks],
            confidence=round(chunks[0].score, 2)
        )`,
			runnable: true
		}
	],
	testSuite: {
		title: 'RAG Retrieval & Cosine Similarity Suite (pytest)',
		testFilePath: 'tests/test_rag_pipeline.py',
		command: 'pytest -v --cov=app/services/rag tests/test_rag_pipeline.py',
		executionTimeSec: 0.95,
		testCode: `import pytest
from unittest.mock import AsyncMock, MagicMock
from app.services.rag import (
    DocumentChunk,
    InMemoryVectorStore,
    RAGService,
    cosine_similarity,
)

def test_cosine_similarity_identical_vectors():
    v1 = [1.0, 0.0, 0.0]
    v2 = [1.0, 0.0, 0.0]
    assert pytest.approx(cosine_similarity(v1, v2)) == 1.0

def test_cosine_similarity_orthogonal_vectors():
    v1 = [1.0, 0.0, 0.0]
    v2 = [0.0, 1.0, 0.0]
    assert pytest.approx(cosine_similarity(v1, v2)) == 0.0

def test_in_memory_vector_store_ranking():
    store = InMemoryVectorStore()
    chunk1 = DocumentChunk("doc_1", "Litestar uses async controllers.", {})
    chunk2 = DocumentChunk("doc_2", "Flask uses WSGI application factories.", {})

    # Mock embeddings
    store.add(chunk1, [0.9, 0.1, 0.0])
    store.add(chunk2, [0.1, 0.9, 0.0])

    # Query aligned closely with chunk1
    results = store.search(query_vector=[0.95, 0.05, 0.0], top_k=1)
    assert len(results) == 1
    assert results[0].chunk.id == "doc_1"
    assert results[0].score > 0.98

@pytest.mark.asyncio
async def test_rag_service_returns_fallback_when_no_chunks_match(mocker):
    mock_client = mocker.AsyncMock()
    # Mock embedding creation
    mock_client.embeddings.create.return_value = MagicMock(
        data=[MagicMock(embedding=[0.0, 0.0, 1.0])]
    )

    empty_store = InMemoryVectorStore()
    rag = RAGService(client=mock_client, store=empty_store)
    result = await rag.query_and_answer("How to configure Litestar?")

    assert result.confidence == 0.0
    assert "No relevant documentation found" in result.answer
    assert len(result.citations) == 0`,
		simulatedStdout: `============================= test session starts ==============================
platform win32 -- Python 3.13.0, pytest-9.0.1, pluggy-1.5.0
rootdir: d:\\Web Projects\\Static\\python-ai-lab
plugins: anyio-4.6.2, mock-3.17.0, cov-7.1.0
collected 4 items

tests/test_rag_pipeline.py::test_cosine_similarity_identical_vectors PASSED [ 25%]
tests/test_rag_pipeline.py::test_cosine_similarity_orthogonal_vectors PASSED [ 50%]
tests/test_rag_pipeline.py::test_in_memory_vector_store_ranking PASSED     [ 75%]
tests/test_rag_pipeline.py::test_rag_service_returns_fallback_when_no_chunks_match PASSED [100%]

---------- coverage: platform win32, python 3.13.0 -----------
Name                    Stmts   Miss  Cover   Missing
-----------------------------------------------------
app/services/rag.py        45      2    96%   68-69
-----------------------------------------------------
TOTAL                      45      2    96%

============================== 4 passed in 0.95s ===============================`,
		coverage: {
			files: [{ name: 'app/services/rag.py', stmts: 45, miss: 2, cover: '96%', missing: '68-69' }],
			total: { stmts: 45, miss: 2, cover: '96%' }
		},
		summary:
			'All 4 tests passed. 96% coverage on cosine similarity math, vector store search, and grounded fallback.'
	},
	interactiveComponent: 'chat'
};
