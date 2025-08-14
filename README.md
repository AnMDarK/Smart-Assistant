
# Protótipo: Assistente Pessoal (web)

Este é um protótipo funcional **frontend (web)** + **backend stub (Node.js)** que demonstra o fluxo:
- Gravar áudio no navegador
- Enviar áudio ao backend
- Receber JSON estruturado (mock) com listas, agenda e sugestões
- Renderizar listas no frontend

## O que está incluído
- `index.html` — interface minimalista e arredondada
- `style.css` — estilos
- `app.js` — lógica de gravação e comunicação
- `server.js` — backend de exemplo que retorna uma resposta mock (Node.js + Express)
- `README.md` — este arquivo

## Como testar localmente (passo a passo simples)
1. Baixe/extraia o conteúdo para uma pasta.
2. Backend:
   - Instale Node.js (v14+).
   - Abra um terminal dentro da pasta e rode:
     ```
     npm init -y
     npm install express multer cors
     node server.js
     ```
   - O backend vai rodar em `http://localhost:3000`.

3. Frontend:
   - Você pode abrir `index.html` diretamente no navegador (alguns navegadores bloqueiam fetch para `file://`).
   - Recomendado: usar um servidor simples. Exemplo com Python:
     ```
     python3 -m http.server 8000
     ```
     Depois abra `http://localhost:8000` e use o protótipo.
   - Ao clicar em **Gravar** você permite o microfone, grava e envia ao backend.
   - O backend retorna uma resposta mock e a interface mostra o JSON e as listas.

## Próximos passos para funcionalidade real
- Substituir o mock em `server.js` por:
  1. Chamada ao serviço de transcrição (ex.: OpenAI Speech-to-Text) para transcrever o áudio.
  2. Enviar a transcrição para o modelo com o **Prompt de Sistema** que você já tem para gerar o JSON.
  3. Validar datas/horários ambíguos e pedir confirmação ao usuário.
  4. Integrar com Google Calendar / Outlook via OAuth para criar eventos reais.
  5. Persistir listas e usuários com Firebase (Firestore) e usar FCM para notificações.

## Observações importantes
- Este protótipo **não** envia áudio a serviços externos. É local e seguro para testes.
- Para produção, proteja chaves de API, implemente autenticação e criptografia, e siga políticas de privacidade.

## Arquivos importantes
- `server.js` — substitua o bloco mock pelo seu código de integração com OpenAI/Firebase.
- `app.js` — cliente que grava e envia áudio.

