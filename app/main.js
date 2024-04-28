/* This JavaScript code snippet is creating a simple HTTP server using Node.js's `net` module. Here's a
breakdown of what the code does: */
const net = require("net");

const fs = require("fs");
const path = require("path");
/* The code snippet you provided is setting up a directory variable `DIRECTORY` based on command-line
arguments. Here's a breakdown of what it does: */
let DIRECTORY = __dirname;
process.argv.forEach((val, index) => {
  if (val === "--directory" && process.argv[index + 1]) {
    DIRECTORY = process.argv[index + 1];
  }
});

console.log("🚀 ~ Your Server Started!");
const server = net.createServer({ keepAlive: true }, (socket) => {
  socket.on("data", (data) => {
    const request = data.toString(); // Convert the data to a string
    const [method, URLpath] = request.split(" "); // Extract the path from the request
    if (URLpath === "/") {
      socket.write("HTTP/1.1 200 OK\r\n\r\nHello, World!");
    } else if (URLpath.startsWith("/echo")) {
      const message = URLpath.split("/echo/")[1];
      socket.write(
        `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${message.length}\r\n\r\n${message}`
      );
    } else if (URLpath.includes("/user-agent")) {
      const userAgent = request.split("User-Agent: ")[1].split("\r\n")[0];
      socket.write(
        `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`
      );
    } else if (URLpath.includes("/files/")) {
      if (method === "GET") {
        const filePath = path.join(DIRECTORY, URLpath.split("/")[2]);
        try {
          const fileData = fs.readFileSync(filePath, { encoding: "utf8" });
          socket.write(
            `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${fileData.length}\r\n\r\n${fileData}`
          );
        } catch (error) {
          socket.write(
            "HTTP/1.1 404 Not Found\r\nContent-Type: application/octet-stream\r\nContent-Length: 0\r\n\r\n"
          );
        }
      }
      if (method === "POST") {
        const fileName = URLpath.split("/")[2];
        const filePath = path.join(DIRECTORY, fileName);
        const fileData = request.split("\r\n\r\n")[1];
        fs.writeFileSync(filePath, fileData, { encoding: "utf8" });
        socket.write(
          `HTTP/1.1 201 OK\r\nContent-Type: text/plain\r\nContent-Length: ${fileName.length}\r\n\r\n${fileName}`
        );
      }
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
