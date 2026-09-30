import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRiri } from '@riri/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const HTML_FILE = path.join(__dirname, 'index.html');

const heuristicRiri = createRiri({ decisionEngine: 'heuristic' });
const layaRiri = createRiri({ decisionEngine: 'laya', timeout: 20000 });
let layaLoaded = false;

// Pre-warm Laya in background on server launch
layaRiri.load().then(() => {
  layaLoaded = true;
  console.log('🧠 Laya ONNX model pre-warmed and ready for inference!');
}).catch(err => {
  console.warn('⚠️ Laya pre-warm deferred:', err.message);
});

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost:3000'));

  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    try {
      const html = fs.readFileSync(HTML_FILE, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error loading index.html: ' + err.message);
    }
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/laya/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ loaded: layaLoaded, ready: layaLoaded }));
    return;
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const text = payload.text || '';

        if (url.pathname === '/api/rewrite') {
          const chosenEngine = payload.decisionEngine === 'laya' ? 'laya' : 'heuristic';
          let targetRiri = heuristicRiri;
          if (chosenEngine === 'laya') {
            if (!layaLoaded) {
              await layaRiri.load();
              layaLoaded = true;
            }
            targetRiri = layaRiri;
          }

          const result = await targetRiri.rewrite(text, {
            mode: payload.mode || 'standard',
            aggressiveness: payload.aggressiveness ?? 0.6,
            freezeWords: payload.freezeWords || [],
            decisionEngine: chosenEngine,
          });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
          return;
        }

        if (url.pathname === '/api/grammar') {
          const result = await heuristicRiri.grammar(text);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
          return;
        }

        if (url.pathname === '/api/readability') {
          const result = await heuristicRiri.readability(text);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
          return;
        }

        if (url.pathname === '/api/tone') {
          const result = await heuristicRiri.tone(text);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
          return;
        }

        if (url.pathname === '/api/summarize') {
          const result = await heuristicRiri.summarize(text, { maxSentences: 2 });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
          return;
        }


        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Endpoint not found' }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`
=======================================================
   🌸 RIRI Playground running at:
   http://localhost:${PORT}
   
   Ready for interactive browser testing!
=======================================================
`);
});
