# 0001. Estado-aware `confirmar-compra`

## Status

Accepted

## Context

`POST /api/tdv/confirmar-compra` historically always PATCHed ServiceNow to estados `4` then `5` after Prova de Vida, which matches **Origem** `1` (TDV nativa) where the **Comprador** still needs that advance before Assinatura.

For **Origem** `2`/`3`/`4`, the working assumption is that the **TDV** is already at **Estado** `7+` when the buyer opens the purchase. Forcing `4`→`5` would be an invalid transition.

An alternative was a separate read-only “detalhe compra” endpoint used only by Origem 2–4. That would duplicate Confirmação dados shaping and split the post-liveness contract by origem.

## Decision

Reuse `POST /api/tdv/confirmar-compra` for all origens:

1. `buscaTdv` first.
2. If **Estado** is already `7`, `8`, or `9`, return Confirmação dados (including `origem` / `estado`) **without** PATCH. Callers may omit `codigoProvaVidaComprador` (Origem `2`/`3`/`4` skip Prova de Vida).
3. Otherwise advance to `4` then `5` and **require** `codigoProvaVidaComprador` (Origem `1` path).

Post-Endereço routing for Origem 2–4 uses a separate `POST /api/tdv/confirmar-endereco` — not an overload of `confirmar-compra`.

## Consequences

- Callers must not assume every successful `confirmar-compra` mutated ServiceNow estado.
- Response now includes `origem` and `estado` so the flow can show conditional CEP edit and branch after Autodeclaração.
- Origem `2`/`3`/`4` never attach Prova de Vida on this endpoint when already `7+` — see `docs/tdv/tdv-2-4-open-questions.md` §1 (decided: skip).
