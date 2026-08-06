# TDV Origem 2–4 — Open questions to validate

Questions that block or risk the comprador path for **Origem** `2` (e-Notariado), `3` (CDT), `4` (Renave). Working assumptions from the grill session are listed; mark each as confirmed or corrected after talking to negócio / ServiceNow.

## 1. Estado when the Comprador starts (critical)

**Working assumption:** For Origem `2`/`3`/`4`, the **TDV** is already at **Estado** `7+` (comunicação de venda gerada / pagamento / concluído) when the buyer picks the vehicle in “Estou comprando o veículo”.

**Why it matters:** Today `POST /api/tdv/confirmar-compra` always PATCHes ServiceNow to estado `4` then `5`. That transition is invalid if the TDV is already `7+`. Agreed approach: make `confirmar-compra` **estado-aware** — if already `7+`, only `buscaTdv` and return Confirmação dados; if still at `3`, keep today’s `4`→`5` advance.

**Ask:**
- [ ] For e-Notariado / CDT / Renave compras listed in `GET .../transferencias-de-veiculos?codigoComprador=...&ativa=true`, what `estado` values actually appear?
- [ ] Can the same CPF see a mix of estado `3` (ATPV-e criada, TDV 1.0 style) and `7+` (external comunicação) in one list?
- [ ] If somehow still at `3` for origem `2`/`3`/`4`, should the app fall back to the TDV 1.0 advance (`4`→`5`) or show an error?
- [x] When already `7+`, should `confirmar-compra` still attempt to PATCH `codigoProvaVidaComprador` without changing `estado`, or skip PATCH entirely?

**Decided (Prova de Vida on 7+):** Skip PATCH entirely. Origem `2`/`3`/`4` comprador path does **not** run Prova de Vida; `codigoProvaVidaComprador` is omitted. Only Origem `1` (advance `4`→`5`) requires it.

**Owner / ask:** _________________  
**Answer:** _________________  
**Date:** _________________

---

## 2. Restriction check after Autodeclaração

**Status:** Deferred — not in this implementation slice. Route only by **Estado** `7` / `8` / `9` for now.

**Working assumption (later):** After `[Comprador] Endereço`, if the vehicle has a restriction → error screen (same idea as `[Vendedor] Veículo com restrição`). Else route by estado `7` / `8` / `9`.

**Why it matters:** `analise-requisitos` exposes `hasRestriction` but always returns `false` today. Unclear which ServiceNow field/endpoint is the source of truth for the comprador path (débitos? restrição administrativa? vistoria?).

**Ask:**
- [ ] Which API/field indicates “veículo com restrição” for Origem `2`/`3`/`4` at this step?
- [ ] Is restriction checked only at Endereço confirm, or also earlier (vehicle select / after confirmar-compra)?

**Owner / ask:** _________________  
**Answer:** _________________  
**Date:** _________________

---

## 3. Address update without changing Estado

**Working assumption:** Swagger allows PATCH of `cepComprador` / `bairroComprador` / `logradouroComprador` / etc. **without** sending `estado` (“Salva os dados da TDV sem alterar o seu estado”). `confirmar-endereco` will use that when the user edited CEP.

**Ask:**
- [ ] Confirm ServiceNow accepts address-only PATCH when the TDV is already at estado `7` (or `8`/`9`).
- [ ] Must `codigoProvaVidaComprador` still be sent on that PATCH, or is address-only enough?

**Owner / ask:** _________________  
**Answer:** _________________  
**Date:** _________________

---

## 4. Scope vs official HUs (awareness only)

This implementation is a **shared Comprador shortcut** branched by **Origem** `2`/`3`/`4`, not a full read of each HU:

| Versão (product) | HU summary | This PR’s comprador path |
|---|---|---|
| TDV 2.0 | Liveness → pendências/Pix → conclusão | **No liveness** → confirmação (CEP edit) → Endereço → route by estado `7`/`8`/`9` |
| TDV 3.0 | Unspecified in docs | Same shortcut via `origem: 4` / treated with 2–4 |
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
  → Consulta compras (vehicles include origem)
  → Escolha veículo
  → Origem 2|3|4? → true: skip Prova de Vida
                 → false (Origem 1): Prova de Vida
  → POST /api/tdv/confirmar-compra
       (estado-aware: 4→5 only when still at 3, requires codigoProvaVidaComprador;
        if already 7+ just buscaTdv, no prova de vida)
  → [Comprador] Confirmação dados
       └─ Origem 2|3|4: footer “Editar endereço” (visibilityCondition)
            → CEP only → POST /api/tdv/validacao-comprador (preview) → back to Confirmação dados
  → [Comprador] Endereço (Autodeclaração)
  → Origem 1: Assinatura
  → Origem 2|3|4: POST /api/tdv/confirmar-endereco
       → estado 7 → Aviso pagamento
       → estado 8 → Pagamento confirmado
       → estado 9 → Concluído
       → else → snackbar error + end
       (restriction routing: later)
```

See also `CONTEXT.md` (glossary) and `docs/tdv/tdv-versoes.md` (version reference).
