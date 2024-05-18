# Uncomment this to pass the first stage
import socket
import argparse
import threading

def main():
    print("🚀 ~ Your Server Started!")

    parser = argparse.ArgumentParser()
    parser.add_argument("--directory")
    args = parser.parse_args()
    server_socket = socket.create_server(("localhost", 4221), reuse_port=True)
    while True:
        client_socket, addr = server_socket.accept() # wait for client
        print(f"Connection from {addr}")

        # Start a new thread to handle the client
        threading.Thread(target=handle_client, args=(client_socket, args)).start()

def handle_client(client_socket, args):
    try:
        request = client_socket.recv(1024).decode("utf-8")  # get data from client
        response = handleRequest(request, args)  # handle request
        client_socket.sendall(response)  # send data to client
    finally:
        client_socket.close()  # Close the client socket when done


def handleRequest(request, args):
    lines = request.split("\r\n")
    method, path, protocol = lines[0].split(" ")
    pathParts = path.split("/")
    encoding = next((line for line in lines if "Accept-Encoding:" in line), None)


    if method not in ["GET", "POST"]:
        return create_response(405, "Method Not Allowed")
    
    if method == "GET" and path == "/":
        return create_response(200)
    
    if path == "/user-agent":
        userAgent = next((line for line in lines if "User-Agent:" in line), None).split("User-Agent: ")[1]
        return create_response(200, content=userAgent)
    
    if path.startswith("/files/") and len(pathParts) == 3 and args.directory:
        fileName = pathParts[2]
        if method == "GET":
            try:
                with open(f"{args.directory}/{fileName}", "rb") as file:
                    content = file.read().decode("utf-8")
                    return create_response(200, "OK", "application/octet-stream", content)
            except FileNotFoundError:
                return create_response(404, "Not Found")
        if method == "POST":
            content = lines[-1]
            with open(f"{args.directory}/{fileName}", "w") as file:
                file.write(content)
            return create_response(201, "Created")

    if len(pathParts) > 2:
        subPath = pathParts[2]
        return create_response(200, content=subPath)

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
