# Prospecta V1

Plataforma local de prospecção comercial, sem banco de dados de servidor.

## Recursos

- Dashboard com funil comercial
- Busca de empresas via Google Places API (opcional)
- Atalho para busca no Google Maps
- Cadastro manual de leads
- Memória persistente com IndexedDB
- Status do lead e histórico de atualização
- Score de oportunidade
- Sugestão de serviço
- Modelos de abordagem para WhatsApp
- Abertura do WhatsApp com mensagem pronta
- Cadastro de serviços
- Exportação CSV
- Backup e restauração em JSON

## Como abrir

### Opção simples
Abra `index.html` no Chrome/Edge.

### Opção recomendada
Alguns navegadores limitam chamadas de API quando o arquivo é aberto diretamente.
Se você tiver Python instalado, abra o terminal na pasta e execute:

    python -m http.server 8080

Depois acesse:

    http://localhost:8080

## Google Places API

1. Crie um projeto no Google Cloud.
2. Ative a Places API (New).
3. Crie uma chave de API.
4. Configure restrições apropriadas para a chave.
5. Dentro da plataforma, abra Configurações e salve a chave.

A busca usa o endpoint Text Search (New).

## Memória

A plataforma usa IndexedDB do navegador. Os dados continuam salvos após fechar e abrir novamente.

Eles podem ser perdidos se você:
- limpar os dados do navegador;
- usar janela anônima;
- trocar de computador;
- apagar o perfil do navegador.

Por isso existe o botão de backup JSON.

## Observação sobre prospecção

Use os dados e mensagens de forma responsável e respeite as regras aplicáveis do Google, do WhatsApp e de proteção de dados. A plataforma prepara e abre a conversa; o envio continua sob seu controle.
