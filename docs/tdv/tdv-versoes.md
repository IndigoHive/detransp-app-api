# Versões da TDV (Transferência Digital de Veículo)

O fluxo hoje implementado neste repositório (`mock-data/tdv-flow.json`, `src/services/tdv/`) cobre a **TDV 1.0**. As demais versões abaixo são variações/complementos desse fluxo, cada uma cobrindo um cenário específico de transferência. Este documento é a referência única: quem precisar entender como uma versão da TDV funciona deve conseguir resolver só lendo aqui, sem precisar abrir os documentos originais.

Fontes usadas, em ordem de confiança:
1. **`História de usuário/`** — Histórias de Usuário (HU) e diagramas BPM oficiais, uma pasta por versão. Fonte de negócio mais recente e mais detalhada em regras, mensagens de tela e critérios de aceitação.
2. [`swagger.yaml`](./swagger.yaml) — contrato OpenAPI da API de TDV (ServiceNow), também recente.
3. [`tdv-especificacao.pdf`](./tdv-especificacao.pdf) — especificação técnica da API (177 páginas). Usado só para preencher mecânica de API (URLs, headers, endpoints) que a HU não detalha. **Onde ele conflita com a HU ou o swagger, HU/swagger vencem** — o PDF é mais antigo e algumas de suas regras já foram substituídas (ver notas ao longo do documento).

Os `.docx`/`.pdf` originais da HU continuam na pasta; este documento resume o que importa para não precisar abri-los no dia a dia.

## API — visão geral

- **Base URLs:** dev `https://apisndev.detran.sp.gov.br`, homologação `https://apisnqa.detran.sp.gov.br`, produção `https://apisn.detran.sp.gov.br`. Prefixo comum: `/api/x_mdpdd_be_tdv/v1/tdv`.
- **Autenticação:** OAuth 2.0 do GOV.BR (`Authorization: Bearer {token}`), token expira em 1h e não há refresh. Acesso à funcionalidade exige selo **Prata ou Ouro** no gov.br (se o usuário não tiver, o app oferece o caminho para elevar o nível).
- **Headers relevantes:** `X-CPF-Usuario` (obrigatório), `X-Integrity-Token`, `X-Authorization-Code` (código do ITI, só nas etapas de assinatura eletrônica).
- **Endpoints principais** (contrato completo no swagger):
  - `GET /tdv/veiculos` — lista veículos do proprietário; também usada para "descobrir" a versão da TDV via `origem`.
  - `GET /tdv/cidadaos/{cpf}` e `GET /tdv/enderecos/{cep}` — consultas auxiliares.
  - `POST /tdv/provas-de-vida` / `GET /tdv/provas-de-vida/{id}` — prova de vida (facial via SDK do TSE, ou GOV.BR). Regra de negócio comum a quase todas as versões: **score de reconhecimento facial abaixo de 55% obriga nova captura**.
  - `POST /tdv/transferencias-de-veiculos` — cria a TDV.
  - `GET /tdv/transferencias-de-veiculos` — lista TDVs do usuário (`codigoComprador`/`ativa` como filtro).
  - `GET`/`PATCH /tdv/transferencias-de-veiculos/{codigoTransferenciaVeiculo}` — consulta/avança o estado da TDV (mesmo endpoint para preencher dados, confirmar compra, assinar e cancelar).
  - `POST /tdv/transferencias-de-veiculos/validar-tdv` — usado no fluxo TDV 6.0 para validar a transferência antes de seguir (só no PDF, não está no swagger).
  - `GET /tdv/transferencias-de-veiculos/{codigo}/debitos` e `.../qr-code` — débitos e QR code Pix para pagamento.
  - `GET /api/x_mdpdd_be_gp/v1/ges_proc/getOutorgantes` — **serviço separado** (módulo "gp"/Gestão de Procurações), usado só pela TDV 5.0 para verificar procurações ativas do cidadão.

### Máquina de estados (`TDV.estado`)

| # | Estado |
|---|--------|
| 1 | Veículo selecionado |
| 2 | Dados da venda informados |
| 3 | ATPV-e criada |
| 4 | Intenção de compra confirmada |
| 5 | Autodeclaração de residência confirmada |
| 6 | ATPV-e assinada pelo comprador |
| 7 | ATPV-e assinada pelo vendedor e comunicação de venda gerada |
| 8 | Taxa de serviço paga |
| 9 | Transferência concluída |
| 10 | Transferência cancelada |

Cancelamento só é permitido até o estado `6`. Regras de cancelamento variam conforme já existe ou não assinatura de uma das partes (ver TDV 1.0 abaixo) e sempre têm SLA de **48h** para a outra parte aceitar/recusar o cancelamento.

### Como o app identifica a versão

O schema `TDV` do swagger tem dois campos de origem, e cada um cobre uma parte do roteamento. Cruzando os dois com o que a HU do TDV 6.0 descreve ("origem 8 ou 9" para e-Notariado/CDT, "origem Código = 5" para Cartório), a leitura mais consistente é:

| Versão | Campo | Valor |
|---|---|---|
| TDV 1.0 | `origem` | `1` (TDV nativa) |
| TDV 2.0 (e-Notariado/CDT) | `origemComunicacaoVendaVeiculo` | `9` eNotariado ou `8` Venda Digital (nome interno do fluxo CDT) |
| TDV 3.0 (Renave saída) | `origem` | `4` (Renave) — mesma origem da TDV 4.0; a HU não dá um valor próprio |
| TDV 4.0 (Renave entrada) | `origem` | `4` (Renave) |
| TDV 5.0 (Procuração) | — | não usa `origem`, ver seção própria |
| TDV 6.0 (Cartório/SEFAZ) | `origemComunicacaoVendaVeiculo` | `4` Cartório ou `5` SEFAZ (a pasta da HU chama a versão de "SEFAZ-CARTÓRIO" e cobre as duas origens; o texto da HU cita especificamente o `5`) |

Pontos de atenção:
- Para diferenciar TDV 3.0 de TDV 4.0 (ambas com `origem: '4'`), o que muda é **qual das partes é CNPJ**: na TDV 3.0 (saída) `codigoVendedor` é a loja; na TDV 4.0 (entrada) `codigoComprador` é a loja. Na prática, porém, a HU da TDV 4.0 descreve a detecção via uma checagem de negócio (existe intenção de venda gerada pelo sistema SERPRO para aquele veículo?), não via valor de `origem` — trate essa checagem como a fonte de verdade e o valor `4` como contexto.
- `tdv-especificacao.pdf` traz exemplos com `origem: '5'` (TDV 4.0) e `origem: '6'` + `estado: '7'` (TDV 6.0) que **não batem com o enum do swagger** (que vai só até `4`) nem com a HU. Como o PDF é a fonte mais antiga, tratamos esses valores como superados — não use-os sem confirmar antes.
- `codigoComprador`/`codigoVendedor` aceitam CPF (11 dígitos) ou CNPJ (14 dígitos) — é o que permite uma loja (pessoa jurídica) figurar como comprador ou vendedor nos fluxos Renave (TDV 3.0/4.0).

## TDV 1.0 — Fluxo normal (Pessoa Física)
📁 `História de usuário/TDV 1.0 - PF/` (US0079 Vendedor, US0080 Comprador)

- **Participantes:** vendedor e comprador, ambos pessoa física com conta gov.br nível Prata/Ouro.
- **Pré-condições gerais** (valem para praticamente todas as versões): veículo registrado em SP e sendo transferido dentro de SP; taxa de transferência paga previamente ao registro; vistoria válida (últimos 60 dias); sem débitos/restrições; ATPV-e emitido a partir de 04/01/2021; troca de município exige placa Mercosul; placa cinza (municipal) só transfere dentro do mesmo município.
- **Fluxo do vendedor:** login → seleciona "Vendedor" → sistema lista veículos do CPF → seleciona veículo → prova de vida facial (SDK TSE, reprovado se confiança < 55%) → informa dados do comprador (CPF, nome mascarado, e-mail, CEP/endereço) → informa dados da venda (valor, quilometragem — precisa ser ≥ à do último laudo de vistoria) → confirma → sistema gera ATPV-e e notifica o comprador ("Você foi indicado por um vendedor como comprador de um veículo").
- **Fluxo do comprador:** recebe notificação → reconhece a intenção de compra → prova de vida facial → revisa dados do vendedor/veículo/venda → aceita autodeclaração de residência → assina digitalmente via Gov.br (código enviado ao app Gov.br) → sistema gera "intenção de compra" e notifica o vendedor para assinar.
- **Assinatura final do vendedor:** vendedor assina o ATPV-e → sistema armazena hash da assinatura e o PDF → gera a Comunicação de Venda.
- **Pagamento e conclusão:** comprador tem **30 dias** para pagar a taxa via Pix (art. 233 do CTB: passar do prazo é infração média, multa de R$ 130,16, risco de remoção do veículo ao pátio) → confirmado o pagamento, sistema gera ficha RENAVAM, atualiza o proprietário (Renavam nacional e estadual), abre processo no e-CRV já aprovado, e disponibiliza o CRLV-e para download. Ambas as partes são notificadas.
- **Erros/cenários alternativos relevantes:** nível gov.br insuficiente; usuário sem veículos; validação facial pendente expira em 2h; já existe intenção de venda gerada pelo app (permite cancelar); veículo com impedimento; endereço do comprador fora de SP; município diferente sem placa Mercosul; quilometragem menor que a do laudo de vistoria; cancelamento pós-assinatura exige aceite da outra parte em até 48h (se não houver aceite, gera bloqueio administrativo no veículo).

## TDV 2.0 — e-Notariado ou CDT
📁 `História de usuário/TDV 2.0 - e-Notariado e CDT/` (US0081)

- **Participantes:** só o comprador interage no app — a venda já foi registrada externamente (cartório via sistema e-Notariado, ou app da Carteira Digital de Trânsito).
- **Fluxo:** comprador entra no app → sistema verifica se existe ao menos uma Comunicação de Venda com origem e-Notariado/CDT para o CPF → comprador seleciona a comunicação → **prova de vida facial (SDK TSE)** → sistema checa pendências antes de liberar a finalização:
  - vistoria válida? se não, mostra lista de pendências e finaliza pedindo para resolver e voltar depois;
  - tem restrição administrativa? mesma tratativa;
  - tem pendência financeira? se sim, mostra o total a pagar e oferece pagamento via Pix (QR code ou "linha para copiar").
- Pago tudo (taxa de transferência + demais pendências), sistema gera RENAVAM, atualiza proprietário, abre processo no e-CRV, libera CRLV-e para download, e notifica vendedor e comprador.
- **Erros comuns:** nível gov.br insuficiente; nenhuma comunicação de venda/ATPV-e encontrada para o CPF; comprador não reconhece a indicação de compra (cancela e notifica o vendedor).

## TDV 3.0 — Saída Renave usados ("Loja vende para o cidadão")
📁 `História de usuário/TDV 3.0 - Renave Usado Saída Loja/`

- **Participantes (esperado):** cidadão comprador; loja/revenda (CNPJ, cadastrada no Renave) como vendedora.
- **⚠️ Ainda não especificado:** apesar de existir uma pasta dedicada, todo o conteúdo nela (`Vendedor.pdf`, `Comprador.pdf`, `Solicitação de Cancelamento.pdf`, `Transferência de Propriedade de Veículo.pdf`, `Negócio + Requisitos.pdf`, `Visão Geral das 4 Jornadas do TDV.pdf`) é material de referência do fluxo **padrão da TDV 1.0** (BPMN das 4 jornadas, cancelamento, etc.) — não há nenhuma regra específica da "saída" Renave documentada. O único arquivo Renave-específico na pasta (`RENAVE-ENTRADA.pdf`) descreve na verdade o fluxo de **entrada** (TDV 4.0), aparentemente colocado ali como referência cruzada.
- **Ação:** essa é a única versão sem nenhuma especificação própria encontrada em nenhuma das três fontes. Precisa ser levantada com o time de negócio/Detran antes de qualquer implementação.

## TDV 4.0 — Entrada Renave usados ("Loja compra do cidadão")
📁 `História de usuário/TDV 4.0 - Renave Usado Entrada Loja/` (US0000) e `TDV 3.0/RENAVE-ENTRADA.pdf`

- **Participantes:** cidadão vendedor (pessoa física); loja/revenda (CNPJ) como compradora, com a intenção de compra **iniciada pelo lojista no sistema SERPRO** (transação **PRNV 258**), não pelo cidadão.
- **Fluxo:** cidadão loga → seleciona "Vendedor" → sistema lista veículos do CPF → seleciona o veículo → sistema verifica se **já existe uma intenção de venda gerada pelo sistema SERPRO** para aquele veículo:
  - se não existir, segue o processo de TDV padrão (TDV 1.0);
  - se existir, localiza a intenção de compra do lojista → prova de vida facial do vendedor → cidadão confirma os dados do lojista (CNPJ, nome, e-mail, endereço) e os dados da venda (valor, km) → confirma a intenção de venda.
- **Documento digital vs. físico:** sistema verifica se o veículo tem CRV digital ou físico:
  - **Digital:** vai direto para a assinatura.
  - **Físico:** gera um documento com texto padrão definido pela área de negócio: *"Eu, (Nome do Vendedor), portador do CPF nº (CPF), reconheço a venda do veículo de placa (placa) e RENAVAM (renavam), por meio do sistema RENAVE, ao CNPJ nº (CNPJ do lojista)."*, que o vendedor assina.
- Vendedor assina a Intenção de venda (ATPV-e) via Gov.br → sistema insere a assinatura no documento digital através da **transação PRNV 258** do SERPRO → checa débitos/restrições/vistoria → se houver impedimento, encerra com mensagem orientando a resolver a pendência → se não houver, notifica o lojista via **API SERPRO**, gera RENAVAM, atualiza proprietário e emite CRLV.
- **Detecção pelo app:** a HU (US0000) descreve a checagem como uma regra de negócio — ao selecionar o veículo, o sistema verifica se **já existe uma intenção de venda gerada pelo sistema SERPRO** para aquele veículo (se não existir, segue TDV 1.0 padrão). No schema do swagger isso corresponde a `origem: '4'` (Renave).

## TDV 5.0 — Procuração (CPF ou CNPJ)
📁 `História de usuário/TDV 5.0 - CNPJ por Procuração/` (US0081 "TDV 5.1")

- **Participantes:** um **procurador** (pessoa física com procuração ativa) atuando em nome de um **outorgante**, que pode ser Pessoa Física ou Pessoa Jurídica, tanto do lado vendedor quanto comprador.
- **Não usa o campo `origem`** — é resolvido por um serviço à parte, antes de entrar no fluxo de TDV:
  1. Logo após o onboarding, o cidadão escolhe entre "Veículo Próprio" (segue TDV 1.0 normalmente, listando veículos do próprio CPF) ou "Veículos de Terceiros" (procuração).
  2. Se por procuração, o app chama `GET /api/x_mdpdd_be_gp/v1/ges_proc/getOutorgantes?servico=...&cpf=...` para listar as procurações ativas do CPF logado (200 com lista de outorgantes, 404 se não houver nenhuma).
  3. Outorgantes são exibidos em abas — **CPF primeiro, CNPJ em seguida** — para o procurador escolher quem representar.
  4. Escolhido o outorgante, o sistema passa o CPF ou CNPJ dele para o fluxo, que a partir daí **segue exatamente como a TDV 1.0** (mesmas telas de vendedor/comprador), listando os veículos do outorgante em vez do procurador.
- **Identificação do comprador também aceita CNPJ:** quando o procurador informa quem é o comprador, pode digitar CPF ou CNPJ; o sistema valida a existência via **API do B-Cadastro** (pessoa física ou jurídica) e garante que o identificador do comprador seja diferente do identificador do proprietário (mensagens de erro específicas para cada caso: "O CPF/CNPJ do comprador precisa ser diferente do proprietário").
- Todas as demais validações (endereço em SP, placa Mercosul entre municípios, KM da vistoria) permanecem as mesmas da TDV 1.0.
- **Detalhe de integração:** toda chamada subsequente do fluxo por procuração inclui os headers `X-cpf-procurador` e `X-procuracao-number` (conforme o `tdv-especificacao.pdf`, pág. 155–160), que fazem o app exibir um card azul indicando que a operação é feita por procuração.

## TDV 6.0 — Cartório / SEFAZ
📁 `História de usuário/TDV 6.0 - SEFAZ-CARTÓRIO/` (US0001 "V6.1")

- **Participantes:** só o comprador interage no app — a Comunicação de Venda já foi registrada em cartório integrado à SEFAZ.
- **Fluxo:** idêntico ao da TDV 2.0 (e-Notariado/CDT) — reaproveita as mesmas telas — mas com **duas validações extras logo na seleção da comunicação de venda**, exclusivas dessa versão:
  1. **Duas assinaturas obrigatórias:** se o campo indicativo de assinaturas da CV for diferente de `2`, o app exibe mensagem de que a CV não atende ao pré-requisito e orienta o cidadão a procurar atendimento presencial, voltando à tela inicial.
  2. **Só pessoa física:** se vendedor ou comprador da CV forem CNPJ, mesma orientação de atendimento presencial (essa versão não aceita pessoa jurídica em nenhuma ponta).
- Passadas as duas validações, segue o mesmo roteiro de TDV 2.0: checa vistoria/restrições/pendências financeiras, paga via Pix o que faltar, gera RENAVAM/e-CRV/CRLV-e.
- **Resumo da própria HU:** *"Este fluxo segue a mesma regra para e-Notariado e CDT [...]. A sequência da TDV segue o restante do fluxo CDT / e-Notariado."* — ou seja, TDV 6.0 = TDV 2.0 + as duas checagens acima.
- **Detecção pelo app:** `origemComunicacaoVendaVeiculo` igual a `4` (Cartório) ou `5` (SEFAZ) na Comunicação de Venda — a HU cita o código `5` explicitamente. Os erros de validação (quando as duas checagens acima falham) são `DuasAssinaturasError` e `DuasPessoasFisicasError`.

## Próximos passos
- Levantar a especificação da TDV 3.0 (Saída Renave) — não existe em nenhuma das fontes atuais (nem HU, nem swagger, nem PDF), só o fluxo inverso (TDV 4.0) está documentado.
- Confirmar com o backend a detecção exata de TDV 3.0 vs. TDV 4.0 em runtime (ambas com `origem: '4'` — a diferença é qual parte é CNPJ).
- Detalhar, por versão, as telas/validações do app conforme forem implementadas (hoje só a TDV 1.0 está em `mock-data/tdv-flow.json`).
