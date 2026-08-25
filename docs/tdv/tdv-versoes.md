# Versões da TDV (Transferência Digital de Veículo)

O fluxo implementado neste repositório (`mock-data/tdv-flow.json`, `src/services/tdv/`) cobre hoje as **TDV 1.0, 2.0, 3.0, 4.0 e 6.0**; a **TDV 5.0 não será implementada** (ver a seção própria). Cada versão cobre um cenário específico de transferência. Este documento é a referência única de **regra de negócio e contrato**: quem precisar entender como uma versão da TDV funciona deve conseguir resolver só lendo aqui, sem precisar abrir os documentos originais.

Fontes usadas, em ordem de confiança:
1. **`detran-app-kotlin`** — o app que está hoje na Play Store. É a **fonte de verdade de comportamento**: o DETRAN espera que o nosso fluxo se comporte igual a ele. Onde o app diverge da HU ou do PDF, **o app vence** (e a divergência fica anotada aqui).
2. **`História de usuário/`** — Histórias de Usuário (HU) e diagramas BPM oficiais, uma pasta por versão. Fonte de negócio para intenção, mensagens de tela e critérios de aceitação.
3. [`swagger.yaml`](./swagger.yaml) — contrato OpenAPI da API de TDV (ServiceNow). Está **incompleto**: faltam `origem` `5`/`6` e dois endpoints que o app usa em produção (`validar-tdv` e `autodeclaracao-de-residencia`).
4. [`tdv-especificacao.pdf`](./tdv-especificacao.pdf) — especificação técnica da API (177 páginas). Usado para mecânica de API (URLs, headers, bodies) que a HU não detalha. É a fonte mais antiga; onde conflita com o app ou o swagger, perde.

Os `.docx`/`.pdf` originais da HU continuam na pasta; este documento resume o que importa para não precisar abri-los no dia a dia.

> A **implementação** de cada versão (telas, nós do flow, serviços da API) e as divergências
> em aberto estão em [`tdv-versoes-implementacao.md`](./tdv-versoes-implementacao.md).

## Onde olhar no app de produção

Mapa dos arquivos do `detran-app-kotlin` citados ao longo deste documento:

| Arquivo | O que resolve |
|---|---|
| `ui/data/TransferenciaService.kt` | **Contrato completo** da API TDV usada em produção (Retrofit) |
| `ui/model/transferencia/encontrarTransf.kt` | `obterTransf` — o registro TDV completo, tal como é lido **e reenviado** |
| `ui/screens/transferencia/SelecionarVeiculoScreen.kt` | Roteamento do comprador por `origem`/`estado` (o "cérebro" das versões 2/3/4/6) |
| `ui/screens/transferencia/AnaliseRequisitoScreen.kt` | Roteamento do vendedor (criação, TDV ativa, retomada) |
| `ui/screens/transferencia/ConfirmacaoDadosScreen.kt` | Confirmação de dados nos 3 modos: COMPRADOR, VENDEDOR, RENAVE |
| `ui/screens/transferencia/ConfirmarEnderecoScreen.kt` | Autodeclaração de residência, TCR da TDV 4.0 e a **criação da TDV** nas versões 2/3/4/6 |
| `ui/screens/transferencia/enotariado/` | Telas de pendência e status (vistoria/pagamento) |
| `ui/screens/transferencia/AssinaturaScreen.kt` | Assinatura ITI nos 3 modos |
| `ui/screens/transferencia/ReconhecimentoFacialScreen.kt` | Prova de vida (Rota Vida) e para onde ela devolve |

## API — visão geral

- **Base URLs:** dev `https://apisndev.detran.sp.gov.br`, homologação `https://apisnqa.detran.sp.gov.br`, produção `https://apisn.detran.sp.gov.br`. Prefixo comum: `/api/x_mdpdd_be_tdv/v1/tdv`.
- **Autenticação:** OAuth 2.0 do GOV.BR (`Authorization: Bearer {token}`), token expira em 1h e não há refresh. Acesso à funcionalidade exige selo **Prata ou Ouro** no gov.br (se o usuário não tiver, o app oferece o caminho para elevar o nível).
- **Headers relevantes:** `X-CPF-Usuario` (obrigatório), `User-Agent` (obrigatório, formato `{Android|iOS}/appdt/{versão}`), `X-Integrity-Token`, `X-Authorization-Code` (código do ITI, **só** nas etapas de assinatura — e nunca no corpo).
- **Endpoints** (o que o app de produção realmente chama):

| Método | Rota | Uso |
|---|---|---|
| `GET` | `/tdv/veiculos` | veículos do proprietário (jornada do vendedor) |
| `GET` | `/tdv/transferencias-de-veiculos?codigoComprador=&ativa=` | TDVs/CVs do comprador (**sem `campos`** — devolve o registro inteiro) |
| `GET` | `/tdv/transferencias-de-veiculos?placaVeiculo=&ativa=` | TDV ativa de um veículo (jornada do vendedor) |
| `POST` | `/tdv/transferencias-de-veiculos` | cria a TDV. **Dois formatos de corpo** — ver abaixo |
| `GET` | `/tdv/transferencias-de-veiculos/{codigo}` | lê a TDV (dados, autodeclaração, TCR, estado) |
| `PATCH` | `/tdv/transferencias-de-veiculos/{codigo}` | avança o estado (todas as transições usam este endpoint) |
| `POST` | `/tdv/transferencias-de-veiculos/validar-tdv` | **TDV 6.0**: valida a CV de cartório. Corpo = registro `obterTransf` inteiro. 200 = ok, 406 = erro de validação. **Não está no swagger** |
| `POST` | `/tdv/cidadaos/{cpf}/autodeclaracao-de-residencia` | gera o **texto** da autodeclaração a partir de um endereço. **Não está no swagger** |
| `GET` | `/tdv/cidadaos/{cpf}` · `/tdv/enderecos/{cep}` | consultas auxiliares (dados do comprador, CEP) |
| `POST`/`GET` | `/tdv/provas-de-vida` (+ Rota Vida `prova/v3`, `match/v3`, `ds/{localId}`) | prova de vida facial. Score < 55% obriga nova captura |
| `GET` | `/tdv/transferencias-de-veiculos/{codigo}/debitos` · `.../qr-code` | débitos e QR Code Pix |

### Os dois formatos de `POST /transferencias-de-veiculos`

Este é o detalhe que mais confunde, e é o que o app faz:

**a) Vendedor abrindo uma TDV nova (TDV 1.0)** — corpo enxuto, `origem` fixa em `1`
(`criarTransferenciaVeiculoBody`):
```json
{ "placaVeiculo": "…", "nomeVendedor": "…", "emailVendedor": "…",
  "codigoVendedor": "…", "origem": 1, "codigoRenavamVeiculo": "…" }
```

**b) Comprador materializando uma Comunicação de Venda externa (TDV 2.0/3.0/6.0)** — corpo é
o **registro `obterTransf` inteiro**, exatamente como veio da listagem, com
`confirmacaoAutodeclaracaoResidenciaComprador = true`
(`getCriarComunicacaoVendaEnotariado`, `ConfirmarEnderecoScreen.kt:700`). Não é um subconjunto
escolhido a dedo: é o **eco do registro recebido**.

Resposta: `201` com `{ "result": { "codigoTransferenciaVeiculo": "…" } }` — **e o PDF (pág. 116)
prevê 201 com corpo vazio** como sucesso também. `TDVAtivaExistenteError` significa "já existe",
e o app trata como sucesso: relê a TDV e segue.

### Máquina de estados (`TDV.estado`)

| # | Estado | Observação |
|---|--------|---|
| 1 | Veículo selecionado | |
| 2 | Dados da venda informados | |
| 3 | ATPV-e criada | |
| 4 | Intenção de compra confirmada | |
| 5 | Autodeclaração de residência confirmada | |
| 6 | ATPV-e assinada pelo comprador | **na TDV 4.0 significa outra coisa**: o vendedor aceitou o TCR |
| 7 | ATPV-e assinada pelo vendedor e comunicação de venda gerada | é onde as CVs externas costumam nascer |
| 8 | Taxa de serviço paga | |
| 9 | Transferência concluída | |
| 10 | Transferência cancelada | |

Cancelamento (`PATCH { estado: "10" }`) só é permitido até o estado `6`. Regras de cancelamento
variam conforme já existe ou não assinatura de uma das partes e têm SLA de **48h** para a outra
parte aceitar/recusar (se não houver aceite, gera bloqueio administrativo no veículo).

### Como o app identifica a versão

O roteamento sai do campo **`origem`** do registro TDV — mas, para o comprador, `origem`
sozinha não decide: o par **`origem` + `codigoTransferenciaVeiculo`** (e, na 6.0, o `estado`) é
que manda.

| `origem` | Significado | Versão |
|---|---|---|
| `1` | Seleção de veículo (TDV nativa) | TDV 1.0 |
| `2` | Comunicação de venda e-Notariado | TDV 2.0 |
| `3` | Comunicação de venda CDT | TDV 2.0 |
| `4` | ATPV-e Renave seminovos (saída da loja) | TDV 3.0 |
| `5` | Entrada Renave (venda para a loja) | TDV 4.0 |
| `6` | Cartório / SEFAZ | TDV 6.0 |

**Roteamento do comprador, como está em produção** (`SelecionarVeiculoScreen.kt:798-872`):

```
codigoTransferenciaVeiculo vazio  E  origem ∈ {2,3,4}   →  fluxo "e-notariado" (sem prova de vida)
origem == 6  E  estado == 7                            →  POST validar-tdv, e então fluxo "e-notariado"
qualquer outro caso (inclui origem 1)                  →  roteia por estado:
      3, 7, 8, 9 → tela de acompanhamento da compra
      4          → confirmação de dados
      5          → assinatura
      6          → "aguardando o vendedor assinar"
      demais     → prova de vida (TDV 1.0)
```

Pontos de atenção:
- **A prova de vida do comprador só existe na TDV 1.0.** Nas versões 2.0/3.0/6.0 o app pula
  direto para a confirmação de dados. A HU da TDV 2.0 menciona prova de vida; **o app não faz**,
  e o app é a fonte de verdade.
- **`origem` 2/3/4 com `codigoTransferenciaVeiculo` preenchido** cai no roteamento por estado
  (a CV já virou TDV; não há o que criar). Exceção: quando o comprador tem **um único** veículo
  o app pula a tela de seleção e manda para o fluxo e-notariado mesmo com código
  (`SelecionarVeiculoScreen.kt:187-196`) — inconsistência do próprio app.
- **O `swagger.yaml` está desatualizado**: o enum `origem` dele só vai até `4`. Os valores `5` e
  `6` são o que o ServiceNow devolve. Não use o swagger como fonte para origem.
- `origemComunicacaoVendaVeiculo` (1–9) é um campo **diferente**, que diz de onde veio a
  *Comunicação de Venda*, não a TDV. O app **não roteia por ele** — só o repassa adiante.
  Costuma acompanhar a origem (origem `2` ↔ `9` eNotariado, `3` ↔ `8` Venda Digital,
  `6` ↔ `4` Cartório), mas não é o que decide a versão.
- **Cópia das telas: o Figma vence o app.** O app de produção ainda manda o cidadão para a
  "Carteira Digital de Trânsito - CDT" nas telas de conclusão; o **CDT está depreciado** e o
  Figma que o DETRAN enviou já traz "CNH do Brasil". Onde a nossa cópia diferir do app por esse
  motivo, está certo — não "corrigir" de volta.
- `codigoComprador`/`codigoVendedor` aceitam CPF (11 dígitos) ou CNPJ (14 dígitos) — é o que
  permite uma loja figurar como comprador (TDV 4.0) ou vendedor (TDV 3.0). **Atenção: o
  ServiceNow devolve CPF zero-padded para 14 dígitos** em algumas listagens (confirmado em
  campo numa CV de origem 6), mesma largura de um CNPJ. Quem for exibir precisa desempatar;
  quem for reenviar **não pode alterar o valor** — o DETRAN exige o documento de volta
  exatamente como veio.

---

## TDV 1.0 — Fluxo normal (Pessoa Física) — origem `1`
📁 `História de usuário/TDV 1.0 - PF/` (US0079 Vendedor, US0080 Comprador)

> **Status: implementada, testada e validada.** Não mexer sem necessidade — é a linha de base
> com que as outras versões são comparadas.

- **Participantes:** vendedor e comprador, ambos pessoa física com conta gov.br nível Prata/Ouro.
- **Pré-condições gerais** (valem para praticamente todas as versões): veículo registrado em SP e sendo transferido dentro de SP; taxa de transferência paga previamente ao registro; vistoria válida (últimos 60 dias); sem débitos/restrições; ATPV-e emitido a partir de 04/01/2021; troca de município exige placa Mercosul; placa cinza (municipal) só transfere dentro do mesmo município.
- **Fluxo do vendedor:** login → seleciona "Vendedor" → sistema lista veículos do CPF → seleciona veículo → **cria a TDV** (`POST`, formato "a", `origem: 1`) → prova de vida facial (SDK TSE, reprovado se confiança < 55%) → informa dados do comprador (CPF, nome mascarado, e-mail, CEP/endereço) → informa dados da venda (valor, quilometragem — precisa ser ≥ à do último laudo de vistoria; `PATCH` estado 2 levando `codigoProvaVidaVendedor`) → confirma (`PATCH` estado 3) → sistema gera ATPV-e e notifica o comprador ("Você foi indicado por um vendedor como comprador de um veículo").
- **Fluxo do comprador:** recebe notificação → reconhece a intenção de compra → prova de vida facial → revisa dados do vendedor/veículo/venda (`PATCH` estado 4 com `codigoProvaVidaComprador`) → aceita a autodeclaração de residência (`PATCH { estado: 5, confirmacaoAutodeclaracaoResidenciaComprador: true }`) → assina via Gov.br/ITI (`PATCH { estado: 6 }` + header `X-Authorization-Code`) → sistema notifica o vendedor para assinar.
- **Assinatura final do vendedor:** `PATCH { estado: 7 }` + `X-Authorization-Code` → sistema armazena o hash da assinatura e o PDF, e gera a Comunicação de Venda.
- **Pagamento e conclusão:** comprador tem **30 dias** para pagar a taxa via Pix (art. 233 do CTB: passar do prazo é infração média, multa de R$ 130,16, risco de remoção ao pátio) → confirmado o pagamento (estado 8), sistema gera ficha RENAVAM, atualiza o proprietário (Renavam nacional e estadual), abre processo no e-CRV já aprovado e disponibiliza o CRLV-e (estado 9). Ambas as partes são notificadas.
- **Erros/cenários alternativos relevantes:** nível gov.br insuficiente; usuário sem veículos; validação facial pendente expira em 2h; já existe intenção de venda gerada pelo app (permite cancelar); veículo com impedimento; endereço do comprador fora de SP; município diferente sem placa Mercosul; quilometragem menor que a do laudo de vistoria; cancelamento pós-assinatura exige aceite da outra parte em até 48h.

---

## TDV 2.0 — e-Notariado ou CDT — origem `2` e `3`
📁 `História de usuário/TDV 2.0 - e-Notariado e CDT/` (US0081)

- **Participantes:** só o comprador interage no app — a venda já foi registrada externamente
  (cartório via sistema e-Notariado, ou app da Carteira Digital de Trânsito). O vendedor não entra.
- **Como a CV aparece:** na listagem do comprador com `origem` `2`/`3` e
  `codigoTransferenciaVeiculo` **nulo** — a regra que o próprio PDF enuncia (pág. 108) e que o
  app aplica.

**Jornada, passo a passo, como o app faz:**

1. **Seleção** → sem prova de vida, vai direto para a confirmação de dados.
2. **Confirmação de dados** (`ConfirmacaoDadosScreen`, `isEnotariado = true`): mostra CPF
   (mascarado a partir do `codigoComprador`), nome, endereço do comprador, placa, marca/modelo,
   quilometragem e **"Valor não informado"** como valor de venda (a CV externa não traz valor).
   Botões: **Confirmar** e **Cancelar compra**.
3. **Autodeclaração de residência** (`ConfirmarEnderecoScreen`): o app **pede o texto ao
   servidor** — `POST /cidadaos/{cpf}/autodeclaracao-de-residencia` com
   `{logradouro, numero, complemento, bairro, municipio, uf, nomeUF}` → resposta
   `{ result: { autodeclaracaoResidencia: "Eu, … declaro para os devidos fins que resido em …" } }`.
   Checkbox obrigatório: *"Eu confirmo que as informações acima são verdadeiras"*.
   - **Alterar endereço** abre uma tela com CEP (com busca), Cidade, Bairro, Logradouro, Número
     e Complemento; o endereço editado é usado **apenas para regerar o texto** — o app não o
     envia na criação da TDV.
4. **Confirmar** → se já existe `codigoTransferenciaVeiculo`, só relê a TDV
   (`GET /transferencias-de-veiculos/{codigo}`); senão **cria** com o registro inteiro
   (formato "b" acima).
5. **Desfecho:** sucesso → tela de acompanhamento roteada por `estado` (7 = aviso de pagamento,
   8 = pagamento confirmado, 9 = concluído). Erros conhecidos viram telas específicas:

| Erro do ServiceNow | Para onde vai |
|---|---|
| `TDVAtivaExistenteError` | relê a TDV e segue (é sucesso) |
| `SituacaoAdministrativaPendenteError` | pendência administrativa |
| `SituacaoJudicialPendenteError` | pendência judicial |
| `SituacoesAdministrativaJudicialPendentesError` | pendência administrativa **e** judicial |
| `VistoriaPendenteError` | Status da transferência com **vistoria** pendente |
| `PagamentoPendenteError` | Status da transferência com **pagamento** pendente |
| `PagamentoVistoriaPendentesError` | Status da transferência com **pagamento** pendente |
| `RestricoesEncontradasError` + detail contendo "PAGAMENTO DE TAXA DE SERVIÇO NÃO LOCALIZADO" | tela de acompanhamento da compra |

6. **Pagamento:** tela de Status (linhas "Vistoria" e "Pagamento", cada uma Regular/Pendente) →
   seta em "Pagamento" → `GET .../debitos` → lista de débitos + total → **Pagar com Pix** →
   QR Code (`GET .../qr-code`) → confirmação.

- **Divergência registrada:** a HU pede prova de vida facial do comprador; **o app de produção
  não faz** nas versões 2.0/3.0/6.0. Seguimos o app.

---

## TDV 3.0 — Saída Renave usados ("Loja vende para o cidadão") — origem `4`
📁 `História de usuário/TDV 3.0 - Renave Usado Saída Loja/`

- **Participantes:** cidadão comprador; loja/revenda (CNPJ, cadastrada no Renave) como vendedora.
- **Sem HU própria:** todo o conteúdo da pasta é material de referência da TDV 1.0 (BPMN das 4
  jornadas, cancelamento etc.). O único arquivo Renave-específico (`RENAVE-ENTRADA.pdf`)
  descreve o fluxo de **entrada** (TDV 4.0).
- **Mas o comportamento está definido pelo app:** `origem = 4` é tratada **exatamente como
  e-Notariado/CDT** — a mesma cláusula `origem ∈ {2,3,4}` em todos os pontos de decisão
  (`SelecionarVeiculoScreen.kt:573`, `:801`, `:996`, `:1003`). Não há nenhuma tela, chamada ou
  validação exclusiva da 3.0.
- **A diferença é de dados, não de fluxo:** aqui o **vendedor é CNPJ**, então `codigoVendedor`
  vem com 14 dígitos e as telas que mostram "quem está vendendo" precisam formatar CNPJ.
- **Conclusão prática:** implementar a TDV 3.0 = garantir que o caminho e-notariado funcione com
  vendedor pessoa jurídica. Não há regra de negócio adicional a levantar com o DETRAN.

---

## TDV 4.0 — Entrada Renave usados ("Loja compra do cidadão") — origem `5`
📁 `História de usuário/TDV 4.0 - Renave Usado Entrada Loja/` (US0000) e `TDV 3.0/RENAVE-ENTRADA.pdf`

- **Participantes:** cidadão **vendedor** (pessoa física); loja/revenda (CNPJ) como compradora,
  com a intenção de compra **iniciada pelo lojista no sistema SERPRO** (transação **PRNV 258**),
  não pelo cidadão.
- **Como aparece:** o cidadão entra como vendedor, escolhe o veículo, e a TDV já existe com
  `origem = 5` e `codigoVendedor` = CPF dele. O app descobre isso ao tentar criar a TDV e
  receber `TDVAtivaExistenteError`, relendo então a listagem por placa.

**Jornada, passo a passo, como o app faz** (`AnaliseRequisitoScreen` → `ConfirmarEnderecoScreen`):

1. **Roteamento na entrada:** `estado == 6` → vai direto para a **assinatura**; `estado ∈
   {6,7,8,9}` **e** `origem ≠ 5` → acompanhamento; caso contrário → tela "já existe uma
   transferência em andamento" (continuar ou cancelar).
2. **Continuar:** `origem == 5` tem **precedência sobre o estado** — sempre vai para a
   **prova de vida** (`AnaliseRequisitoScreen.kt:644`). Ou seja, **a prova de vida existe na
   TDV 4.0** e é obrigatória.
3. **Confirmação de dados da loja** (`ConfirmacaoDadosScreen`, modo RENAVE): renavam, placa,
   ano de fabricação, marca/modelo, cor, chassi, **CNPJ**, razão social, e-mail e endereço da
   empresa, com o aviso *"Se os dados estiverem incorretos, cancele a solicitação e ajuste as
   informações antes de prosseguir."*. Botões: **Confirmar** e **Cancelar venda**.
4. **Termo de Ciência e Responsabilidade (TCR):** o app lê a TDV
   (`GET /transferencias-de-veiculos/{codigo}`) e, quando `origem == 5`, **exibe o texto que
   vem no campo `termoCienciaResponsabilidade` do próprio registro** — o texto é do servidor,
   não montado no app. Títulos: *"Leia atentamente e aceite os termos da venda"* /
   *"Termo de ciência e responsabilidade"*; checkbox *"Declaro que li e concordo com os termos
   e condições acima."*
5. **Aceite do TCR:** `PATCH { "estado": "6", "confirmacaoTermoCienciaResponsabilidade": true }`
   — **e nada mais**. O `codigoProvaVida` colhido no passo 2 **não é enviado** em lugar nenhum
   nesta jornada (`atualizarAutodeclaracaoRenaveBody` só tem esses dois campos).
6. **Assinatura:** ITI → `PATCH { "estado": "7" }` + header `X-Authorization-Code`.
7. **Conclusão:** *"Sua intenção de venda foi concluída — A pessoa que está comprando o veículo
   foi informada."* Não há Pix nem tela de comprador nesta jornada: o lojista é notificado via
   API SERPRO e o restante corre fora do app.

- **Documento digital vs. físico (HU):** se o veículo tem CRV **digital**, vai direto para a
  assinatura; se **físico**, a HU prevê um documento com texto padrão definido pela área de
  negócio (*"Eu, (Nome do Vendedor), portador do CPF nº (CPF), reconheço a venda do veículo de
  placa (placa) e RENAVAM (renavam), por meio do sistema RENAVE, ao CNPJ nº (CNPJ do
  lojista)."*). Na prática esse é o papel que o `termoCienciaResponsabilidade` do registro
  cumpre.
- **Estado 6 aqui não é "comprador assinou"** — é "o vendedor aceitou o TCR". Nenhum comprador
  assina pelo app na TDV 4.0.

---

## TDV 5.0 — Procuração (CPF ou CNPJ) — ⛔ NÃO IMPLEMENTAR
📁 `História de usuário/TDV 5.0 - CNPJ por Procuração/` (US0081 "TDV 5.1")

> **Decisão do DETRAN: a TDV 5.0 será descontinuada e não deve ser implementada.**
> Nada dela existe hoje na nossa API nem no flow, e nada deve ser construído. Esta seção fica
> apenas como registro histórico do que a HU descrevia — **não a use como backlog**.

O que a HU previa: um **procurador** (pessoa física com procuração ativa) atuando em nome de um
**outorgante** (PF ou PJ), resolvido antes do fluxo de TDV por um serviço à parte
(`GET /api/x_mdpdd_be_gp/v1/ges_proc/getOutorgantes?servico=…&cpf=…`), com escolha do outorgante
em abas (CPF primeiro, CNPJ depois), headers `X-cpf-procurador` e `X-procuracao-number` em todas
as chamadas seguintes, validação do comprador por CPF **ou** CNPJ via B-Cadastro e um card azul
nas telas indicando a procuração. A partir da escolha do outorgante, o resto seria idêntico à
TDV 1.0, listando os veículos do outorgante.

---

## TDV 6.0 — Cartório / SEFAZ — origem `6`
📁 `História de usuário/TDV 6.0 - SEFAZ-CARTÓRIO/` (US0001 "V6.1")

- **Participantes:** só o comprador interage no app — a Comunicação de Venda já foi registrada
  em cartório integrado à SEFAZ, **com as duas assinaturas já colhidas lá**.
- **Como aparece:** `origem = 6` e `estado = 7` na listagem do comprador (é assim que o PDF,
  pág. 161, manda identificar a versão, e é assim que o app decide). `codigoTransferenciaVeiculo`
  costuma vir **nulo** — a CV ainda não é uma TDV.
- **A diferença para a 2.0 é uma chamada a mais, antes de tudo:**
  `POST /transferencias-de-veiculos/validar-tdv`, com o registro `obterTransf` **inteiro** no
  corpo. `200` = pode seguir; `406` traz o motivo em `error.message`:

  1. **`DuasAssinaturasError`** — o cartório não comunicou as duas assinaturas. Mensagem:
     *"Transferência digital indisponível: falta de assinatura"* → *"Para este serviço, é
     obrigatório que o cartório tenha comunicado a assinatura tanto do comprador quanto do
     vendedor. Não foi localizada uma assinatura. Portanto, para realizar sua transferência o
     comprador precisa solicitar transferência pelo serviço **Transferir Propriedade de Veículo
     Registrado em São Paulo**."*
  2. **`DuasPessoasFisicasError`** — alguma das partes é PJ. Mensagem: *"Transferência digital
     indisponível: requisito de pessoas físicas não atendido"* → *"Este serviço é destinado
     **exclusivamente** quando o comprador e vendedor são **pessoas físicas**. Caso uma das
     partes for uma empresa (pessoa jurídica), solicite a transferência pelo serviço
     **Transferir Propriedade de Veículo Registrado em São Paulo**."*

  No app essas duas mensagens aparecem em **bottom sheet**, e o cidadão volta para a listagem.
- **Passada a validação, é exatamente a TDV 2.0**: confirmação de dados → autodeclaração de
  residência (texto do servidor) → criação com o registro inteiro → pendências/pagamento.
  A própria HU resume: *"Este fluxo segue a mesma regra para e-Notariado e CDT [...]. A sequência
  da TDV segue o restante do fluxo CDT / e-Notariado."*
- **Detalhe de gate:** em produção o `validar-tdv` só é chamado quando `origem == 6` **e**
  `estado == 7` (`SelecionarVeiculoScreen.kt:813`). Uma CV de cartório em outro estado cai no
  roteamento por estado, como uma TDV comum.

---

## Pendências externas (dependem do DETRAN / ServiceNow)

- Atualizar o `swagger.yaml`: falta `origem` `5` e `6`, o endpoint `validar-tdv` e o endpoint
  `POST /cidadaos/{cpf}/autodeclaracao-de-residencia`.
- Confirmar o contrato do `POST /transferencias-de-veiculos` no formato "b" (eco do registro):
  quais campos são realmente obrigatórios, e se `201` com corpo vazio é resposta esperada
  (o PDF diz que sim; a resposta sem código já apareceu em homologação).
- Confirmar se a prova de vida colhida na TDV 4.0 deve ser enviada em alguma transição — hoje o
  app de produção a descarta.
