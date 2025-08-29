# Workflows & Node Registry

## Workflow JSON (v1)
```json
{
  "name": "Daily Digest",
  "version": 1,
  "nodes": [
    { "id": "n1", "type": "ingest.url", "config": {"url": "https://news"}, "inputs": [], "outputs": [{"key": "out", "type": "json"}] }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2" }
  ]
}
```

## Node Contract
- `type`: unique id (`ingest.pdf`, `ai.rag_qa`, `act.slack`, ...)
- `inputs[]` / `outputs[]`: `text|json|file|vector_ids`
- `config`: validated by JSON Schema
- `retry`: `{ max, backoff, jitter }`

## Validation Rules
- DAG only (no cycles), required inputs connected, type-safe edges.
- Block run when invalid; show error list.
