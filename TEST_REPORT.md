# Relatório de testes - Prospecta V2.2

Data: 31/08/2026

## Resultado

49 verificações funcionais aprovadas.

## Fluxo de trabalho testado

- Inicialização do Dashboard
- Carregamento dos serviços e mensagens padrão
- Navegação em todas as telas
- Busca manual pelo Google Maps
- Aviso correto quando Google Places está sem chave
- Cadastro manual de empresa
- Cálculo de oportunidade e recomendação automática
- Atualização do Dashboard após cadastro
- Assistente IA
  - geração de solicitação
  - cópia da solicitação
  - abertura do ChatGPT
  - validação de JSON
  - prévia da importação
  - importação de leads
  - detecção de duplicatas
  - rejeição de JSON inválido
- Leads
  - listagem
  - pesquisa
  - filtro por oportunidade
  - edição
  - alteração de status
  - observações
  - exclusão
- WhatsApp
  - geração da mensagem
  - geração do link wa.me com telefone
- Serviços
  - carregamento dos serviços padrão
  - cadastro de novo serviço
- Abordagens
  - carregamento dos modelos
  - edição e salvamento de modelo
- Configurações
  - salvar chave opcional
  - mostrar/ocultar chave
- Exportação CSV
- Backup JSON
- Limpeza dos dados
- Restauração de backup
- Navegação mobile em Dashboard, Prospectar, Assistente IA, Leads, Serviços, Abordagens e Configurações
- Validação sintática do app.js
- Validação de referências entre IDs do HTML e JavaScript

## Problemas encontrados e corrigidos

1. No celular, Serviços, Abordagens e Configurações ficavam ocultos no menu.
   Correção: menu inferior passou a permitir rolagem horizontal e todas as telas permanecem acessíveis.

2. O botão “Apagar todos os dados” não removia as configurações locais.
   Correção: agora também limpa a store de configurações e remove a chave opcional exibida.

## Observação do ambiente de teste

O ambiente de execução bloqueia navegação do Chromium para localhost/file por política administrativa.
Por isso, os testes de interface foram executados em Chromium real com uma camada de memória isolada equivalente à interface usada pelo IndexedDB. A implementação original do IndexedDB permaneceu no produto final e foi verificada estruturalmente e por sintaxe.

O fluxo gratuito do Assistente IA continua sendo manual: Prospecta gera o prompt -> usuário envia ao ChatGPT -> ChatGPT devolve JSON -> Prospecta importa.
