## GOVERNO DO ESTADO DE SÃO PAULO

#### SECRETARIA DE GOVERNO

# APP Detran - Transferência de veículos


**Projeto:** Detran **Data** : 20/01/

# Histórico da Revisão

```
Data Versão Descrição Autor
```
20/01/2025 1.0 Versão Inicial - Montagem de layout Roberto Pina

17/03/2025 1.1 Inclusão de serviços do TDV 4.0 Roberto Pina

03/07/2025 1.2 Após nova refatoração foram trocadas
todas as urls do TDV para o
Poupatempo e Detran

```
Roberto Pina
```
30/09/2025 1.3 Ajuste de serviço para mudar o estado
de 7 para 8 na assinatura do vendedor

```
Roberto Pina
```
07/10/2025 1.4 Ajuste na chamada do vendedor
"Dados da venda" incluindo um ponto
na casa dos centavos no body

```
Roberto Pina
```
07/11/2025 1.5 Inclusão dos módulos TDV 5.0 e

```
TDV 6.
```
```
Roberto Pina
```
04/03/2026 1.6 Inclusão da regra “origem 5” na
assinatura do vendedor (Pag. 77)

```
Roberto Pina
```
05/03/2026 1.7 No serviço de verificar se há intenção
de venda foi incluído no body o
Renavam (Pag. 8)

```
Roberto Pina
```
17/04/2026 1.8 Inclusão de scopes TDV Roberto Pina


## Índice Analítico

   - Projeto: Detran Data : 20/01/
- 1. Introdução................................................................................................................................
- 2. Pré-condições..........................................................................................................................
- 3. Fluxo de transações – Solicitação.........................................................................................
- 4. Fluxo Principal “Transferência de veículos”........................................................................
         - 4.1.1 Scopes......................................................................................................................
         - 4.1.2 Vendedor...................................................................................................................
         - 4.1.3 Comprador..............................................................................................................
         - 4.1.4 Vendedor segunda assinatura................................................................................
         - 4.1.5 Comprador pagamento taxas.................................................................................
         - 4.1.6 Comprador pagamento confirmado........................................................................
         - 4.1.7 Comprador - Veículo transferido...........................................................................
         - 4.1.8 Estado - Transferência de veículos......................................................................
         - 4.1.9 e-Notariado...........................................................................................................
         - 4.1.10 TDV 4.0...............................................................................................................
         - 4.1.11 TDV 5.0...............................................................................................................
         - 4.1.12 TDV 6.0...............................................................................................................
- 5. Fluxo Alternativo “Mensagens de erro API”.....................................................................
- 6. Serviços WS.........................................................................................................................
- 7. Regras de negócio...............................................................................................................
- 8. Referências..........................................................................................................................
      - 8.1 Protótipo do aplicativo...................................................................................................


### Projeto: Detran Data : 20/01/

# Especificação - Transferência de veículos

**1. Introdução**

```
A proposta deste documento é especificar o funcionamento dos serviços da API service now
para a transferência de propriedade de veículos no app do Detran.
```
**2. Pré-condições**

```
● Usuário deve possuir cadastro na plataforma Gov BR;
● É permitido logar no App qualquer usuário com selo BRONZE, PRATA ou OURO;
● Para o usuário acessar a transferência de propriedade de veículo, terá como premissa ter
um perfil com selo PRATA ou OURO;
● O veículo deve estar registrado no estado de São Paulo;
● O veículo precisa ser transferido para um local dentro do Estado de São Paulo;
● O pagamento da taxa de transferência do veículo deve ser realizado previamente;
● A vistoria do veículo deve ser realizada previamente com validade dos últimos 60 dias;
● O veículo não pode possuir débitos e restrições;
● Este serviço é para transferência de veículo entre pessoas físicas;
● Para transferir o veículo entre cidades diferentes é necessário ter a placa Mercosul;
● Para veículos que possuam a placa cinza (placa municipal), a transferência somente será
realizada no mesmo município de residência do novo proprietário;
● ATPVe emitido a partir de 04/01/2021.
```
**3. Fluxo de transações – Solicitação**


```
Projeto: Detran Data : 20/01/
```
**4. Fluxo Principal “Transferência de veículos”**

```
A transferência de veículos poderá ser acessada de duas formas, são elas:
```
```
● Vendedor
● Comprador
```
```
Ambas as duas formas terão como premissa acessar com um perfil do nível
prata ou acima.
```
**4.1.1** **_Scopes_**

```
Para o funcionamento dos serviços no APP Detran, é necessário cadastrar os
seguintes Scopes:
```
```
Lembrando que todos também devem ser cadastrados no integrador para o
funcionamento correto dos serviços.
```
```
"openid",
"email",
"profile",
"offline_access",
"govbr_provadevida",
"api:detran.multas.search",
"api:detran.vistorias.read",
"api:detran.veiculos.read",
"api:sefaz.ipvapix.qrcode.read",
"api:cdesp.bcadastro.fisica.cpf.search",
"api:cdesp.bcadastro.juridica.cnpj.search",
"api:integrador.bcadastro",
"api:detran.veiculos.search",
"ip_address",
"microprofile-jwt",
"address",
"api:cnh-pid.search",
"api:sim-reciclagens.search",
"govbr_empresa",
"api:cnh-divisoes-equitativas.search",
"api:cnh-pid.upsert",
"api:detran.condutores.search",
"api:sim-suspensoes.search",
"api:detran.renach.upsert",
"api:cnh-mf.upsert",
"api:cnh-renachs.upsert",
"api:cnh-mf.search",
"api:crv-emplacamentos.search",
"api:cnh-toxicologico.search",
"api:cnh-cadastros.search",
"api:sim-suspensoes.upsert",
"api:sim-indicacoes.upsert",
```

**Projeto:** Detran **Data** : 20/01/

```
"api:crv-emplacamentos.upsert",
"api:cnh-digital.upsert",
"api:cnh-renachs.search",
"api:cnh-digital.search",
"api:detran.condutores.upsert",
"api:sim-reciclagens.upsert",
"api:cnh-divisoes-equitativas.upsert",
"api:detran.renach.search",
"api:cnh-toxicologico.upsert",
"api:cnh-idosos.search",
"api:crv-cadastros.search",
"api:sim-recursos.upsert",
"api:sim-indicacoes.search",
"api:sim-recursos.search",
"api:cnh-idosos.upsert",
"api:crv-cadastros.upsert",
"phone",
"api:cnh-cadastros.upsert",
"api:detran.veiculos.upsert",
"api:crv-documentos.search",
"api:crv-documentos.upsert",
"api:sggd.sousp.cxpostal.user",
"api:sggd.sousp.cxpostal.admin",
"api:integrador.vida.update",
"api:detran-taxas.search",
"api:vistoria.veiculos.search"
```
**4.1.2** **_Vendedor_**

```
Ao acessar a funcionalidade de transferência de veículo com perfil de vendedor,
será aberta tela para seleção de opção. Será necessário selecionar a opção de
“vendedor ou comprador” do veículo. Neste caso vamos simular o “vendedor”.
```

**Projeto:** Detran **Data** : 20/01/

```
Caso o cidadão tenha veículos em seu nome, será apresentada uma listagem
de todos os veículos e solicitado que selecione o veículo que será vendido :
```
```
Para listar o(s) veículo(s), chamar o serviço:
```
```
(Chamada feita pela Servicenow)
```
#### GET

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/veiculos
```

**Projeto:** Detran **Data** : 20/01/

```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/veiculos
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Ex. Response Status 200 OK:
```
#### {

```
"result": [
```
#### {

```
"placa": "BGA8H82",
```
```
"placaMercosul": true,
```
```
"nomeProprietario": "VICENTE NOAH RAUL DA CUNHA",
```
```
"chassi": "9321BX5J1DD028442",
```
```
"codigoRenavam": 1000937230,
```
```
"codigoMunicipio": 7107,
```
```
"nomeMunicipio": "SAO PAULO",
```
```
"codigoMarca": 11202,
```
```
"descricaoMarca": "HARLEY DAVIDSON/FLSTF",
```
```
"codigoCategoria": 3,
```
```
"descricaoCategoria": "OFICIAL",
```

**Projeto:** Detran **Data** : 20/01/

```
"codigoTipo": 4,
```
```
"descricaoTipo": "MOTOCICLO",
```
```
"codigoCarroceria": 999,
```
```
"descricaoCarroceria": "NAO APLIC",
```
```
"codigoCor": 2,
```
```
"descricaoCor": "AZUL",
```
```
"codigoCombustivel": 2,
```
```
"descricaoCombustivel": "GASOLINA",
```
```
"codigoEspecie": 1,
```
```
"descricaoEspecie": "PASSAGEIRO",
```
```
"anoFabricacao": "2013",
```
```
"anoModelo": "2013",
```
```
"anoExercicio": "2020",
```
```
"dataEmissao": "2020-03-14",
```
```
"dataEmissaoLicenciamento": "2020-03-14",
```
```
"dataMovimento": "2019-03-14",
```
```
"dataInclusao": "2015-10-08"
```
#### }

```
Para verificar se há intenção de venda, chamar o serviço:
```
```
(Chamada feita pela Servicenow)
```
#### POST

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
```

**Projeto:** Detran **Data** : 20/01/

```
ulos
```
```
Request Body
```
```
placaVeiculo:"placa",
```
```
nomeVendedor: .”nomeProprietario”,
```
```
emailVendedor: "email",
```
```
codigoVendedor: "cpf",
```
```
codigoRenavamVeiculo: “Renavam”
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Ex. Response Status 400:
```
#### {

```
"result": null,
```
```
"error": {
```
```
"message": "tdvativaexistenteerror",
```
```
"detail": "O código de transferência do veículo não foi encontrado."
```
#### },

```
"status": "failure"
```
#### }


**Projeto:** Detran **Data** : 20/01/

```
Ao selecionar o veículo que já possui intenção de venda, será apresentada tela
informando que o veículo possui processo de transferência em andamento e
caso queira continuar, será direcionado para etapa (tela) onde foi interrompido a
transferência através do estado
```
```
Ex: Caso o cidadão, seja ele vendedor ou comprador, depare com um
travamento do aplicativo, acabe a bateria do celular ou qualquer outra situação
que feche a transferência de veículos. Serão respeitadas as regras de gravação
até o bloco que foi preenchido. Sendo assim, quando o cidadão acessar
novamente o aplicativo, irá retomar o preenchimento da transferência sem ter
perdido toda etapa anterior.
```
#### TABELA ESTADO

```
Tabela estados TDV
```

**Projeto:** Detran **Data** : 20/01/

```
Telas com estado do vendedor e comprador:
```
```
Telas de estado TDV.png
```
```
Ao clicar em “Sim” será chamado o serviço para direcionar para a tela correta
(estado):
```
#### GET

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos?placaVeiculo=ABC&ativa=true
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos?placaVeiculo=ABC&ativa=true
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```

**Projeto:** Detran **Data** : 20/01/

```
Ex. Response Status 200 OK:
```
#### {

```
"result": [
```
#### {

```
"codigoAnexoAssinaturaVendedor": "123456",
```
```
"placaVeiculo": "XYZ9876",
```
```
"codigoCarroceriaVeiculo": "002",
```
```
"numeroTransferenciaVeiculo": "654321",
```
```
"valorVendaVeiculo": "45000.00",
```
```
"complementoComprador": "Apto 101",
```
```
"numeroCrvVeiculo": "987654321",
```
```
"descricaoTipoVeiculo": "SUV",
```
```
"estado": "1",
```
```
"codigoCategoriaVeiculo": "001",
```
```
"codigoAnexoAssinaturaReciboPagamentoVendedor": "789456",
```
```
"ativa": "true",
```
```
"descricaoCorVeiculo": "Branco",
```
```
"confirmacaoAutodeclaracaoResidenciaComprador": "true",
```
```
"descricaoCategoriaVeiculo": "Particular",
```
```
"nomeVendedor": "Maria Souza",
```
```
"numeroAtpveVeiculo": "321654987",
```
```
"codigoEspecieVeiculo": "001",
```
```
"emailComprador": "comprador@exemplo.com",
```
```
"ufVeiculo": "SP",
```
```
"codigoAnexoAtpve": "852963",
```

**Projeto:** Detran **Data** : 20/01/

```
"numeroComprador": "12345",
```
```
"descricaoCombustivelVeiculo": "Flex",
```
```
"nomeMunicipioComprador": "Campinas",
```
```
"kmVeiculo": "80000",
```
```
"codigoComprador": "54321",
```
```
"anoFabricacaoVeiculo": "2017",
```
```
"ufComprador": "SP",
```
```
"anoModeloVeiculo": "2018",
```
```
"codigoMunicipioComprador": "3509502",
```
```
"codigoRenavamVeiculo": "12345678910",
```
```
"codigoProvaVidaComprador": "654789",
```
```
"bairroComprador": "Centro",
```
```
"codigoCombustivelVeiculo": "001",
```
```
"dataHoraCriacao": "2023-09-01T10:30:00",
```
```
"codigoMarcaVeiculo": "001",
```
```
"nomeMunicipioVeiculo": "São Paulo",
```
```
"autodeclaracaoResidenciaComprador": "true",
```
```
"descricaoEspecieVeiculo": "Passeio",
```
```
"descricaoMarcaVeiculo": "Toyota",
```
```
"codigoAnexoCrlv": "963852",
```
```
"nomeComprador": "Carlos Oliveira",
```
```
"anoExercicioVeiculo": "2023",
```
```
"chassiVeiculo": "9BWZZZ377VT004251",
```
```
"codigoTransferenciaVeiculo": "852147963",
```
```
"cepComprador": "13000123",
```
```
"telefoneVendedor": "+5511998765432",
```

**Projeto:** Detran **Data** : 20/01/

```
"codigoCorVeiculo": "002",
```
```
"codigoProvaVidaVendedor": "987654",
```
```
"descricaoCarroceriaVeiculo": "SUV",
```
```
"codigoTipoVeiculo": "002",
```
```
"emailVendedor": "vendedor@exemplo.com",
```
```
"codigoVendedor": "789456",
```
```
"codigoDespachante": "963258",
```
```
"logradouroComprador": "Rua das Flores",
```
```
"codigoMunicipioVeiculo": "3550308",
```
```
"codigoAnexoAssinaturaComprador": "741258",
```
```
"origemComunicacaoVendaVeiculo": "Online",
```
```
"origem": 1,
```
```
"dataInicialPagamento": "2023-09-10"
```
#### },

#### {

```
"codigoAnexoAssinaturaVendedor": "123456",
```
```
"placaVeiculo": "XYZ9876",
```
```
"codigoCarroceriaVeiculo": "002",
```
```
"numeroTransferenciaVeiculo": "654321",
```
```
"valorVendaVeiculo": "45000.00",
```
```
"complementoComprador": "Apto 101",
```
```
"numeroCrvVeiculo": "987654321",
```
```
"descricaoTipoVeiculo": "SUV",
```
```
"estado": "1",
```
```
"codigoCategoriaVeiculo": "001",
```
```
"codigoAnexoAssinaturaReciboPagamentoVendedor": "789456",
```

**Projeto:** Detran **Data** : 20/01/

```
"ativa": "true",
```
```
"descricaoCorVeiculo": "Branco",
```
```
"confirmacaoAutodeclaracaoResidenciaComprador": "true",
```
```
"descricaoCategoriaVeiculo": "Particular",
```
```
"nomeVendedor": "Maria Souza",
```
```
"numeroAtpveVeiculo": "321654987",
```
```
"codigoEspecieVeiculo": "001",
```
```
"emailComprador": "comprador@exemplo.com",
```
```
"ufVeiculo": "SP",
```
```
"codigoAnexoAtpve": "852963",
```
```
"numeroComprador": "12345",
```
```
"descricaoCombustivelVeiculo": "Flex",
```
```
"nomeMunicipioComprador": "Campinas",
```
```
"kmVeiculo": "80000",
```
```
"codigoComprador": "54321",
```
```
"anoFabricacaoVeiculo": "2017",
```
```
"ufComprador": "SP",
```
```
"anoModeloVeiculo": "2018",
```
```
"codigoMunicipioComprador": "3509502",
```
```
"codigoRenavamVeiculo": "12345678910",
```
```
"codigoProvaVidaComprador": "654789",
```
```
"bairroComprador": "Centro",
```
```
"codigoCombustivelVeiculo": "001",
```
```
"dataHoraCriacao": "2023-09-01T10:30:00",
```
```
"codigoMarcaVeiculo": "001",
```
```
"nomeMunicipioVeiculo": "São Paulo",
```

**Projeto:** Detran **Data** : 20/01/

```
"autodeclaracaoResidenciaComprador": "true",
```
```
"descricaoEspecieVeiculo": "Passeio",
```
```
"descricaoMarcaVeiculo": "Toyota",
```
```
"codigoAnexoCrlv": "963852",
```
```
"nomeComprador": "Carlos Oliveira",
```
```
"anoExercicioVeiculo": "2023",
```
```
"chassiVeiculo": "9BWZZZ377VT004251",
```
```
"codigoTransferenciaVeiculo": "852147963",
```
```
"cepComprador": "13000123",
```
```
"telefoneVendedor": "+5511998765432",
```
```
"codigoCorVeiculo": "002",
```
```
"codigoProvaVidaVendedor": "987654",
```
```
"descricaoCarroceriaVeiculo": "SUV",
```
```
"codigoTipoVeiculo": "002",
```
```
"emailVendedor": "vendedor@exemplo.com",
```
```
"codigoVendedor": "789456",
```
```
"codigoDespachante": "963258",
```
```
"logradouroComprador": "Rua das Flores",
```
```
"codigoMunicipioVeiculo": "3550308",
```
```
"codigoAnexoAssinaturaComprador": "741258",
```
```
"origemComunicacaoVendaVeiculo": "Online",
```
```
"origem": 1,
```
```
"dataInicialPagamento": "2023-09-10"
```
#### }

#### ]

#### }


**Projeto:** Detran **Data** : 20/01/

```
Caso o usuário clique em “Não, cancelar processo”, se recusando seguir de
onde parou, a intenção de venda anterior será cancelada com sucesso.
```
```
O serviço que realiza o cancelamento de intenção de venda anterior é:
```
```
(Chamada feita pela Servicenow)
```
#### PATCH

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos/${id_transferencia}
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos/${id_transferencia}
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```

**Projeto:** Detran **Data** : 20/01/

```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Request Body:
```
#### {

```
"estado": "10",
```
```
"ativa": false
```
#### }

```
Response status 204 OK.
```
```
O retorno correto virá vazio com status de sucesso 204.
```
```
Caso o veículo possua restrição administrativa, será retornado o seguinte:
```
```
(Chamada feita pela Servicenow)
```
#### POST

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos
```
```
Request Body
```
```
{"placaVeiculo":"ABC1234","origem":"1","emailVendedor":"teste@gmail.com","n
omeVendedor":"João da Silva","codigoVendedor":"01234567891"}
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```

**Projeto:** Detran **Data** : 20/01/

```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Ex. Response Status 400:
```
#### {

```
"result": null,
```
```
"error": {
```
```
"message": "restricaoencontradaerror",
```
```
"detail": "O código de transferência do veículo não foi encontrado."
```
#### },

```
"status": "failure"
```
#### }


**Projeto:** Detran **Data** : 20/01/2025

```
Caso o veículo não possua restrição administrativa, será retornado o seguinte:
```
```
(Chamada feita pela Servicenow)
```
#### POST

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos
```
```
Request Body
```
```
{"placaVeiculo":"ABC1234","origem":"1","emailVendedor":"teste@gmail.com","n
omeVendedor":"João da Silva","codigoVendedor":"01234567891"}
```
```
Headers:
```

**Projeto:** Detran **Data** : 20/01/2025

```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Ex. Response Status 200:
```
#### {

```
"result": {
```
```
"codigoTransferenciaVeiculo": "987654321"
```
#### },

```
"error": null,
```
```
"status": "success"
```
#### }


**Projeto:** Detran **Data** : 20/01/2025

```
OBS: Armazenar "codigoTransferenciaVeiculo" para utilizar nas chamadas
futuras.
```
```
Ao clicar em “Avançar”, será solicitada uma prova de vida por validação facial
para identificar se o usuário realmente é o vendedor.
```

**Projeto:** Detran **Data** : 20/01/2025


**Projeto:** Detran **Data** : 20/01/2025

```
Clicando em “Fazer validação facial”, será aberta a câmera do celular para o
cidadão efetuar o reconhecimento facial.
```
```
Será chamado serviço para criar uma solicitação de prova de vida ou retornar
uma já existente:
```
```
(Chamada feita pela Prodesp)
```
#### POST

```
(Ambiente de Homologação)
```
```
https://appsp.api-hml.rota.sp.gov.br/vida/prova
```
```
(Ambiente de Produção)
```
```
https://appsp.api.rota.sp.gov.br/vida/prova
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: X-User-AppSP Value: {{tokenIntegrity}}
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Request body:
```
#### {

```
"tipo": 1,
```
```
"cpf": "07961203826",
```
```
"tempoExpiracao": 1440,
```
```
"tempoReuso": 1,
```
```
"solicitante": "TDV",
```
```
"idSolicitante": "3",
```
```
"canalSolicitante": "spgovbr",
```
```
"motivo": "tdv",
```
```
"pushTitulo": null,
```
```
"pushMensagem": null
```

**Projeto:** Detran **Data** : 20/01/2025

#### }

```
Ex. Response status 201 ok
```
#### {

```
"id": "string",
```
```
"cpf": "07961203826",
```
```
"dataCriacao": "12/12/2023 00:00",
```
```
"dataExpiracao": "12/12/2023 00:00",
```
```
"idSocilitante": "1",
```
```
"canalSocilitante": "spgovbr",
```
```
"realizadoPor": "string",
```
```
"idRealizadoPor": "string",
```
```
"solicitante": "TDV",
```
```
"motivo": "tdv",
```
```
"tempoExpiracao": 1440,
```
```
"tempoReuso": 1,
```
```
"tentativas": 0,
```
```
"status": 0,
```
```
"tipo": 1,
```
```
"dataBloqueioDiario": "12/12/2023 00:00",
```
```
"dataRealizacao": "12/12/2023 00:00"
```
#### }

```
Caso o retorno seja diferente de sucesso, considerar a regra abaixo:
```
```
400 Erro de validação
```
```
401 Sem token de autenticação, token inválido ou expirado
```
```
429 Excedida a quantidade de requisições simultâneas
```

**Projeto:** Detran **Data** : 20/01/2025

```
500 Erro inesperado no serviço
```
```
Defaut - Erro inesperado
```
```
Após criar uma solicitação de prova de vida, chamar o serviço para fazer upload
“armazenar” a foto do cidadão:
```
```
(Chamada feita pela Prodesp)
```
#### POST

```
(Ambiente de Homologação)
```
```
https://arquivos.api-hml.rota.sp.gov.br/ps/4afd2041-22cd-4d06-8e12-45d734709
1b4
```
```
(Ambiente de Produção)
```
```
https://arquivos.api.rota.sp.gov.br/ps/4afd2041-22cd-4d06-8e12-45d7347091b4
```
```
Headers:
```
```
Key: X-TraceId-SP Value: 10
```
```
Key: CPF Value: 00466739036
```
```
Key: Content-Type Value: image/jpeg
```
```
Key: Accept Value: application/json
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Request body:
```
```
Envio da imagem no formato binário
```
```
Ex. Response status 200 ok
```
#### {

```
"id": "f4fb19f6-1e70-47aa-abd5-327cbb2958c1",
```
```
"pathId": "37680000",
```
```
"localId": "4afd2041-22cd-4d06-8e12-45d7347091b4",
```
```
"relativePath": "/ps/37680000/f4fb19f6-1e70-47aa-abd5-327cbb2958c1",
```
```
"url":
"https://arquivos.api-hml.rota.sp.gov.br/ps/37680000/f4fb19f6-1e70-47aa-abd5-3
```

**Projeto:** Detran **Data** : 20/01/2025

```
27cbb2958c1"
```
#### }

```
Após criar a solicitação de prova de vida, será chamado o serviço para realizar
o batimento biométrico do cidadão, retornando se a foto enviada confere ou não
com os dados constantes nas bases do TSE e o score obtido na conferência.
```
```
(Chamada feita pela Prodesp)
```
#### POST

```
(Ambiente de Homologação)
```
```
https://vida.api-hml.rota.sp.gov.br/vida/match/v3
```
```
(Ambiente de Produção)
```
```
https://appsp.api.rota.sp.gov.br/vida/match/v3
```
```
Headers:
```
```
Key: idProva Value: id retirado do retorno da chamada anterior
```
```
Key: Content-Type Value: application/json
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: X-User-AppSP Value: {{tokenIntegrity}}
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Request body:
```
#### {

```
"biometria": [
```
#### {

```
"formato": "PNG",
```
```
"urlImagem": "/ps/37680000/f4fb19f6-1e70-47aa-abd5-327cbb2958c1",
"retirado da chamada anterior do campo relativePath"
```
```
"tipo": "FACIAL"
```
#### }

#### ],


**Projeto:** Detran **Data** : 20/01/2025

```
"cpfAtendente": "77897463915",
```
```
"identificador": {
```
```
"tipo": "CPF",
```
```
"numero": "00466739036" “CPF do usuário”
```
#### },

```
"ipAtendente": "0.0.0.0",
```
```
"baseDeDados": "1",
```
```
"macAddressAtendente": "00:00:00:00:00:00"
```
#### }

```
Ex. Response status 200 ok
```
#### {

```
"confere": "true"
```
#### }

```
Regra: no response acima, se o score “confere”, retornar TRUE, seguir para
próxima tela, caso retorne FALSE ou o status for 204 e 400 mostrar a tela de
erro.
```
```
Tela de erro do reconhecimento facial:
```

**Projeto:** Detran **Data** : 20/01/2025

```
Caso o retorno seja diferente de sucesso, considerar a regra abaixo:
```
```
204 Identificador não encontrado na base do TSE
```
```
400 Erro de validação
```
```
401 Sem token de autenticação, token inválido ou expirado
```
```
429 Excedida a quantidade de requisições simultâneas
```
```
500 Erro inesperado no serviço
```
```
502 A requisição enviada demorou mais tempo do que o servidor estava
preparado para esperar
```
```
Defaut - Erro inesperado
```
```
Retornando sucesso no reconhecimento facial, será exibida tela que está tudo
certo:
```

**Projeto:** Detran **Data** : 20/01/2025

```
Com a validação facial concluída, iremos chamar o serviço para pegar todas as
informações do veículo:
```
#### GET

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos/{{codigoTransferenciaVeiculo}}
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos/{{codigoTransferenciaVeiculo}}
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```

**Projeto:** Detran **Data** : 20/01/2025

```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Ex. Response Status 200 OK:
```
#### {

```
"result":
```
#### {

```
"codigoAnexoAssinaturaVendedor": "123456",
```
```
"placaVeiculo": "XYZ9876",
```
```
"codigoCarroceriaVeiculo": "002",
```
```
"numeroTransferenciaVeiculo": "654321",
```
```
"valorVendaVeiculo": "45000.00",
```
```
"complementoComprador": "Apto 101",
```
```
"numeroCrvVeiculo": "987654321",
```
```
"descricaoTipoVeiculo": "SUV",
```
```
"estado": "1",
```
```
"codigoCategoriaVeiculo": "001",
```
```
"codigoAnexoAssinaturaReciboPagamentoVendedor": "789456",
```
```
"ativa": "true",
```
```
"descricaoCorVeiculo": "Branco",
```
```
"confirmacaoAutodeclaracaoResidenciaComprador": "true",
```
```
"descricaoCategoriaVeiculo": "Particular",
```
```
"nomeVendedor": "Maria Souza",
```
```
"numeroAtpveVeiculo": "321654987",
```
```
"codigoEspecieVeiculo": "001",
```
```
"emailComprador": "comprador@exemplo.com",
```
```
"ufVeiculo": "SP",
```

**Projeto:** Detran **Data** : 20/01/2025

```
"codigoAnexoAtpve": "852963",
```
```
"numeroComprador": "12345",
```
```
"descricaoCombustivelVeiculo": "Flex",
```
```
"nomeMunicipioComprador": "Campinas",
```
```
"kmVeiculo": "80000",
```
```
"codigoComprador": "54321",
```
```
"anoFabricacaoVeiculo": "2017",
```
```
"ufComprador": "SP",
```
```
"anoModeloVeiculo": "2018",
```
```
"codigoMunicipioComprador": "3509502",
```
```
"codigoRenavamVeiculo": "12345678910",
```
```
"codigoProvaVidaComprador": "654789",
```
```
"bairroComprador": "Centro",
```
```
"codigoCombustivelVeiculo": "001",
```
```
"dataHoraCriacao": "2023-09-01T10:30:00",
```
```
"codigoMarcaVeiculo": "001",
```
```
"nomeMunicipioVeiculo": "São Paulo",
```
```
"autodeclaracaoResidenciaComprador": "true",
```
```
"descricaoEspecieVeiculo": "Passeio",
```
```
"descricaoMarcaVeiculo": "Toyota",
```
```
"codigoAnexoCrlv": "963852",
```
```
"nomeComprador": "Carlos Oliveira",
```
```
"anoExercicioVeiculo": "2023",
```
```
"chassiVeiculo": "9BWZZZ377VT004251",
```
```
"codigoTransferenciaVeiculo": "852147963",
```
```
"cepComprador": "13000123",
```

**Projeto:** Detran **Data** : 20/01/2025

```
"telefoneVendedor": "+5511998765432",
```
```
"codigoCorVeiculo": "002",
```
```
"codigoProvaVidaVendedor": "987654",
```
```
"descricaoCarroceriaVeiculo": "SUV",
```
```
"codigoTipoVeiculo": "002",
```
```
"emailVendedor": "vendedor@exemplo.com",
```
```
"codigoVendedor": "789456",
```
```
"codigoDespachante": "963258",
```
```
"logradouroComprador": "Rua das Flores",
```
```
"codigoMunicipioVeiculo": "3550308",
```
```
"codigoAnexoAssinaturaComprador": "741258",
```
```
"origemComunicacaoVendaVeiculo": "Online",
```
```
"origem": 5 ,
```
```
"dataInicialPagamento": "2023-09-10"
```
#### },

```
Caso o campo “origem”, retorne 5 , enviar para tela do TDV 4.0. E caso retorne
qualquer número, enviar para tela abaixo de dados do comprador.
```

**Projeto:** Detran **Data** : 20/01/2025

```
Ao preencher o CPF do comprador, irá trazer o nome mascarado sem edição. o
E-mail será digitado manualmente.
```
```
O serviço chamado para o CPF é:
```
```
(Chamada feita pela Servicenow)
```
#### GET

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/usuarios/{{codigoC
omprador}}
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/usuarios/{{codigoCom
prador}}
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```

**Projeto:** Detran **Data** : 20/01/2025

```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfcomprador}}
```
```
Response status 200 Ok
```
```
Ex. Response: 200.
```
#### {

```
"result": {
```
```
"cpf": "123.456.789-00",
```
```
"nome": "João da Silva",
```
```
"nomeMae": "Maria da Silva",
```
```
"dataNascimento": "1980-05-15",
```
```
"sexo": "Masculino",
```
```
"logradouro": "Rua das Flores",
```
```
"tipoLogradouro": "Rua",
```
```
"numeroLogradouro": "123",
```
```
"complemento": "Apto 101",
```
```
"cep": "12345-678",
```
```
"bairro": "Centro",
```
```
"codMunicipio": "3550308",
```
```
"municipio": "São Paulo",
```
```
"uf": "SP",
```
```
"ddd": "11",
```
```
"telefone": "987654321",
```
```
"anoObito": null,
```
```
"estrangeiro": "false",
```
```
"dataAtualizacao": "2023-09-10"
```

**Projeto:** Detran **Data** : 20/01/2025

#### }

#### }

```
Caso o CPF informado seja o mesmo do proprietário do veículo, será exibido a
restrição em tela:
```
```
Ao preencher o CEP, os campos, cidade, bairro e logradouro serão bloqueados
para edição. Os campos número e complemento devem vir em branco para o
vendedor preencher. Preenchendo o CEP, será chamado o serviço:
```
```
OBS: Liberar edição de campos de endereço quando o retorno da consulta de
CEP for vazio.
```
```
(Chamada feita pela Servicenow)
```
#### GET

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/enderecos/{{cepCo
mprador}}
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/enderecos/{{cepComp
rador}}
```
```
Ex. Response status 200 ok
```
#### {

```
"result": {
```
```
"cep": "08060283",
```
```
"bairro": "Vila Jacuí",
```
```
"tipoLogradouro": "Rua",
```

**Projeto:** Detran **Data** : 20/01/2025

```
"endereco": "Aulide Carini",
```
```
"complemento": "",
```
```
"tipoLogradouroAbrev": "R",
```
```
"enderecoAbrev": "R Aulide Carini",
```
```
"tipoLogradouroAbrevDNE": "R",
```
```
"localidade": "São Paulo",
```
```
"estado": "São Paulo",
```
```
"uf": "SP",
```
```
"numeroIBGE": 3550308,
```
```
"logradouro": null,
```
```
"cdTipoCEP": 1,
```
```
"tipoCEP": "CEP Padrão",
```
```
"municipio": "São Paulo",
```
```
"tipoLocalidade": null,
```
```
"codigoMunicipio": 9668,
```
```
"codigoLocalRel": 9668,
```
```
"latitude": null,
```
```
"longitude": null,
```
```
"codigoDne": 580843,
```
```
"tipoLogradouroDne": 81,
```
```
"codigoBairro": 26812
```
#### }

#### }

```
Caso o cidadão insira um CEP de outro estado que não seja de SP, não será
possível realizar a transferência.
```

**Projeto:** Detran **Data** : 20/01/2025

```
Para casos onde a cidade do comprador é diferente da cidade de registro do
veículo e a placa não é no padrão mercosul, será chamado serviço atualizar os
dados do comprador:
```
```
(Chamada feita pela Servicenow)
```
#### PATCH

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos/{{codigoTransferenciaVeiculo}}
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos/{{codigoTransferenciaVeiculo}}
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Request body:
```
#### {


**Projeto:** Detran **Data** : 20/01/2025

```
"cepComprador": "70660061",
```
```
"logradouroComprador": "Rua Rua das Flores",
```
```
"emailComprador": "Gs@gms.com",
```
```
"bairroComprador": "Centro",
```
```
"complementoComprador": "",
```
```
"numeroComprador": "9",
```
```
"codigoComprador": "04402997135"
```
#### }

```
Response status 204 Ok
```
```
Response status 400
```
```
● provadevidaexpiradaerror (voltar para tela de prova de vida)
● estadoinvalidoerror (deverá apresentar erro no CEP)
● cpfinvalidoerror (deverá ser CPF diferente do proprietário)
● cepinvalidoerror (deverá apresentar erro no CEP)
● placamercosulausenteerror (deverá apresentar tela de placa mercosul)
```
```
Caso a cidade do vendedor seja diferente do comprador e a placa cinza, será
exibida tela com restrição.
```
```
Caso não tenha restrições, será necessário preencher os dados do veículo:
```

**Projeto:** Detran **Data** : 20/01/2025

```
Regra: Caso o cidadão digite a quilometragem incorreta, ou retorne o erro 406,
o campo ficará inválido não sendo possível prosseguir.
```
```
Ao digitar o valor abaixo de R$ 1,00, deverá ser exibido erro para informar um
valor igual ou acima de R$ 1,00.
```
```
Ao preencher os dados do veículo e clicar em “Avançar”, é chamado o serviço
para atualizar os dados da venda:
```
```
(Chamada feita pela Servicenow)
```

**Projeto:** Detran **Data** : 20/01/2025

#### PATCH

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos/{{codigoTransferenciaVeiculo}}
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos/{{codigoTransferenciaVeiculo}}
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Request body:
```
#### {

```
"valorVendaVeiculo": "213213.21", Enviar o ponto (. ) na casa dos
centavos
```
```
"codigoProvaVidaVendedor": "123456789",
```
```
"estado": "2",
```
```
"kmVeiculo": "23"
```
#### }

```
Response status 204 Ok
```
```
Com todos dados preenchidos, será solicitado a confirmação dos dados do
comprador. O campo de nome deve retornar mascarado para o vendedor.
```

**Projeto:** Detran **Data** : 20/01/2025

```
Ao clicar em “Confirmar”, é chamado o serviço:
```
```
(Chamada feita pela Servicenow)
```
#### GET

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos/{{codigoTransferenciaVeiculo}}
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos/{{codigoTransferenciaVeiculo}}
```
```
Headers:
```

**Projeto:** Detran **Data** : 20/01/2025

```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Ex. Response 200 OK:
```
#### {

```
"result": {
```
```
"valorVendaVeiculo": "90000",
```
```
"complementoComprador": "123",
```
```
"numeroComprador": "345",
```
```
"nomeMunicipioComprador": "São Paulo",
```
```
"kmVeiculo": "13000",
```
```
"codigoComprador": "72116955017",
```
```
"bairroComprador": "Vila Jacuí",
```
```
"nomeComprador": "Carlos da Silva",
```
```
"logradouroComprador": "Rua Aulide Carini"
```
#### }

#### }

```
Caso o vendedor clique em “Cancelar” na etapa de confirmação dos dados será
cancelado o processo e chamado o serviço:
```
```
(Chamada feita pela Servicenow)
```
#### PATCH

```
(Ambiente de Homologação)
```

**Projeto:** Detran **Data** : 20/01/2025

```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos/{{codigoTransferenciaVeiculo}}
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos/{{codigoTransferenciaVeiculo}}
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Request Body :
```
#### {

```
"estado": "10",
```
```
"ativa": false
```
#### }

```
Response 204 OK
```

**Projeto:** Detran **Data** : 20/01/2025

```
Ao clicar em “Confirmar”, para atualizar os dados da venda, é chamado o
serviço:
```
```
(Chamada feita pela Servicenow)
```
#### PATCH

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos/{{codigoTransferenciaVeiculo}}
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos/{{codigoTransferenciaVeiculo}}
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```

**Projeto:** Detran **Data** : 20/01/2025

```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Request Body :
```
#### {

```
"estado": "{{3}}"
```
#### }

```
Response 204 OK
```
```
Após confirmar, será apresentada a tela que a intenção de venda foi concluída
com sucesso.
```

**Projeto:** Detran **Data** : 20/01/2025

**4.1.3** **_Comprador_**

```
Com todo processo de intenção de venda realizado com sucesso pelo
vendedor, ao acessar o app com perfil de comprador, receberá uma notificação
informando que foi indicado para uma compra de veículo.
```
```
OBS: Para acessar a funcionalidade de transferência, o comprador terá como
premissa acessar com um perfil do nível prata ou acima.
```
```
Na indicação de venda, poderá vir somente um veículo como uma lista, caso
tenha mais de uma indicação para o comprador.
```
```
Para receber a notificação da indicação de venda e listar as mensagens, é
chamado o serviço:
```
```
(Chamada feita pela Prodesp)
```
#### GET

```
(Ambiente de homologação)
```
```
https://caixapostal.api-hml.rota.sp.gov.br/mensagens/app/detran?page=\(page)
```
```
(Ambiente de Produção)
```
```
https://caixapostal.api.rota.sp.gov.br/mensagens/app/detran?page=\(page)
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: X-User-AppSP Value: {{tokenIntegrity}}
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Ex. Response status 200 OK:
```
#### [

#### {

```
"id": "1",
```
```
"appFinal": "App Exemplo",
```
```
"key": "notificacao_123",
```
```
"status": 1,
```
```
"titulo": "Notificação de Exemplo",
```

**Projeto:** Detran **Data** : 20/01/2025

```
"mensagemCurta": "Esta é uma mensagem curta.",
```
```
"mensagemLonga": "Esta é uma mensagem longa com mais detalhes
sobre a notificação.",
```
```
"dataEnvio": "2024-09-15 12:00"
```
#### }

#### ]

```
Para acessar as mensagens, será chamado o serviço:
```
```
Inserir “id” na url retirado da chamada anterior
```
```
(Chamada feita pela Servicenow)
```
#### GET

```
(Ambiente de homologação)
```
```
https://caixapostal.api-hml.rota.sp.gov.br/mensagens/app/detran/id/{id}
```
```
(Ambiente de Produção)
```
```
https://caixapostal.api.rota.sp.gov.br/mensagens/app/detran/id/{id}
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: X-User-AppSP Value: {{tokenIntegrity}}
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Response status 200 OK
```
#### [

#### {

```
"id": "1",
```
```
"appFinal": "App Exemplo",
```
```
"key": "notificacao_123",
```
```
"status": 1,
```
```
"titulo": "Notificação de Exemplo",
```

**Projeto:** Detran **Data** : 20/01/2025

```
"mensagemCurta": "Esta é uma mensagem curta.",
```
```
"mensagemLonga": "Esta é uma mensagem longa com mais detalhes
sobre a notificação.",
```
```
"dataEnvio": "2024-09-15 12:00"
```
#### }

#### ]

```
Para listar o(s) veículo(s), chamar o serviço:
```
```
(Chamada feita pela Servicenow)
```
#### GET

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos?ativa=true&codigoComprador=\(cpf)
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos?ativa=true&codigoComprador=\(cpf)
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Ex. Response Status 200 OK:
```
#### {

```
"result": [
```
#### {

```
"codigoAnexoAssinaturaVendedor": "123456",
```

**Projeto:** Detran **Data** : 20/01/2025

```
"placaVeiculo": "XYZ9876",
```
```
"codigoCarroceriaVeiculo": "002",
```
```
"numeroTransferenciaVeiculo": "654321",
```
```
"valorVendaVeiculo": "45000.00",
```
```
"complementoComprador": "Apto 101",
```
```
"numeroCrvVeiculo": "987654321",
```
```
"descricaoTipoVeiculo": "SUV",
```
```
"estado": "1",
```
```
"codigoCategoriaVeiculo": "001",
```
```
"codigoAnexoAssinaturaReciboPagamentoVendedor": "789456",
```
```
"ativa": "true",
```
```
"descricaoCorVeiculo": "Branco",
```
```
"confirmacaoAutodeclaracaoResidenciaComprador": "true",
```
```
"descricaoCategoriaVeiculo": "Particular",
```
```
"nomeVendedor": "Maria Souza",
```
```
"numeroAtpveVeiculo": "321654987",
```
```
"codigoEspecieVeiculo": "001",
```
```
"emailComprador": "comprador@exemplo.com",
```
```
"ufVeiculo": "SP",
```
```
"codigoAnexoAtpve": "852963",
```
```
"numeroComprador": "12345",
```
```
"descricaoCombustivelVeiculo": "Flex",
```
```
"nomeMunicipioComprador": "Campinas",
```
```
"kmVeiculo": "80000",
```
```
"codigoComprador": "54321",
```
```
"anoFabricacaoVeiculo": "2017",
```

**Projeto:** Detran **Data** : 20/01/2025

```
"ufComprador": "SP",
```
```
"anoModeloVeiculo": "2018",
```
```
"codigoMunicipioComprador": "3509502",
```
```
"codigoRenavamVeiculo": "12345678910",
```
```
"codigoProvaVidaComprador": "654789",
```
```
"bairroComprador": "Centro",
```
```
"codigoCombustivelVeiculo": "001",
```
```
"dataHoraCriacao": "2023-09-01T10:30:00",
```
```
"codigoMarcaVeiculo": "001",
```
```
"nomeMunicipioVeiculo": "São Paulo",
```
```
"autodeclaracaoResidenciaComprador": "true",
```
```
"descricaoEspecieVeiculo": "Passeio",
```
```
"descricaoMarcaVeiculo": "Toyota",
```
```
"codigoAnexoCrlv": "963852",
```
```
"nomeComprador": "Carlos Oliveira",
```
```
"anoExercicioVeiculo": "2023",
```
```
"chassiVeiculo": "9BWZZZ377VT004251",
```
```
"codigoTransferenciaVeiculo": "852147963",
```
```
"cepComprador": "13000123",
```
```
"telefoneVendedor": "+5511998765432",
```
```
"codigoCorVeiculo": "002",
```
```
"codigoProvaVidaVendedor": "987654",
```
```
"descricaoCarroceriaVeiculo": "SUV",
```
```
"codigoTipoVeiculo": "002",
```
```
"emailVendedor": "vendedor@exemplo.com",
```
```
"codigoVendedor": "789456",
```

**Projeto:** Detran **Data** : 20/01/2025

```
"codigoDespachante": "963258",
```
```
"logradouroComprador": "Rua das Flores",
```
```
"codigoMunicipioVeiculo": "3550308",
```
```
"codigoAnexoAssinaturaComprador": "741258",
```
```
"origemComunicacaoVendaVeiculo": "Online",
```
```
"origem": 1,
```
```
"dataInicialPagamento": "2023-09-10"
```
#### },

#### {

```
"codigoAnexoAssinaturaVendedor": "123456",
```
```
"placaVeiculo": "XYZ9876",
```
```
"codigoCarroceriaVeiculo": "002",
```
```
"numeroTransferenciaVeiculo": "654321",
```
```
"valorVendaVeiculo": "45000.00",
```
```
"complementoComprador": "Apto 101",
```
```
"numeroCrvVeiculo": "987654321",
```
```
"descricaoTipoVeiculo": "SUV",
```
```
"estado": "1",
```
```
"codigoCategoriaVeiculo": "001",
```
```
"codigoAnexoAssinaturaReciboPagamentoVendedor": "789456",
```
```
"ativa": "true",
```
```
"descricaoCorVeiculo": "Branco",
```
```
"confirmacaoAutodeclaracaoResidenciaComprador": "true",
```
```
"descricaoCategoriaVeiculo": "Particular",
```
```
"nomeVendedor": "Maria Souza",
```
```
"numeroAtpveVeiculo": "321654987",
```

**Projeto:** Detran **Data** : 20/01/2025

```
"codigoEspecieVeiculo": "001",
```
```
"emailComprador": "comprador@exemplo.com",
```
```
"ufVeiculo": "SP",
```
```
"codigoAnexoAtpve": "852963",
```
```
"numeroComprador": "12345",
```
```
"descricaoCombustivelVeiculo": "Flex",
```
```
"nomeMunicipioComprador": "Campinas",
```
```
"kmVeiculo": "80000",
```
```
"codigoComprador": "54321",
```
```
"anoFabricacaoVeiculo": "2017",
```
```
"ufComprador": "SP",
```
```
"anoModeloVeiculo": "2018",
```
```
"codigoMunicipioComprador": "3509502",
```
```
"codigoRenavamVeiculo": "12345678910",
```
```
"codigoProvaVidaComprador": "654789",
```
```
"bairroComprador": "Centro",
```
```
"codigoCombustivelVeiculo": "001",
```
```
"dataHoraCriacao": "2023-09-01T10:30:00",
```
```
"codigoMarcaVeiculo": "001",
```
```
"nomeMunicipioVeiculo": "São Paulo",
```
```
"autodeclaracaoResidenciaComprador": "true",
```
```
"descricaoEspecieVeiculo": "Passeio",
```
```
"descricaoMarcaVeiculo": "Toyota",
```
```
"codigoAnexoCrlv": "963852",
```
```
"nomeComprador": "Carlos Oliveira",
```
```
"anoExercicioVeiculo": "2023",
```

**Projeto:** Detran **Data** : 20/01/2025

```
"chassiVeiculo": "9BWZZZ377VT004251",
```
```
"codigoTransferenciaVeiculo": "852147963",
```
```
"cepComprador": "13000123",
```
```
"telefoneVendedor": "+5511998765432",
```
```
"codigoCorVeiculo": "002",
```
```
"codigoProvaVidaVendedor": "987654",
```
```
"descricaoCarroceriaVeiculo": "SUV",
```
```
"codigoTipoVeiculo": "002",
```
```
"emailVendedor": "vendedor@exemplo.com",
```
```
"codigoVendedor": "789456",
```
```
"codigoDespachante": "963258",
```
```
"logradouroComprador": "Rua das Flores",
```
```
"codigoMunicipioVeiculo": "3550308",
```
```
"codigoAnexoAssinaturaComprador": "741258",
```
```
"origemComunicacaoVendaVeiculo": "Online",
```
```
"origem": 1,
```
```
"dataInicialPagamento": "2023-09-10"
```
#### }

#### ]

#### }


**Projeto:** Detran **Data** : 20/01/2025

```
Caso somente retorne um veículo, não irá apresentar a tela acima e será
direcionada para tela com os dados de compra do veículo.
```
```
Ao selecionar o veículo que já possui intenção de compra, será retornado no
response no campo “estado” direcionado para etapa (tela) onde foi interrompido
a transferência através do estado.
```
```
Ex: Caso o cidadão, seja ele vendedor ou comprador, depare com um
travamento do aplicativo, acabe a bateria do celular ou qualquer outra situação
que feche a transferência de veículos. Serão respeitadas as regras de gravação
até o bloco que foi preenchido. Sendo assim, quando o cidadão acessar
novamente o aplicativo, irá retomar o preenchimento da transferência sem ter
perdido toda etapa anterior.
```
#### TABELA ESTADO

```
Tabela estados TDV
```

**Projeto:** Detran **Data** : 20/01/2025

```
Telas com estado do vendedor e comprador:
```
```
Telas de estado TDV.png
```
```
Acessando o veículo, será solicitada uma prova de vida por validação facial
para identificar se o cidadão realmente é o comprador.
```

**Projeto:** Detran **Data** : 20/01/2025


**Projeto:** Detran **Data** : 20/01/2025

```
Clicando em “Fazer validação facial”, será aberta a câmera do celular para o
cidadão efetuar o reconhecimento facial.
```
```
Será chamado serviço para criar uma solicitação de prova de vida ou retornar
uma já existente:
```
```
(Chamada feita pela Prodesp)
```
#### POST

```
(Ambiente de Homologação)
```
```
https://appsp.api-hml.rota.sp.gov.br/vida/prova
```
```
(Ambiente de Produção)
```
```
https://appsp.api.rota.sp.gov.br/vida/prova
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: X-User-AppSP Value: {{tokenIntegrity}}
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Request body:
```
#### {

```
"tipo": 1,
```
```
"cpf": "07961203826",
```
```
"tempoExpiracao": 1440,
```
```
"tempoReuso": 1,
```
```
"solicitante": "TDV",
```
```
"idSolicitante": "3",
```
```
"canalSolicitante": "spgovbr",
```
```
"motivo": "tdv",
```
```
"pushTitulo": null,
```
```
"pushMensagem": null
```

**Projeto:** Detran **Data** : 20/01/2025

#### }

```
Ex. Response status 201 ok
```
#### {

```
"id": "string",
```
```
"cpf": "07961203826",
```
```
"dataCriacao": "12/12/2023 00:00",
```
```
"dataExpiracao": "12/12/2023 00:00",
```
```
"idSocilitante": "1",
```
```
"canalSocilitante": "spgovbr",
```
```
"realizadoPor": "string",
```
```
"idRealizadoPor": "string",
```
```
"solicitante": "TDV",
```
```
"motivo": "tdv",
```
```
"tempoExpiracao": 1440,
```
```
"tempoReuso": 1,
```
```
"tentativas": 0,
```
```
"status": 0,
```
```
"tipo": 1,
```
```
"dataBloqueioDiario": "12/12/2023 00:00",
```
```
"dataRealizacao": "12/12/2023 00:00"
```
#### }

```
Caso o retorno seja diferente de sucesso, considerar a regra abaixo:
```
```
400 Erro de validação
```
```
401 Sem token de autenticação, token inválido ou expirado
```
```
429 Excedida a quantidade de requisições simultâneas
```

**Projeto:** Detran **Data** : 20/01/2025

```
500 Erro inesperado no serviço
```
```
Defaut - Erro inesperado
```
```
Após criar uma solicitação de prova de vida, chamar o serviço para fazer upload
“armazenar” a foto do cidadão:
```
```
(Chamada feita pela Prodesp)
```
#### POST

```
(Ambiente de Homologação)
```
```
https://arquivos.api-hml.rota.sp.gov.br/ps/4afd2041-22cd-4d06-8e12-45d734709
1b4
```
```
(Ambiente de Produção)
```
```
https://arquivos.api.rota.sp.gov.br/ps/4afd2041-22cd-4d06-8e12-45d7347091b4
```
```
Headers:
```
```
Key: X-TraceId-SP Value: 10
```
```
Key: CPF Value: 00466739036
```
```
Key: Content-Type Value: image/jpeg
```
```
Key: Accept Value: application/json
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Request body:
```
```
Envio da imagem no formato binário
```
```
Ex. Response status 200 ok
```
#### {

```
"id": "f4fb19f6-1e70-47aa-abd5-327cbb2958c1",
```
```
"pathId": "37680000",
```
```
"localId": "4afd2041-22cd-4d06-8e12-45d7347091b4",
```
```
"relativePath": "/ps/37680000/f4fb19f6-1e70-47aa-abd5-327cbb2958c1",
```
```
"url":
"https://arquivos.api-hml.rota.sp.gov.br/ps/37680000/f4fb19f6-1e70-47aa-abd5-3
```

**Projeto:** Detran **Data** : 20/01/2025

```
27cbb2958c1"
```
#### }

```
Após criar a solicitação de prova de vida, será chamado o serviço para realizar
o batimento biométrico do cidadão, retornando se a foto enviada confere ou não
com os dados constantes nas bases do TSE e o score obtido na conferência.
```
```
(Chamada feita pela Prodesp)
```
#### POST

```
(Ambiente de Homologação)
```
```
https://vida.api-hml.rota.sp.gov.br/vida/match/v3
```
```
(Ambiente de Produção)
```
```
https://appsp.api.rota.sp.gov.br/vida/match/v3
```
```
Headers:
```
```
Key: idProva Value: id retirado do retorno da chamada anterior
```
```
Key: Content-Type Value: application/json
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: X-User-AppSP Value: {{tokenIntegrity}}
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Request body:
```
#### {

```
"biometria": [
```
#### {

```
"formato": "PNG",
```
```
"urlImagem": "/ps/37680000/f4fb19f6-1e70-47aa-abd5-327cbb2958c1",
"retirado da chamada anterior do campo relativePath"
```
```
"tipo": "FACIAL"
```
#### }

#### ],


**Projeto:** Detran **Data** : 20/01/2025

```
"cpfAtendente": "77897463915",
```
```
"identificador": {
```
```
"tipo": "CPF",
```
```
"numero": "00466739036" “CPF do usuário”
```
#### },

```
"ipAtendente": "0.0.0.0",
```
```
"baseDeDados": "1",
```
```
"macAddressAtendente": "00:00:00:00:00:00"
```
#### }

```
Ex. Response status 200 ok
```
#### {

```
"confere": "true"
```
#### }

```
Regra: no response acima, se o score “confere”, retornar TRUE chamar o
serviço PATCH, se der 204 seguir para próxima tela, caso retorne FALSE ou o
status for 204 e 400 mostrar a tela de erro.
```
```
(Chamada feita pela Servicenow)
```
#### PATCH

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos/{{codigoTransferenciaVeiculo}}
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos/{{codigoTransferenciaVeiculo}}
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```

**Projeto:** Detran **Data** : 20/01/2025

```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Body: raw
```
```
{"estado":"4","codigoProvaVidaComprador":"123456789"}
```
```
Response Status 204 OK
```
```
Tela de erro do reconhecimento facial:
```
```
Caso o retorno seja diferente de sucesso, considerar a regra abaixo:
```
```
204 Identificador não encontrado na base do TSE
```
```
400 Erro de validação
```
```
401 Sem token de autenticação, token inválido ou expirado
```
```
429 Excedida a quantidade de requisições simultâneas
```
```
500 Erro inesperado no serviço
```
```
502 A requisição enviada demorou mais tempo do que o servidor estava
```

**Projeto:** Detran **Data** : 20/01/2025

```
preparado para esperar
```
```
Defaut - Erro inesperado
```
```
Caso obtenha sucesso no reconhecimento facial, será exibida tela que foi
concluída.
```
```
Com a validação facial concluída, serão exibidos os dados do comprador e
veículo.
```

**Projeto:** Detran **Data** : 20/01/2025

```
Para exibir os dados da confirmação da compra, é chamado o serviço:
```
```
(Chamada feita pela Servicenow)
```
#### GET

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos/{{codigoTransferenciaVeiculo}}
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos/{{codigoTransferenciaVeiculo}}
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```

**Projeto:** Detran **Data** : 20/01/2025

```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Ex. Response Status 200 OK
```
#### {

```
"result": {
```
```
"placaVeiculo": "BGF6E70",
```
```
"valorVendaVeiculo": "90000",
```
```
"complementoComprador": null,
```
```
"numeroComprador": "3550308",
```
```
"nomeMunicipioComprador": "São Paulo",
```
```
"kmVeiculo": "13000",
```
```
"codigoComprador": "72116955017",
```
```
"bairroComprador": "Vila Jacuí",
```
```
"descricaoMarcaVeiculo": "PEUGEOT/208 GRIFFE A",
```
```
"nomeComprador": "Carlos da Silva ",
```
```
"logradouroComprador": "Rua Aulide Carini"
```
#### }

#### }

```
Confirmando os dados do comprador, será solicitado autodeclaração de
endereço. Sendo como obrigatório marcar o checkbox confirmando que as
informações são verdadeiras.
```

**Projeto:** Detran **Data** : 20/01/2025

```
Para exibir o texto de autodeclaração de endereço, é chamado o serviço:
```
```
(Chamada feita pela Servicenow)
```
#### GET

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos/{{codigoTransferenciaVeiculo}}/comprador/autodeclaracao-de-residencia
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos/{{codigoTransferenciaVeiculo}}/comprador/autodeclaracao-de-residencia
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```

**Projeto:** Detran **Data** : 20/01/2025

```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Ex. Response Status 200 OK
```
#### {

```
"result": [
```
```
"Eu, Carlos da Silva , inscrito no CPF sob o nº 72116955017, declaro para
os devidos fins que resido à Rua Aulide Carini nº 3550308, Bairro Vila Jacuí, no
município de São Paulo, no estado de São Paulo.",
```
```
"Por ser a expressão da verdade, firmo a presente declaração para efeitos
legais.",
```
```
"Eu li e, para efeitos legais, confirmo que as informações acima são
verdadeiras"
```
#### ]

#### }

```
Ao selecionar o checkbox e clicar em “Confirmar” , é chamado o serviço:
```
```
(Chamada feita pela Servicenow)
```
#### PATCH

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos/{{codigoTransferenciaVeiculo}}
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos/{{codigoTransferenciaVeiculo}}
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```

**Projeto:** Detran **Data** : 20/01/2025

```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Body: raw
```
```
{"estado":"5","confirmacaoAutodeclaracaoResidenciaComprador":true}
```
```
Response Status 204 OK
```
```
Confirmando a declaração de endereço, será solicitado que o comprador assine
o documento de intenção de venda eletronicamente.
```
```
Ao clicar em “Assinar” , será aberto o app do gov.br gerando uma mensagem
com código. Será necessáro voltar ao app sp.gov.br e inserir o código na
seguinte tela “Webview”:
```

**Projeto:** Detran **Data** : 20/01/2025

```
(Ambiente de Homologação)
```
```
https://cas.staging.iti.br/oauth2.0/authorize?response_type=code&redirect_uri=s
pgovbr://localhost/appspgovbr/iti/oauth_redirect.html&scope=sign&client_id=detr
ansphom%22
```
```
(Ambiente de Produção)
```
```
https://cas.iti.br/oauth2.0/authorize?response_type=code&redirect_uri=spgovbr:/
/localhost/appspgovbr/iti/oauth_redirect.html&scope=sign&client_id=spgovbrpro
d%22
```
```
Ao inserir o código e clicar em “Autorizar” , o usuário irá receber um token para
inserir e ser chamado para atualizar o estado:
```
```
(Chamada feita pela Servicenow)
```
#### PATCH

```
https://f110-2804-14c-6541-42ed-a107-afee-8e49-21f4.ngrok-free.app/api/x_md
pdd_be_tdv/v1/tdv/transferencias-de-veiculos/{{codigoTransferenciaVeiculo}}
```

**Projeto:** Detran **Data** : 20/01/2025

```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Body: raw
```
```
{"estado":"6"}
```
```
Response Status 204 OK
```
```
Após chamar o serviço acima, será apresentada a tela que a intenção de
compra do veículo foi realizada com sucesso. Para a finalização da
transferência o vendedor deverá assinar o documento e posteriormente o
comprador pagar a taxa.
```

**Projeto:** Detran **Data** : 20/01/2025

**4.1.4** **_Vendedor segunda assinatura_**

```
Após o comprador assinar a intenção de compra do veículo, o vendedor será
notificado para que seja realizada a segunda assinatura.
```
```
Para receber a notificação da indicação de venda e listar as mensagens, é
chamado o serviço:
```
```
(Chamada feita pela Prodesp)
```
#### GET

```
(Ambiente de homologação)
```
```
https://caixapostal.api-hml.rota.sp.gov.br/mensagens/app/detran?page=\(page)
```
```
(Ambiente de Produção)
```
```
https://caixapostal.api.rota.sp.gov.br/mensagens/app/detran?page=\(page)
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```

**Projeto:** Detran **Data** : 20/01/2025

```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: X-User-AppSP Value: {{tokenIntegrity}}
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Ex. Response status 200 OK:
```
#### [

#### {

```
"id": "1",
```
```
"appFinal": "App Exemplo",
```
```
"key": "notificacao_123",
```
```
"status": 1,
```
```
"titulo": "Notificação de Exemplo",
```
```
"mensagemCurta": "Esta é uma mensagem curta.",
```
```
"mensagemLonga": "Esta é uma mensagem longa com mais detalhes
sobre a notificação.",
```
```
"dataEnvio": "2024-09-15 12:00"
```
#### }

#### ]

```
Para acessar as mensagens, será chamado o serviço:
```
```
Inserir “id” na url retirado da chamada anterior
```
```
(Chamada feita pela Servicenow)
```
#### GET

```
(Ambiente de homologação)
```
```
https://caixapostal.api-hml.rota.sp.gov.br/mensagens/app/detran/id/{id}
```
```
(Ambiente de Produção)
```
```
https://caixapostal.api.rota.sp.gov.br/mensagens/app/detran/id/{id}
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```

**Projeto:** Detran **Data** : 20/01/2025

```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: X-User-AppSP Value: {{tokenIntegrity}}
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Response status 200 OK
```
#### [

#### {

```
"id": "1",
```
```
"appFinal": "App Exemplo",
```
```
"key": "notificacao_123",
```
```
"status": 1,
```
```
"titulo": "Notificação de Exemplo",
```
```
"mensagemCurta": "Esta é uma mensagem curta.",
```
```
"mensagemLonga": "Esta é uma mensagem longa com mais detalhes
sobre a notificação.",
```
```
"dataEnvio": "2024-09-15 12:00"
```
#### }

#### ]

```
Após ler as notificações será chamado serviço para exibida tela de
transferência de veículo:
```
```
(Chamada feita pela Servicenow)
```
#### GET

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos/{{codigoTransferenciaVeiculo}}
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos/{{codigoTransferenciaVeiculo}}
```

**Projeto:** Detran **Data** : 20/01/2025

```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Ex. Response Status 200 OK:
```
#### {

```
"result": {
```
```
"placaVeiculo": null,
```
```
"descricaoCorVeiculo": "BRANCA",
```
```
"nomeVendedor": "ANGELO FERENCINI NETO",
```
```
"descricaoMarcaVeiculo": "PEUGEOT/208 GRIFFE A"
```
#### }

#### }


**Projeto:** Detran **Data** : 20/01/2025

```
Ao clicar em “Assinar” , será aberto o app do gov.br gerando uma mensagem
com código. Será necessáro voltar ao app sp.gov.br e inserir o código na
seguinte tela “Webview”:
```
```
(Ambiente de Homologação)
```
```
https://cas.staging.iti.br/oauth2.0/authorize?response_type=code&redirect_uri=s
pgovbr://localhost/appspgovbr/iti/oauth_redirect.html&scope=sign&client_id=detr
ansphom%22
```
```
(Ambiente de Produção)
```
```
https://cas.iti.br/oauth2.0/authorize?response_type=code&redirect_uri=spgovbr:/
/localhost/appspgovbr/iti/oauth_redirect.html&scope=sign&client_id=spgovbrpro
d%22
```

**Projeto:** Detran **Data** : 20/01/2025

```
Ao inserir o código e clicar em “Autorizar” , o usuário irá receber um token para
inserir e ser chamado para atualizar o estado:
```
```
(Chamada feita pela Servicenow)
```
#### PATCH

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos/{{codigoTransferenciaVeiculo}}
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos/{{codigoTransferenciaVeiculo}}
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```

**Projeto:** Detran **Data** : 20/01/2025

```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Key: X-Authorization-Code Value: xAuthorizationCode
```
```
Body: raw
```
```
{"estado":"7"}
```
```
Response Status 204 OK
```
```
Caso a chamada acima retorne 204 passando o “estado 7” e a origem for
diferente de “5”, será feito uma nova chamada passando o “estado 8”, seguindo
o fluxo.
```
```
(Chamada feita pela Servicenow)
```
#### PATCH

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos/{{codigoTransferenciaVeiculo}}
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos/{{codigoTransferenciaVeiculo}}
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Body: raw
```
```
{"estado":"8"}
```
```
Response Status 204 OK
```

**Projeto:** Detran **Data** : 20/01/2025

```
Independente do retorno acima, chamar os serviço para apresentar a tela de
que a venda do veículo foi realizada com sucesso. Lembrando que somente
será concluída após a taxa paga pelo comprador.
```
```
(Chamada feita pela Servicenow)
```
#### GET

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos/{{codigoTransferenciaVeiculo}}
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos/{{codigoTransferenciaVeiculo}}
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Ex. Response Status 200 OK:
```
#### {

```
"result": {
```
```
"placaVeiculo": null,
```
```
"descricaoCorVeiculo": "BRANCA",
```
```
"nomeVendedor": "ANGELO FERENCINI NETO",
```
```
"descricaoMarcaVeiculo": "PEUGEOT/208 GRIFFE A"
```
#### }

#### }


**Projeto:** Detran **Data** : 20/01/2025

**4.1.5** **_Comprador pagamento taxas_**

```
Após o vendedor realizar a assinatura pela segunda vez, o comprador será
notificado dizendo que o vendedor concluiu a transferência do veículo e será
necessário pagar as taxas para concluir.
```

**Projeto:** Detran **Data** : 20/01/2025

```
Para receber a notificação de transferência concluída e listar as mensagens, é
chamado o serviço:
```
```
(Chamada feita pela Prodesp)
```
#### GET

```
(Ambiente de homologação)
```
```
https://caixapostal.api-hml.rota.sp.gov.br/mensagens/app/detran?page=\(page)
```
```
(Ambiente de Produção)
```
```
https://caixapostal.api.rota.sp.gov.br/mensagens/app/detran?page=\(page)
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```

**Projeto:** Detran **Data** : 20/01/2025

```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: X-User-AppSP Value: {{tokenIntegrity}}
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Ex. Response status 200 OK:
```
#### [

#### {

```
"id": "1",
```
```
"appFinal": "App Exemplo",
```
```
"key": "notificacao_123",
```
```
"status": 1,
```
```
"titulo": "Notificação de Exemplo",
```
```
"mensagemCurta": "Esta é uma mensagem curta.",
```
```
"mensagemLonga": "Esta é uma mensagem longa com mais detalhes
sobre a notificação.",
```
```
"dataEnvio": "2024-09-15 12:00"
```
#### }

#### ]

```
Para acessar as mensagens, será chamado o serviço:
```
```
Inserir “id” na url retirado da chamada anterior
```
```
(Chamada feita pela Servicenow)
```
#### GET

```
(Ambiente de homologação)
```
```
https://caixapostal.api-hml.rota.sp.gov.br/mensagens/app/detran/id/{id}
```
```
(Ambiente de Produção)
```
```
https://caixapostal.api.rota.sp.gov.br/mensagens/app/detran/id/{id}
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```

**Projeto:** Detran **Data** : 20/01/2025

```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: X-User-AppSP Value: {{tokenIntegrity}}
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Response status 200 OK
```
#### [

#### {

```
"id": "1",
```
```
"appFinal": "App Exemplo",
```
```
"key": "notificacao_123",
```
```
"status": 1,
```
```
"titulo": "Notificação de Exemplo",
```
```
"mensagemCurta": "Esta é uma mensagem curta.",
```
```
"mensagemLonga": "Esta é uma mensagem longa com mais detalhes
sobre a notificação.",
```
```
"dataEnvio": "2024-09-15 12:00"
```
#### }

#### ]

```
Após ler as notificações será chamado serviço de notificação sobre pagamento:
```
```
(Chamada feita pela Servicenow)
```
#### GET

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos/{{codigoTransferenciaVeiculo}}
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos/{{codigoTransferenciaVeiculo}}
```

**Projeto:** Detran **Data** : 20/01/2025

```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Ex. Response Status 200 OK:
```
#### {

```
"result":{
"codigoDocumentoAssinaturaVendedor":"123",
"placaVeiculo":"ABC123",
"codigoCarroceriaVeiculo":"456",
"codigoTransferenciaVeiculo":"789",
"valorVendaVeiculo":"10000.00",
"complementoComprador":"Complemento do Comprador",
"numeroCrvVeiculo":"CRV123",
"descricaoTipoVeiculo":"Sedan",
"estado":"SP",
"codigoCategoriaVeiculo":"001",
"ativa":"true",
"descricaoCorVeiculo":"Preto",
"confirmacaoAutodeclaracaoResidenciaComprador":"true",
"descricaoCategoriaVeiculo":"Veículo de Passeio",
"nomeVendedor":"João Vendedor",
"codigoEspecieVeiculo":"002",
"estadoProvaVidaComprador":"SP",
"emailComprador":"comprador@example.com",
"ufVeiculo":"SP",
"codigoDocumentoAtpve":"ATPVE123",
"numeroComprador":"789",
"estadoProvaVidaVendedor":"SP",
"descricaoCombustivelVeiculo":"Gasolina",
"nomeMunicipioComprador":"São Paulo",
"kmVeiculo":"50000",
"codigoComprador":"456",
"anoFabricacaoVeiculo":"2020",
"ufComprador":"SP",
"anoModeloVeiculo":"2021",
"codigoMunicipioComprador":"789",
"codigoRenavamVeiculo":"987",
"codigoProvaVidaComprador":"123",
"bairroComprador":"Bairro do Comprador",
"codigoCombustivelVeiculo":"003",
```

**Projeto:** Detran **Data** : 20/01/2025

```
"codigoMarcaVeiculo":"001",
"nomeMunicipioVeiculo":"São Paulo",
"autodeclaracaoResidenciaComprador":"true",
"descricaoEspecieVeiculo":"Automóvel",
"descricaoMarcaVeiculo":"Toyota",
"nomeComprador":"Maria Compradora",
"anoExercicioVeiculo":"2022",
"chassiVeiculo":"123456789",
"cepComprador":"12345-678",
"telefoneVendedor":"987654321",
"codigoCorVeiculo":"001",
"codigoProvaVidaVendedor":"456",
"descricaoCarroceriaVeiculo":"Sedan",
"codigoTipoVeiculo":"001",
"emailVendedor":"vendedor@example.com",
"codigoVendedor":"789",
"logradouroComprador":"Rua do Comprador",
"codigoMunicipioVeiculo":"987",
"codigoDocumentoAssinaturaComprador":"987"
}
```
#### }


**Projeto:** Detran **Data** : 20/01/2025

```
Logo em seguida, para retornar os débitos que necessitam ser quitados, será
chamado o serviço:
```
```
OBS: REGRA - Ao chamar a tela abaixo, passar como parâmetro no app o
"nomeComprador" retirado da chamada anterior.
```
```
(Chamada feita pela Servicenow)
```
#### GET

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos/{{codigoTransferenciaVeiculo}}/debitos
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos/{{codigoTransferenciaVeiculo}}/debitos
```

**Projeto:** Detran **Data** : 20/01/2025

```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Ex. Response status 200 OK:
```
#### {

```
"result":{
"valorTotal":432.49,
"debitos":[
{
"descricao":"Transferência de Veiculo",
"valor":272.27
},
{
"descricao":"Licenciamento",
"valor":160.22
}
]
}
}
```

**Projeto:** Detran **Data** : 20/01/2025

```
Após o comprador clicar em “Pagar com pix, chamar o serviço para gerar o
QRcode:
```
```
(Chamada feita pela Servicenow)
```
#### GET

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos/{{codigoTransferenciaVeiculo}}/qr-code?forcarNovo=true
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos/{{codigoTransferenciaVeiculo}}/qr-code?forcarNovo=true
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```

**Projeto:** Detran **Data** : 20/01/2025

```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Ex. Response status 201 OK:
```
#### {

```
"result": {
```
```
"idQRCode": "12345",
```
```
"qrCode":
"00020101021226830014BR.GOV.BCB.PIX2551qrcodesample.com.br12345...",
```
```
"estadoQRCode": 1,
```
```
"idPagamentoQRCode": "98765",
```
```
"dataPagamentoQRCode": "2024-09-19T14:30:00Z",
```
```
"dataExpiracaoQRCode": "2024-09-19T14:30:00Z"
```
#### }

#### }

```
estadoQRCode pode assumir os seguintes valores:
```
- 1 (Ativo)
- 2 (Pago)
- 3 (Expirado)


**Projeto:** Detran **Data** : 20/01/2025

```
OBS: REGRA - Para gerar o contador “relógio”, deverá pegar o campo
“dataExpiracao”:”yyyy-MM-ddTHH:mm:ssZ” , menos a data atual feita pelo
desenvolvedor.
```
```
Para verificar se o pagamento da taxa foi pago, chamar o serviço:
```
```
OBS: serviço irá bater de 10 em 10 segundos até limitar nos 15 minutos
```
```
(Chamada feita pela Servicenow)
```
#### GET

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos/{{codigoTransferenciaVeiculo}}/qr-code?forcarNovo=false
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos/{{codigoTransferenciaVeiculo}}/qr-code?forcarNovo=false
```
```
Headers:
```

**Projeto:** Detran **Data** : 20/01/2025

```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Ex. Response status 200 OK:
```
#### {

```
"result": {
```
```
"idQRCode": "12345",
```
```
"qrCode":
"00020101021226830014BR.GOV.BCB.PIX2551qrcodesample.com.br12345...",
```
```
"estadoQRCode": 1,
```
```
"idPagamentoQRCode": "98765",
```
```
"dataPagamentoQRCode": "2024-09-19T14:30:00Z",
```
```
"dataExpiracaoQRCode": "2024-09-19T14:30:00Z"
```
#### }

#### }

```
estadoQRCode pode assumir os seguintes valores:
```
- 1 (Ativo)
- 2 (Pago)
- 3 (Expirado)

```
Caso o retorno seja pago, apresentar a seguinte tela:
```

**Projeto:** Detran **Data** : 20/01/2025

```
Para apresentar a identificação e data do pagamento, pegar os campos da
chamada anterior:
```
```
"idPagamento": "string",
```
```
"dataPagamento": "datetime"
```

**Projeto:** Detran **Data** : 20/01/2025

```
Caso o tempo expire, apresentaremos a tela abaixo.
```

**Projeto:** Detran **Data** : 20/01/2025

**4.1.6** **_Comprador pagamento confirmado_**

```
Após o comprador realizar o pagamento, receberá uma notificação dizendo que
a taxa de transferência foi confirmada.
```
```
Para receber a notificação de pagamento concluído e listar as mensagens, é
chamado o serviço:
```
```
(Chamada feita pela Prodesp)
```
#### GET

```
(Ambiente de homologação)
```
```
https://caixapostal.api-hml.rota.sp.gov.br/mensagens/app/detran?page=\(page)
```
```
(Ambiente de Produção)
```
```
https://caixapostal.api.rota.sp.gov.br/mensagens/app/detran?page=\(page)
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```

**Projeto:** Detran **Data** : 20/01/2025

```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Ex. Response status 200 OK:
```
#### [

#### {

```
"id": "1",
```
```
"appFinal": "App Exemplo",
```
```
"key": "notificacao_123",
```
```
"status": 1,
```
```
"titulo": "Notificação de Exemplo",
```
```
"mensagemCurta": "Esta é uma mensagem curta.",
```
```
"mensagemLonga": "Esta é uma mensagem longa com mais detalhes
sobre a notificação.",
```
```
"dataEnvio": "2024-09-15 12:00"
```
#### }

#### ]

```
Para acessar as mensagens, será chamado o serviço:
```
```
Inserir “id” na url retirado da chamada anterior
```
```
(Chamada feita pela Servicenow)
```
#### GET

```
(Ambiente de homologação)
```
```
https://caixapostal.api-hml.rota.sp.gov.br/mensagens/app/detran/id/{id}
```
```
(Ambiente de Produção)
```
```
https://caixapostal.api.rota.sp.gov.br/mensagens/app/detran/id/{id}
```

**Projeto:** Detran **Data** : 20/01/2025

```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Response status 200 OK
```
#### [

#### {

```
"id": "1",
```
```
"appFinal": "App Exemplo",
```
```
"key": "notificacao_123",
```
```
"status": 1,
```
```
"titulo": "Notificação de Exemplo",
```
```
"mensagemCurta": "Esta é uma mensagem curta.",
```
```
"mensagemLonga": "Esta é uma mensagem longa com mais detalhes
sobre a notificação.",
```
```
"dataEnvio": "2024-09-15 12:00"
```
#### }

#### ]

```
Após ler as notificações será exibida tela de transferência de veículo:
```
```
Para apresentar os dados na tela abaixo, é chamado o serviço:
```
```
(Chamada feita pela Servicenow)
```
#### GET


**Projeto:** Detran **Data** : 20/01/2025

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos/{{codigoTransferenciaVeiculo}}
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos/{{codigoTransferenciaVeiculo}}
```
```
Params:
```
```
Key: campos Value: descricaoMarcaVeiculo,descricaoCorVeiculo,placaVeiculo
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Ex. Response status 200 OK:
```
#### {

```
"result": {
```
```
"placaVeiculo": "BGF6E70",
```
```
"descricaoCorVeiculo": "BRANCA",
```
```
"descricaoMarcaVeiculo": "PEUGEOT/208 GRIFFE A"
```
#### }

#### }


**Projeto:** Detran **Data** : 20/01/2025


**Projeto:** Detran **Data** : 20/01/2025

**4.1.7** **_Comprador - Veículo transferido_**

```
Após o comprador realizar o pagamento, receberá uma notificação dizendo que
a taxa de transferência foi confirmada.
```
```
Para receber a notificação de pagamento concluído e listar as mensagens, é
chamado o serviço:
```
```
(Chamada feita pela Prodesp)
```
#### GET

```
(Ambiente de homologação)
```
```
https://caixapostal.api-hml.rota.sp.gov.br/mensagens/app/detran?page=\(page)
```
```
(Ambiente de Produção)
```
```
https://caixapostal.api.rota.sp.gov.br/mensagens/app/detran?page=\(page)
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```

**Projeto:** Detran **Data** : 20/01/2025

```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Ex. Response status 200 OK:
```
#### [

#### {

```
"id": "1",
```
```
"appFinal": "App Exemplo",
```
```
"key": "notificacao_123",
```
```
"status": 1,
```
```
"titulo": "Notificação de Exemplo",
```
```
"mensagemCurta": "Esta é uma mensagem curta.",
```
```
"mensagemLonga": "Esta é uma mensagem longa com mais detalhes
sobre a notificação.",
```
```
"dataEnvio": "2024-09-15 12:00"
```
#### }

#### ]

```
Para acessar as mensagens, será chamado o serviço:
```
```
Inserir “id” na url retirado da chamada anterior
```
```
(Chamada feita pela Servicenow)
```
#### GET

```
(Ambiente de homologação)
```
```
https://caixapostal.api-hml.rota.sp.gov.br/mensagens/app/detran/id/{id}
```
```
(Ambiente de Produção)
```
```
https://caixapostal.api.rota.sp.gov.br/mensagens/app/detran/id/{id}
```

**Projeto:** Detran **Data** : 20/01/2025

```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Response status 200 OK
```
#### [

#### {

```
"id": "1",
```
```
"appFinal": "App Exemplo",
```
```
"key": "notificacao_123",
```
```
"status": 1,
```
```
"titulo": "Notificação de Exemplo",
```
```
"mensagemCurta": "Esta é uma mensagem curta.",
```
```
"mensagemLonga": "Esta é uma mensagem longa com mais detalhes
sobre a notificação.",
```
```
"dataEnvio": "2024-09-15 12:00"
```
#### }

#### ]

```
Após ler as notificações será exibida tela de transferência realizada com
sucesso:
```
```
Para apresentar os dados na tela abaixo, é chamado o serviço:
```
```
(Chamada feita pela Servicenow)
```
#### GET


**Projeto:** Detran **Data** : 20/01/2025

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos/{{codigoTransferenciaVeiculo}}
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos/{{codigoTransferenciaVeiculo}}
```
```
Params:
```
```
Key: campos Value: descricaoMarcaVeiculo,descricaoCorVeiculo,placaVeiculo
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Ex. Response status 200 OK:
```
#### {

```
"result": {
```
```
"placaVeiculo": "BGF6E70",
```
```
"descricaoCorVeiculo": "BRANCA",
```
```
"descricaoMarcaVeiculo": "PEUGEOT/208 GRIFFE A"
```
#### }

#### }


**Projeto:** Detran **Data** : 20/01/2025

**4.1.8** **_Estado - Transferência de veículos_**

```
Caso o cidadão, seja ele vendedor ou comprador, depare com um travamento
do aplicativo, acabe a bateria do celular ou qualquer outra situação que feche a
transferência de veículos. Serão respeitadas as regras de gravação até o bloco
que foi preenchido. Sendo assim, quando o cidadão acessar novamente o
aplicativo, irá retomar o preenchimento da transferência sem ter perdido toda
etapa anterior.
```
#### TABELA ESTADO

```
Tabela estados TDV
```

**Projeto:** Detran **Data** : 20/01/2025

```
Telas com estado do vendedor e comprador:
```
```
Telas de estado TDV.png
```
**4.1.9** **_e-Notariado_**

```
Lista de Veículos
```
```
Com todo processo de intenção de venda realizado com sucesso pelo
vendedor, ao acessar o app com perfil de comprador, será exibida tela para
escolha do veículo, podendo receber somente um ou uma lista com diversos
veículos para seleção.
```
```
OBS: Para acessar a funcionalidade de transferência, o comprador terá como
premissa acessar com um perfil do nível prata ou acima e possuir intenção de
compra.
```

**Projeto:** Detran **Data** : 20/01/2025


**Projeto:** Detran **Data** : 20/01/2025

```
Para listar o(s) veículo(s), chamar o serviço:
```
```
(Chamada feita pela Servicenow)
```
#### GET

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos
```
```
Params:
```
```
Key: campos Value:
placaVeiculo,descricaoMarcaVeiculo,descricaoCorVeiculo,nomeComprador,codi
goTransferenciaVeiculo,origemComunicacaoVendaVeiculo
```
```
Headers:
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: X-Access-Token Value: {{tokenAcesso}}
```
```
Key: X-CPF-Usuario Value: {{CPF do usuário}}
```
```
Ex. Response Status 200 OK:
```
#### {

```
"result":
```
#### [

#### {

```
"placaVeiculo": "string",
```
```
"descricaoMarcaVeiculo": "string",
```
```
"descricaoCorVeiculo": "string",
```
```
"nomeComprador": "string",
```
```
"codigoTransferenciaVeiculo": "string",
```

**Projeto:** Detran **Data** : 20/01/2025

```
"origemComunicacaoVendaVeiculo": 0
```
```
"origem": 2
```
#### }

#### ]

#### }

#### REGRA:

```
Se no retorno da chamada acima os campos codigoTransferenciaVeiculo,
retornar “null” e origem , retornar “2, 3 ou 4” , significa que ele pertence ao
e-notariado ou CDT (Carteira digital de trânsito).
```
```
Confirmação de compra
```
```
A validação facial não será necessária nesse fluxo, portanto iremos pular para
confirmação de compra, onde serão exibidos os dados do comprador e veículo.
```

**Projeto:** Detran **Data** : 20/01/2025

```
Para exibir os dados da confirmação da compra, é chamado o serviço:
```
```
(Chamada feita pela Servicenow)
```
#### GET

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos/{{codigoTransferenciaVeiculo}}
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos/{{codigoTransferenciaVeiculo}}
```
```
Params:
```
```
Key: campos Value:
cepComprador,bairroComprador,logradouroComprador,numeroComprador,com
plementoComprador
```
```
Headers:
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: X-Access-Token Value: {{tokenAcesso}}
```
```
Key: X-CPF-Usuario Value: {{CPF do usuário}}
```
```
Ex. Response Status 200 OK
```
#### {

```
"result":
```
#### {

```
"logradouroComprador": "string",
```
```
"numeroComprador": "string",
```
```
"complementoComprador": "string",
```
```
"bairroComprador": "string",
```
```
"cepComprador": "string"
```
#### }

#### }


**Projeto:** Detran **Data** : 20/01/2025

```
Alteração de endereço
```
```
Após o cidadão clicar em “Alterar”, informar os campos de endereço e clicar em
“Confirmar”, será chamado o serviço:
```
#### PATCH

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos/{{codigoTransferenciaVeiculo}}
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos/{{codigoTransferenciaVeiculo}}
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: X-Access-Token Value: {{tokenAcesso}}
```
```
Key: X-CPF-Usuario Value: {{CPF do usuário}}
```
```
Body request:
```
#### {

```
"logradouroComprador": "string",
```
```
"numeroComprador": "string",
```
```
"complementoComprador": "string",
```
```
"bairroComprador": "string",
```
```
"cepComprador": "string",
```
```
"estado": “7”
```
#### }

```
Response Status 204 (Sucesso)
```
```
Vazio
```

**Projeto:** Detran **Data** : 20/01/2025

```
Confirmação de endereço
```
```
Confirmando os dados do comprador, será solicitado autodeclaração de
endereço. Sendo como obrigatório marcar o checkbox confirmando que as
informações são verdadeiras.
```
```
Para exibir o texto de autodeclaração de endereço, é chamado o serviço:
```
```
(Chamada feita pela Servicenow)
```
#### GET

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos/{{codigoTransferenciaVeiculo}}
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos/{{codigoTransferenciaVeiculo}}
```
```
Headers:
```

**Projeto:** Detran **Data** : 20/01/2025

```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: X-Access-Token Value: {{tokenAcesso}}
```
```
Key: X-CPF-Usuario Value: {{CPF do usuário}}
```
```
Params:
```
```
Key: campos Value: autodeclaracaoResidenciaComprador
```
```
Ex. Response Status 200 OK
```
#### {

```
"result":
```
#### {

```
"autodeclaracaoResidenciaComprador": "string"
```
#### }

#### }

```
Ao selecionar o checkbox e clicar em “Confirmar” , é chamado o serviço:
```
```
(Chamada feita pela Servicenow)
```
#### POST

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```

**Projeto:** Detran **Data** : 20/01/2025

```
Key: X-Access-Token Value: {{tokenAcesso}}
```
```
Key: X-CPF-Usuario Value: {{CPF do usuário}}
```
```
Body request:
```
#### {

```
"codigoTransferenciaVeiculo": "string",
```
```
"numeroTransferenciaVeiculo": "string",
```
```
"ativa": “string”,
```
```
"estado": “string”,
```
```
"dataHoraCriacao": "datetime",
```
```
"tipoProvaVida": “string”,
```
```
"placaVeiculo": "string",
```
```
"chassiVeiculo": "string",
```
```
"codigoRenavamVeiculo": "string",
```
```
"numeroCrvVeiculo": "string",
```
```
"codigoMunicipioVeiculo": “string”,
```
```
"nomeMunicipioVeiculo": "string",
```
```
"codigoMarcaVeiculo": “string”,
```
```
"descricaoMarcaVeiculo": "string",
```
```
"codigoCategoriaVeiculo": “string”,
```
```
"descricaoCategoriaVeiculo": "string",
```
```
"codigoTipoVeiculo": “string”,
```
```
"descricaoTipoVeiculo": "string",
```
```
"codigoCarroceriaVeiculo": “string”,
```
```
"descricaoCarroceriaVeiculo": "string",
```
```
"codigoCorVeiculo": “string”,
```
```
"descricaoCorVeiculo": "string",
```

**Projeto:** Detran **Data** : 20/01/2025

```
"codigoCombustivelVeiculo": “string”,
```
```
"descricaoCombustivelVeiculo": "string",
```
```
"codigoEspecieVeiculo": “string”,
```
```
"descricaoEspecieVeiculo": "string",
```
```
"anoFabricacaoVeiculo": “string”,
```
```
"anoModeloVeiculo": “string”,
```
```
"anoExercicioVeiculo": “string”,
```
```
"kmVeiculo": “string”,
```
```
"valorVendaVeiculo": “string”,
```
```
"ufVeiculo": "string",
```
```
"codigoVendedor": "string",
```
```
"nomeVendedor": "string",
```
```
"emailVendedor": "string",
```
```
"codigoProvaVidaVendedor": "string",
```
```
"codigoComprador": "string",
```
```
"nomeComprador": "string",
```
```
"emailComprador": "string",
```
```
"logradouroComprador": "string",
```
```
"numeroComprador": "string",
```
```
"complementoComprador": "string",
```
```
"bairroComprador": "string",
```
```
"codigoMunicipioComprador": “string”,
```
```
"nomeMunicipioComprador": "string",
```
```
"ufComprador": "string",
```
```
"cepComprador": "string",
```
```
"codigoProvaVidaComprador": "string",
```

**Projeto:** Detran **Data** : 20/01/2025

```
"autodeclaracaoResidenciaComprador": "string",
```
```
"confirmacaoAutodeclaracaoResidenciaComprador": “string”,
```
```
"codigoAnexoAtpve": "string",
```
```
"codigoAnexoAssinaturaVendedor": "string",
```
```
"codigoAnexoAssinaturaComprador": "string",
```
```
"codigoDespachante": "string",
```
```
"numeroAtpveVeiculo": "string",
```
```
"origemComunicacaoVendaVeiculo": “string”,
```
```
"dataEmissaoCrvVeiculo": "datetime",
```
```
"numeroLaudoVistoria": "string",
```
```
"estadoLaudoVistoria": "string",
```
```
"numeroEcrvVeiculo": "string",
```
```
"anoEcrvVeiculo": “string”,
```
```
"codigoFinanciadoGravame": "string",
```
```
"kmVistoriadaVeiculo": “string”,
```
```
"estadoComprador": "string",
```
```
"codigoAnexoLaudoAuditoria": "string",
```
```
"codigoAnexoAutodeclaracaoResidenciaComprador": "string",
```
```
"dataInicialPagamento": "datetime",
```
```
"idQRCode": "string",
```
```
"qrCode": "string",
```
```
"estadoQRCode": “string”,
```
```
"dataExpiracaoQRCode": "datetime",
```
```
"idPagamentoQRCode": "string",
```
```
"dataPagamentoQRCode": "datetime"
```
#### }


**Projeto:** Detran **Data** : 20/01/2025

```
Ex. Response Status 201 OK:
```
#### {

```
"result":
```
#### {

```
"codigoTransferenciaVeiculo": "<id da transferência criada>"
```
#### }

#### }

```
Caso retorne o erro “TDVAtivaExistenteError” , significa que já existe uma
TDV criada.
```
```
Sem pendências
```
```
Caso o veículo não tenha nenhuma pendência e retornar na chamada acima o
status code 201 “vazio” ou TDVAtivaExistenteError , será chamado o serviço
para apresentar a tela de sucesso:
```
```
(Chamada feita pela Servicenow)
```
#### GET

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos/{{codigoTransferenciaVeiculo}}
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos/{{codigoTransferenciaVeiculo}}
```
```
Headers:
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: X-Access-Token Value: {{tokenAcesso}}
```
```
Key: X-CPF-Usuario Value: {{CPF do usuário}}
```
```
Params:
```
```
Key: campos Value:
```

**Projeto:** Detran **Data** : 20/01/2025

```
placaVeiculo,descricaoMarcaVeiculo,descricaoCorVeiculo,nomeComprador
```
```
Ex. Response Status 200 OK
```
#### {

```
"result":
```
#### {

```
"placaVeiculo": "string",
```
```
"descricaoMarcaVeiculo": "string",
```
```
"descricaoCorVeiculo": "string",
```
```
"nomeComprador": "string"
```
```
"estado": "string"
```
#### }

#### }

```
Regra:
```
```
Caso retorne 7 no campo “estado”, apresentará a tela de pagamento de pix:
```

**Projeto:** Detran **Data** : 20/01/2025

```
Caso retorne 8 no campo “estado”, apresentará pagamento confirmado:
```

**Projeto:** Detran **Data** : 20/01/2025

```
Caso retorne 9 no campo “estado”, apresentará a tela de sucesso:
```
```
Pagamento pendente
```
```
Caso seja identificada uma ou mais restrições na chamada PATCH (após clicar
no botão “Confirmar” da tela confirmação de endereço, serão retornadas as
pendências da seguinte forma:
```
```
Response: 500
```
```
Vistoria regularizada e pagamento pendente
```
#### {

```
"message": "PagamentoPendenteError",
```
```
"detail": "Pagamento de taxa não localizado"
```
#### }


**Projeto:** Detran **Data** : 20/01/2025

```
Ao selecionar o item “pagamento pendente”, exibirá os débitos existentes:
```

**Projeto:** Detran **Data** : 20/01/2025

```
Para apresentar a tela com os dados de situação financeira pendente, será
chamado o serviço:
```
```
OBS: REGRA - Ao chamar a tela abaixo, passar como parâmetro no app o
"nomeComprador" retirado da chamada anterior.
```
```
(Chamada feita pela Servicenow)
```
#### GET

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos/{{codigoTransferenciaVeiculo}}/debitos
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos/{{codigoTransferenciaVeiculo}}/debitos
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Ex. Response status 200 OK:
```
```
{
"result":
{
"valorTotal": 761.1300000000001,
"debitos":
[
{
"descricao": "Transferência de Veículo",
"valor": 272.27
},
{
"descricao": "Licenciamento",
"valor": 160.22
},
{
"descricao": "Multa MUNICIPAL 2550 de 22/12/2023",
```

**Projeto:** Detran **Data** : 20/01/2025

```
"valor": 197.18
},
{
"descricao": "Multa MUNICIPAL 2550 de 22/12/2023",
"valor": 131.46
}
]
}
}
```
```
Após o comprador clicar em “Pagar com pix, chamar o serviço para gerar o
QRcode:
```
```
(Chamada feita pela Servicenow)
```
#### GET

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos/{{codigoTransferenciaVeiculo}}/qr-code?forcarNovo=true
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos/{{codigoTransferenciaVeiculo}}/qr-code?forcarNovo=true
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Ex. Response status 201 OK:
```
#### {

```
"result": {
```
```
"idQRCode": "12345",
```
```
"qrCode":
"00020101021226830014BR.GOV.BCB.PIX2551qrcodesample.com.br12345...",
```

**Projeto:** Detran **Data** : 20/01/2025

```
"estadoQRCode": 1,
```
```
"idPagamentoQRCode": "98765",
```
```
"dataPagamentoQRCode": "2024-09-19T14:30:00Z",
```
```
"dataExpiracaoQRCode": "2024-09-19T14:30:00Z"
```
#### }

#### }

```
estadoQRCode pode assumir os seguintes valores:
```
- 1 (Ativo)
- 2 (Pago)
- 3 (Expirado)

```
OBS: REGRA - Para gerar o contador “relógio”, deverá pegar o campo
“dataExpiracao”:”yyyy-MM-ddTHH:mm:ssZ” , menos a data atual feita pelo
desenvolvedor.
```

**Projeto:** Detran **Data** : 20/01/2025

```
OBS: serviço irá bater de 10 em 10 segundos até limitar nos 15 minutos
```
```
Para verificar se o pagamento da taxa foi pago, chamar o serviço:
```
```
(Chamada feita pela Servicenow)
```
#### GET

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos/{{codigoTransferenciaVeiculo}}/qr-code?forcarNovo=false
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos/{{codigoTransferenciaVeiculo}}/qr-code?forcarNovo=false
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Ex. Response status 200 OK:
```
#### {

```
"result": {
```
```
"idQRCode": "12345",
```
```
"qrCode":
"00020101021226830014BR.GOV.BCB.PIX2551qrcodesample.com.br12345...",
```
```
"estadoQRCode": 1,
```
```
"idPagamentoQRCode": "98765",
```
```
"dataPagamentoQRCode": "2024-09-19T14:30:00Z",
```
```
"dataExpiracaoQRCode": "2024-09-19T14:30:00Z"
```
#### }


**Projeto:** Detran **Data** : 20/01/2025

#### }

```
estadoQRCode pode assumir os seguintes valores:
```
- 1 (Ativo)
- 2 (Pago)
- 3 (Expirado)

```
Caso o retorno seja pago, apresentar a seguinte tela:
```
```
Para apresentar a identificação e data do pagamento, pegar os campos da
chamada anterior:
```
```
"idPagamento": "string",
```
```
"dataPagamento": "datetime"
```

**Projeto:** Detran **Data** : 20/01/2025

```
Caso o tempo do pagamento pix expire, apresentaremos a tela abaixo:
```
```
Vistoria e pagamento pendentes
```
```
Agora se a vistoria e o pagamento não foram realizados, será exibido da
seguinte forma:
```
```
Response: 500
```
```
Vistoria e pagamento pendentes
```
#### {

```
"message": "PagamentoVistoriaPendentesError",
```
```
"detail": "Pagamento de taxa não localizado,Laudo de vistoria não localizado"
```
#### }


**Projeto:** Detran **Data** : 20/01/2025

```
Selecionando vistoria, será exibida mensagem de pendência:
```

**Projeto:** Detran **Data** : 20/01/2025

```
Ao selecionar o item pagamento pendente, exibirá os débitos existentes:
```
```
Para apresentar a tela com os dados de situação financeira pendente, será
chamado o serviço:
```
```
OBS: REGRA - Ao chamar a tela abaixo, passar como parâmetro no app o
"nomeComprador" retirado da chamada anterior.
```
```
(Chamada feita pela Servicenow)
```
#### GET

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos/{{codigoTransferenciaVeiculo}}/debitos
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos/{{codigoTransferenciaVeiculo}}/debitos
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```

**Projeto:** Detran **Data** : 20/01/2025

```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Ex. Response status 200 OK:
```
```
{
"result":
{
"valorTotal": 761.1300000000001,
"debitos":
[
{
"descricao": "Transferência de Veículo",
"valor": 272.27
},
{
"descricao": "Licenciamento",
"valor": 160.22
},
{
"descricao": "Multa MUNICIPAL 2550 de 22/12/2023",
"valor": 197.18
},
{
"descricao": "Multa MUNICIPAL 2550 de 22/12/2023",
"valor": 131.46
}
]
}
}
```
```
Após o comprador clicar em “Pagar com pix, chamar o serviço para gerar o
QRcode:
```
```
(Chamada feita pela Servicenow)
```
#### GET

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos/{{codigoTransferenciaVeiculo}}/qr-code?forcarNovo=true
```
```
(Ambiente de Produção)
```

**Projeto:** Detran **Data** : 20/01/2025

```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos/{{codigoTransferenciaVeiculo}}/qr-code?forcarNovo=true
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Ex. Response status 201 OK:
```
#### {

```
"result": {
```
```
"idQRCode": "12345",
```
```
"qrCode":
"00020101021226830014BR.GOV.BCB.PIX2551qrcodesample.com.br12345...",
```
```
"estadoQRCode": 1,
```
```
"idPagamentoQRCode": "98765",
```
```
"dataPagamentoQRCode": "2024-09-19T14:30:00Z",
```
```
"dataExpiracaoQRCode": "2024-09-19T14:30:00Z"
```
#### }

#### }

```
estadoQRCode pode assumir os seguintes valores:
```
- 1 (Ativo)
- 2 (Pago)
- 3 (Expirado)


**Projeto:** Detran **Data** : 20/01/2025

```
OBS: REGRA - Para gerar o contador “relógio”, deverá pegar o campo
“dataExpiracao”:”yyyy-MM-ddTHH:mm:ssZ” , menos a data atual feita pelo
desenvolvedor.
```
```
OBS: serviço irá bater de 10 em 10 segundos até limitar nos 15 minutos
```
```
Para verificar se o pagamento da taxa foi pago, chamar o serviço:
```
```
(Chamada feita pela Servicenow)
```
#### GET

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos/{{codigoTransferenciaVeiculo}}/qr-code?forcarNovo=false
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos/{{codigoTransferenciaVeiculo}}/qr-code?forcarNovo=false
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```

**Projeto:** Detran **Data** : 20/01/2025

```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Ex. Response status 200 OK:
```
#### {

```
"result": {
```
```
"idQRCode": "12345",
```
```
"qrCode":
"00020101021226830014BR.GOV.BCB.PIX2551qrcodesample.com.br12345...",
```
```
"estadoQRCode": 1,
```
```
"idPagamentoQRCode": "98765",
```
```
"dataPagamentoQRCode": "2024-09-19T14:30:00Z",
```
```
"dataExpiracaoQRCode": "2024-09-19T14:30:00Z"
```
#### }

#### }

```
estadoQRCode pode assumir os seguintes valores:
```
- 1 (Ativo)
- 2 (Pago)
- 3 (Expirado)

```
Caso o retorno seja pago, apresentar a seguinte tela:
```

**Projeto:** Detran **Data** : 20/01/2025

```
Para apresentar a identificação e data do pagamento, pegar os campos da
chamada anterior:
```
```
"idPagamento": "string",
```
```
"dataPagamento": "datetime"
```
```
Caso o tempo do pagamento pix expire, apresentaremos a tela abaixo:
```

**Projeto:** Detran **Data** : 20/01/2025

```
Administrativa pendente
```
```
Caso o veículo tenha alguma situação administrativa pendente, será exibida a
seguinte mensagem descritiva:
```
```
Response: 500
```
```
Situação administrativa pendente e situação judicial regularizada
```
#### {

```
"message": "SituacaoAdministrativaPendenteError",
```
```
"detail": "Veículo com bloqueio - Baixa permanente"
```
#### }


**Projeto:** Detran **Data** : 20/01/2025

```
Judicial pendente
```
```
Caso o veículo tenha alguma situação judicial pendente, será exibida a seguinte
mensagem descritiva:
```
```
Response: 500
```
```
Situação judicial pendente e administrativa regularizada
```
#### {

```
"message": "SituacaoJudicialPendenteError",
```
```
"detail": "Veículo com Restrição Judicial"
```
#### }


**Projeto:** Detran **Data** : 20/01/2025

```
Administrativa e judicial pendentes
```
```
Agora se o veículo tiver pendências administrativas e judiciais, será a seguinte
mensagem descritiva:
```
```
Response: 500
```
```
Situações administrativa e judicial pendentes
```
#### {

```
"message": "SituacoesAdministrativaJudicialPendentesError",
```
```
"detail": "Veículo com bloqueio - Baixa permanente,Veículo com Restrição
Judicial"
```
#### }


**Projeto:** Detran **Data** : 20/01/2025

```
Anexos
```
```
Mensagens Restrições.xlsx
```
```
payloads.txt
```
```
curl.txt
```

**Projeto:** Detran **Data** : 20/01/2025

**4.1.10** **_TDV 4.0_**

```
O fluxo do TDV 4.0 Renave, inicia somente no fluxo do vendedor após a
listagem do veículo e verificação de requisitos.
```
```
Acessando o veículo, será solicitada uma prova de vida por validação facial
para identificar se o cidadão realmente é o vendedor.
```

**Projeto:** Detran **Data** : 20/01/2025


**Projeto:** Detran **Data** : 20/01/2025

```
Clicando em “Fazer validação facial”, será aberta a câmera do celular para o
cidadão efetuar o reconhecimento facial.
```
```
Será chamado serviço para criar uma solicitação de prova de vida ou retornar
uma já existente:
```
```
(Chamada feita pela Prodesp)
```
#### POST

```
(Ambiente de Homologação)
```
```
https://vida.api-hml.rota.sp.gov.br/vida/prova
```
```
(Ambiente de Produção)
```
```
https://vida.api.rota.sp.gov.br/vida/prova
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: X-User-AppSP Value: {{tokenIntegrity}}
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Request body:
```
#### {

```
"tipo": 1,
```
```
"cpf": "07961203826",
```
```
"tempoExpiracao": 1440,
```
```
"tempoReuso": 1,
```
```
"solicitante": "TDV",
```
```
"idSolicitante": "3",
```
```
"canalSolicitante": "spgovbr",
```
```
"motivo": "tdv",
```
```
"pushTitulo": null,
```
```
"pushMensagem": null
```

**Projeto:** Detran **Data** : 20/01/2025

#### }

```
Ex. Response status 201 ok
```
#### {

```
"id": "string",
```
```
"cpf": "07961203826",
```
```
"dataCriacao": "12/12/2023 00:00",
```
```
"dataExpiracao": "12/12/2023 00:00",
```
```
"idSocilitante": "1",
```
```
"canalSocilitante": "spgovbr",
```
```
"realizadoPor": "string",
```
```
"idRealizadoPor": "string",
```
```
"solicitante": "TDV",
```
```
"motivo": "tdv",
```
```
"tempoExpiracao": 1440,
```
```
"tempoReuso": 1,
```
```
"tentativas": 0,
```
```
"status": 0,
```
```
"tipo": 1,
```
```
"dataBloqueioDiario": "12/12/2023 00:00",
```
```
"dataRealizacao": "12/12/2023 00:00"
```
#### }

```
Caso o retorno seja diferente de sucesso, considerar a regra abaixo:
```
```
400 Erro de validação
```
```
401 Sem token de autenticação, token inválido ou expirado
```
```
429 Excedida a quantidade de requisições simultâneas
```

**Projeto:** Detran **Data** : 20/01/2025

```
500 Erro inesperado no serviço
```
```
Defaut - Erro inesperado
```
```
Após criar uma solicitação de prova de vida, chamar o serviço para fazer upload
“armazenar” a foto do cidadão:
```
```
(Chamada feita pela Prodesp)
```
#### POST

```
(Ambiente de Homologação)
```
```
https://arquivos.api-hml.rota.sp.gov.br/ps/4afd2041-22cd-4d06-8e12-45d734709
1b4
```
```
(Ambiente de Produção)
```
```
https://arquivos.api.rota.sp.gov.br/ps/4afd2041-22cd-4d06-8e12-45d7347091b4
```
```
Headers:
```
```
Key: X-TraceId-SP Value: 10
```
```
Key: CPF Value: 00466739036
```
```
Key: Content-Type Value: image/jpeg
```
```
Key: Accept Value: application/json
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Request body:
```
```
Envio da imagem no formato binário
```
```
Ex. Response status 200 ok
```
#### {

```
"id": "f4fb19f6-1e70-47aa-abd5-327cbb2958c1",
```
```
"pathId": "37680000",
```
```
"localId": "4afd2041-22cd-4d06-8e12-45d7347091b4",
```
```
"relativePath": "/ps/37680000/f4fb19f6-1e70-47aa-abd5-327cbb2958c1",
```
```
"url":
"https://arquivos.api-hml.rota.sp.gov.br/ps/37680000/f4fb19f6-1e70-47aa-abd5-3
```

**Projeto:** Detran **Data** : 20/01/2025

```
27cbb2958c1"
```
#### }

```
Após criar a solicitação de prova de vida, será chamado o serviço para realizar
o batimento biométrico do cidadão, retornando se a foto enviada confere ou não
com os dados constantes nas bases do TSE e o score obtido na conferência.
```
```
(Chamada feita pela Prodesp)
```
#### POST

```
(Ambiente de Homologação)
```
```
https://vida.api-hml.rota.sp.gov.br/vida/match/v3
```
```
(Ambiente de Produção)
```
```
https://appsp.api.rota.sp.gov.br/vida/match/v3
```
```
Headers:
```
```
Key: idProva Value: id retirado do retorno da chamada anterior
```
```
Key: Content-Type Value: application/json
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: X-User-AppSP Value: {{tokenIntegrity}}
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Request body:
```
#### {

```
"biometria": [
```
#### {

```
"formato": "PNG",
```
```
"urlImagem": "/ps/37680000/f4fb19f6-1e70-47aa-abd5-327cbb2958c1",
"retirado da chamada anterior do campo relativePath"
```
```
"tipo": "FACIAL"
```
#### }

#### ],


**Projeto:** Detran **Data** : 20/01/2025

```
"cpfAtendente": "77897463915",
```
```
"identificador": {
```
```
"tipo": "CPF",
```
```
"numero": "00466739036" “CPF do usuário”
```
#### },

```
"ipAtendente": "0.0.0.0",
```
```
"baseDeDados": "1",
```
```
"macAddressAtendente": "00:00:00:00:00:00"
```
#### }

```
Ex. Response status 200 ok
```
#### {

```
"confere": "true"
```
#### }

```
Regra: no response acima, se o score “confere”, retornar TRUE chamar o
serviço PATCH, se der 204 seguir para próxima tela, caso retorne FALSE ou o
status for 204 e 400 mostrar a tela de erro.
```
```
(Chamada feita pela Servicenow)
```
#### PATCH

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos/{{codigoTransferenciaVeiculo}}
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos/{{codigoTransferenciaVeiculo}}
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```

**Projeto:** Detran **Data** : 20/01/2025

```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Body: raw
```
```
{"estado":"4","codigoProvaVidaComprador":"123456789"}
```
```
Response Status 204 OK
```
```
Tela de erro do reconhecimento facial:
```
```
Caso o retorno seja diferente de sucesso, considerar a regra abaixo:
```
```
204 Identificador não encontrado na base do TSE
```
```
400 Erro de validação
```
```
401 Sem token de autenticação, token inválido ou expirado
```
```
429 Excedida a quantidade de requisições simultâneas
```
```
500 Erro inesperado no serviço
```
```
502 A requisição enviada demorou mais tempo do que o servidor estava
```

**Projeto:** Detran **Data** : 20/01/2025

```
preparado para esperar
```
```
Defaut - Erro inesperado
```
```
Caso obtenha sucesso no reconhecimento facial, será exibida tela que foi
concluída.
```
```
Com a validação facial concluída, iremos chamar o serviço para pegar todas as
informações do veículo:
```
#### GET

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos/{{codigoTransferenciaVeiculo}}
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos/{{codigoTransferenciaVeiculo}}
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```

**Projeto:** Detran **Data** : 20/01/2025

```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Ex. Response Status 200 OK:
```
#### {

```
"result":
```
#### {

```
"codigo": "123456",
```
```
"nome": "João da Silva",
```
```
"email": "joao.silva@email.com",
```
```
"bairro": "Centro",
```
```
"logradouro": "Rua das Flores",
```
```
"numero": "100",
```
```
"complemento": "Apto 202",
```
```
"codigoRenavam": "987654321",
```
```
"placa": "ABC-1234",
```
```
"anoModelo": "2022",
```
```
"marca": "Toyota",
```
```
"cor": "Preto",
```
```
"chassi": "9BWZZZ377VT004251",
```
```
"origem": "5"
```
#### }

#### }


**Projeto:** Detran **Data** : 20/01/2025

```
Caso o campo “origem”, retorne 5 , enviar para tela do TDV 4.0,
```
```
para confirmação de dados da empresa que está comprando o veículo:
```
```
Para exibir os dados da confirmação da compra, é chamado o serviço:
```
```
(Chamada feita pela Servicenow)
```
#### GET

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos/{{codigoTransferenciaVeiculo}}
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos/{{codigoTransferenciaVeiculo}}
```
```
Headers:
```

**Projeto:** Detran **Data** : 20/01/2025

```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Ex. Response Status 200 OK
```
#### {

```
"result":
```
#### {

```
"codigo": "123456",
```
```
"nome": "João da Silva",
```
```
"email": "joao.silva@email.com",
```
```
"bairro": "Centro",
```
```
"logradouro": "Rua das Flores",
```
```
"numero": "100",
```
```
"complemento": "Apto 202",
```
```
"codigoRenavam": "987654321",
```
```
"placa": "ABC-1234",
```
```
"anoModelo": "2022",
```
```
"marca": "Toyota",
```
```
"cor": "Preto",
```
```
"chassi": "9BWZZZ377VT004251",
```
```
"origem": "5"
```
#### }

#### }


**Projeto:** Detran **Data** : 20/01/2025

```
Confirmando os dados do comprador, será solicitado autodeclaração de
endereço. Sendo como obrigatório marcar o checkbox confirmando que as
informações são verdadeiras.
```
```
Para exibir o texto de autodeclaração de endereço, é chamado o serviço:
```
```
(Chamada feita pela Servicenow)
```
#### GET

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos/{{codigoTransferenciaVeiculo}}
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos/{{codigoTransferenciaVeiculo}}
```
```
Headers:
```

**Projeto:** Detran **Data** : 20/01/2025

```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Ex. Response Status 200 OK
```
#### {

```
"result":
```
#### {

```
"termoCienciaResponsabilidade”
```
```
}
```
```
}
```
```
Ao selecionar o checkbox e clicar em “Confirmar” , é chamado o serviço:
```
```
(Chamada feita pela Servicenow)
```
#### PATCH

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos/{{codigoTransferenciaVeiculo}}
```
```
(Ambiente de Produção)
```
```
https://apisn.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veic
ulos/{{codigoTransferenciaVeiculo}}
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```

**Projeto:** Detran **Data** : 20/01/2025

```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Body: raw
```
```
{"estado":"6","confirmacaoTermoCienciaResponsabilidade":true}
```
```
Response Status 204 OK
```
```
Confirmando a declaração de endereço, será solicitado que o comprador assine
o documento de intenção de venda eletronicamente.
```
```
Ao clicar em “Assinar” , será aberto o app do gov.br gerando uma mensagem
com código. Será necessáro voltar ao app sp.gov.br e inserir o código na
```

**Projeto:** Detran **Data** : 20/01/2025

```
seguinte tela “Webview”:
```
```
(Ambiente de Homologação)
```
```
https://cas.staging.iti.br/oauth2.0/authorize?response_type=code&redirect_uri=d
etran.sp://localhost/appdetran/iti/oauth_redirect.html&scope=sign&client_id=app
detranprodesphomol
```
```
(Ambiente de Produção)
```
```
https://cas.iti.br/oauth2.0/authorize?response_type=code&redirect_uri=spgovbr:/
/localhost/appspgovbr/iti/oauth_redirect.html&scope=sign&client_id=spgovbrpro
d
```
```
OBS: Não temos a url correta do ambiente de produção
```
```
Ao inserir o código e clicar em “Autorizar” , o usuário irá receber um token para
inserir e ser chamado para atualizar o estado:
```
```
(Chamada feita pela Servicenow)
```
#### PATCH

```
https://f110-2804-14c-6541-42ed-a107-afee-8e49-21f4.ngrok-free.app/api/x_md
```

**Projeto:** Detran **Data** : 20/01/2025

```
pdd_be_tdv/v1/tdv/transferencias-de-veiculos/{{codigoTransferenciaVeiculo}}
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```
```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Body: raw
```
```
{"estado":"7"}
```
```
Response Status 204 OK
```
```
Após chamar o serviço acima, será apresentada a tela que a intenção de
compra do veículo foi realizada com sucesso. Para a finalização da
transferência o vendedor deverá assinar o documento e posteriormente o
comprador pagar a taxa.
```

**Projeto:** Detran **Data** : 20/01/2025

**4.1.11** **_TDV 5.0_**

```
O fluxo do TDV 5.0 Procuração, inicia com a verificação se o cidadão foi
indicado como procurador de um veículo. Para acessar o módulo, o cidadão
deverá clicar no botão para verificar se existe uma procuração ativa em seu
nome:
```
```
(Chamada feita pela Servicenow)
```
#### GET

```
(Ambiente de Homologação)
```
```
https://pdspdetranqa.service-now.com/api/x_mdpdd_be_gp/v1/ges_proc/getOut
organtes?servico=c2d1d4d51b3b0614743265b33a4bcb05&cpf=16030692755
```
```
Headers:
```
```
Key: Content-Type Value: application/json
```
```
Key: X-Integrity-Token Value: {{tokenIntegrity}}
```
```
Key: Authorization Value: {{tokenAcesso}}
```

**Projeto:** Detran **Data** : 20/01/2025

```
Key: Accept Value: application/json
```
```
Key: User-Agent Value: {{iOS|Android}}/appsp/{{versao}}
```
```
Key: X-CPF-Usuario Value: {{cpfusuario}}
```
```
Key: X-cpf-procurador Value: {{cpf_procurador}}
```
```
Key: Xprocuracao-number Value: {{numeroProcuracao}}
```
```
Response Status 200 OK
```
```
data = listOf(
```
```
DataItem(
```
```
type = "procuracoes",
```
```
id = "3a90944dfb89f210b898f4045eefdca3",
```
```
attributes = Attributes(
```
```
procuracoes = Procuracoes(
```
```
number = "PROC0005004",
```
```
outorgante = Outorgante(
```
```
idOutorgante = "07984224000124",
```
```
nomeOutorgante = "TECHNOVA SOLUTIONS",
```
```
representante = Representante(
```
```
id = "87223147849",
```
```
nome = "LELIS SOUZA FILHO"
```
#### ),

```
tipoOutorgante = "Pessoa Jurídica (PJ)"
```
#### ),

```
procurador = Procurador(
```
```
idProcurador = "34324084807",
```
```
nomeProcurador = "JOSILDO LIMA",
```
```
representante = Representante(
```

**Projeto:** Detran **Data** : 20/01/2025

```
id = null,
```
```
nome = null
```
#### ),

```
tipoProcurador = "Pessoa Física (PF)"
```
#### )

#### )

#### )

#### ),

```
DataItem(
```
```
type = "procuracoes",
```
```
id = "ba90944dfb89f210b898f4045eefdca6",
```
```
attributes = Attributes(
```
```
procuracoes = Procuracoes(
```
```
number = "PROC0005183",
```
```
outorgante = Outorgante(
```
```
idOutorgante = "16030692755",
```
```
nomeOutorgante = "MARIA PAULA DA SILVA TELES",
```
```
representante = Representante(
```
```
id = null,
```
```
nome = null
```
#### ),

```
tipoOutorgante = "Pessoa Física (PF)"
```
#### ),

```
procurador = Procurador(
```
```
idProcurador = "34324084807",
```
```
nomeProcurador = "JOSILDO LIMA",
```

**Projeto:** Detran **Data** : 20/01/2025

```
representante = Representante(
```
```
id = null,
```
```
nome = null
```
#### ),

```
tipoProcurador = "Pessoa Física (PF)"
```
#### )

#### )

#### )

#### )

#### ),

```
jsonapi = JsonApi(version = "1.1"),
```
```
links = Links(self = "/api/x_mdpdd_be_gp/v1/ges_proc/getOutorgantes"),
```
```
meta = Meta(existeProcuracaoPFouPJ = "true")
```
#### )

```
Caso não retorne procuração para o cidadão, no responde irá retornar
Status code 404.
```
```
Caso tenha procuração ativa, será exibido em tela qual opção o cidadão
acesse, por PF ou PJ:
```

**Projeto:** Detran **Data** : 20/01/2025

```
Na sequência, independente da escolha, avançando para próxima tela, serão
exibidos o(s) nome(s) da(s) pessoa(s) que deseja representar no serviço:
```

**Projeto:** Detran **Data** : 20/01/2025

```
Após selecionar o nome e confirmar, serão exibidos os dados do representante
e do dono do veículo. Daqui para frente o fluxo é o mesmo existente na TDV 1.0
sendo como vendedor e comprador.
```
```
OBS: O único detalhe que é necessário ser acrescentado, é o envio do
“Header” {{cpf_procurador}} e {{numeroProcuracao}}. para que o fluxo siga
com as telas contendo o card azul da procuração.
```

**Projeto:** Detran **Data** : 20/01/2025

**4.1.12** **_TDV 6.0_**

```
O fluxo do TDV 6.0 inicia somente como comprador. Para identificar se é
cartório , primeiramente deverá chamar o serviço de listagem de veículos
“/veiculos” e verificar os campos:
```
```
Se “origem” = 6 e “estado” = 7, significa que é TDV 6.0
```

**Projeto:** Detran **Data** : 20/01/2025

```
Sendo assim, na sequência chamar o serviço de “/validar-tdv”:
```
```
(Chamada feita pela Servicenow)
```
#### POST

```
(Ambiente de Homologação)
```
```
https://apisnqa.detran.sp.gov.br/api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-v
eiculos/validar-tdv
```
```
Body: obterTransf (Retorna na chamada de listagem de veículo)
```
```
Response Status 200 OK (Retornando sucesso, seguir para o fluxo do
e-notariado)
```
```
Caso retorne 406, verifique o campo “message”.
```
```
Se retornar "DuasAssinaturasError", apresentar a seguinte tela:
```

**Projeto:** Detran **Data** : 20/01/2025

```
Se retornar "DuasPessoasFisicasError", apresentar a seguinte tela:
```

```
Projeto: Detran Data : 20/01/2025
```
**5. Fluxo Alternativo “Mensagens de erro API”**

OBS: Os nomes dos tipos de erro não possuem separação, i.e., espaço em branco ou quebra de linha. Entretanto, neste
documento esses caracteres foram utilizados por motivos estéticos.

**Erros genéricos**

Os erros a seguir podem ocorrem ao invocar qualquer operação da API:

**Listar veículos**

Os erros a seguir podem ocorrer ao invocar a operação “Listar veículos”:

**Criar transferência de veículo**

Os erros a seguir podem ocorrer ao invocar a operação “Criar transferência de veículo”:


```
Projeto: Detran Data : 20/01/2025
```
**Encontrar transferência de veículo ativa**


```
Projeto: Detran Data : 20/01/2025
```
Os erros a seguir podem ocorrer ao invocar a operação “Encontrar transferência de veículo ativa”:

**Solicitar prova de vida**

Os erros a seguir podem ocorrer ao invocar a operação “Solicitar prova de vida”:

**Verificar solicitação de prova de vida**

Os erros a seguir podem ocorrer ao invocar a operação “Verificar solicitação de prova de vida”:

**Obter dados do comprador**

Os erros a seguir podem ocorrer ao invocar a operação “Obter dados do comprador”:

**Obter CEP do comprador**

Os erros a seguir podem ocorrer ao invocar a operação “Obter CEP do comprador”:

**Atualizar dados do comprador**


```
Projeto: Detran Data : 20/01/2025
```
Os erros a seguir podem ocorrer ao invocar a operação “Atualizar dados do comprador”:

**Atualizar dados da venda**


```
Projeto: Detran Data : 20/01/2025
```
Os erros a seguir podem ocorrer ao invocar a operação “Atualizar dados da venda”:


```
Projeto: Detran Data : 20/01/2025
```
**Revisar dados do comprador**

Os erros a seguir podem ocorrer ao invocar a operação “Revisar dados do comprador”:

**Cancelar transferência de veículo**

Os erros a seguir podem ocorrer ao invocar a operação “Cancelar transferência de veículo”:


```
Projeto: Detran Data : 20/01/2025
```
**Criar ATPV-e**

Os erros a seguir podem ocorrer ao invocar a operação “Criar ATPV-e”:

**Listar notificações**

Não existem erros específicos relacionados à invocação da operação “Listar notificações”.


```
Projeto: Detran Data : 20/01/2025
```
**Marcar notificação como lida**

Os erros a seguir podem ocorrer ao invocar a operação “Marcar notificação como lida”:

**Obter transferência de veículo**

Os erros a seguir podem ocorrer ao invocar a operação “Obter transferência de veículo”:

**Listar veículos para comprador**

Não existem erros específicos relacionados à invocação da operação “Listar veículos para comprador”.

**Revisar intenção de compra**

Os erros a seguir podem ocorrer ao invocar a operação “Revisar intenção de compra”:

**Revisar compra**

Os erros a seguir podem ocorrer ao invocar a operação “Revisar compra”:


```
Projeto: Detran Data : 20/01/2025
```
**Confirmar compra**

Os erros a seguir podem ocorrer ao invocar a operação “Confirmar compra”:

**Revisar autodeclaração de residência**

Os erros a seguir podem ocorrer ao invocar a operação “Revisar autodeclaração de residência”:

**Confirmar autodeclaração de residência**

Os erros a seguir podem ocorrer ao invocar a operação “Confirmar autodeclaração de residência”:


```
Projeto: Detran Data : 20/01/2025
```
**Assinar ATPV-e (comprador)**

Os erros a seguir podem ocorrer ao invocar a operação “Assinar ATPV-e (comprador)”:


```
Projeto: Detran Data : 20/01/2025
```
**Revisar venda**

Os erros a seguir podem ocorrer ao invocar a operação “Revisar venda”:

**Assinar ATPV-e (vendedor)**

Os erros a seguir podem ocorrer ao invocar a operação “Assinar ATPV-e (vendedor)”:


```
Projeto: Detran Data : 20/01/2025
```
**Notificar vendedor do sucesso**

Os erros a seguir podem ocorrer ao invocar a operação “Notificar vendedor do sucesso”:

**Notificar sobre pagamento da taxa**

Os erros a seguir podem ocorrer ao invocar a operação “Notificar sobre pagamento da taxa”:

**Notificar transferência concluída**

Os erros a seguir podem ocorrer ao invocar a operação “Notificar transferência concluída”:

**Fazer download do CRLV**

Os erros a seguir podem ocorrer ao invocar a operação “Fazer download do CRLV”:

**Notificar cancelamento**

Os erros a seguir podem ocorrer ao invocar a operação “Notificar cancelamento”:


```
Projeto: Detran Data : 20/01/2025
```
**Listar solicitações**

Não existem erros específicos relacionados à invocação da operação “Listar solicitações”.

**Obter solicitação**

Os erros a seguir podem ocorrer ao invocar a operação “Obter solicitação”:

**6. Serviços WS**

```
https://novodev.detran.sp.gov.br/now/nav/ui/classic/params/target/x_snc_hexagon_swagger_ui.do%3Fsy
sparm_attachment_id%3Df898f7e51bb89650743265b33a4bcb14%26displayOperationId%3Dtrue
```
**7. Regras de negócio**

```
R001 - Para acessar o serviço de transferência de veículo como vendedor ou comprador, é necessário
que o cidadão possua o nível de selo prata ou ouro em sua conta gov.br.
```
```
R 002 - Usuário deve possuir cadastro na plataforma Gov BR;
```
```
R 003 - É permitido logar no App qualquer usuário com selo BRONZE, PRATA ou OURO;
```
```
R 004 - Para o usuário acessar a transferência de propriedade de veículo, terá como premissa ter um perfil
com selo PRATA ou OURO;
```
```
R 005 - O veículo deve estar registrado no estado de São Paulo;
```
```
R 006 - O veículo precisa ser transferido para um local dentro do Estado de São Paulo;
```
```
R 007 - O pagamento da taxa de transferência do veículo deve ser realizado previamente;
```

```
Projeto: Detran Data : 20/01/2025
```
**R 008 -** A vistoria do veículo deve ser realizada previamente com validade dos últimos 60 dias;

**R 009 -** O veículo **não** pode possuir débitos e restrições;

**R 010 -** Este serviço é para transferência de veículo entre pessoas físicas;

**R 011 -** Para transferir o veículo entre cidades diferentes é necessário ter a placa Mercosul;

**R 012 -** Para veículos que possuam a placa cinza (placa municipal), a transferência somente será realizada

no mesmo município de residência do novo proprietário;

**R 013 -** ATPVe emitido a partir de 04/01/2021.

**8. Referências**

**8.1 Protótipo do aplicativo**

https://www.figma.com/proto/zLkP9Kff2CdkpRejqKCR2b/APP-%7C-Detran-SP?page-id=886%3A11455&node-id
=1852-34626&node-type=frame&viewport=2051%2C1837%2C0.44&t=lJq9f5T6BFzpVopu-1&scaling=scale-down
&content-scaling=fixed&starting-point-node-id=1158%3A3927&show-proto-sidebar=1


