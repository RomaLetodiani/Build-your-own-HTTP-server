const net = require("net");

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const parsedData = data.toString(); // Convert the data to a string
    console.log("🚀 ~ socket.on ~ parsedData:", parsedData);
    const path = parsedData.split(" ")[1]; // Extract the path from the request
    console.log("🚀 ~ socket.on ~ path:", path);

    if (path === "/") {
      socket.write("HTTP/1.1 200 OK\r\n\r\nHello, World!");
    } else {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    }
  });

  socket.on("close", () => {
    socket.end();
    server.close();
  });
});

server.listen(4221, "localhost");
