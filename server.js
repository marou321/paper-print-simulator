const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.woff2': 'font/woff2'
};

const COMPRESSIBLE_EXTS = new Set(['.html', '.css', '.js', '.json', '.svg', '.txt', '.xml']);

// Clean route map for core pages (works with or without trailing slashes)
const PAGE_ROUTES = {
  '/': 'index.html',
  '/about': path.join('about', 'index.html'),
  '/contact': path.join('contact', 'index.html'),
  '/privacy': path.join('privacy', 'index.html')
};

function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}

function sendJson(res, statusCode, payload, isHead = false) {
  const body = JSON.stringify(payload);
  setSecurityHeaders(res);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  });
  res.end(isHead ? undefined : body);
}

function serveFile(req, res, filePath, statusCode = 200) {
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(PUBLIC_DIR))) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.stat(resolved, (statErr, stats) => {
    if (statErr || !stats.isFile()) {
      const notFoundPage = path.join(PUBLIC_DIR, '404.html');
      if (resolved !== path.resolve(notFoundPage) && fs.existsSync(notFoundPage)) {
        return serveFile(req, res, notFoundPage, 404);
      }
      setSecurityHeaders(res);
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(resolved).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const isHtml = ext === '.html';
    const cacheControl = isHtml
      ? 'public, max-age=300, must-revalidate'
      : 'public, max-age=86400';

    setSecurityHeaders(res);
    const acceptEncoding = String(req.headers['accept-encoding'] || '');
    const shouldGzip = COMPRESSIBLE_EXTS.has(ext) && /\bgzip\b/i.test(acceptEncoding);

    const headers = {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
      'Vary': 'Accept-Encoding'
    };

    if (req.method === 'HEAD') {
      headers['Content-Length'] = stats.size;
      res.writeHead(statusCode, headers);
      res.end();
      return;
    }

    const stream = fs.createReadStream(resolved);
    stream.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      }
      res.end('Internal Server Error');
    });

    if (shouldGzip) {
      headers['Content-Encoding'] = 'gzip';
      res.writeHead(statusCode, headers);
      stream.pipe(zlib.createGzip()).pipe(res);
    } else {
      headers['Content-Length'] = stats.size;
      res.writeHead(statusCode, headers);
      stream.pipe(res);
    }
  });
}

function handleContactPost(req, res) {
  let raw = '';
  let aborted = false;

  req.on('data', (chunk) => {
    raw += chunk;
    if (raw.length > 16 * 1024) {
      aborted = true;
      sendJson(res, 413, { ok: false, error: 'Message payload is too large.' });
      req.destroy();
    }
  });

  req.on('end', () => {
    if (aborted) return;
    try {
      const data = JSON.parse(raw || '{}');
      const name = String(data.name || '').trim();
      const email = String(data.email || '').trim();
      const topic = String(data.topic || 'General').trim();
      const message = String(data.message || '').trim();

      if (name.length < 2 || name.length > 120) {
        return sendJson(res, 400, { ok: false, error: 'Please enter your name (2–120 characters).' });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return sendJson(res, 400, { ok: false, error: 'Please enter a valid email address.' });
      }
      if (message.length < 10 || message.length > 3000) {
        return sendJson(res, 400, { ok: false, error: 'Please enter a message between 10 and 3000 characters.' });
      }

      // Log inquiry metadata without storing sensitive data on disk
      console.log(`[contact] topic="${topic}" from="${name}" <${email}> (${message.length} chars)`);
      return sendJson(res, 200, {
        ok: true,
        message: 'Thank you! Your message has been received. We typically reply within 1–2 business days.'
      });
    } catch {
      return sendJson(res, 400, { ok: false, error: 'Invalid JSON request body.' });
    }
  });
}

function handleRequest(req, res) {
  const hostHeader = req.headers.host || `localhost:${PORT}`;
  let parsedUrl;
  try {
    parsedUrl = new URL(req.url || '/', `http://${hostHeader}`);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad Request');
    return;
  }

  let pathname = decodeURIComponent(parsedUrl.pathname);

  // API Endpoints
  if (pathname === '/api/health' && (req.method === 'GET' || req.method === 'HEAD')) {
    return sendJson(
      res,
      200,
      { status: 'ok', service: 'peachyprint', timestamp: new Date().toISOString() },
      req.method === 'HEAD'
    );
  }

  if (pathname === '/api/contact' && req.method === 'POST') {
    return handleContactPost(req, res);
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method Not Allowed');
    return;
  }

  // Normalize trailing slash for clean page routes (except root)
  const normalized = pathname.length > 1 && pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname;

  if (Object.prototype.hasOwnProperty.call(PAGE_ROUTES, normalized)) {
    return serveFile(req, res, path.join(PUBLIC_DIR, PAGE_ROUTES[normalized]), 200);
  }

  // Also allow /about.html, /contact.html, /privacy.html redirects to clean URLs
  if (normalized === '/about.html' || normalized === '/contact.html' || normalized === '/privacy.html') {
    const cleanTarget = normalized.replace(/\.html$/, '');
    res.writeHead(301, { Location: cleanTarget });
    res.end();
    return;
  }

  // Static files inside public/
  const safeRelative = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '').replace(/^[/\\]+/, '');
  const candidate = path.join(PUBLIC_DIR, safeRelative);

  fs.stat(candidate, (err, stats) => {
    if (!err && stats.isDirectory()) {
      return serveFile(req, res, path.join(candidate, 'index.html'), 200);
    }
    return serveFile(req, res, candidate, 200);
  });
}

const server = http.createServer(handleRequest);

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    console.log(`PeachyPrint server listening on http://${HOST}:${PORT}`);
  });
}

module.exports = { server, handleRequest };
