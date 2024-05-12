using System;
using System.Net;
using System.Net.Sockets;
using System.Text;

class HttpServer {
    private TcpListener server;

    public HttpServer(IPAddress ipAddress, int port) {
        server = new TcpListener(ipAddress, port);
    }

    public void Start() {
        try {
            server.Start();
            Console.WriteLine("🚀 ~ Your Server Started!");

            while (true) {
                TcpClient client = server.AcceptTcpClient();
                HandleClient(client);
            }
        } catch (Exception ex) {
            Console.WriteLine("Error: " + ex.Message);
        }
    }

    private void HandleClient(TcpClient client) {
        NetworkStream stream = client.GetStream();
        byte[] buffer = new byte[1024];
        int bytesRead = stream.Read(buffer, 0, buffer.Length);
        string request = Encoding.ASCII.GetString(buffer, 0, bytesRead);
        Console.WriteLine("Client Request: " + request);

        string response = GetResponse(request);
        byte[] responseBytes = Encoding.ASCII.GetBytes(response);
        stream.Write(responseBytes, 0, responseBytes.Length);

        stream.Close();
        client.Close();
    }

    private string GetResponse(string request) {
        string[] lines = request.Split(new[] { "\r\n" }, StringSplitOptions.None);
        string[] firstLine = lines[0].Split(' ');
        string method = firstLine[0];
        string path = firstLine[1];

        if (method != "GET" && method != "POST")
            return CreateResponse(405, "Method Not Allowed");

        if (path == "/")
            return CreateResponse(200, "OK", "text/plain", "");

        if (path == "/user-agent") {
        string? userAgent = lines.FirstOrDefault(static line => line.StartsWith("User-Agent:"));
        Console.WriteLine("User-Agent: " + userAgent);
        if (userAgent != null) {
            userAgent = userAgent["User-Agent:".Length..].Trim();
            return CreateResponse(200, "OK", "text/plain", userAgent);
        }
    }

        string[] pathParts = path.Split('/');
        if (pathParts.Length > 2) {
            string subPath = pathParts[2];
            return CreateResponse(200, "OK", "text/plain", subPath);
        }

        // Handle other paths or resources here
        return CreateResponse(404, "Not Found");
    }

    private string CreateResponse(int statusCode, string statusText, string contentType = "text/plain", string content = "") {
        StringBuilder response = new StringBuilder();
        response.Append($"HTTP/1.1 {statusCode} {statusText}");
        response.Append("\r\n");
        response.Append($"Content-Type: {contentType}");
        response.Append("\r\n");
        response.Append($"Content-Length: {content.Length}");
        response.Append("\r\n\r\n");
        response.Append(content);
        return response.ToString();
    }
}

class Program {
    static void Main(string[] args) {
        IPAddress ipAddress = IPAddress.Any;
        int port = 4221;
        HttpServer httpServer = new HttpServer(ipAddress, port);
        httpServer.Start();
    }
}
