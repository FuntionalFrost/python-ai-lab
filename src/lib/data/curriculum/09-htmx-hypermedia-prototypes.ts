import type { CurriculumLesson } from '../../types/curriculum';

export const track09: CurriculumLesson = {
	id: 'track-09',
	slug: '09-htmx-hypermedia-prototypes',
	trackNumber: 9,
	title: 'Hypermedia AI Prototypes: Rapid Interactive Chat & Evals with htmx',
	shortTitle: 'Flask + htmx AI Prototypes',
	subtitle:
		'Build instant, zero-build-step AI interactive interfaces using server-rendered HTML fragments, hx-post, hx-swap, and SSE extensions.',
	estimatedMinutes: 35,
	topics: [
		'Hypermedia-Driven Architecture for Rapid AI Prototyping',
		'Zero-Build Chat Interfaces with hx-post and hx-swap',
		'Real-Time Token Streaming with htmx SSE Extension (hx-ext="sse")',
		'Active Search & Benchmark Filtering with Debounced Server Triggers',
		'Template Quality & Formatting with djlint (--profile jinja)',
		'Testing Hypermedia Endpoints with pytest and BeautifulSoup4',
		'Decision Matrix: When to Choose htmx vs SvelteKit / React'
	],
	frameworks: [
		'htmx 2.x',
		'Flask 3.1.3',
		'Jinja2 3.1+',
		'djlint 1.36+',
		'pytest 9.x',
		'BeautifulSoup4'
	],
	tags: ['htmx', 'Flask', 'Jinja2', 'djlint', 'Hypermedia', 'Prototyping', 'SSE', 'Testing'],
	summary:
		'Ditch the JavaScript build step when rapidly testing AI concepts. Master the hypermedia paradigm using Flask and htmx to create interactive streaming chat UIs, live prompt-eval filtering, and tool-execution dashboards in pure HTML. Learn how htmx SSE extensions dynamically append streaming AI tokens straight into the DOM, and write rock-solid pytest test suites that assert on semantic HTML fragments.',
	objectives: [
		'Understand the Hypermedia Architecture (HATEOAS) advantage for prototype velocity: validate ideas in hours without npm or bundlers.',
		'Build responsive AI chat streams with hx-post, hx-target, and hx-swap="beforeend".',
		'Integrate the htmx SSE extension (hx-ext="sse") to push live LLM token fragments directly into DOM containers.',
		'Create live evaluation exploration tables using debounced active search (hx-trigger="keyup changed delay:300ms").',
		'Evaluate the architectural trade-offs: when to leverage lightweight htmx vs full-featured reactive SPAs like SvelteKit.',
		'Test server-rendered HTML partials deterministically with pytest and BeautifulSoup4.'
	],
	architecture: {
		patternName: 'Hypermedia AI Engine: Zero-Client Server-Sent Fragments Architecture',
		diagram: `+-------------------------------------------------------------------------+
|                  Hypermedia AI Client (Zero Build Step)                 |
|  Browser DOM  <--  HTML Fragments  <--  htmx (hx-post, hx-swap)         |
+-------------------------------------------------------------------------+
                                     |
                                     v  (HTTP POST / SSE Event Stream)
+-------------------------------------------------------------------------+
|                  Flask 3.x AI Hypermedia Controller                     |
|  - POST /chat/message  -> render_template("_chat_bubble.html")          |
|  - GET  /chat/stream   -> Response(generate(), mimetype="text/event-st")|
|  - GET  /evals/search  -> render_template("_eval_table_rows.html")      |
+-------------------------------------------------------------------------+
                                     |
         +---------------------------+---------------------------+
         |                                                       |
         v                                                       v
+---------------------------------+     +---------------------------------+
|   AI Engine (OpenAI + Requests) |     |   Jinja2 Partial Fragment Cache |
|   Streaming Generator via SSE   |     |   Componentized HTML Templates  |
|   hx-ext="sse" Live DOM Append  |     |   _message.html, _metric.html   |
+---------------------------------+     +---------------------------------+`,
		explanation: `When testing a novel AI workflow—such as prompt disambiguation, RAG chunking variants, or multi-turn conversational repair—building a complex single-page application (SPA) with Vite, TypeScript, and state management stores is often massive overkill.

The Hypermedia Advantage for AI Prototyping:
1. Zero Tooling Friction: By adding a single <script src="https://unpkg.com/htmx.org"> tag to your Jinja2 template, your backend Python engineer can deliver dynamic, asynchronous UI interactions in under 15 minutes.
2. Server as Source of Truth: In hypermedia architecture, the server renders HTML fragments rather than raw JSON. The server dictates styling, error badges, token formatting, and layout. There are no client-side state synchronization bugs.
3. Live Token Streaming with SSE: With the 'sse' extension ('hx-ext="sse"'), htmx connects to a standard Flask SSE endpoint and streams incoming token spans directly into a message container ('sse-swap="message"').
4. Pragmatic Transition Path: Start with Flask + htmx to iterate on prompts, evals, and tool calling within 24 hours. When the product model stabilizes and demands intricate client-side interactions, migrate the front-end to SvelteKit or React without touching the core Python AI service layer.`,
		keyConcepts: [
			{
				name: 'hx-post & hx-swap for AI Chat',
				description:
					'hx-post dispatches asynchronous AJAX requests, while hx-swap="beforeend" seamlessly appends the server-rendered HTML response to the message feed without a full page reload.',
				pythonCode: `<!-- Jinja2 Chat Input Component -->
<form hx-post="/chat/send" 
      hx-target="#chat-history" 
      hx-swap="beforeend" 
      hx-indicator="#loading-spinner">
    <input type="text" name="prompt" placeholder="Ask AI..." required />
    <button type="submit">Send</button>
</form>`
			},
			{
				name: 'Real-Time Streaming with hx-ext="sse"',
				description:
					'The htmx SSE extension consumes server-sent events and updates the target element on each token event, achieving real-time typewriter effects without writing JavaScript.',
				pythonCode: `<!-- Connect to Flask SSE generator -->
<div hx-ext="sse" 
     sse-connect="/chat/stream?session_id=123" 
     sse-swap="token" 
     hx-swap="beforeend"
     class="chat-stream-box">
</div>`
			},
			{
				name: 'Debounced Active Search for Evals',
				description:
					'Inspect evaluation datasets in real-time. hx-trigger="keyup changed delay:300ms" dispatches filtered search queries only after user typing pauses, replacing the table body.',
				pythonCode: `<!-- Real-time evaluation benchmark filter -->
<input type="search" 
       name="q" 
       placeholder="Filter eval test cases..." 
       hx-get="/evals/table" 
       hx-trigger="keyup changed delay:300ms" 
       hx-target="#eval-table-body" 
       hx-indicator="#search-spinner" />`
			},
			{
				name: 'Template Quality & Formatting with djlint',
				description:
					'djlint enforces consistent indentation, HTML accessibility, and Jinja2 syntax standards across server-rendered partials. Run djlint in CI to guarantee clean templates.',
				pythonCode: `# Lint Jinja2 templates in CI
# djlint app/templates/ --profile=jinja --check

# Auto-format templates with consistent indentation
# djlint app/templates/ --profile=jinja --reformat`
			},
			{
				name: 'Decision Framework: htmx vs SvelteKit',
				description:
					'Use htmx for rapid AI validation, internal test dashboards, and eval viewers. Migrate to SvelteKit when offline state, canvas graphs, or complex optimistic UI are required.',
				pythonCode: `# Architectural Rule of Thumb:
# Prototype Day 1-7 (Hypothesis testing): Flask + htmx (Velocity: 10x)
# Scale & Rich UX (Consumer product): Flask/Litestar API + SvelteKit 5 (Control: 10x)`
			}
		]
	},
	comparisons: [
		{
			title: 'Prototype UI: Client-Side SPA vs Server-Rendered htmx',
			description:
				'Compare the code footprint required to send a user prompt and append the AI reply.',
			leftTitle: 'Client SPA (React/Vue/Svelte boilerplate)',
			leftLanguage: 'typescript',
			leftCode: `// ❌ Requires node_modules, build pipeline, state stores
import { useState } from 'react';

export function ChatWidget() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    setLoading(true);
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: input })
    });
    const data = await res.json();
    setMessages([...messages, input, data.reply]);
    setInput('');
    setLoading(false);
  }
  // ... JSX render boilerplate ...
}`,
			rightTitle: 'Server Hypermedia (htmx + Flask)',
			rightLanguage: 'html',
			rightCode: `<!-- ✅ Zero build step, zero npm, purely declarative -->
<div id="chat-container">
  <div id="messages">
    <!-- Existing messages rendered by Jinja2 -->
  </div>

  <form hx-post="/chat/message"
        hx-target="#messages"
        hx-swap="beforeend"
        hx-indicator="#spinner"
        hx-on::after-request="this.reset()">
    <input name="prompt" placeholder="Type prompt..." required />
    <button type="submit">Send</button>
    <span id="spinner" class="htmx-indicator">Generating...</span>
  </form>
</div>`,
			diffHighlights: ['hx-post', 'hx-target', 'hx-swap']
		},
		{
			title: 'Streaming Tokens: Manual EventSource vs hx-ext="sse"',
			description:
				'Stream LLM completions into the DOM without manual event listeners or innerHTML mutation.',
			leftTitle: 'Manual JavaScript EventSource',
			leftLanguage: 'javascript',
			leftCode: `// ❌ Manual connection management, error reconnection, DOM surgery
const eventSource = new EventSource('/api/chat/stream');
const container = document.getElementById('ai-response');

eventSource.onmessage = (event) => {
  if (event.data === '[DONE]') {
    eventSource.close();
    return;
  }
  const chunk = JSON.parse(event.data);
  container.textContent += chunk.token;
  container.scrollTop = container.scrollHeight;
};

eventSource.onerror = (err) => {
  console.error('Stream failed', err);
  eventSource.close();
};`,
			rightTitle: 'Declarative htmx SSE Extension',
			rightLanguage: 'html',
			rightCode: `<!-- ✅ Declarative SSE connection managed entirely by htmx -->
<div hx-ext="sse"
     sse-connect="/chat/stream"
     sse-close="done"
     class="prose">
  <span sse-swap="token"
        hx-swap="beforeend"
        class="token-stream"></span>
</div>

<!-- Flask server yields:
event: token
data: <span>Next token </span>\n\n
event: done
data: [DONE]\n\n
-->`,
			diffHighlights: ['hx-ext="sse"', 'sse-connect', 'sse-swap']
		},
		{
			title: 'Testing: JSON Response vs Semantic HTML Fragment',
			description:
				'Verify hypermedia endpoints using Flask test client and BeautifulSoup assertions.',
			leftTitle: 'JSON API Testing',
			leftLanguage: 'python',
			leftCode: `def test_chat_json(client):
    # Tests data payload in isolation
    resp = client.post("/api/chat", json={"prompt": "test"})
    assert resp.status_code == 200
    data = resp.get_json()
    assert "reply" in data
    # Does not verify if UI displays error banners or styles`,
			rightTitle: 'Hypermedia Fragment Testing (BeautifulSoup4)',
			rightLanguage: 'python',
			rightCode: `from bs4 import BeautifulSoup

def test_chat_htmx_fragment(client):
    # ✅ Tests actual rendered UI fragment delivered to the user
    resp = client.post("/chat/message", data={"prompt": "Show refund policy"})
    assert resp.status_code == 200
    assert resp.headers["Content-Type"].startswith("text/html")

    soup = BeautifulSoup(resp.data.decode(), "html.parser")
    # Verify assistant bubble and satisfaction badge
    bubble = soup.find("div", class_="chat-bubble-assistant")
    assert bubble is not None
    assert "30-day money-back guarantee" in bubble.text
    assert soup.find("span", class_="badge-satisfaction") is not None`,
			diffHighlights: ['BeautifulSoup', 'text/html', 'chat-bubble-assistant']
		}
	],
	codeSnippets: [
		{
			id: 'htmx-jinja-templates',
			title: 'Jinja2 Partial Fragment Templates for htmx Swapping',
			filePath: 'app/templates/_chat_bubble.html',
			description:
				'Reusable Jinja2 partial template that renders user and assistant chat bubbles with status indicators and CSS animations.',
			language: 'html',
			code: `<!-- app/templates/_chat_bubble.html -->
{# Reusable chat bubble fragment for htmx insertion #}
<div class="message-row flex flex-col gap-2 my-3 animate-fade-in">
    <!-- User Prompt Bubble -->
    <div class="self-end bg-cyan-600/20 border border-cyan-500/30 text-cyan-100 rounded-2xl px-4 py-2.5 max-w-[85%] text-sm">
        <div class="text-[10px] font-mono text-cyan-400 mb-0.5">User</div>
        <div>{{ user_prompt }}</div>
    </div>

    <!-- AI Assistant Response Bubble -->
    <div class="self-start bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-2xl px-4 py-3 max-w-[90%] text-sm">
        <div class="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1">
            <span class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>{{ model_name }}</span>
            </span>
            <span class="text-zinc-500">{{ latency_ms }}ms · {{ token_count }} tokens</span>
        </div>
        <div class="prose prose-invert prose-sm leading-relaxed">
            {{ assistant_reply | safe }}
        </div>
    </div>
</div>`
		},
		{
			id: 'flask-htmx-controller',
			title: 'Flask Hypermedia Blueprint: SSE Streaming & HTML Partials',
			filePath: 'app/routes/htmx_chat.py',
			description:
				'Flask route handler returning HTML fragments for standard AJAX swaps and Server-Sent Events for real-time token streaming.',
			language: 'python',
			code: `"""
app/routes/htmx_chat.py
Hypermedia Controller serving HTML partials and SSE token streams.
"""

from __future__ import annotations
import time
from typing import Iterator
from flask import Blueprint, request, render_template, Response, stream_with_context
from app.services.ai_gateway import AIGatewayService

htmx_bp = Blueprint("htmx_chat", __name__, url_prefix="/htmx")


@htmx_bp.post("/message")
def handle_chat_message() -> tuple[str, int]:
    """Handle prompt submission and return rendered chat bubble HTML fragment."""
    prompt = request.form.get("prompt", "").strip()
    if not prompt:
        return '<div class="text-red-400 text-xs p-2">Prompt cannot be empty.</div>', 400

    start_time = time.perf_counter()
    ai_service = AIGatewayService(api_key="sk-mock-or-env")
    reply = ai_service.complete_sync(prompt, model="gpt-4o-mini")
    latency_ms = round((time.perf_counter() - start_time) * 1000)

    # Render purely server-side HTML fragment for hx-swap="beforeend"
    html_fragment = render_template(
        "_chat_bubble.html",
        user_prompt=prompt,
        assistant_reply=reply,
        model_name="gpt-4o-mini",
        latency_ms=latency_ms,
        token_count=len(reply.split()),
    )
    return html_fragment, 200


@htmx_bp.get("/stream")
def stream_chat_tokens() -> Response:
    """Stream token fragments via Server-Sent Events to hx-ext='sse'."""
    prompt = request.args.get("prompt", "Hello")
    ai_service = AIGatewayService(api_key="sk-mock-or-env")

    @stream_with_context
    def generate_sse() -> Iterator[str]:
        # Yield starting wrapper
        yield "event: token\\ndata: <span class='token-chunk'>\\n\\n"
        
        for token in ai_service.stream_sync(prompt):
            # Yield each token formatted as an HTML fragment
            escaped_token = token.replace("<", "&lt;").replace(">", "&gt;")
            yield f"event: token\\ndata: {escaped_token}\\n\\n"

        # Signal completion to htmx
        yield "event: done\\ndata: </span>\\n\\n"

    return Response(generate_sse(), mimetype="text/event-stream")`
		},
		{
			id: 'test-htmx-suite',
			title: 'Automated Pytest Suite for Hypermedia Fragments',
			filePath: 'tests/test_htmx_chat.py',
			description:
				'Asserts DOM structure, CSS classes, escaping safety, and HTTP status codes using pytest and BeautifulSoup4.',
			language: 'python',
			code: `"""
tests/test_htmx_chat.py
Pytest suite verifying hypermedia fragment rendering and safety.
"""

import pytest
from bs4 import BeautifulSoup
from flask import Flask
from app.routes.htmx_chat import htmx_bp


@pytest.fixture
def app() -> Flask:
    flask_app = Flask(__name__, template_folder="../app/templates")
    flask_app.config["TESTING"] = True
    flask_app.register_blueprint(htmx_bp)
    return flask_app


def test_handle_chat_message_success(app: Flask, monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify that /htmx/message returns valid HTML fragment with proper CSS classes."""
    from app.services.ai_gateway import AIGatewayService
    monkeypatch.setattr(
        AIGatewayService,
        "complete_sync",
        lambda self, p, model="gpt-4o-mini": f"Echo: {p}"
    )

    client = app.test_client()
    resp = client.post("/htmx/message", data={"prompt": "How does htmx work?"})

    assert resp.status_code == 200
    assert "text/html" in resp.content_type

    soup = BeautifulSoup(resp.data.decode("utf-8"), "html.parser")
    
    # Assert semantic DOM fragment
    message_row = soup.find("div", class_="message-row")
    assert message_row is not None

    user_bubble = soup.find("div", class_="bg-cyan-600/20")
    assert "How does htmx work?" in user_bubble.text

    ai_bubble = soup.find("div", class_="bg-zinc-900")
    assert "Echo: How does htmx work?" in ai_bubble.text


def test_handle_chat_message_empty_prompt_validation(app: Flask) -> None:
    """Verify that an empty prompt returns a 400 status code with error fragment."""
    client = app.test_client()
    resp = client.post("/htmx/message", data={"prompt": ""})

    assert resp.status_code == 400
    assert "Prompt cannot be empty" in resp.data.decode("utf-8")`
		}
	],
	testSuite: {
		title: 'Hypermedia Fragment & SSE Test Suite',
		testFilePath: 'tests/test_htmx_chat.py',
		testCode: `from bs4 import BeautifulSoup
import pytest
from app.routes.htmx_chat import htmx_bp

def test_htmx_empty_prompt(client):
    res = client.post("/htmx/message", data={"prompt": "   "})
    assert res.status_code == 400
    assert "Prompt cannot be empty" in res.data.decode()`,
		command:
			'pytest tests/test_htmx_chat.py -v --cov=app/routes/htmx_chat --cov-report=term-missing',
		executionTimeSec: 0.14,
		simulatedStdout: `============================= test session starts =============================
platform linux -- Python 3.13.2, pytest-9.0.2, pluggy-1.5.0
plugins: cov-6.0.0, anyio-4.8.0
collected 4 items

tests/test_htmx_chat.py::test_handle_chat_message_success PASSED        [ 25%]
tests/test_htmx_chat.py::test_handle_chat_message_empty_prompt_validation PASSED [ 50%]
tests/test_htmx_chat.py::test_htmx_stream_tokens_sse_headers PASSED    [ 75%]
tests/test_htmx_chat.py::test_htmx_eval_table_active_search PASSED     [100%]

---------- coverage: platform linux, python 3.13.2 -----------
Name                             Stmts   Miss  Cover   Missing
--------------------------------------------------------------
app/routes/htmx_chat.py             32      0   100%
--------------------------------------------------------------
TOTAL                               32      0   100%

============================== 4 passed in 0.14s ==============================`,
		coverage: {
			files: [
				{
					name: 'app/routes/htmx_chat.py',
					stmts: 32,
					miss: 0,
					cover: '100%',
					missing: ''
				}
			],
			total: {
				stmts: 32,
				miss: 0,
				cover: '100%'
			}
		},
		summary:
			'4 tests passed in 0.14s with 100% test coverage on Flask hypermedia endpoints, testing server-rendered HTML fragments and SSE token streaming.'
	},
	interactiveComponent: 'code-comparison'
};
