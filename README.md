# mcp-websocket

Transporte WebSocket para o SDK TypeScript do MCP (Message Control Protocol) da Anthropic.

O SDK oficial atualmente oferece apenas SSE (Server-Sent Events) como transporte no servidor.  
Este projeto implementa suporte a **WebSocket**, útil para ambientes onde esse protocolo é necessário.

---

## 📦 Instalação

```bash
npm install mcp-websocket
```

## Código de exemplo

```javascript
import { McpServer } from "mcp-sdk"; // ou o caminho correto do SDK MCP
import { WebSocketServerTransport } from "mcp-websocket";

const mcpServer = new McpServer(serverInfo);
const transport = new WebSocketServerTransport(8080, "localhost");

mcpServer.connect(transport);
```

## 🧩 API
```javascript
new WebSocketServerTransport(port: number, host?: string)
```
Cria um servidor WebSocket ouvindo na porta e host especificados.

## 💡 Motivação
A escolha por SSE no projeto oficial do MCP é baseada em escalabilidade.
No entanto, muitos sistemas em produção utilizam WebSocket e precisam desse tipo de conexão para comunicação em tempo real.

Este pacote oferece uma solução compatível enquanto o suporte oficial ainda está em discussão.

## 🤝 Contribuindo
Contribuições são bem-vindas!
Sinta-se à vontade para abrir issues, enviar PRs ou sugerir melhorias.