/* This JavaScript code snippet is creating a simple HTTP server using Node.js's `net` module. Here's a
breakdown of what the code does: */
const net = require("net");

console.log("🚀 ~ Your Server Started!");

/* Creating a TCP server using Node.js's `net` module. The `net.createServer()` 
method is used to create a new TCP server. In this case, the server is configured 
with the option `keepAlive: true`, which enables the TCP keep-alive functionality on the server. */
const server = net.createServer({ keepAlive: true }, (socket) => {
  /* The `socket.on("data", (data) => { ... }` block in the code snippet is an event listener in Node.js
that listens for incoming data on the socket connection. When data is received, the provided
callback function is executed. Here's a breakdown of what the code inside this block is doing: */
  socket.on("data", (data) => {
    /* This block of code is handling the incoming data on the socket connection. Here's a breakdown of
    what it does: */
    const request = data.toString(); // Convert the data to a string
    // console.log("🚀 ~ socket.on ~ request:", request);
    const path = request.split(" ")[1]; // Extract the path from the request
    // console.log("🚀 ~ socket.on ~ path:", path);
    const userAgent = request.split("User-Agent: ")[1].split("\r\n")[0];
    // console.log("🚀 ~ socket.on ~ userAgent:", userAgent);

    /* This `if` statement is checking if the requested path is the root path ("/"). If the path is
    "/", the server responds with an HTTP status of 200 OK and sends the message "Hello, World!"
    back to the client using the `socket.write` method. */
    if (path === "/") {
      socket.write("HTTP/1.1 200 OK\r\n\r\nHello, World!");
    } else if (path.startsWith("/echo")) {
      /* The `else if (path.startsWith("/echo"))` block in the code snippet is checking if the
    requested path starts with "/echo". If the condition is true, it means that the client is
    requesting an "echo" operation where the server should simply echo back a message provided in
    the path. */
      const message = path.split("/echo/")[1];
      // console.log("🚀 ~ socket.on ~ message:", message);
      socket.write(
        `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${message.length}\r\n\r\n${message}`
      );
    } else if (path.includes("/user-agent") && userAgent) {
      /* The `else if (path.includes("/user-agent") && userAgent)` block in the code snippet is
    checking if the requested path contains "/user-agent" and if the `userAgent` variable has a
    value (meaning it was successfully extracted from the request data). */
      socket.write(
        `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`
      );
    } else {
      /* The `else` block is handling the case where none of the previous conditions in the code snippet are met. 
    This means that if the requested path does not match "/", "/echo", or "/user-agent", 
    the server will respond with an HTTP status of 404 Not Found. This is a common practice in 
    web servers to indicate that the requested resource could not be found on the server. */
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    }
  });

  socket.on("close", () => {
    socket.end();
    server.close();
  });
});

server.listen(4221, "127.0.0.1");
