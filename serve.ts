// Local static server for Aeris Valley Air Rally (Node 22, standard library only).
// Serves game/ at http://localhost:8080 so the game can be played and screenshotted
// in a desktop browser with no network. Not part of the graded hand-in.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = join(here, 'game');
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

const server = createServer(async (req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const filePath = join(root, urlPath === '/' ? 'index.html' : urlPath);
  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end();
    return;
  }
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'content-type': types[extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
});

server.listen(8080, () => {
  console.log('Aeris Valley Air Rally at http://localhost:8080');
});
