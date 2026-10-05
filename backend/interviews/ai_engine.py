import os
import json
import re
from typing import Dict, Any, List, Optional

# Try importing Google Generative AI
try:
    import google.generativeai as genai
    HAS_GENAI = True
except ImportError:
    genai = None
    HAS_GENAI = False


def get_gemini_client():
    api_key = (
        os.environ.get('GEMINI_API_KEY')
        or os.environ.get('GOOGLE_API_KEY')
        or ''
    ).strip().strip('"').strip("'")
    if HAS_GENAI and api_key:
        genai.configure(api_key=api_key)
        return genai
    return None


# =====================================================================
# Comprehensive Domain Question Vaults for Dynamic Generation
# =====================================================================

DOMAIN_QUESTION_BANKS = {
    'Full-Stack Engineer': [
        {
            'category': 'System Design & Scalability',
            'question_text': (
                "Design a real-time collaborative document editing system (like Google Docs). "
                "How do you resolve concurrent edits, ensure low-latency sync across multiple geographic regions, "
                "and handle offline conflict reconciliation?"
            ),
            'context_hint': "Consider Operational Transformation (OT) vs CRDTs, WebSocket gateway clustering, Redis pub/sub, and snapshot persistence.",
            'key_criteria': [
                "CRDTs vs Operational Transformation comparison",
                "WebSocket connection management and heartbeat",
                "Distributed cache & Redis pub/sub message broadcast",
                "Conflict resolution and vector clocks / timestamp ordering",
                "Persistent document storage (snapshots + append-only change log)"
            ],
            'model_answer': (
                "A robust architecture employs Conflict-free Replicated Data Types (CRDTs) such as Yjs or Automerge "
                "for commutative conflict resolution without central lock contention. Frontend clients maintain an in-memory document state "
                "and stream delta operations over WebSockets to an edge-routed gateway. Gateway nodes publish diffs to a Redis cluster, "
                "which broadcasts them to sibling nodes. For persistence, deltas are written to an append-only log (e.g. Kafka or PostgreSQL WAL) "
                "with periodic background snapshot compaction stored in S3/PostgreSQL. Disconnected clients replay pending mutations upon reconnection "
                "using vector clocks."
            ),
            'follow_up_drill': "How would you handle a network partition where two users make conflicting formatting changes simultaneously?"
        },
        {
            'category': 'Frontend Architecture & Performance',
            'question_text': (
                "Explain how React's Virtual DOM reconciler and Fiber architecture work under the hood. "
                "What causes unnecessary re-renders in large SPA dashboards, and how do you profile and eliminate them?"
            ),
            'context_hint': "Mention reconciliation diffing algorithm, Fiber linked-list work units, useMemo/useCallback, React 19 compiler/memoization, and browser main thread scheduling.",
            'key_criteria': [
                "Fiber tree nodes and priority-based cooperative multitasking",
                "Reconciliation heuristic assumptions (component types, keys)",
                "Causes of re-renders: prop reference churn, context propagation, state waterfalls",
                "Profiling with React DevTools Flamegraph and performance profiling",
                "Remediation: component splitting, memoization, state colocation, selector patterns"
            ],
            'model_answer': (
                "React's Fiber architecture models component trees as a singly-linked list of Fiber units, allowing work to be paused, "
                "prioritized, and resumed via requestIdleCallback/MessageChannel scheduling. Unnecessary re-renders occur primarily from "
                "unstable object/array references in props, heavy unmemoized parent states, or broad React Context updates. "
                "We diagnose using React Profiler flamegraphs looking for long render bars. Solutions include splitting monolithic states, "
                "colocating local state close to consumers, wrapping expensive computations in useMemo, stabilizing callbacks with useCallback, "
                "and utilizing fine-grained state libraries (like Zustand) or Context selector patterns."
            ),
            'follow_up_drill': "What are the trade-offs of using useMemo everywhere vs letting React do its standard diffing pass?"
        },
        {
            'category': 'Backend APIs & Data Consistency',
            'question_text': (
                "Suppose you have a high-throughput payment processing API. How do you design it for strict idempotency, "
                "preventing double charges even in the event of client retries, network timeouts, or worker crashes?"
            ),
            'context_hint': "Discuss Idempotency-Key headers, atomic distributed locks, database unique constraints, state machines, and webhook delivery guarantees.",
            'key_criteria': [
                "Client-provided Idempotency-Key header stored with request fingerprint (hash of payload)",
                "Atomic check-and-set lock via Redis or database transaction with serializable isolation",
                "Payment state machine (INITIATED -> PROCESSING -> SUCCEEDED / FAILED)",
                "Cached response return for repeated identical keys",
                "Expiry TTL and error handling when concurrent requests arrive with the same key"
            ],
            'model_answer': (
                "We enforce idempotency by requiring an Idempotency-Key header on mutation requests. Upon receipt, a SHA-256 hash of the payload "
                "and key is checked atomically against a Redis cache with SETNX. If a record exists in 'PROCESSING' state, subsequent requests "
                "receive HTTP 409 or wait with backoff. If 'SUCCEEDED', the cached response payload is immediately returned. In the database, "
                "an idempotency record with a unique constraint guarantees that even across multiple distributed workers, only one transaction commits. "
                "The payment transition follows a strict state machine with outbox-pattern events for external payment gateways."
            ),
            'follow_up_drill': "What happens if the payment provider processes the charge, but your backend crashes before recording the success?"
        },
        {
            'category': 'Database Design & Optimization',
            'question_text': (
                "In PostgreSQL, how do B-Tree indexes work, and when would an index scan turn into a sequential scan? "
                "How do composite indexes leverage the leftmost prefix rule, and how do you resolve N+1 query patterns?"
            ),
            'context_hint': "Explain index traversal, EXPLAIN ANALYZE, selectivity/cardinality, composite column order, and Django select_related / prefetch_related.",
            'key_criteria': [
                "B-tree depth, page lookups, and pointer retrieval",
                "Why query planner chooses Seq Scan: low table cardinality or low column selectivity (>10-20% rows matched)",
                "Composite index ordering (leftmost prefix rule)",
                "N+1 query problem and resolution via JOINs (select_related) or IN queries (prefetch_related)",
                "EXPLAIN (ANALYZE, BUFFERS) interpretation"
            ],
            'model_answer': (
                "PostgreSQL B-Tree indexes maintain a balanced multi-way search tree where leaf pages store sorted index keys and tuple IDs (TIDs). "
                "The planner chooses a sequential scan when the table has few pages or when an index scan would require reading a high percentage "
                "of table pages (>15-20%), making random I/O slower than sequential read-ahead. For composite indexes on (A, B), searches on A or (A, B) "
                "utilize the index, but queries filtering only on B cannot traverse the root. N+1 queries occur when an ORM issues one query for a parent list "
                "and N subsequent queries for related foreign keys; in Django, select_related executes SQL INNER/LEFT JOINs for single foreign keys, while "
                "prefetch_related executes a batched 'WHERE id IN (...)' query for M2M or reverse relationships."
            ),
            'follow_up_drill': "Under what circumstances would an index on a boolean column actually be useful?"
        },
        {
            'category': 'Behavioral & Engineering Leadership (STAR)',
            'question_text': (
                "Tell me about a time you faced a severe production incident or high-priority bug right before a release deadline. "
                "Describe the Situation, the Task, the Action you took to mitigate and diagnose it, and the Result."
            ),
            'context_hint': "Structure your answer using the STAR methodology: Situation, Task, Action, and Result with quantifiable impact.",
            'key_criteria': [
                "Clear STAR structure (Situation, Task, Action, Result)",
                "Calm incident triage: communication, containment/rollback before root-cause deep dive",
                "Technical investigation: log aggregation, metrics, bisecting commits",
                "Post-incident blameless post-mortem and permanent preventative safeguards",
                "Quantifiable outcome (downtime reduced, tests added, zero customer data lost)"
            ],
            'model_answer': (
                "Situation: 48 hours before an enterprise client onboarding release, our checkout service experienced a sudden spike in 504 gateway timeouts under staging load. "
                "Task: As lead engineer, my task was to stabilize the pipeline, isolate the regression, and ensure zero customer disruption without pushing past the hard SLA. "
                "Action: I instituted an incident war room, assigned one teammate to communicate status updates, and immediately rolled back the staging deployment to the last known stable SHA. "
                "Examining distributed traces in Datadog revealed an unindexed database query in a newly merged coupon validator triggering table locks. I authored a database migration adding a partial composite index, wrote automated regression tests, and verified load resilience at 3x peak traffic. "
                "Result: We recovered normal p99 latencies within 45 minutes, shipped the release on time with 100% availability, and introduced an automated PR lint check flagging unindexed foreign key lookups."
            ),
            'follow_up_drill': "What safeguards did you implement in CI/CD to ensure an unindexed query never reaches production again?"
        }
    ],

    'Backend Python / Django': [
        {
            'category': 'Python Internals & Asynchronous Architecture',
            'question_text': (
                "Explain the Global Interpreter Lock (GIL) in CPython. How does it impact CPU-bound vs I/O-bound tasks, "
                "and how do you leverage multiprocessing, asyncio, or Celery to achieve high concurrency in Python backends?"
            ),
            'context_hint': "Discuss mutex synchronization, thread switching, asyncio event loop, multiprocessing vs multithreading, and distributed task queues.",
            'key_criteria': [
                "CPython GIL prevents simultaneous multi-core execution of Python bytecode across OS threads",
                "I/O-bound tasks release the GIL during syscalls (socket, disk), making threading/asyncio highly effective",
                "CPU-bound tasks require multiprocessing (os.fork/spawn) or C-extensions to achieve true multi-core parallelism",
                "Asyncio single-threaded cooperative multitasking event loop",
                "Celery/Redis background worker architecture for offloading compute and slow network tasks"
            ],
            'model_answer': (
                "The CPython GIL is a mutual exclusion lock protecting internal memory management and reference counting from race conditions. "
                "Because of this, standard Python threads cannot execute bytecode concurrently across multiple CPU cores. For I/O-bound operations "
                "(HTTP calls, DB queries), the thread releases the GIL while waiting on kernel I/O, allowing threading or asyncio's cooperative event loop "
                "to handle tens of thousands of concurrent connections efficiently. For CPU-bound tasks (image processing, data crunching), we use the "
                "multiprocessing module to spawn separate Python processes with distinct memory spaces and GILs, or offload jobs asynchronously to distributed "
                "task workers like Celery backed by Redis or RabbitMQ."
            ),
            'follow_up_drill': "What is the status of the no-GIL initiative in recent Python versions (PEP 703) and how does it change thread safety?"
        },
        {
            'category': 'Django ORM & Database Performance',
            'question_text': (
                "How does the Django ORM translate QuerySets into SQL? What are the key differences between select_related and prefetch_related, "
                "and how do you handle database connection pooling and transaction atomic blocks under high concurrent traffic?"
            ),
            'context_hint': "Explain lazy evaluation, SQL JOINs, IN clauses, transaction.atomic(), pgBouncer connection pooling, and select_for_update.",
            'key_criteria': [
                "Lazy evaluation: QuerySets do not hit the database until evaluated (iteration, len, slicing, bool)",
                "select_related uses SQL JOIN for ForeignKey/OneToOne",
                "prefetch_related executes separate queries with WHERE id IN (...) for ManyToMany/reverse relations",
                "transaction.atomic() context managers, savepoints, and select_for_update row-level locking",
                "Connection pooling using pgBouncer or persistent DB connections (CONN_MAX_AGE)"
            ],
            'model_answer': (
                "Django QuerySets are lazy; SQL queries are only generated and executed upon iteration, slicing, or caching methods. "
                "select_related works by constructing SQL JOINs, which is ideal for single-valued relationships (ForeignKey, OneToOne). "
                "prefetch_related does separate queries and performs in-Python joining, which is required for multi-valued relations (ManyToMany, reverse FK). "
                "Under high concurrency, transaction.atomic() wraps code in BEGIN/COMMIT or SAVEPOINT blocks; to prevent race conditions on shared counters "
                "we combine this with select_for_update() row locking or F() expressions. For connection management, setting CONN_MAX_AGE keeps TCP sockets alive, "
                "and deploying pgBouncer in transaction pooling mode prevents connection exhaustion on PostgreSQL."
            ),
            'follow_up_drill': "What happens if an unhandled exception occurs inside a nested transaction.atomic() block?"
        },
        {
            'category': 'System Design: Distributed Rate Limiter',
            'question_text': (
                "Design a distributed rate limiter for a public API gateway. Compare the Token Bucket, Leaky Bucket, and Sliding Window Counter algorithms. "
                "How do you implement sliding window rate limiting across a cluster using Redis?"
            ),
            'context_hint': "Discuss Redis sorted sets (ZADD, ZREMRANGEBYSCORE, ZCARD), atomic Lua scripts, clock synchronization, and HTTP 429 Retry-After headers.",
            'key_criteria': [
                "Algorithm comparison: Token Bucket, Leaky Bucket, Fixed Window, Sliding Window Log/Counter",
                "Sliding window implementation using Redis Sorted Sets (timestamps as scores)",
                "Atomic execution using Redis EVAL with Lua script to avoid race conditions",
                "Memory efficiency trade-offs of sorted sets vs sliding window counters",
                "Proper response headers (X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After)"
            ],
            'model_answer': (
                "The Sliding Window Counter balances accuracy and memory. In Redis, a Sliding Window Log uses a Sorted Set per candidate key (IP or API key). "
                "When a request arrives, we execute an atomic Lua script: 1) ZREMRANGEBYSCORE to prune timestamps older than (now - window_size), "
                "2) ZCARD to count requests in the current window, 3) If count < limit, ZADD current timestamp and set TTL, allowing the request; otherwise deny with HTTP 429. "
                "To optimize memory under millions of users, we use a hybrid Sliding Window Counter dividing time into discrete sub-buckets (e.g. 1-second chunks in Redis hashes) "
                "and calculating an interpolated count: current_window_count + previous_window_count * (1 - time_into_current_window)."
            ),
            'follow_up_drill': "How do you handle Redis cluster outages so that the rate limiter does not bring down the entire API gateway?"
        },
        {
            'category': 'API Security, Authentication & Microservices',
            'question_text': (
                "How do you design a secure stateless token authentication system (JWT vs Session-based)? "
                "How do you handle token revocation, refresh token rotation, and protect against CSRF and XSS attacks?"
            ),
            'context_hint': "Mention HTTP-only SameSite cookies, JWT signature verification (RS256 vs HS256), refresh token families, and blacklisting in Redis.",
            'key_criteria': [
                "JWT structure (header, payload, signature) and stateless verification",
                "XSS protection: HttpOnly, Secure cookies; avoiding localStorage for sensitive tokens",
                "CSRF mitigation: SameSite=Lax/Strict cookies and Anti-CSRF token headers",
                "Token revocation strategies: short-lived access tokens (15m) + revocable refresh tokens in database/Redis",
                "Refresh token rotation with reuse detection to invalidate compromised token families"
            ],
            'model_answer': (
                "Stateless JWTs eliminate database lookups for authorization by embedding cryptographic signatures (preferably asymmetric RS256). "
                "However, true statelessness makes immediate token revocation difficult. The industry standard pattern pairs short-lived access tokens (5-15 mins) "
                "stored in memory with long-lived refresh tokens stored in HttpOnly, Secure, SameSite=Strict cookies to protect against XSS and CSRF. "
                "Refresh tokens use automatic rotation: every time a new access token is issued, a new refresh token replaces the old one. If an already-used refresh "
                "token is submitted, the system flags a breach and invalidates the entire token family. For emergency revocations, a Redis-based blacklist tracks "
                "revoked user IDs or JTI claims."
            ),
            'follow_up_drill': "Why is storing JWT access tokens in localStorage considered dangerous, and what attack vector does it open?"
        },
        {
            'category': 'Behavioral & Engineering Incident Management',
            'question_text': (
                "Describe a situation where you had a disagreement with a team member or architect regarding technical design. "
                "How did you navigate the discussion, evaluate the alternatives, and arrive at a consensus?"
            ),
            'context_hint': "Focus on data-driven decision making, RFC/design docs, prototyping benchmarks, and disagree-and-commit principles.",
            'key_criteria': [
                "Clear professional conflict context (framework choice, architecture approach, database schema)",
                "Separation of ego from engineering: focus on objective requirements and SLAs",
                "Techniques used: written Design Docs/RFCs, empirical benchmarking, POC prototyping",
                "Willingness to listen, compromise, and align with team goals",
                "Long-term outcome and team relationship strengthening"
            ],
            'model_answer': (
                "Situation: On a data ingestion project, an architect favored using MongoDB for schema flexibility, while I argued for PostgreSQL with JSONB columns "
                "because our downstream reporting required strict relational joins with our existing user accounts. "
                "Task: My goal was to avoid an architectural split and technical debt without causing friction or stalling the sprint deadline. "
                "Action: Instead of debating opinions, I created a short RFC detailing our 12-month requirements: throughput, query patterns, and maintenance overhead. "
                "I built a rapid proof-of-concept benchmarking both databases on 500k synthetic event payloads. The benchmark proved that PostgreSQL JSONB with GIN indexes "
                "matched MongoDB's write performance while enabling ACID transactions for financial ledger balances. "
                "Result: We reviewed the data in our architectural forum, and the architect agreed with PostgreSQL. We launched smoothly, saving significant operational overhead."
            ),
            'follow_up_drill': "What would you have done if the team decided to move forward with MongoDB despite your benchmark findings?"
        }
    ],

    'System Design & Architecture': [
        {
            'category': 'Distributed Systems & Data Sharding',
            'question_text': (
                "Design a globally distributed URL shortener (like TinyURL / Bitly) handling 100M new URLs per day and 10B reads per month. "
                "Cover hash generation, collision resolution, database sharding, caching, and analytics tracking."
            ),
            'context_hint': "Calculate QPS, base62 encoding vs token generation service (ZooKeeper), consistent hashing, 80/20 caching rule, and Kafka clickstream pipeline.",
            'key_criteria': [
                "Capacity estimation (writes QPS ~1200/s, reads QPS ~4000/s, storage calculation)",
                "Short hash generation: Base62 encoding of 64-bit unique IDs vs MD5 truncation",
                "Distributed ID generator (Snowflake or ZooKeeper range coordinator)",
                "Database selection (NoSQL key-value like Cassandra or DynamoDB) and sharding key",
                "Multi-layer caching (CDN + Redis) following the 80/20 Pareto principle"
            ],
            'model_answer': (
                "At 100M writes/day, write QPS is ~1,160 writes/sec; 10B reads/month is ~3,850 reads/sec. "
                "For hash generation, we avoid MD5 collision retries by generating unique 64-bit integers using a distributed ID generator (Twitter Snowflake "
                "or ZooKeeper allocating ID ranges to app servers) and converting that integer to a Base62 string (a-z, A-Z, 0-9), yielding 7-character URLs "
                "capable of supporting 3.5 trillion unique mappings. We store mappings in DynamoDB or Cassandra with the short_hash as the partition key. "
                "Because reads dominate writes (3:1 ratio), we cache the top 20% most active URLs in a distributed Redis cluster using LRU eviction, achieving "
                "a 90%+ cache hit rate. Analytics clicks are asynchronously published to Kafka and consumed by an Apache Flink pipeline writing to ClickHouse."
            ),
            'follow_up_drill': "How do you ensure hot URLs (e.g. from viral Twitter tweets) do not overwhelm a single Redis cache node?"
        },
        {
            'category': 'Event-Driven Architecture & Message Brokers',
            'question_text': (
                "Compare Apache Kafka, RabbitMQ, and AWS SQS. When would you choose an append-only commit log over a message queue? "
                "How do you achieve exactly-once processing semantics across distributed microservices?"
            ),
            'context_hint': "Explain log-based streaming vs queue-based broker, partition ordering, consumer groups, transactional outbox pattern, and idempotent consumers.",
            'key_criteria': [
                "Kafka: distributed append-only partitioned log with replayability and consumer offset tracking",
                "RabbitMQ: AMQP broker with smart broker/dumb consumer routing, ack-based message removal",
                "Partition-level ordering vs total ordering",
                "Transactional Outbox Pattern with Debezium/CDC to prevent dual-write bugs",
                "Idempotent consumer keys and two-phase commit / saga orchestrations"
            ],
            'model_answer': (
                "RabbitMQ is an AMQP broker where messages are discarded once acknowledged, making it ideal for transient job queues and complex header/topic routing. "
                "Kafka is a distributed commit log where immutable events persist on disk, enabling multiple independent consumer groups to replay history and process at their own pace. "
                "Kafka provides total ordering only within a partition, based on the message key. True 'exactly-once' across independent systems is mathematically impossible "
                "under network partitions; however, we achieve practical exactly-once processing through 'at-least-once delivery plus idempotent consumption'. "
                "We use the Transactional Outbox Pattern to commit domain entities and outbox events in a single database transaction, emit via CDC (Debezium) to Kafka, "
                "and have consumers record unique message IDs in their datastore before applying state changes."
            ),
            'follow_up_drill': "What is the difference between a Saga Choreography and a Saga Orchestrator pattern in distributed transactions?"
        }
    ],

    'Behavioral & STAR Leadership': [
        {
            'category': 'Behavioral STAR: Handling Project Failure & Ownership',
            'question_text': (
                "Describe a project or technical initiative you worked on that did not go according to plan or failed. "
                "What were the root causes, what was your personal responsibility, and what did you learn that changed your future approach?"
            ),
            'context_hint': "Authentic vulnerability, objective root-cause analysis, personal accountability, and positive growth mindset.",
            'key_criteria': [
                "Honest description of a genuine setback or miscalculation",
                "Taking ownership without deflecting blame to colleagues or tools",
                "Diagnosis of what was missing (early scoping, customer feedback, load testing)",
                "Action taken to remediate and salvage business value",
                "Systemic improvements incorporated into subsequent projects"
            ],
            'model_answer': (
                "Situation: Early in my career, I led the migration of a legacy search feature to an Elasticsearch cluster. "
                "Task: The goal was to reduce search latency from 800ms to under 50ms for 200,000 active users. "
                "Action: While the search queries were blazingly fast in staging, upon launching in production during Black Friday, the cluster ran out of JVM heap memory "
                "and collapsed. My root mistake was failing to stress-test with production-scale re-indexing payloads while concurrent queries were hitting the nodes. "
                "I took full accountability, rolled our traffic back to the cached fallback database, and spent 24 hours reconfiguring JVM garbage collection, shard sizes, "
                "and establishing index lifecycle management (ILM). "
                "Result: We relaunched with dedicated query and master nodes, achieving 35ms latency. Crucially, I instituted a mandatory production-scale load testing gate in CI "
                "and authored our team's cluster sizing guideline, which prevented similar incidents on three subsequent migrations."
            ),
            'follow_up_drill': "How do you decide when to pull the plug on a failing technical initiative rather than continuing to invest effort?"
        }
    ]
}


# =====================================================================
# Dynamic Question Generation Engine
# =====================================================================

def generate_interview_questions(
    role: str = 'Full-Stack Engineer',
    target_company: str = 'FAANG / Tier-1 Tech',
    difficulty: str = 'medium',
    resume_data: Optional[Dict[str, Any]] = None,
    count: int = 5
) -> List[Dict[str, Any]]:
    """
    Generates a personalized, structured interview question set.
    Attempts to use Gemini AI if API key is configured; otherwise uses
    calibrated multi-domain dynamic banks with resume contextualization.
    """
    gemini = get_gemini_client()

    # If Gemini is configured, attempt intelligent generation
    if gemini:
        try:
            questions = _generate_with_gemini(gemini, role, target_company, difficulty, resume_data, count)
            if questions and len(questions) >= count:
                return questions[:count]
        except Exception as e:
            print(f"[AIEngine] Gemini generation fallback triggered due to: {e}")

    # Built-in Calibrated Question Generator (Zero API key dependency)
    return _generate_calibrated_questions(role, target_company, difficulty, resume_data, count)


def _generate_with_gemini(
    gemini,
    role: str,
    target_company: str,
    difficulty: str,
    resume_data: Optional[Dict[str, Any]],
    count: int
) -> List[Dict[str, Any]]:
    """Invokes Google Gemini model for custom question generation."""
    model = gemini.GenerativeModel('gemini-1.5-flash')

    resume_context = ""
    if resume_data:
        skills = ", ".join(resume_data.get('skills', [])[:10])
        projects = " | ".join(resume_data.get('projects', [])[:3])
        experience = " | ".join(resume_data.get('experience', [])[:2])
        resume_context = f"""
Candidate Resume Profile:
- Skills: {skills}
- Projects: {projects}
- Experience: {experience}
        """

    prompt = f"""
You are an expert Staff Engineering Interviewer at {target_company} conducting a rigorous mock interview for a {difficulty.upper()} {role}.
{resume_context}

Generate exactly {count} progressive interview questions structured as JSON.
Format the output as a valid JSON array of objects with the following schema:
[
  {{
    "category": "System Design & Architecture | Core CS & Logic | Framework Deep-Dive | Behavioral STAR | Resume Project Drill",
    "question_text": "Detailed interview question...",
    "context_hint": "Guidance on key concepts to address...",
    "key_criteria": ["Criteria 1", "Criteria 2", "Criteria 3", "Criteria 4"],
    "model_answer": "Benchmark high-scoring answer demonstrating senior engineer caliber...",
    "follow_up_drill": "Probing follow-up question..."
  }}
]

Make at least one question specifically test a project or skill from the candidate's resume (if provided).
Return ONLY the raw JSON array without markdown formatting.
"""
    response = model.generate_content(prompt)
    raw_text = response.text.strip()
    # Strip backticks if present
    if raw_text.startswith('```'):
        raw_text = re.sub(r'^```(?:json)?\s*', '', raw_text)
        raw_text = re.sub(r'\s*```$', '', raw_text)

    parsed = json.loads(raw_text)
    if isinstance(parsed, list):
        return parsed
    return []


def _generate_calibrated_questions(
    role: str,
    target_company: str,
    difficulty: str,
    resume_data: Optional[Dict[str, Any]],
    count: int
) -> List[Dict[str, Any]]:
    """Generates calibrated questions dynamically using curated domain banks and resume metadata."""
    # Find matching bank or fallback to Full-Stack
    matched_bank = DOMAIN_QUESTION_BANKS.get(role)
    if not matched_bank:
        for k in DOMAIN_QUESTION_BANKS:
            if k.lower() in role.lower() or role.lower() in k.lower():
                matched_bank = DOMAIN_QUESTION_BANKS[k]
                break
    if not matched_bank:
        matched_bank = DOMAIN_QUESTION_BANKS['Full-Stack Engineer']

    questions: List[Dict[str, Any]] = []

    # If resume contains projects or skills, generate a personalized resume deep-dive question!
    if resume_data:
        skills = resume_data.get('skills', [])
        projects = resume_data.get('projects', [])
        featured_skill = skills[0] if skills else "Distributed Architecture"
        featured_proj = projects[0] if projects else "high-traffic web application"

        resume_q = {
            'category': 'Resume Project Deep-Dive & Architecture',
            'question_text': (
                f"I noticed in your background that you worked on {featured_proj} and specialize in {featured_skill}. "
                f"Can you walk me through the end-to-end architecture of this system? What was the single biggest "
                f"performance bottleneck or trade-off you encountered, and how did you resolve it?"
            ),
            'context_hint': (
                f"Focus on architecture decisions involving {featured_skill}, quantifiable metrics, and trade-offs made."
            ),
            'key_criteria': [
                "Clear high-level architectural diagram explanation (data flow, protocols, state)",
                f"Justification for selecting {featured_skill} over alternatives",
                "Deep dive into a concrete bottleneck (memory leak, DB lock contention, network latency)",
                "Quantifiable before-and-after outcome"
            ],
            'model_answer': (
                f"In this project, we designed a decoupled architecture leveraging {featured_skill} for the primary processing tier. "
                "Our core bottleneck was unexpected connection saturation on the database during peak traffic spikes. "
                "We mitigated this by introducing an async worker queue for non-critical telemetry, adding connection pooling with pgBouncer, "
                "and caching serialized payloads in Redis with a 5-minute TTL. This reduced p95 latency from 680ms to 42ms and stabilized throughput."
            ),
            'follow_up_drill': f"If your system traffic increased by 10x tomorrow, what component of {featured_proj} would break first?"
        }
        questions.append(resume_q)

    # Add questions from bank
    for q in matched_bank:
        if len(questions) >= count:
            break
        questions.append(dict(q))

    # If we still need more questions, borrow from other banks
    for bank_name, bank_questions in DOMAIN_QUESTION_BANKS.items():
        if len(questions) >= count:
            break
        for q in bank_questions:
            if len(questions) >= count:
                break
            if q['question_text'] not in [item['question_text'] for item in questions]:
                questions.append(dict(q))

    return questions[:count]


# =====================================================================
# Intelligent Answer Evaluation Engine
# =====================================================================

def evaluate_interview_answer(
    question_data: Dict[str, Any],
    candidate_answer: str,
    role: str = 'Full-Stack Engineer',
    difficulty: str = 'medium'
) -> Dict[str, Any]:
    """
    Evaluates candidate's answer with granular rubric scoring, strengths,
    gaps, model answer, and follow-up drill.
    """
    cleaned_answer = (candidate_answer or '').strip()

    if not cleaned_answer or len(cleaned_answer) < 15:
        return {
            'score': 15.0,
            'accuracy_score': 10.0,
            'clarity_score': 20.0,
            'depth_score': 15.0,
            'rubric_feedback': "Your response was too brief or incomplete to thoroughly demonstrate technical competency. In technical interviews, interviewers expect structured explanations, architectural justifications, and discussion of edge cases.",
            'strengths': ["Attempted the question"],
            'gaps': ["Lacks technical detail, architecture explanations, or trade-off analysis", "Answer was under the minimum expected depth"],
            'model_answer': question_data.get('model_answer', ''),
            'follow_up_drill': question_data.get('follow_up_drill', 'Can you elaborate on your architectural approach?')
        }

    gemini = get_gemini_client()
    if gemini:
        try:
            ai_eval = _evaluate_with_gemini(gemini, question_data, cleaned_answer, role, difficulty)
            if ai_eval:
                return ai_eval
        except Exception as e:
            print(f"[AIEngine] Gemini answer evaluation fallback triggered: {e}")

    # Built-in Heuristic Semantic Evaluator
    return _evaluate_heuristic(question_data, cleaned_answer, difficulty)


def _evaluate_with_gemini(
    gemini,
    question_data: Dict[str, Any],
    candidate_answer: str,
    role: str,
    difficulty: str
) -> Dict[str, Any]:
    """Evaluates answer using Google Gemini."""
    model = gemini.GenerativeModel('gemini-1.5-flash')

    prompt = f"""
You are an exacting Principal Engineering Interviewer evaluating a candidate's answer for a {difficulty.upper()} {role} position.

Question:
{question_data.get('question_text', '')}

Expected Criteria:
{json.dumps(question_data.get('key_criteria', []))}

Candidate's Answer:
\"\"\"{candidate_answer}\"\"\"

Provide an objective, constructive evaluation structured strictly as JSON:
{{
  "score": <float between 0 and 100>,
  "accuracy_score": <float between 0 and 100>,
  "clarity_score": <float between 0 and 100>,
  "depth_score": <float between 0 and 100>,
  "rubric_feedback": "<2-3 paragraph insightful assessment of reasoning, technical precision, and communication>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "gaps": ["<omission or trade-off not mentioned 1>", "<omission 2>"],
  "model_answer": "<ideal senior-level answer>",
  "follow_up_drill": "<sharp follow-up drill question>"
}}

Return ONLY valid JSON.
"""
    response = model.generate_content(prompt)
    raw_text = response.text.strip()
    if raw_text.startswith('```'):
        raw_text = re.sub(r'^```(?:json)?\s*', '', raw_text)
        raw_text = re.sub(r'\s*```$', '', raw_text)

    return json.loads(raw_text)


def _evaluate_heuristic(
    question_data: Dict[str, Any],
    candidate_answer: str,
    difficulty: str
) -> Dict[str, Any]:
    """
    Deterministic rubric evaluation analyzing technical coverage,
    terminology, structure, and depth.
    """
    lower_ans = candidate_answer.lower()
    words = lower_ans.split()
    word_count = len(words)

    key_criteria = question_data.get('key_criteria', [])
    model_answer = question_data.get('model_answer', '')
    follow_up = question_data.get('follow_up_drill', 'Can you discuss alternative approaches?')

    # Check criteria matches
    matched_criteria = []
    unmatched_criteria = []

    for criterion in key_criteria:
        # Extract keywords from criterion
        keywords = [w.lower() for w in re.findall(r'[a-zA-Z]{3,}', criterion)]
        matches = sum(1 for kw in keywords if kw in lower_ans)
        if matches >= max(1, len(keywords) // 3):
            matched_criteria.append(criterion)
        else:
            unmatched_criteria.append(criterion)

    criteria_ratio = len(matched_criteria) / max(1, len(key_criteria))

    # Assess Technical Keywords
    tech_keywords = [
        'latency', 'throughput', 'caching', 'redis', 'trade-off', 'tradeoff', 'scale', 'scaling',
        'database', 'partition', 'index', 'lock', 'concurrency', 'async', 'event', 'queue',
        'kafka', 'transaction', 'acid', 'consistency', 'idempotent', 'idempotency', 'metric',
        'benchmark', 'failure', 'recovery', 'failover', 'bottleneck', 'load balancer', 'sharding',
        'situation', 'task', 'action', 'result', 'test', 'security', 'token', 'ssl', 'circuit breaker'
    ]
    matched_tech = [kw for kw in tech_keywords if kw in lower_ans]
    tech_depth_score = min(100.0, (len(matched_tech) / 8.0) * 100.0)

    # Length & Structure Scoring
    if word_count < 25:
        length_multiplier = 0.70
    elif word_count < 60:
        length_multiplier = 0.88
    else:
        length_multiplier = 1.0

    # Calculate sub-scores
    base_tech = (tech_depth_score * 0.4 + criteria_ratio * 60.0)
    accuracy = round(min(100.0, max(35.0, base_tech * length_multiplier)), 1)
    clarity = round(min(100.0, max(45.0, (75.0 if word_count >= 40 else 55.0) + (15.0 if '.' in candidate_answer else 0.0))), 1)
    depth = round(min(100.0, max(35.0, (tech_depth_score * 0.65 + criteria_ratio * 35.0) * length_multiplier)), 1)

    overall = round((accuracy * 0.45 + clarity * 0.25 + depth * 0.30), 1)

    # Strengths synthesis
    strengths = []
    if matched_criteria:
        strengths.append(f"Successfully addressed core principles: {matched_criteria[0][:60]}...")
    if matched_tech:
        strengths.append(f"Used strong engineering vocabulary: {', '.join(matched_tech[:4])}")
    if word_count >= 80:
        strengths.append("Provided a well-elaborated response with sufficient context.")
    if not strengths:
        strengths.append("Demonstrated foundational familiarity with the problem domain.")

    # Gaps synthesis
    gaps = []
    if unmatched_criteria:
        for c in unmatched_criteria[:2]:
            gaps.append(f"Could elaborate more on: {c}")
    if tech_depth_score < 50:
        gaps.append("Include more concrete system metrics (e.g. p99 latencies, cache hit ratios, throughput limits).")
    if word_count < 80:
        gaps.append("Elaborate further on failure modes, error handling, and recovery strategies.")
    if not gaps:
        gaps.append("Consider detailing long-term operational monitoring and automated telemetry.")

    # Feedback paragraph
    verdict_text = "demonstrated strong technical fluency" if overall >= 75 else "provided a solid baseline that would benefit from greater architectural depth"
    rubric_feedback = (
        f"The candidate's response {verdict_text}. "
        f"You addressed {len(matched_criteria)} of {len(key_criteria)} primary evaluation targets. "
        f"Communication was clear with good vocabulary ({len(matched_tech)} key engineering concepts noted). "
        f"To elevate this answer to staff engineer bar, explicitly state architectural trade-offs and disaster recovery plans."
    )

    return {
        'score': overall,
        'accuracy_score': accuracy,
        'clarity_score': clarity,
        'depth_score': depth,
        'rubric_feedback': rubric_feedback,
        'strengths': strengths,
        'gaps': gaps,
        'model_answer': model_answer,
        'follow_up_drill': follow_up
    }
