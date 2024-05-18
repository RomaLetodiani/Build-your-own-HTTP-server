# Uncomment this to pass the first stage
import socket


def main():
    print("🚀 ~ Your Server Started!")

    server_socket = socket.create_server(("localhost", 4221), reuse_port=True)
    client_socket, addr = server_socket.accept() # wait for client
    print(f"Connection from {addr}")
    request = client_socket.recv(1024).decode("utf-8") # get data from client
    response = handleRequest(request) # handle request
    client_socket.sendall(response) # send data to client

def handleRequest(request):
    lines = request.split("\r\n")
    method, path, protocol = lines[0].split(" ")
    if method not in ["GET", "POST"]:
        return create_response(405, "Method Not Allowed")
    
    if method == "GET" and path == "/":
        return create_response(200)
    return create_response(404, "Not Found")

def create_response(status_code, status_text = "OK", content_type = "text/plain", content = "", content_encoding = ""):
    response = []
    response.append(f"HTTP/1.1 {status_code} {status_text}")
    response.append(f"Content-Type: {content_type}")
    if content_encoding:
        response.append(f"Content-Encoding: {content_encoding}")
    response.append(f"Content-Length: {len(content)}\r\n")
    response.append(content)
    return "\r\n".join(response).encode()

if __name__ == "__main__":
    while True:
        main()
