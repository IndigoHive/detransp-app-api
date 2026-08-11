---
name: save-tdv-flow
description: >-
  Saves detransp-app-api/mock-data/tdv-flow.json into the local editor Postgres
  as the published TDV flow version. Use when the user asks to save, sync, push,
  or load the TDV flow JSON into the local database, Postgres, detransp_app_dev,
  or the TDV flow in the editor.
---

# Save TDV flow to local database

After editing `mock-data/tdv-flow.json` in **detransp-app-api**, persist it to the
local editor DB so the mobile app / admin can load the updated flow.

## Default targets

| Item | Value |
|------|--------|
| JSON source | `detransp-app-api/mock-data/tdv-flow.json` |
| Database | `postgresql://postgres:postgres@127.0.0.1:5432/detransp_app_dev` |
| Flow slug | `tdv` |
| Row updated | `flow_version` pointed by `flow.published_version_id` |

Prefer `DATABASE_URL` from `detransp-app-editor/apps/admin-api/.env.development`
when present; otherwise use the default above. Never write to `detransp_app_test`.

## Workflow

1. Confirm `mock-data/tdv-flow.json` is the intended source (validate JSON if unsure).
2. Run the bundled script from **detransp-app-api** (needs `pg` via sibling editor `node_modules`):

```bash
node .cursor/skills/save-tdv-flow/scripts/save-tdv-flow.cjs
```

Optional env overrides:

```bash
FLOW_JSON_PATH=/absolute/path/tdv-flow.json \
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/detransp_app_dev \
FLOW_SLUG=tdv \
node .cursor/skills/save-tdv-flow/scripts/save-tdv-flow.cjs
```

3. Report slug, version number, version id, and `json_bytes` from the script output.
4. Remind the user to reload the TDV flow in the app/editor if it was already open.

## Manual fallback (no script)

If the script cannot resolve `pg`, run equivalent Node from `detransp-app-editor`
(where `pg` is installed): update `flow_version.flow_json` for the published
version of slug `tdv`, bump `updated_at` on that version and on `flow`.

Schema reminder:

- `flow` — `id`, `slug`, `published_version_id`, …
- `flow_version` — `id`, `flow_id`, `version_number`, `flow_json` (JSONB), …

## Do not

- Create a new flow or version unless the user explicitly asks
- Overwrite a non-`tdv` slug without an explicit slug override
- Commit DB changes or credentials
- Use the test database
