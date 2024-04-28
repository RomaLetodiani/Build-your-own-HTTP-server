const net = require("net");

console.log("🚀 ~ Your Server Started!");

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const request = data.toString(); // Convert the data to a string
    // console.log("🚀 ~ socket.on ~ request:", request);
    const path = request.split(" ")[1]; // Extract the path from the request
    // console.log("🚀 ~ socket.on ~ path:", path);
    const userAgent = request.split("User-Agent: ")[1].split("\r\n")[0];
    // console.log("🚀 ~ socket.on ~ userAgent:", userAgent);

    if (path === "/") {
      socket.write("HTTP/1.1 200 OK\r\n\r\nHello, World!");
    } else if (path.startsWith("/echo")) {
      const message = path.split("/echo/")[1];
      // console.log("🚀 ~ socket.on ~ message:", message);
      socket.write(
        `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${message.length}\r\n\r\n${message}`
      );
    } else if (userAgent) {
      socket.write(
        `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`
      );
    } else {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    }
  });

  socket.on("close", () => {
    socket.end();
    server.close();
  });
});

server.listen(4221, "127.0.0.1");
