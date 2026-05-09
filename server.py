import http.server
import socketserver
import mimetypes

PORT = 8002

mimetypes.add_type('application/javascript', '.js')

Handler = http.server.SimpleHTTPRequestHandler

# Allow cross origin just in case
class CORSRequestHandler(Handler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

with socketserver.TCPServer(("", PORT), CORSRequestHandler) as httpd:
    print("serving at port", PORT)
    httpd.serve_forever()
