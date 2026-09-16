"""Local dev server for the Howling Abyss replica.

Serves the project root. Notes:
  * .glb.gz / map payloads are streamed raw (no Content-Encoding) because the
    client sniffs the gzip magic bytes and decompresses with DecompressionStream.
  * Everything under /static is immutable-versioned, so it is cached hard.
"""
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))

EXTRA_TYPES = {
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.glb': 'model/gltf-binary',
    '.gz': 'application/octet-stream',
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg',
    '.wav': 'audio/wav',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.woff2': 'font/woff2',
}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def guess_type(self, path):
        ext = os.path.splitext(path)[1].lower()
        if ext in EXTRA_TYPES:
            return EXTRA_TYPES[ext]
        return super().guess_type(path)

    def end_headers(self):
        path = self.translate_path(self.path)
        try:
            rel = os.path.relpath(path, ROOT)
        except ValueError:
            rel = ''
        if rel.replace('\\', '/').startswith('static/'):
            self.send_header('Cache-Control', 'public, max-age=31536000, immutable')
        else:
            self.send_header('Cache-Control', 'no-cache')
        # allow the game to read Content-Length / range data from same origin
        self.send_header('Accept-Ranges', 'bytes')
        super().end_headers()

    def log_message(self, fmt, *args):
        # keep the console readable: only surface non-2xx
        if not (200 <= int(args[1]) if len(args) > 1 and str(args[1]).isdigit() else 200) < 400:
            sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
    server = ThreadingHTTPServer(('127.0.0.1', port), Handler)
    print('Howling Abyss replica -> http://127.0.0.1:%d/' % port)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nbye')
        server.server_close()


if __name__ == '__main__':
    main()
