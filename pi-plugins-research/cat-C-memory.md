# Category C: Memory / Context

Research on pi coding agent npm packages related to memory management and context handling.

## Package Overview

| Package | Type | Description | Key Functionality | Dependencies/Requirements | Notes |
|---------|------|-------------|-------------------|---------------------------|-------|
| **pi-memory-md** | extension | Letta-like memory system using GitHub-backed markdown files with YAML frontmatter | `memory_init`, `memory_sync`, `memory_read`, `memory_write`, `memory_list`, `memory_search`; prompt append injection to load memory into context | Requires GitHub repo for storage | Syncs memory to GitHub repo; uses MEMORY.md with structured blocks |
| **pi-memory** | extension | Memory management with optional semantic search via qmd integration | `memory_write`, `memory_read`, `scratchpad`, `memory_search`; selective injection of memory content | Optional: qmd (for semantic search capabilities) | Supports scratchpad for temporary notes; selective memory injection |
| **@askjo/pi-mem** | extension | Daily memory system with scratchpad, notes, and daily logs | `memory_write`, `memory_read`, `memory_search`, `scratchpad`; auto-injection of MEMORY.md, SCRATCHPAD.md, and daily log files | None | Organizes memory by day; includes scratchpad for temporary work |
| **@e9n/pi-context** | extension/skill | Visual context window usage command | `/context` command showing token usage broken down by category (tools, system prompt, conversation, etc.) | None | Useful for debugging context usage; skill-like command interface |
| **pi-episodic-memory** | extension | Semantic search over past conversations using local vector embeddings | `episodic_memory_search`, `episodic_memory_show`; stores conversations with embeddings for retrieval | Transformers.js, sqlite-vec, better-sqlite3 (3 dependencies) | Privacy-focused; all embeddings computed locally; semantic search over conversation history |
| **pi-context-filter** | extension | gitignore-style control over which context files are included | Exclude/include files like AGENTS.md, CLAUDE.md, skills via `.pi/.context` configuration file | None | Uses familiar gitignore syntax; fine-grained context control |
| **@aaronmaturen/pi-context7** | extension | Context7 library documentation integration for fetching up-to-date docs | `resolve_library_id`, `get_library_docs` tools; integrates with Context7 API for library documentation | None (uses native fetch) | Fetches current documentation from Context7 service; useful for coding tasks |
| **@edmundmiller/pi-context-repo** | extension | Git-backed persistent memory filesystem with version control | `memory_write`, `memory_delete`, `memory_commit`, `memory_search`, `memory_log`, `memory_backup`; `/memory` commands | None | Full git integration for memory versioning; includes backup and log features |
| **@e9n/pi-memory** | unknown | (unable to retrieve - forbidden error from npm) | unknown | unknown | Could not access package information |

## Patterns Noticed

### 1. Storage Approaches
- **Git-backed storage** (pi-memory-md, @edmundmiller/pi-context-repo): Leverages GitHub for persistence, version control, and potential collaboration
- **Local file storage** (pi-memory, @askjo/pi-mem): Simple markdown files stored locally
- **Database storage** (pi-episodic-memory): Uses sqlite-vec for vector embeddings and semantic search

### 2. Memory Organization Models
- **Block-based** (pi-memory-md): Structured blocks in a single MEMORY.md file
- **Time-based** (@askjo/pi-mem): Daily log files organized by date
- **Episodic** (pi-episodic-memory): Conversation-level memory with semantic retrieval
- **Free-form** (pi-memory, @edmundmiller/pi-context-repo): Flexible file structure

### 3. Search Capabilities
- **Semantic search** (pi-memory with qmd, pi-episodic-memory): Vector embeddings for meaning-based retrieval
- **Text search** (pi-memory-md, @askjo/pi-mem, @edmundmiller/pi-context-repo): Traditional text matching
- **No search** (@e9n/pi-context, pi-context-filter, @aaronmaturen/pi-context7): These focus on context management rather than memory retrieval

### 4. Common Tool Patterns
Most memory extensions implement similar core tools:
- `memory_write` - Store new memories
- `memory_read` - Retrieve stored memories
- `memory_search` - Find relevant memories
- `scratchpad` - Temporary working notes (in some packages)

### 5. Context Injection Strategies
- **Auto-injection**: Memory loaded automatically into prompts (pi-memory-md, @askjo/pi-mem)
- **Selective injection**: Choose what to include (pi-memory)
- **On-demand**: Manual retrieval via commands (@edmundmiller/pi-context-repo)

### 6. Dependency Philosophy
Most packages aim for minimal dependencies. Only pi-episodic-memory requires significant dependencies (Transformers.js, sqlite-vec, better-sqlite3) for its local embedding capabilities.

### 7. Configuration Approaches
- **File-based**: `.pi/.context` (pi-context-filter), memory files in repo
- **Tool-based**: Direct tool calls for configuration
- **Command-based**: Slash commands for interaction

## Recommendations

For users choosing a memory extension:
- **Simple & lightweight**: @askjo/pi-mem or pi-memory
- **Version control & collaboration**: pi-memory-md or @edmundmiller/pi-context-repo
- **Semantic search over conversations**: pi-episodic-memory
- **Semantic search over notes**: pi-memory (with qmd)
- **Context debugging**: @e9n/pi-context
- **Context filtering**: pi-context-filter
- **External docs access**: @aaronmaturen/pi-context7
