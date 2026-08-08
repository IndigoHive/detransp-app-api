# 0002. Create TDV for Origem 2+ at Autodeclaração via `criar-compra`

## Status

Accepted

## Context

For **Origem** `2`/`3`/`4`, `listaTdvs` returns **pre-TDV stubs** that often lack `codigoTransferenciaVeiculo`. The buyer still needs Confirmação dados and optional CEP edit before **Autodeclaração de residência**, but there is no TDV to `buscaTdv` / PATCH until create.

Alternatives considered:

1. **Overload `confirmar-endereco`** — would create + optional address + route by estado. Misnamed for create; couples “confirm existing TDV address” with “create from stub”.
2. **Reuse `POST /api/tdv/criar` (`CriarTdvService`)** — that is the Origem `1` **Vendedor** path (`criaTdv` with origem TDV then advance `1→2→3`). Wrong role and wrong estado machine for external origem.
3. **Reuse `confirmar-compra`** — historically advances `4→5` after liveness; stubs have no codigo and must not invent that transition. Prior ADR 0001 assumed estado already `7+` at entry; that assumption was wrong for stubs.

## Decision

Add `POST /api/tdv/criar-compra` (`CriarCompraService`), called only from the Origem `2`/`3`/`4` Autodeclaração edge:

1. `criaTdv` with stub fields (`placa`, `renavam`, `origem` `2|3|4`, `nomeVendedor`, `codigoVendedor`, `emailVendedor: ''`).
2. If CEP present: `buscaEndereco` → address-only `atualizaTdv` (no `estado`).
3. `buscaTdv` → map **Estado** `7`/`8`/`9` to `proximaAcao` (same routing contract as the former `confirmar-endereco`); else snackbar error.

Flow consequences:

- Origem `2`/`3`/`4` skip Prova de Vida and skip `confirmar-compra`; Confirmação dados binds from `selectedVehicle` + session (`get_user_info_node`).
- `consulta-compras` must not filter empty `codigoTransferenciaVeiculo` and must expose seller fields.
- Keep `confirmar-endereco` in the codebase for now; stop calling it from the flow.
- `confirmar-compra` remains Origem `1` only (liveness + `4`→`5`); estado-aware `7+` skip stays as defensive code for edge cases.

## Consequences

- Create timing moves to Autodeclaração; list/confirm screens operate on stubs until then.
- Working assumption that SN create lands at `7+` remains to be validated (see open-questions §1).
- Seller email is intentionally empty until a real source exists.
- ADR 0001’s “Origem 2+ uses confirmar-compra when already 7+” path is superseded for the happy path; see note on that ADR.
