# TDV Origem 2–4 — Open questions to validate

Questions that block or risk the comprador path for **Origem** `2` (e-Notariado), `3` (CDT), `4` (Renave). Working assumptions from the grill session are listed; mark each as confirmed or corrected after talking to negócio / ServiceNow.

## 1. When the TDV is created for Origem 2–4 (critical) — corrected

**Previous (wrong) assumption:** For Origem `2`/`3`/`4`, the **TDV** already existed at **Estado** `7+` when the buyer picked the vehicle, and `confirmar-compra` only needed to `buscaTdv`.

**Corrected model:** `GET /compras` returns **pre-TDV stubs** from `listaTdvs` (often **without** `codigoTransferenciaVeiculo`). There is no `buscaTdv` until after create. The **TDV** is created in ServiceNow only when the **Comprador** confirms **Autodeclaração de residência**, via `POST /api/tdv/criar-compra`.

**Working assumption (post-create):** ServiceNow create for Origem `2`/`3`/`4` lands at **Estado** `7+` (no invented `4`→`5` advances).

**Why it matters:** The flow must skip `confirmar-compra` for Origem `2`/`3`/`4`, list stubs without filtering empty codigo, and create at Autodeclaração (optionally with CEP).

**Ask:**
- [ ] After `criaTdv` with origem `2`/`3`/`4`, what `estado` does ServiceNow return / leave the TDV in?
- [ ] Can the same CPF see a mix of Origem `1` TDVs (with codigo) and Origem `2+` stubs (empty codigo) in one list?
- [x] Should Origem `2`/`3`/`4` run Prova de Vida / call `confirmar-compra`?

**Decided:** Skip Prova de Vida and skip `confirmar-compra` for Origem `2`/`3`/`4`. Create at Autodeclaração via **Criar compra**. Only Origem `1` uses liveness + `confirmar-compra` (`4`→`5`).

**Owner / ask:** _________________  
**Answer:** _________________  
**Date:** _________________

---

## 2. Restriction check after Autodeclaração

**Status:** Implemented per especificação §4.1.9 (Slice 2) — ServiceNow errors on create/update map to pendência screens (`pagamento_pendente`, vistoria, administrativa, judicial). Remaining field-level questions below are awareness only.

**Working assumption (later refinement):** After `[Comprador] Endereço` / **Criar compra**, if the vehicle has a restriction → error screen (same idea as `[Vendedor] Veículo com restrição`). Else route by estado `7` / `8` / `9`.

**Why it matters:** `analise-requisitos` exposes `hasRestriction` but always returns `false` today. Unclear which ServiceNow field/endpoint is the source of truth for the comprador path (débitos? restrição administrativa? vistoria?).

**Ask:**
- [x] Which API/field indicates “veículo com restrição” for Origem `2`/`3`/`4` at this step? — **Implemented via SN error mapping** (`mapPendenciaError`); exact type codes still to confirm with negócio.
- [ ] Is restriction checked only after Autodeclaração / create, or also earlier (vehicle select)?

**Owner / ask:** _________________  
**Answer:** Implemented per especificação (Slice 2); type-code inventory still open.  
**Date:** 2026-08-08

---

## 3. Address update without changing Estado

**Working assumption (updated):** Swagger allows PATCH of address fields without `estado`. **Criar compra** sends address on `criaTdv` when CEP is present. Legacy **Confirmar endereço** PATCHes with `estado: '7'` when `codigoTransferencia` exists (see ADR 0002 note).

**Ask:**
- [ ] Confirm ServiceNow accepts address-only PATCH right after create when the TDV is already at estado `7` (or `8`/`9`).
- [ ] Must buyer identity / prova de vida fields still be sent on that PATCH, or is address-only enough?

**Owner / ask:** _________________  
**Answer:** _________________  
**Date:** _________________

---

## 4. Scope vs official HUs (awareness only)

This implementation is a **shared Comprador shortcut** branched by **Origem** `2`/`3`/`4`, not a full read of each HU:

| Versão (product) | HU summary | This PR’s comprador path |
|---|---|---|
| TDV 2.0 | Liveness → pendências/Pix → conclusão | **No liveness** → confirmação from stub (CEP edit) → Endereço → **Criar compra** → route by estado `7`/`8`/`9` |
| TDV 3.0 | Unspecified in docs | Same shortcut via origem CDT |
| TDV 4.0 | Primarily **Vendedor** + loja | Same shortcut if listed as compra with origem Renave |

**Ask:**
- [ ] Is product OK shipping this shortcut before full HU alignment (especially TDV 3.0 / 4.0)?

**Owner / ask:** _________________  
**Answer:** _________________  
**Date:** _________________

---

## Agreed flow (for reference)

```
Estou comprando
  → Consulta compras (includes pre-TDV stubs; empty codigo OK; seller fields)
  → Escolha veículo
  → Origem 2|3|4?
       true: skip Prova de Vida + confirmar-compra
            → get_user_info (session name/CPF) → Confirmação dados (selectedVehicle)
       false (Origem 1): Prova de Vida → POST /api/tdv/confirmar-compra (4→5)
            → Confirmação dados
  → [Comprador] Confirmação dados
       └─ Origem 2|3|4: footer “Editar endereço” (visibilityCondition)
            → CEP only → POST /api/tdv/validacao-comprador (preview) → back to Confirmação dados
  → [Comprador] Endereço (Autodeclaração)
  → Origem 1: Assinatura
  → Origem 2|3|4: POST /api/tdv/criar-compra
       (criaTdv with stub origem + seller; optional address PATCH; buscaTdv)
       → estado 7 → Aviso pagamento → Débitos → PIX (forcarNovo true/false)
       → estado 8 → Pagamento confirmado
       → estado 9 → Concluído
       → SN pendência errors → dedicated screens (Slice 2); pagamento_pendente → Débitos
```

See also `CONTEXT.md` (glossary), [`docs/adr/0002-criar-compra-origem-externa.md`](../adr/0002-criar-compra-origem-externa.md), and `docs/tdv/tdv-versoes.md` (version reference).
