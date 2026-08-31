# Prospecta V2

A V2 adiciona o modo **Assistente IA**, pensado para usar sua conta normal do ChatGPT sem precisar contratar Google Places API ou OpenAI API.

## Fluxo sem API

1. Abra **Assistente IA**.
2. Informe nicho, cidade e quantidade.
3. Marque os dados desejados.
4. Clique em **Gerar solicitação**.
5. Copie e envie a solicitação no ChatGPT.
6. O ChatGPT pesquisa empresas reais e devolve um bloco JSON estruturado.
7. Copie o JSON.
8. Volte ao Prospecta, cole em **Importar resposta** e clique em **Analisar resposta**.
9. Confira a prévia e importe os leads.
10. Os leads ficam salvos no histórico local da plataforma.

## Recursos

- Dashboard e funil comercial
- Assistente IA sem API integrada
- Importação estruturada de resultados do ChatGPT
- Detecção de empresas já cadastradas
- Cadastro manual
- Memória persistente via IndexedDB
- Status e observações
- Score de oportunidade
- Sugestão de serviços
- Mensagens para WhatsApp
- Exportação CSV
- Backup/restauração JSON
- Google Places continua disponível como recurso opcional

## Memória

Os dados ficam no IndexedDB do navegador. Faça backups periódicos. Limpar os dados do navegador, usar modo anônimo ou trocar de computador pode remover o histórico local.

## Abrir

Você pode abrir `index.html` diretamente. Para recursos web que exijam permissões adicionais do navegador, é preferível executar a pasta por um servidor local:

    python -m http.server 8080

e acessar `http://localhost:8080`.
