# TDV (Transferência Digital de Veículo)

Domain language for digital vehicle transfer flows between citizens (and, in some versions, dealerships) mediated by DETRAN-SP / ServiceNow.

## Language

**TDV**:
A digital vehicle transfer process identified by a `codigoTransferencia`, with an **Origem** and an **Estado**.
_Avoid_: transferência (alone), ATPV (the document is related but not the process)

**Origem**:
The channel that created the **TDV**. Values used for app routing: `1` = TDV nativa (1.0), `2` = e-Notariado, `3` = CDT, `4` = Renave.
_Avoid_: versão (when meaning this field), origemComunicacaoVendaVeiculo (a different field used by TDV 6.0)

**Estado**:
The lifecycle step of a **TDV** (`1`–`10`). After the buyer's **Autodeclaração de residência** for **Origem** `2`/`3`/`4`, the app routes by **Estado** `7` (aviso pagamento), `8` (pagamento confirmado), or `9` (concluído) — never to **Assinatura**.
_Avoid_: status, step, stage

**Comprador**:
The party acquiring the vehicle; in this scope, the logged-in citizen acting under “Estou comprando o veículo”.
_Avoid_: buyer (in product copy), cliente

**Vendedor**:
The party selling the vehicle.
_Avoid_: seller (in product copy)

**Autodeclaração de residência**:
The buyer's confirmation that the declared address is their residence (screen `[Comprador] Endereço`). For **Origem** `2`/`3`/`4` this is the last buyer confirmation step before routing by **Estado**, and the moment any edited address is persisted to the **TDV**.
_Avoid_: confirmação de endereço (as a synonym for the whole step — that is only the screen title)

**Assinatura**:
Electronic signature of the ATPV-e via Gov.br/ITI. Required on the **Origem** `1` buyer path after **Autodeclaração de residência**; **not** used on the **Origem** `2`/`3`/`4` buyer path in this scope.
_Avoid_: ITI alone, assinatura eletrônica (when referring to the flow step)

**Prova de Vida**:
Facial liveness check (SDK) that produces a `codigoProvaVida`. Required on the **Comprador** path **only for Origem** `1` before confirming purchase (`confirmar-compra`). **Origem** `2`/`3`/`4` skip Prova de Vida and go from vehicle select straight to `confirmar-compra`.
_Avoid_: liveness (in product language), biometria

**Endereço do comprador**:
The buyer's residence on the **TDV**, stored as CEP plus fields resolved from ServiceNow `buscaEndereco`. In this scope the **Comprador** may change it for **Origem** `2`/`3`/`4` by entering a new **CEP** only (same pattern as `criar-tdv` / `[Vendedor] Dados comprador`); full street fields are not collected in the app. Preview after CEP edit uses existing `validacao-comprador`; persistence happens at **Autodeclaração de residência** via **Confirmar endereço**. The edit entry point is a conditional footer button on the shared `[Comprador] Confirmação dados` screen (`visibilityCondition` on **Origem**), not a duplicated confirmation screen.
_Avoid_: formulário de endereço completo, autofill de logradouro no client, tela de confirmação separada por origem

**Confirmar compra**:
App operation (`POST /api/tdv/confirmar-compra`) on the **Comprador** path. For **Origem** `1`, runs after **Prova de Vida**, requires `codigoProvaVidaComprador`, advances the **TDV** to estados `4` then `5`, and returns Confirmação dados. For **Origem** `2`/`3`/`4` (no liveness; working assumption estado already `7+`), loads the same Confirmação dados via `buscaTdv` **without** PATCH and **without** requiring `codigoProvaVidaComprador`.
_Avoid_: separate detalhe-compra endpoint

**Confirmar endereço**:
App operation (`POST /api/tdv/confirmar-endereco`) used on the **Origem** `2`/`3`/`4` **Comprador** path at **Autodeclaração de residência**: optionally updates **Endereço do comprador** from CEP via `buscaEndereco`, then returns **Estado** so the flow can route to aviso de pagamento (`7`), pagamento confirmado (`8`), or concluído (`9`) — never **Assinatura**. Any other **Estado** is treated as an error (snackbar) and ends the flow. Restriction handling is out of scope for this slice.
_Avoid_: valida-assinatura, overload of confirmar-compra for post-Endereço routing

## Flagged ambiguities

- **Versão vs Origem**: Product talk of “TDV 2–4” maps to **Origem** `2`/`3`/`4` in this implementation scope. Official HUs for those versions describe different roles/flows (e.g. TDV 4.0 is primarily a **Vendedor** journey); this CONTEXT documents the agreed comprador shortcut for this work, not a rewrite of the HUs.
- **Estado at Comprador entry for Origem 2–4**: Working assumption is already `7+`; unconfirmed. Tracked in [`docs/tdv/tdv-2-4-open-questions.md`](./docs/tdv/tdv-2-4-open-questions.md). `confirmar-compra` is estado-aware so it does not PATCH `4`→`5` when already `7+` (see [`docs/adr/0001-estado-aware-confirmar-compra.md`](./docs/adr/0001-estado-aware-confirmar-compra.md)).
- **Prova de Vida on Origem 2–4**: Product override for this app’s comprador shortcut — no liveness and no `codigoProvaVidaComprador` PATCH on `7+` (decided; see open-questions §1 and ADR 0001). Official HUs for TDV 2.0 still mention facial liveness.
- **Restriction after Autodeclaração**: Deferred; see open-questions §2.

## Example dialogue

> Dev: After the buyer confirms address on an e-Notariado TDV, do they sign?
> Expert: No. Check the **Estado**. If it's `7`, send them to payment notice; `8` payment confirmed; `9` done. Restriction comes later. **Assinatura** is only for **Origem** `1`.
> Dev: Do they do **Prova de Vida**?
> Expert: No for **Origem** `2`/`3`/`4` — vehicle select goes straight to Confirmação dados via `confirmar-compra`. Only **Origem** `1` runs Prova de Vida.
> Dev: Can they change the address?
> Expert: Yes — enter a new **CEP**, preview with `validacao-comprador`, save only at **Autodeclaração de residência** via **Confirmar endereço**.
> Dev: And how do we know it's e-Notariado?
> Expert: Look at **Origem** on the **TDV** — value `2`. Same buyer UX for `3` (CDT) and `4` (Renave) in this scope.
