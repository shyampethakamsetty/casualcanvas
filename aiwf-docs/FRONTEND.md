# Frontend (Next.js + React Flow)
## Routes
- `/` — open/create workflow by ID.
- `/login` — magic-code (dev).
- `/workflows/[id]` — canvas editor + inspector + run panel.

## Components
- **NodePalette** — drag node type.
- **Canvas** — React Flow for nodes/edges (drop/connect).
- **Inspector** — edit selected node config.
- **RunPanel** — trigger run & poll status.

## API Client
`NEXT_PUBLIC_API_BASE` + `/api/v1`; inject JWT from `localStorage` for dev.

## Adding a Node UI
- Palette: add type label.
- Inspector: add form controls for config schema.
- Save: serialize to backend workflow schema.
