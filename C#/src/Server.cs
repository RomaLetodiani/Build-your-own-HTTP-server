using System.IO.Compression;
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

        byte[] response = GetResponse(request, args);
        stream.Write(response, 0, response.Length);

        stream.Close();
        client.Close();
    }

    private static byte[] GetResponse(string request, string[] args) {
        string[] lines = request.Split(new[] { "\r\n" }, StringSplitOptions.None);
        string[] firstLine = lines[0].Split(' ');
        string method = firstLine[0];
        string path = firstLine[1];
        string[] pathParts = path.Split('/');
        string EncodingTypes = lines.FirstOrDefault(static line => line.StartsWith("Accept-Encoding:")) ?? string.Empty;

        if (method != "GET" && method != "POST")
            return CreateResponse(405, "Method Not Allowed");

        if (path == "/")
            return CreateResponse(200, "OK", "text/plain", "");

        if (path.StartsWith("/files/") && pathParts.Length > 2 && args.Length > 1)
        {
            string directory = args[1];
            string fileName = pathParts[2];
            string filePath = Path.Combine(directory, fileName);

            if (method == "GET"){
            if (!File.Exists(filePath))
            {
                return CreateResponse(404, "Not Found");
            }
            string fileData = File.ReadAllText(filePath);
            return CreateResponse(200, "OK", "application/octet-stream", fileData);
            }
            
            if (method == "POST")
            {
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

        if (EncodingTypes != string.Empty && pathParts.Length == 3)
        {
            string subPath = pathParts[2];
            if (EncodingTypes.Contains("gzip")) {
                byte[] subPathBytes = Encoding.ASCII.GetBytes(subPath);
                using MemoryStream memoryStream = new();
                using GZipStream gzipStream = new(memoryStream, CompressionMode.Compress);
                gzipStream.Write(subPathBytes, 0, subPathBytes.Length);
                gzipStream.Close();
                byte[] compressedData = memoryStream.ToArray();
                byte[] response = CreateResponse(200, "OK", "text/plain", "", compressedData.Length, "gzip");
                response = [.. response, .. compressedData];
                return response;
            } else {
                return CreateResponse(200, "OK", content: subPath);
            }
        }

        if (pathParts.Length > 2) {
            string subPath = pathParts[2];
            return CreateResponse(200, "OK", "text/plain", subPath);
        }

        // Handle other paths or resources here
        return CreateResponse(404, "Not Found");
    }

    private static byte[] CreateResponse(int statusCode, string statusText, string contentType = "text/plain", string content = "", int contentLength = 0, string EncodingType = "") {
        StringBuilder response = new();
        response.Append($"HTTP/1.1 {statusCode} {statusText}");
        response.Append("\r\n");
        response.Append($"Content-Type: {contentType}");
        response.Append("\r\n");
        if (EncodingType != string.Empty) {
            response.Append($"Content-Encoding: {EncodingType}");
            response.Append("\r\n");
        }
        if (contentLength > 0){
            response.Append($"Content-Length: {contentLength}");
            response.Append("\r\n\r\n");
        } else {
            response.Append($"Content-Length: {content.Length}");
            response.Append("\r\n\r\n");
            response.Append(content);
        }
        byte[] responseBytes = Encoding.ASCII.GetBytes(response.ToString());
        return responseBytes;
    }
}

class Program {
    static void Main(string[] args) {
        IPAddress ipAddress = IPAddress.Any;
        int port = 4221;
        HttpServer httpServer = new(ipAddress, port, args);
        httpServer.Start();
    }
}
