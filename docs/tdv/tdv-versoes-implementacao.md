# TDV — como cada versão está implementada na API e no flow

Documento de handover. O objetivo é que qualquer pessoa consiga, só lendo daqui, entender
**por onde cada versão da TDV passa no `mock-data/tdv-flow.json`**, **qual código da
`detransp-app-api` atende cada passo** e **onde nós divergimos do app que está em produção**.

- Regra de negócio e contrato: [`tdv-versoes.md`](./tdv-versoes.md)
- Fonte de verdade de comportamento: **`detran-app-kotlin`** (o app da Play Store)

> **Estado desta revisão.** Todo este documento foi reconferido contra o `detran-app-kotlin`,
> e as versões 2.0/3.0/4.0/6.0 foram convergidas para o comportamento dele. As afirmações sobre
> o app de produção têm arquivo e linha. As seções §5–§8 trazem, para cada versão, uma tabela
> **"app de produção × nós"**; o que ficou divergente de propósito está em §11, e o que ainda
> falta validar em homologação está em §13. A auditoria de idempotência está em §12.

---

## 1. Os dois eixos que controlam tudo: `origem` e `estado`

### 1.1 `origem` — qual versão da TDV é essa

`src/clients/detran-sp-service-now/tdv/types/_common.ts`

| `origem` | Constante | Versão | Quem usa o app | Como a TDV nasce |
|---|---|---|---|---|
| `1` | `TDV` | **TDV 1.0** | vendedor **e** comprador (PF) | o próprio app cria (`POST /api/tdv/criar`) |
| `2` | `E_NOTARIADO` | **TDV 2.0** | só o comprador | Comunicação de Venda registrada no e-Notariado (cartório) |
| `3` | `CDT` | **TDV 2.0** | só o comprador | Comunicação de Venda registrada no app da Carteira Digital de Trânsito |
| `4` | `RENAVE` | **TDV 3.0** | só o comprador | ATPV-e Renave seminovos — *loja vende para o cidadão* |
| `5` | `ENTRADA_RENAVE` | **TDV 4.0** | só o vendedor (cidadão) | lojista abre a intenção pelo SERPRO (transação PRNV 258) |
| `6` | `CARTORIO` | **TDV 6.0** | só o comprador | Comunicação de Venda de cartório integrado à SEFAZ |

**TDV 5.0 (procuração) não existe e não será implementada** — decisão do DETRAN, ver §14.

`origemComunicacaoVendaVeiculo` é um campo **paralelo** (de onde veio a *CV*, não a TDV). Nem o
app de produção nem o nosso flow roteiam por ele; só o repassamos adiante em `criar-compra` e
`validar-tdv`.

### 1.2 `estado` — em que ponto da máquina de estados a TDV está

`CodigoEstadoTDV`, mesmo arquivo: `1` veículo selecionado · `2` dados da venda informados ·
`3` ATPV-e criada · `4` intenção de compra confirmada · `5` autodeclaração confirmada ·
`6` ATPV-e assinada pelo comprador (**na origem 5: TCR aceito pelo vendedor**) ·
`7` ATPV-e assinada pelo vendedor + CV gerada · `8` taxa paga · `9` concluída · `10` cancelada.

---

## 2. Onde o flow se divide por versão

Dois nós de bifurcação, um por jornada. Achar esses dois no editor é o atalho para entender
qualquer versão.

### Jornada do COMPRADOR — `n_c3f8a2e9b147` · `Origem 2|3|4|6?`

```
[Comprador] Escolha veículo (s_52363926e91c)
        │  selectedVehicle.origem
        ▼
   n_c3f8a2e9b147  ── false (origem 1) ──► n_cd7b779a01a0 "Rotear por ação"  ► TDV 1.0
        │
        └── true (origem 2, 3, 4 ou 6) ──► n_6e0a4c1d8b27 "TDV 6.0 cartório?" ► TDV 2.0/3.0/6.0
```

Esse desvio pula **duas** coisas do fluxo TDV 1.0: a tela de *liveness* e o
`POST /api/tdv/confirmar-compra`. Origem 2, 3, 4 e 6 compartilham o mesmo caminho de telas; a
origem `6` passa antes pelo `validar-tdv`.

### Jornada do VENDEDOR — `n_8e2f4a6c1b3d` · `Origem 5 (venda para loja)?`

```
[Vendedor] Sucesso liveness (s_550eb1c5ac27)
        ▼
   n_8e2f4a6c1b3d   (origem vem de Criar TDV OU de Análise Requisitos)
        ├── true  ──► [Vendedor] Confirmação dados loja (s_5d25c3769fdc)   ► TDV 4.0
        └── false ──► [Vendedor] Dados comprador (s_2909315de67e)          ► TDV 1.0
```

Gêmeo no caminho de retomada: `n_9b4d6e8a1c20` `Origem 5 (retomar venda para loja)?`, depois do
liveness de retomada (`n_c4e8f2a71d05`), quando a TDV já existia em estado 1 ou 2.

---

## 3. Mapa rápido: versão → caminho no app

| Versão | origem | Papel | Prova de vida | Assina | Estados | Telas-chave |
|---|---|---|---|---|---|---|
| 1.0 | `1` | vendedor e comprador | **sim**, nos dois lados | ambos (ITI) | 1→2→3→4→5→6→7→8→9 | jornada completa |
| 2.0 | `2`,`3` | só comprador | **não** | não | entra em 7/8/9 | `s_3593782b12c5` → `s_b650bf1fea21` |
| 3.0 | `4` | só comprador | **não** | não | idem 2.0 | idem 2.0 |
| 4.0 | `5` | só vendedor (cidadão) | **sim** | só o vendedor | 1/2 → 6 → 7 | `s_5d25c3769fdc` → `s_800e39d059b5` → `s_0807856fe2c1` |
| 5.0 | — | — | — | — | — | **não será implementada** |
| 6.0 | `6` | só comprador | **não** | não | idem 2.0, com `validar-tdv` antes | idem 2.0 + drawers `d_9b3d7f4a1e50` / `d_0c4e8a5b2f61` |

---

## 4. TDV 1.0 — venda entre pessoas físicas pelo app (origem `1`)

Linha de base — **implementada, testada e validada**; está aqui só para comparação.

**Vendedor:** `GET /api/tdv/veiculos` → `POST /api/tdv/analise-requisitos` → `POST /api/tdv/criar`
→ liveness → `POST /api/tdv/validacao-comprador` → `POST /api/tdv/validacao-venda` →
`POST /api/tdv/informar-dados-venda` (estado 2) → `POST /api/tdv/confirmar-intencao-venda` (estado 3)
→ assinatura ITI via `POST /api/tdv/valida-assinatura` (estado 6 → 7).

**Comprador:** `GET /api/tdv/compras` → liveness → `POST /api/tdv/confirmar-compra`
(estados 3 → 4 → 5) → autodeclaração → assinatura ITI (5 → 6) →
`GET /api/tdv/consulta-debitos` → PIX → estado 8 → 9.

Roteamento de retomada por `n_cd7b779a01a0` (`Rotear por ação`), alimentado por
`AnaliseRequisitosService.proximaAcao` e `ConsultaComprasService.proximaAcao`
(via `acaoComoComprador`).

---

## 5. TDV 2.0 — e-Notariado / CDT (origem `2` e `3`)

### 5.1 Caminho no flow

```
s_52363926e91c  [Comprador] Escolha veículo
   └─ n_c3f8a2e9b147 (true)
      └─ n_6e0a4c1d8b27 (false, pois origem ≠ 6)
         └─ n_8c3f5d0b2a71  "TDV já criada?"  (selectedVehicle.codigoTransferencia vazio?)
            ├─ false ─► s_3593782b12c5  [Comprador] Confirmação dados
            │            └─ s_b650bf1fea21  [Comprador] Endereço (autodeclaração)
            │               └─ n_2d9e4b6a8c17  POST /api/tdv/criar-compra
            │                  └─ n_5a7c9e1b3d46  "Rotear pós endereço"
            └─ true  ─► n_a4e7b1c9d205  "Rotear por estado (TDV existente)"
                           ├─ 3|4|5 ─► n_cd7b779a01a0 (retoma como comprador, igual TDV 1.0)
                           └─ 7|8|9 ─► telas de acompanhamento
```

Edição opcional de endereço: `s_85ba93c2e996` (CEP) → `GET /api/tdv/enderecos/:cep`
(`n_f5aacdb3ca97`) → `s_7e2a1c9b4f08` (formulário) → `s_b650bf1fea21`.

### 5.2 `POST /api/tdv/criar-compra` — o endpoint central das versões 2/3/6

`src/services/tdv/criar-compra/criar-compra-service.ts`

1. **Relê o registro** da comunicação de venda: `listaTdvs` por `codigoComprador` + placa,
   **sem `campos`**, casando por placa e renavam.
2. **Se o registro já tem `codigoTransferenciaVeiculo`, não cria nada** — lê a TDV e roteia por
   estado (§12). Só segue para a criação quando não há código.
3. `POST /transferencias-de-veiculos` com **o registro inteiro** como corpo, tirando os campos
   nulos (como o Gson do app faz) e marcando `confirmacaoAutodeclaracaoResidenciaComprador:
   'true'`. Nada do que o flow mandou sobrescreve o registro — inclusive o endereço, que segue o
   do cartório/CV. Sem registro encontrado, cai no payload montado a partir do que o flow enviou.
4. Sem código na resposta (**201 vazio**) ou `TDVAtivaExistenteError` → usa o código do registro
   já lido ou relista (`resolveExistingCodigo`).
5. Erro de **pendência** conhecida → `mapPendenciaError` devolve `proximaAcao` em vez de erro HTTP.
6. `GET /transferencias-de-veiculos/{codigo}` e traduz `estado` → `proximaAcao` (`mapProximaAcao`).

> O custo é **uma consulta a mais por criação**. É deliberado: um payload incompleto foi a causa
> mais provável do `201` sem `codigoTransferenciaVeiculo` visto em homologação, e reler garante
> que valores como o CPF zero-padded voltem byte a byte.

**`proximaAcao` → tela** (case node `n_5a7c9e1b3d46`):

| `proximaAcao` | Vem de | Tela |
|---|---|---|
| `aviso_pagamento` | estado `7` | `s_a7f3c91e2b04` [Comprador] Aviso pagamento |
| `pagamento_confirmado` | estado `8` | `s_1abd59a0d122` [Comprador] Pagamento confirmado |
| `concluido` | estado `9` | `s_92a9313c0809` [Comprador] Concluído |
| `pagamento_pendente` | `PagamentoPendenteError` | `n_42d9a1904282` → `s_8aefa5b66037` Status da Transferência |
| `vistoria_pagamento_pendentes` | `PagamentoVistoriaPendentesError` | `s_d7fb70e64057` Status da Transferência |
| `administrativa_pendente` | `SituacaoAdministrativaPendenteError` | `s_237dc4a23b0a` |
| `judicial_pendente` | `SituacaoJudicialPendenteError` | `s_92032d9974db` |
| `administrativa_judicial_pendentes` | `SituacoesAdministrativaJudicialPendentesError` | `s_f62f452e2717` |
| *(nenhum dos acima)* | qualquer outro estado | snackbar `"Estado da transferência inválido para continuar"` |

Os nomes de erro do ServiceNow são casados **em minúsculas** pelo dicionário `PENDENCIA_BY_TYPE`
— se o backend renomear um tipo, a pendência vira 500 silenciosamente.

### 5.3 Pagamento
`s_a7f3c91e2b04` → `n_b8e4d02f3c15` `GET /api/tdv/consulta-debitos` → `n_c9f5e13a4d26`
(`estado == 2`? = QR já pago) → `s_d0a6f24b5e37` (lista de débitos) → `n_e1b7a35c6f48`
`pix_screen` → `s_f2c8b46d7059`.

`ConsultaDebitosService` tem duas sutilezas: `gerarQrCode` só é `true` no nó de PIX (a lista
chama com `false` para não iniciar o relógio de expiração); e quando detecta o QR **pago** com a
TDV no estado `7`, ele **acelera** para o estado `8` (o cron do DETRAN faria isso, devagar).

### 5.4 App de produção × nós

| Ponto | App de produção (Kotlin) | Nós | Situação |
|---|---|---|---|
| Prova de vida do comprador | não roda | não roda | ✅ igual |
| Corpo do `POST` de criação | **registro `obterTransf` inteiro** | registro relido e ecoado inteiro (§5.2) | ✅ igual |
| Texto da autodeclaração | `POST /cidadaos/{cpf}/autodeclaracao-de-residencia` | mesmo endpoint, via `POST /api/tdv/autodeclaracao-residencia` | ✅ igual |
| Endereço editado | usado **só** para regerar o texto | idem — o registro manda no que é gravado | ✅ igual |
| `VistoriaPendenteError` | → Status (vistoria) | `vistoria_pendente` → `s_p2b2c3d4e5f7` | ✅ equivalente |
| Demais pendências | 5 tipos | os mesmos 5 + a variante de taxa não localizada | ✅ igual |
| Gate da tela e-notariado | `codigo vazio` **E** `origem ∈ {2,3,4}` | só `origem ∈ {2,3,4,6}` | ⚠️ divergência consciente (§11.3) |
| Valor de venda na confirmação | `"Valor não informado"` | `NAO_INFORMADO` (“Não informado”) | ✅ equivalente |
| Estados 7/8/9 | 3 telas | 3 telas | ✅ igual |

---

## 6. TDV 3.0 — Renave saída / loja vende para o cidadão (origem `4`)

**Não tem regra própria — e isso agora está confirmado, não é lacuna.** O app de produção trata
`origem = 4` na mesma cláusula do e-Notariado em todos os pontos de decisão
(`SelecionarVeiculoScreen.kt:573`, `:801`, `:996`, `:1003`). Nosso flow faz o mesmo
(`n_c3f8a2e9b147`, cláusula `skip-pv-origem-eq-4`).

A única especificidade é de **dados**: o vendedor é CNPJ, então `codigoVendedor` chega com 14
dígitos e as telas que exibem "quem está vendendo" precisam formatar CNPJ (hoje quem cuida disso
é `formatCpfCnpj`, ver §11.5). Tudo o que vale para a §5 vale aqui.

---

## 7. TDV 6.0 — Cartório / SEFAZ (origem `6`)

### 7.1 Como está implementado

```
n_c3f8a2e9b147 (true)
   └─ n_6e0a4c1d8b27  "TDV 6.0 cartório (origem 6)?"
      ├─ true  ─► n_7f1b5d2e9c38  POST /api/tdv/validar-tdv
      │            └─ n_8a2c6e3f0d49  "Rotear validar-tdv"
      │               ├─ enotariado           ─► n_8c3f5d0b2a71 (segue igual TDV 2.0)
      │               ├─ duas_assinaturas     ─► d_9b3d7f4a1e50 (drawer)
      │               └─ duas_pessoas_fisicas ─► d_0c4e8a5b2f61 (drawer)
      └─ false ─► n_8c3f5d0b2a71 (origem 2/3/4: segue igual TDV 2.0)
```

Os dois drawers oferecem **"Solicitar serviço"** (`n_93c1a4d6f052`, abre
`https://www.detran.sp.gov.br/detransp`) ou voltar à tela inicial.

### 7.2 `POST /api/tdv/validar-tdv`
`src/services/tdv/validar-tdv/validar-tdv-service.ts`

- Repassa o registro da listagem para `POST /transferencias-de-veiculos/validar-tdv`.
- Exige `placaVeiculo`, `codigoRenavamVeiculo` e `origem` — sem qualquer um deles, `400`.
- **Sucesso ⇒ `proximaAcao: 'enotariado'`** (nome infeliz: significa "passou nas validações,
  siga o fluxo comum").
- `DuasAssinaturasError` → `duas_assinaturas`; `DuasPessoasFisicasError` →
  `duas_pessoas_fisicas` (casamento por string minúscula, `PROXIMA_ACAO_BY_TYPE`). Qualquer
  outro erro é re-lançado.
- O endpoint **não está no swagger** — só no PDF e no app de produção.

### 7.3 App de produção × nós

| Ponto | App de produção (Kotlin) | Nós | Situação |
|---|---|---|---|
| Quando chama `validar-tdv` | `origem == 6` **E** `estado == 7` | `origem == 6` **E** `estado == 7` | ✅ igual |
| Corpo do `validar-tdv` | registro `obterTransf` inteiro | subconjunto curado | ⚠️ pendente (§13) |
| Erros 406 | 2 tipos → bottom sheet | 2 tipos → drawer | ✅ igual |
| Textos das mensagens | ver [`tdv-versoes.md`](./tdv-versoes.md) | conferidos, batem | ✅ igual |
| Depois da validação | idêntico à 2.0 | idêntico à 2.0 | ✅ igual |

---

## 8. TDV 4.0 — Entrada Renave / cidadão vende para a loja (origem `5`)

Única das "outras versões" que roda na **jornada do vendedor**, e a única com telas próprias.

### 8.1 Caminho no flow

```
[Vendedor] Escolha veículo (s_83bb5547ec06)
   └─ POST /api/tdv/analise-requisitos (n_b824c7dd9350)
      └─ n_5f8e2a91c3d4 "TDV pronta para rotear?"  (proximaAcao preenchida?)
         ├─ true  ─► n_cd7b779a01a0 "Rotear por ação"
         └─ false ─► n_b2c6d93e6c54 "Possui tdv aberta?"
                      └─ true ─► s_62e905fb199e  [Vendedor] TDV aberta
                                 └─ n_7c2a9e51f8d3 "estado 1 ou 2?"
                                    └─ true ─► n_c4e8f2a71d05 liveness (retomar)
                                               └─ n_9b4d6e8a1c20 "Origem 5?"
                                                  └─ true ─► s_5d25c3769fdc

s_5d25c3769fdc  [Vendedor] Confirmação dados loja
   └─ s_800e39d059b5  [Vendedor] Termo para venda   (TCR)
      └─ n_e4b7c91a2f08  POST /api/tdv/confirmar-termo-ciencia   (estado 6)
         └─ s_0807856fe2c1  [Vendedor] Assinatura
            └─ n_b8366e042aa1  GET /api/tdv/link-assinatura-iti
               └─ n_034c402d0d07  iti_signature_screen
                  └─ n_a56ddf102a2a  POST /api/tdv/valida-assinatura   (estado 7)
                     └─ n_083fd6fdd19b "Assinado?" ─► s_ae3771c838a8 [Vendedor] Conclusão loja
```

Há um **segundo** ponto de entrada via `Criar TDV` → `[Vendedor] Sucesso requisitos` → liveness
`n_4d4ab6c16ec8` → `n_8e2f4a6c1b3d`, e um **terceiro** de retomada: quem já aceitou o TCR
(estado 6) volta por `Rotear por ação` na rota `vendedor_loja_assinar`, direto para
`[Vendedor] Assinatura`.

### 8.2 O que a API faz de diferente na origem 5

**`AnaliseRequisitosService`** — devolve `origem` quando existe TDV ativa; é o que alimenta os
dois nós `Origem 5?`. Sem TDV ativa, `origem` não vem (por isso o caminho via `Criar TDV` só se
reproduz no mock — ver §11.3).

**`ConfirmarTermoCienciaService`** — só faz `PATCH` se `origem === '5'`, o TCR ainda não foi
confirmado e a TDV não passou de 7, com o mesmo corpo do app de produção:
```ts
atualizaTdv(..., { estado: '6', confirmacaoTermoCienciaResponsabilidade: true })
```
A prova de vida roda antes (a jornada da loja sempre passa por ela) mas **não é enviada** em
lugar nenhum — é o comportamento do app. Idempotência via `isTermoCienciaConfirmado`.

**`ValidaAssinaturaService`** — na TDV 1.0 o vendedor só assina saindo de `6`; na origem 5 ele
assina saindo de **1, 2 ou 6** direto para `7`. O `itiCode` **não vai no corpo** — o client o
move para o header `X-Authorization-Code`, porque o ServiceNow rejeita se vier nos dois.

### 8.3 App de produção × nós

| Ponto | App de produção (Kotlin) | Nós | Situação |
|---|---|---|---|
| Prova de vida do vendedor | **roda sempre** (origem 5 tem precedência sobre o estado) | roda | ✅ igual |
| Envio do `codigoProvaVida` | **nunca envia** | nunca envia | ✅ igual |
| Corpo do aceite do TCR | `{estado:"6", confirmacaoTermoCienciaResponsabilidade:true}` | idêntico | ✅ igual |
| Texto do TCR | campo `termoCienciaResponsabilidade` **do registro** | mesmo campo, com o texto montado como fallback | ✅ igual |
| Tela de confirmação da loja | renavam, placa, ano, marca/modelo, cor, chassi, CNPJ, empresa, e-mail, endereço + aviso | mesmos campos | ✅ igual |
| Assinatura | `PATCH {estado:"7"}` + header ITI | idem | ✅ igual |
| Reentrada no estado 6 | vai direto para a assinatura | `vendedor_loja_assinar` → assinatura | ✅ igual |
| Texto da conclusão | "Sua intenção de venda foi concluída…" | "Tudo certo! Você concluiu a venda…" | ⚠️ cópia diferente |

---

## 9. Referência da API — endpoints TDV

`src/app/routers/tdv-router.ts` (montado em `/api/tdv`). Todos passam pelo `session-auth` e usam
o `accessToken` gov.br da sessão; o CPF sai do próprio token (`utils/token.ts`).

| Método | Rota | Serviço | Usado por |
|---|---|---|---|
| GET | `/veiculos` | `ConsultaVeiculosService` | vendedor (1.0, 4.0) |
| POST | `/analise-requisitos` | `AnaliseRequisitosService` | vendedor (1.0, 4.0) |
| POST | `/validacao-comprador` | `ValidacaoCompradorService` | vendedor 1.0 |
| GET | `/comprador-cpf`, `/comprador-cep` | `CompradorCpfService`, `CompradorCepService` | vendedor 1.0 |
| POST | `/validacao-venda` | `ValidacaoVendaService` | vendedor 1.0 |
| POST | `/criar` | `CriarTdvService` | vendedor 1.0 (cria sempre com `origem: '1'`) |
| POST | `/informar-dados-venda` | `InformarDadosVendaService` | vendedor 1.0 (→ estado 2) |
| POST | `/validar-km` | `ValidarKmService` | vendedor 1.0 |
| POST | `/confirmar-intencao-venda` | `ConfirmarIntencaoVendaService` | vendedor 1.0 (→ estado 3) |
| POST | `/confirmar-termo-ciencia` | `ConfirmarTermoCienciaService` | **vendedor 4.0** (→ estado 6) |
| POST | `/cancelar` | `CancelarTdvService` | 1.0 (→ estado 10) |
| GET | `/compras` | `ConsultaComprasService` | comprador (1.0, 2.0, 3.0, 6.0) |
| POST | `/confirmar-compra` | `ConfirmarCompraService` | comprador 1.0 (3→4→5) |
| POST | `/criar-compra` | `CriarCompraService` | **comprador 2.0, 3.0, 6.0** |
| POST | `/validar-tdv` | `ValidarTdvService` | **comprador 6.0** |
| POST | `/valida-assinatura` | `ValidaAssinaturaService` | 1.0 e 4.0 |
| GET | `/consulta-debitos` | `ConsultaDebitosService` | comprador (todas) |
| GET | `/enderecos/:cep` | `BuscaEnderecoService` | comprador (2.0/3.0/6.0) |
| POST | `/autodeclaracao-residencia` | `AutodeclaracaoResidenciaService` | **comprador 2.0, 3.0, 6.0** (texto da declaração) |
| POST | `/prova-vida` | `ProvaVidaService` (Rota Vida, não ServiceNow) | 1.0 e 4.0 |
| GET | `/link-assinatura-iti` | `GerarLinkAssinaturaItiService` | 1.0 e 4.0 |

Cobrimos hoje todos os endpoints que o app de produção usa nas jornadas de TDV.

Client ServiceNow: `src/clients/detran-sp-service-now/tdv/detran-sp-service-now-tdv-client.ts`
(base `/api/x_mdpdd_be_tdv/v1/tdv`).

---

## 10. Como testar cada versão localmente

Há **dois mocks distintos** e eles cobrem coisas diferentes:

### 10.1 `npm run dev:mock` — `src/mock-server.ts`
Serve o `mock-data/tdv-flow.json` e respostas fixas, via `MOCK_TDV_COMPRAS` (~linha 690):

| Placa | Versão | `origem` | Configuração |
|---|---|---|---|
| `ABC1A11` | 1.0 | `1` | `estado: '3'`, `proximaAcao: 'comprador'` |
| `DEF2B22` | 2.0 e-Notariado | `2` | `origemComunicacaoVendaVeiculo: '9'`, sem estado → cai em `criar-compra` |
| `GHI3C33` | 2.0 CDT | `3` | `origemComunicacaoVendaVeiculo: '8'` |
| `JKL4D44` | 3.0 Renave saída | `4` | — |
| `MNO6E66` | 6.0 Cartório | `6` | `codigoTransferencia: 'TDV-MOCK-O6'`, `estado: '7'` |
| `PQR5F55` | 4.0 Entrada Renave | `5` | está em `/api/tdv/veiculos` (jornada do vendedor) |

Para escolher o desfecho, **descomente** um `return` nos handlers de `/api/tdv/validar-tdv`
(`enotariado` / `duas_assinaturas` / `duas_pessoas_fisicas`) e `/api/tdv/criar-compra`
(`aviso_pagamento` / `pagamento_confirmado` / `concluido` / cada pendência; também aceita
`simularPendencia` no body).

### 10.2 `TDV_MOCK_ENABLED=true` — `TdvMockStore` in-memory
Substitui o client ServiceNow por um mock stateful
(`src/clients/detran-sp-service-now/tdv/mock/`) e **cobre todas as versões**.
`TDV_MOCK_VERSAO` escolhe qual reproduzir:

| `TDV_MOCK_VERSAO` | origem | Jornada | Massa inicial |
|---|---|---|---|
| `1.0` (default) | `1` | vendedor | vazia — o fluxo cria a TDV do zero |
| `2.0` | `2` e `3` | comprador | duas CVs (e-Notariado + CDT), sem estado e sem código |
| `3.0` | `4` | comprador | uma CV com a loja (CNPJ) como vendedora |
| `4.0` | `5` | vendedor | TDV já aberta pelo lojista via SERPRO, no estado 1 |
| `6.0` | `6` | comprador | CV de cartório **em estado 7 e sem código** (a forma real) — é o que faz o fluxo chamar `validar-tdv` antes |

Knobs: `TDV_MOCK_INITIAL_ESTADO` (1–10), `TDV_MOCK_PENDENCIA` (inclui `vistoria_pendente`),
`TDV_MOCK_VALIDAR_TDV`
(só 6.0), `TDV_MOCK_SELLER_CPF`, `TDV_MOCK_BUYER_CPF`, `TDV_MOCK_VEHICLE_PLATE`,
`TDV_MOCK_VEHICLE_RENAVAM`, `TDV_MOCK_FORCE_VEHICLE_RESTRICTION`,
`TDV_MOCK_FORCE_CIDADES_DIFERENTES`, `LIVENESS_BYPASS_MATCH`. Valor inválido avisa no boot e cai
no default; todas são ignoradas quando `APP_ENV=production`.

**Fidelidade.** A massa vem dos exemplos de resposta real do [`swagger.yaml`](./swagger.yaml):
sys_id de 32 hex para `codigoTransferenciaVeiculo` e `codigoAnexo*`; `TDV<n>` legível em
`numeroTransferenciaVeiculo`; CPF com 11 dígitos e CNPJ com 14; `ativa` como `'1'`/`'0'`;
município no código DETRAN (`7107`); criar TDV a partir de uma CV externa **promove a própria CV**
e cai no **estado 7**; erros em **HTTP 406** com o envelope real
(`{ error: { message, detail }, status: 'failure' }`); segunda TDV ativa na mesma placa recusada
com `TDVAtivaExistenteError`; e o que o serviço envia **sobrescreve** o que estava semeado.
`tdv-mock-store.test.ts` roda as cinco versões contra os serviços reais.

---

## 11. Convergência com o app de produção — o que mudou e o que ficou diferente

Esta rodada alinhou as versões 2.0/3.0/4.0/6.0 ao `detran-app-kotlin`. TDV 1.0 não foi tocada.

### 11.1 ✅ Aplicado

| # | Mudança | Por quê |
|---|---|---|
| A1 | `confirmar-termo-ciencia` voltou a mandar só `{estado:'6', confirmacaoTermoCienciaResponsabilidade:true}` | `atualizarAutodeclaracaoRenaveBody` tem só esses dois campos; a prova de vida da origem 5 é colhida e descartada de propósito (`ConfirmarEnderecoScreen.kt:709`) |
| A2 | `n_6e0a4c1d8b27` voltou a exigir `origem == 6` **E** `estado == 7` | é o gate do app (`SelecionarVeiculoScreen.kt:813`) e a definição da versão no PDF (pág. 161) |
| B1 | `criar-compra` relê e **ecoa o registro inteiro**, sem sobrescrever nada | `getCriarComunicacaoVendaEnotariado(obterTransf)` posta o registro como veio |
| B3 | `VistoriaPendenteError` → `vistoria_pendente` → `s_p2b2c3d4e5f7` | antes virava 500; o app manda para a tela de vistoria pendente |
| B4 | `RestricoesEncontradasError` com detail de taxa não localizada → `pagamento_pendente` | o app lê o `detail` em vez de mostrar erro genérico |
| C1 | autodeclaração de residência renderizada pelo ServiceNow (`POST /api/tdv/autodeclaracao-residencia` → `POST /cidadaos/{cpf}/autodeclaracao-de-residencia`) | o texto tem valor legal e é o servidor que o define |
| C2 | TCR exibido a partir de `termoCienciaResponsabilidade` do registro | idem — o app mostra o campo verbatim |
| D1 | o endereço editado deixou de ir na criação | no app ele só regera o texto da declaração |
| — | `criar-compra` não recria uma TDV existente e `cancelar` virou idempotente (§12) | reentrar numa tela anterior não pode virar erro |

Sobre C1/C2: as telas mostram o texto do servidor quando ele existe e **caem no texto montado
no flow quando não existe** (`visibilityCondition` com `is_empty`/`is_not_empty`). Nenhum
ambiente fica sem texto se o endpoint não responder.

Sobre B1, uma observação para quem for revisar: o commit `c1dca58` ("remove unnecessary API
calls from criar-compra service") tinha justamente removido consultas antes do create. A que
voltou aqui tem outro objetivo — não é enriquecer campos, é **obter o objeto que será
reenviado**. É uma consulta por criação, e sem ela não há como ecoar o registro.

### 11.2 ✅ Correções anteriores que se confirmaram certas
- **Listagem do comprador não esconde mais as CVs** (`isComunicacaoVendaExterna`): sem isso uma
  CV sem `estado` sumia da lista, e o app de produção lista tudo o que a API devolve.
- **Rotas 3/4/5 em `n_a4e7b1c9d205`**: sem elas, uma TDV de origem 2/3/4/6 com código nesses
  estados não casava com rota nenhuma e travava.
- **`emailVendedor`** vem da listagem e é omitido quando desconhecido (nunca o e-mail do
  comprador logado).
- **Reentrada da origem 5 no estado 6** vai para a assinatura, não para "comprador assinou" —
  igual ao app (`AnaliseRequisitoScreen.kt:286`).
- **Rotas mortas** removidas; ramo `false` de `n_b2c6d93e6c54` corrigido; massa mock da origem 6
  sem o `"null"` string; `console.log` de credenciais removidos.

### 11.3 ⚠️ Divergências conscientes (decididas, não esquecidas)

| Ponto | App de produção | Nós | Por quê |
|---|---|---|---|
| Origem 2/3/4 **com** `codigoTransferenciaVeiculo` | roteia por estado na lista com vários veículos, mas manda para o caminho e-notariado quando só há um (`SelecionarVeiculoScreen.kt:187`) | sempre o caminho e-notariado; `n_8c3f5d0b2a71` decide entre criar e rotear por estado | o app é inconsistente consigo mesmo nesse ponto; o nosso caminho cobre os dois casos sem duplicar tela |
| Exibição de CPF zero-padded | `maskCpf(preencherZeros(codigo,11))` corta os 11 **primeiros** dígitos e mostra `000.343.240-84` | `formatCpfCnpj` desempata por dígito verificador e mostra o CPF certo | o valor **reenviado** continua idêntico ao recebido; só a exibição é melhor |
| Cópia das telas | "Carteira Digital de Trânsito - CDT" | "CNH do Brasil" | é o que está no Figma que o DETRAN mandou — CDT está depreciado |
| Conclusão da TDV 4.0 | "Sua intenção de venda foi concluída…" | "Tudo certo! Você concluiu a venda…" | texto do Figma |
| Tela de Status | veículo hardcoded no app (`AAA-1111`) | dados reais do veículo | bug do app; não vale copiar |

### 11.4 ✅ O caminho `nova_tdv` da origem 5 é inalcançável em produção — confirmado
`n_8e2f4a6c1b3d` lê `n_d87067e61ebb.origem` (resposta do `Criar TDV`), mas `CriarTdvService` só
devolve `origem` quando **encontra uma TDV ativa**. O app tem o mesmo comportamento: a `origem`
só é conhecida depois do `TDVAtivaExistenteError` + relistagem (`AnaliseRequisitoScreen.kt:286`).
Contra o ServiceNow real, a origem 5 **sempre** entra pela rota de TDV aberta.

---

## 12. Idempotência — reentrar numa tela anterior não pode quebrar nada

A regra que a TDV 1.0 já seguia (`CriarTdvService` lista antes de criar e devolve a TDV
existente) vale para todas as versões: **todo endpoint que muda estado lê a TDV antes e só
executa a transição se ela ainda fizer sentido**. Assim, o roteamento por estado leva o cidadão
direto para o ponto certo (§2, §5.1), e se ele voltar para uma tela anterior por qualquer motivo
— botão voltar, deep link, retry depois de timeout — a chamada vira leitura, não erro.

| Endpoint | Muda estado? | Guarda | Reentrada |
|---|---|---|---|
| `POST /criar` (1.0) | 1 | lista TDVs ativas da placa e **devolve a existente** sem criar | ok |
| `POST /criar-compra` (2.0/3.0/6.0) | → 7 | se o registro já tem `codigoTransferenciaVeiculo`, **não cria**: lê e roteia por estado. Se a TDV nascer entre o lookup e o create, o `TDVAtivaExistenteError` (ou o 201 vazio) recupera o código | ok |
| `POST /validar-tdv` (6.0) | não | validação pura | ok |
| `POST /confirmar-compra` (1.0, e retomada de 2/3/4/6 nos estados 3–5) | 3→4→5 | só avança a partir de 3 ou 4; em 5+ apenas lê e devolve os dados | ok |
| `POST /confirmar-termo-ciencia` (4.0) | → 6 | `isTermoCienciaConfirmado` + estados já assinados; não repete o PATCH | ok |
| `POST /valida-assinatura` (1.0/4.0) | → 6 ou 7 | só assina a partir do estado esperado; numa segunda chamada apenas reporta `valid` | ok |
| `POST /informar-dados-venda` (1.0) | 1→2 | só avança a partir de 1 | ok |
| `POST /confirmar-intencao-venda` (1.0) | 2→3 | só avança a partir de 2 | ok |
| `POST /cancelar` (todas) | → 10 | sem código (CV que ainda não virou TDV) → no-op; já cancelada → no-op | ok |
| `GET /consulta-debitos` | 7→8 | só acelera quando o QR está pago **e** a TDV está em 7 | ok |
| `GET /compras`, `/veiculos`, `/enderecos`, `/comprador-*`, `POST /autodeclaracao-residencia`, `GET /link-assinatura-iti` | não | leitura/renderização | ok |

Duas correções entraram por causa desta auditoria:

- **`criar-compra` deixou de recriar.** Antes, com uma TDV já criada, ele mandava o `POST` e
  dependia de o ServiceNow responder `TDVAtivaExistenteError` para se recuperar — bastava o
  backend devolver outro erro (por exemplo numa TDV já em 8) para o comprador ver erro em vez da
  tela certa. Agora o caminho normal é o mesmo do app de produção: com código, só lê.
- **`cancelar` deixou de disparar PATCH cego.** Na jornada do comprador o botão "Cancelar
  compra" aparece na confirmação de dados, onde a CV **ainda não tem código** — o PATCH ia para
  uma URL sem id. E cancelar duas vezes virava erro de transição inválida.

E um beco sem saída foi fechado: os estados **3, 4 e 5** de uma TDV de origem 2/3/4/6 iam para a
Confirmação de dados e terminavam no snackbar "Estado da transferência inválido para continuar"
(o `criar-compra` não tem para onde levar esses estados). Agora vão para `Rotear por ação`, que
retoma pelo caminho do comprador da TDV 1.0 — exatamente o que o app de produção faz quando a
CV já virou TDV (`SelecionarVeiculoScreen.kt:817-860`).

---

## 13. Pendências

**Precisa de homologação** (nada aqui bloqueia o merge, mas some da lista só com um teste real):

| Versão | Caminho | O que observar |
|---|---|---|
| 2.0 (origem 2 e 3) | CV sem código → confirmação → autodeclaração → criação | `POST` com o registro completo; `201` **com** código; estado resultante 7 |
| 3.0 (origem 4) | idem, com vendedor CNPJ | CNPJ formatado nas telas; nada quebra com 14 dígitos |
| 6.0 (origem 6) | CV estado 7 → `validar-tdv` → criação | 200 no `validar-tdv`; os dois erros 406 chegando nos drawers |
| 6.0 (erro) | CV que o cartório não assinou | `DuasAssinaturasError` → drawer certo |
| 4.0 (origem 5) | TDV aberta → liveness → dados loja → TCR → assinatura | PATCH do TCR **sem** prova de vida; PATCH 7 com header ITI |
| todas | tela de endereço | o texto da autodeclaração vindo do endpoint novo (e o fallback, se ele falhar) |

**Não feito de propósito:**
- **`validar-tdv` ainda manda o subconjunto curado**, não o registro inteiro. O app manda tudo,
  mas o nosso caminho funciona hoje em homologação e mexer nele agora arriscaria o único fluxo
  da 6.0 já validado. Fica para depois do B1 estar confirmado em homolog.

**Depende do DETRAN/ServiceNow:** ver "Pendências externas" em [`tdv-versoes.md`](./tdv-versoes.md).

## 14. TDV 5.0 (Procuração) — não será implementada

**Decisão do DETRAN: descontinuada.** Nada dela existe neste repositório nem no flow, e nada
deve ser construído. O que a HU previa está registrado em [`tdv-versoes.md`](./tdv-versoes.md)
apenas como histórico.

---

## 15. Onde mexer — índice rápido

| Quero… | Arquivo / nó |
|---|---|
| mudar quem pula liveness no comprador | `n_c3f8a2e9b147` (flow) |
| mudar a detecção da jornada da loja | `n_8e2f4a6c1b3d` e `n_9b4d6e8a1c20` (flow) |
| mudar quando a TDV 6.0 valida | `n_6e0a4c1d8b27` (flow) |
| adicionar estado no roteamento das versões 2/3/4/6 | `n_a4e7b1c9d205` (flow) |
| mudar o que aparece na listagem do comprador | `src/services/tdv/consulta-compras/` + `proxima-acao-comprador.ts` |
| mudar o que a jornada da loja mostra | `src/services/tdv/analise-requisitos/` + `comprador-display-fields.ts` |
| mudar a criação de TDV a partir de CV externa | `src/services/tdv/criar-compra/` |
| mudar o texto da autodeclaração de residência | `src/services/tdv/autodeclaracao-residencia/` + nó `n_a1d5c7e93b60` |
| mudar o texto do TCR (origem 5) | `src/services/tdv/analise-requisitos/` + tela `s_800e39d059b5` |
| mapear um novo erro de pendência | `src/services/tdv/map-pendencia-error/` |
| entender/ajustar idempotência de um endpoint | §12 + o serviço correspondente |
| mapear um novo erro da TDV 6.0 | `src/services/tdv/validar-tdv/` (`PROXIMA_ACAO_BY_TYPE`) |
| mudar transições de estado | `src/clients/detran-sp-service-now/tdv/types/atualiza-tdv.ts` |
| adicionar uma origem nova | `_common.ts` (`CodigoOrigemTDV`) + os nós de bifurcação do flow |
