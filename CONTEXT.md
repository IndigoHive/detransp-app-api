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

**Pre-TDV stub**:
A row from `listaTdvs` for **Origem** `2`/`3`/`4` that often has no `codigoTransferenciaVeiculo` yet. It carries plate, renavam, origem, and seller fields (`nomeVendedor`, `codigoVendedor`) so the app can list the purchase and later create the real **TDV** at **Autodeclaração de residência**.
_Avoid_: treating stubs as full TDVs, requiring codigoTransferencia before create

**Autodeclaração de residência**:
The buyer's confirmation that the declared address is their residence (screen `[Comprador] Endereço`). For **Origem** `2`/`3`/`4` this is the last buyer confirmation step before routing by **Estado**, and the moment the **TDV** is created in ServiceNow (and any edited address is persisted).
_Avoid_: confirmação de endereço (as a synonym for the whole step — that is only the screen title)

**Assinatura**:
Electronic signature of the ATPV-e via Gov.br/ITI. Required on the **Origem** `1` buyer path after **Autodeclaração de residência**; **not** used on the **Origem** `2`/`3`/`4` buyer path in this scope.
_Avoid_: ITI alone, assinatura eletrônica (when referring to the flow step)

**Prova de Vida**:
Facial liveness check (SDK) that produces a `codigoProvaVida`. Required on the **Comprador** path **only for Origem** `1` before confirming purchase (`confirmar-compra`). **Origem** `2`/`3`/`4` skip Prova de Vida and go from vehicle select straight to Confirmação dados (no `confirmar-compra`).
_Avoid_: liveness (in product language), biometria

**Endereço do comprador**:
The buyer's residence on the **TDV**, stored as CEP plus fields resolved from ServiceNow `buscaEndereco`. In this scope the **Comprador** may change it for **Origem** `2`/`3`/`4` by entering a new **CEP** only (same pattern as `criar-tdv` / `[Vendedor] Dados comprador`); full street fields are not collected in the app. Preview after CEP edit uses existing `validacao-comprador`; persistence happens at **Autodeclaração de residência** via **Criar compra**. The edit entry point is a conditional footer button on the shared `[Comprador] Confirmação dados` screen (`visibilityCondition` on **Origem**), not a duplicated confirmation screen. For stubs there is no address until CEP edit (or create without CEP).
_Avoid_: formulário de endereço completo, autofill de logradouro no client, tela de confirmação separada por origem

**Confirmar compra**:
App operation (`POST /api/tdv/confirmar-compra`) on the **Comprador** path for **Origem** `1` only. Runs after **Prova de Vida**, requires `codigoProvaVidaComprador`, advances the **TDV** to estados `4` then `5`, and returns Confirmação dados. **Origem** `2`/`3`/`4` do not call this endpoint.
_Avoid_: using confirmar-compra for Origem 2+/stubs

**Criar compra**:
App operation (`POST /api/tdv/criar-compra`) used on the **Origem** `2`/`3`/`4` **Comprador** path at **Autodeclaração de residência**: creates the **TDV** in ServiceNow from a **pre-TDV stub** (`criaTdv` with that origem), optionally PATCHes **Endereço do comprador** from CEP via `buscaEndereco`, then returns **Estado** so the flow can route to aviso de pagamento (`7`), pagamento confirmado (`8`), or concluído (`9`) — never **Assinatura**. Working assumption: ServiceNow create for external origem lands at `7+`. Any other **Estado** is treated as an error (snackbar) and ends the flow. Restriction handling is out of scope for this slice. Distinct from **Criar TDV** (`POST /api/tdv/criar`, Origem `1` vendedor `1→2→3`).
_Avoid_: reusing CriarTdvService, overload of confirmar-endereco / confirmar-compra for create

**Confirmar endereço**:
Legacy app operation (`POST /api/tdv/confirmar-endereco`) kept in the API for now; the flow no longer calls it. Address persistence + estado routing for Origem `2`/`3`/`4` moved to **Criar compra**.
_Avoid_: wiring new flow edges to confirmar-endereco

## Flagged ambiguities

- **Versão vs Origem**: Product talk of “TDV 2–4” maps to **Origem** `2`/`3`/`4` in this implementation scope. Official HUs for those versions describe different roles/flows (e.g. TDV 4.0 is primarily a **Vendedor** journey); this CONTEXT documents the agreed comprador shortcut for this work, not a rewrite of the HUs.
- **Estado after Criar compra**: Working assumption is ServiceNow create for Origem `2`/`3`/`4` lands at `7+`; unconfirmed. Tracked in [`docs/tdv/tdv-2-4-open-questions.md`](./docs/tdv/tdv-2-4-open-questions.md). See [`docs/adr/0002-criar-compra-origem-externa.md`](./docs/adr/0002-criar-compra-origem-externa.md).
- **Prova de Vida on Origem 2–4**: Product override for this app’s comprador shortcut — no liveness (decided; see open-questions §1). Official HUs for TDV 2.0 still mention facial liveness.
- **Restriction after Autodeclaração**: Deferred; see open-questions §2.
- **Seller email on stubs**: Stub has no email; **Criar compra** sends `emailVendedor: ''`.

## Example dialogue

> Dev: After the buyer confirms address on an e-Notariado purchase, do they sign?
> Expert: No. At **Autodeclaração** we **Criar compra** (create the **TDV**), then check the **Estado**. If it's `7`, send them to payment notice; `8` payment confirmed; `9` done. Restriction comes later. **Assinatura** is only for **Origem** `1`.
> Dev: Do they do **Prova de Vida**?
> Expert: No for **Origem** `2`/`3`/`4` — vehicle select goes straight to Confirmação dados from the stub + session. Only **Origem** `1` runs Prova de Vida then `confirmar-compra`.
> Dev: Can they change the address?
> Expert: Yes — enter a new **CEP**, preview with `validacao-comprador`, save only at **Autodeclaração de residência** via **Criar compra**.
> Dev: And how do we know it's e-Notariado?
> Expert: Look at **Origem** on the stub / selected vehicle — value `2`. Same buyer UX for `3` (CDT) and `4` (Renave) in this scope.
