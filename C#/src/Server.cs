using System.Net;
using System.Net.Sockets;

// You can use print statements as follows for debugging, they'll be visible when running tests.
Console.WriteLine("🚀 ~ Your Server Started!");

TcpListener server = new TcpListener(IPAddress.Any, 4221);
server.Start();

// While True loop to keep the server running for multiple Client requests
while (true){
    Socket clientSocket = server.AcceptSocket();
    Console.WriteLine("Connection Established");


    // byte[] response = System.Text.Encoding.ASCII.GetBytes(okResponse);

    // clientSocket.Send(response);
    byte[] buffer = new byte[1024]; // Adjust buffer size as needed
    int receivedBytes = clientSocket.Receive(buffer);
    string request = System.Text.Encoding.ASCII.GetString(buffer, 0, receivedBytes);
    Console.WriteLine("Client request: " + request);

    // Parse the request to determine what to send back (e.g., static content, dynamic data)
    string response = GetResponse(request); // Replace with your logic for handling requests
    byte[] responseBytes = System.Text.Encoding.ASCII.GetBytes(response);
    clientSocket.Send(responseBytes);
    clientSocket.Close();
    Console.WriteLine("Response Sent");
}

static string GetResponse(string request){
    // Implement your logic for handling requests here
    string okResponse = "HTTP/1.1 200 OK\r\n\r\n";
    // string notFoundResponse = "HTTP/1.1 404 Not Found\r\n\r\n";
    return okResponse;
}
