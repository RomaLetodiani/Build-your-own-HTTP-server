using System.Net;
using System.Net.Sockets;
using System.Text;

class HttpServer {
    private readonly TcpListener server;
    private readonly string[] args;

    public HttpServer(IPAddress ipAddress, int port, string[] args) {
        server = new TcpListener(ipAddress, port);
        this.args = args;
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
        Console.WriteLine("Client Request: \n" + request);

        string response = GetResponse(request, args);
        byte[] responseBytes = Encoding.ASCII.GetBytes(response);
        stream.Write(responseBytes, 0, responseBytes.Length);

        stream.Close();
        client.Close();
    }

    private static string GetResponse(string request, string[] args) {
        string[] lines = request.Split(new[] { "\r\n" }, StringSplitOptions.None);
        string[] firstLine = lines[0].Split(' ');
        string method = firstLine[0];
        string path = firstLine[1];
        string[] pathParts = path.Split('/');

        if (method != "GET" && method != "POST")
            return CreateResponse(405, "Method Not Allowed");

        if (path == "/")
            return CreateResponse(200, "OK", "text/plain", "");

        if (path.StartsWith("/files/") && pathParts.Length > 2 && args.Length > 1)
        {
            if (method == "GET"){
            string directory = args[1];
            string fileName = pathParts[2];
            string filePath = Path.Combine(directory, fileName);
            if (!File.Exists(filePath))
            {
                return CreateResponse(404, "Not Found");
            }
            string fileData = File.ReadAllText(filePath);
            return CreateResponse(200, "OK", "application/octet-stream", fileData);
            }
            
            if (method == "POST")
            {
                string directory = args[1];
                string fileName = pathParts[2];
                string filePath = Path.Combine(directory, fileName);
                string fileData = lines[^1];
                File.WriteAllText(filePath, fileData);
                return CreateResponse(201, "Created", "text/plain", "File saved successfully");
            }
        }

        if (path == "/user-agent") {
        string? userAgent = lines.FirstOrDefault(static line => line.StartsWith("User-Agent:"));
        Console.WriteLine("User-Agent: " + userAgent);
        if (userAgent != null) {
            userAgent = userAgent["User-Agent:".Length..].Trim();
            return CreateResponse(200, "OK", "text/plain", userAgent);
        }
    }

        if (pathParts.Length > 2) {
            string subPath = pathParts[2];
            return CreateResponse(200, "OK", "text/plain", subPath);
        }

        // Handle other paths or resources here
        return CreateResponse(404, "Not Found");
    }

    private static string CreateResponse(int statusCode, string statusText, string contentType = "text/plain", string content = "") {
        StringBuilder response = new StringBuilder();
        response.Append($"HTTP/1.1 {statusCode} {statusText}");
        response.Append("\r\n");
        response.Append($"Content-Type: {contentType}");
        response.Append("\r\n");
        response.Append($"Content-Length: {content.Length}");
        response.Append("\r\n\r\n");
        response.Append(content.ToString());
        return response.ToString();
    }
}

class Program {
    static void Main(string[] args) {
        IPAddress ipAddress = IPAddress.Any;
        int port = 4221;
        HttpServer httpServer = new HttpServer(ipAddress, port, args);
        httpServer.Start();
    }
}
