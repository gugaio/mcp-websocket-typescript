import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { JSONRPCMessage, JSONRPCMessageSchema } from "@modelcontextprotocol/sdk/types.js";
import { WebSocketServer } from 'ws';

const SUBPROTOCOL = "mcp";

/**
 * Server transport for WebSocket: this will accept connections from clients over the WebSocket protocol.
 */
export class WebSocketServerTransport implements Transport {
  private _server?: WebSocketServer; 
  private _socket?: WebSocket; // Active connection
  private _port: number;
  private _host?: string;

  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;
  onconnection?: (socket: WebSocket) => void;

  constructor(port: number, host?: string) {
    this._port = port;
    this._host = host;
  }

  start(): Promise<void> {
    if (this._server) {
      throw new Error(
        "WebSocketServerTransport already started! Call close() before starting again.",
      );
    }

    return new Promise((resolve, reject) => {
      try {
        
        if (!WebSocketServer) {
          reject(new Error("WebSocket Server implementation not found. Please install 'ws' or similar library."));
          return;
        }

        this._server = new WebSocketServer({
          port: this._port,
          host: this._host
        });

        this._server.on('error', (error: Error) => {
          reject(error);
          this.onerror?.(error);
        });

        this._server.on('listening', () => {
          resolve();
        });

        this._server.on('connection', (socket: WebSocket) => {
          // Only accept connections with the correct subprotocol
          if (socket.protocol !== SUBPROTOCOL) {
            socket.close(1002, 'Unsupported protocol');
            return;
          }

          this._socket = socket;
          this.onconnection?.(socket);

          socket.onerror = (event) => {
            const error = 
              "error" in event
                ? (event.error as Error)
                : new Error(`WebSocket error: ${JSON.stringify(event)}`);
            this.onerror?.(error);
          };

          socket.onclose = () => {
            this._socket = undefined;
            this.onclose?.();
          };

          socket.onmessage = (event: MessageEvent) => {
            let message: JSONRPCMessage;
            try {
              const data = typeof event.data === 'string' ? event.data : event.data.toString();
              message = JSONRPCMessageSchema.parse(JSON.parse(data));
            } catch (error) {
              this.onerror?.(error as Error);
              return;
            }

            this.onmessage?.(message);
          };
        });

      } catch (error) {
        reject(error as Error);
      }
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve) => {
      if (this._socket) {
        this._socket.close();
        this._socket = undefined;
      }

      if (this._server) {
        this._server.close(() => {
          this._server = undefined;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  send(message: JSONRPCMessage): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this._socket) {
        reject(new Error("No active connection"));
        return;
      }

      if (this._socket.readyState !== 1) { // WebSocket.OPEN
        reject(new Error("Connection not ready"));
        return;
      }

      try {
        this._socket.send(JSON.stringify(message));
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get the current active connection
   */
  get socket(): WebSocket | undefined {
    return this._socket;
  }

  /**
   * Check if there's an active connection
   */
  get isConnected(): boolean {
    return !!this._socket && this._socket.readyState === 1;
  }

  /**
   * Get server info
   */
  get address(): { port: number; host?: string } {
    return { port: this._port, host: this._host };
  }
}