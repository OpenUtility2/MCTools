// Install dependencies: npm install ws rcon-client
const { WebSocketServer } = require('ws');
const { Rcon } = require('rcon-client');

const PORT = 8080;
const wss = new WebSocketServer({ port: PORT });

console.log(`[RCON Bridge] WebSocket proxy listening on ws://localhost:${PORT}`);

wss.on('connection', (ws) => {
  let rcon = null;

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'auth') {
        try {
          // Connect to actual Minecraft RCON TCP port (default 25575)
          rcon = await Rcon.connect({
            host: '127.0.0.1', // Change if Minecraft server is on another IP
            port: 25575,       // Your server's rcon.port in server.properties
            password: data.password
          });

          ws.send(JSON.stringify({ type: 'auth_result', success: true }));
        } catch (err) {
          ws.send(JSON.stringify({ type: 'auth_result', success: false, error: err.message }));
        }
      } else if (data.type === 'command') {
        if (rcon) {
          const response = await rcon.send(data.command);
          ws.send(JSON.stringify({ type: 'response', body: response }));
        } else {
          ws.send(JSON.stringify({ type: 'response', body: '[Bridge Error] Not authenticated to RCON.' }));
        }
      }
    } catch (err) {
      ws.send(JSON.stringify({ type: 'response', body: `[Bridge Error] ${err.message}` }));
    }
  });

  ws.on('close', () => {
    if (rcon) rcon.end();
  });
});
