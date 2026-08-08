# 0001. Estado-aware `confirmar-compra`

## Status

Accepted (superseded for Origem 2+ happy path — see note)

## Context

`POST /api/tdv/confirmar-compra` historically always PATCHed ServiceNow to estados `4` then `5` after Prova de Vida, which matches **Origem** `1` (TDV nativa) where the **Comprador** still needs that advance before Assinatura.

For **Origem** `2`/`3`/`4`, an earlier working assumption was that the **TDV** was already at **Estado** `7+` when the buyer opens the purchase. Forcing `4`→`5` would be an invalid transition.

An alternative was a separate read-only “detalhe compra” endpoint used only by Origem 2–4. That would duplicate Confirmação dados shaping and split the post-liveness contract by origem.

## Decision

Reuse `POST /api/tdv/confirmar-compra` for all origens:

1. `buscaTdv` first.
2. If **Estado** is already `7`, `8`, or `9`, return Confirmação dados (including `origem` / `estado`) **without** PATCH. Callers may omit `codigoProvaVidaComprador` (Origem `2`/`3`/`4` skip Prova de Vida).
3. Otherwise advance to `4` then `5` and **require** `codigoProvaVidaComprador` (Origem `1` path).

Post-Endereço routing for Origem 2–4 originally used a separate `POST /api/tdv/confirmar-endereco` — not an overload of `confirmar-compra`.

## Note (2026-08)

**Origem** `2`/`3`/`4` no longer use `confirmar-compra` on the happy path. Listed compras are often **pre-TDV stubs** without `codigoTransferenciaVeiculo`; the TDV is created at Autodeclaração via `POST /api/tdv/criar-compra` (see [`0002-criar-compra-origem-externa.md`](./0002-criar-compra-origem-externa.md)). The estado-aware `7+` skip in this service remains as defensive code for Origem `1` edge cases only.

## Consequences

- Callers must not assume every successful `confirmar-compra` mutated ServiceNow estado.
- Response includes `origem` and `estado` for Confirmação dados on the Origem `1` path.
- Origem `2`/`3`/`4` happy path: skip this endpoint entirely.
