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

const server = net.createServer({ keepAlive: true }, (socket) => {
  console.log("🚀 ~ Your Server Started!");
  socket.on("data", (data) => {
    const request = data.toString().split("\r\n");
    let response = handleRequest(request);

    socket.write(response);
  });

  socket.on("close", () => {
    socket.end();
    server.close();
  });
});

const handleRequest = (request) => {
  const [method, path] = request[0].split(" ");
  const pathParts = path.split("/");

  if (method !== "GET" && method !== "POST") {
    return createResponse(405, "Method Not Allowed");
  }

  if (path === "/") {
    return createResponse(200, "OK");
  }

  if (path === "/user-agent") {
    const userAgent = request.find((header) => header.startsWith("User-Agent")).split(": ")[1];
    return createResponse(200, "OK", "text/plain", userAgent);
  }

  if (pathParts.length > 2) {
    const subPath = pathParts[2];
    return createResponse(200, "OK", "text/plain", subPath);
  }

  return createResponse(404, "Not Found");
};

const createResponse = (statusCode, statusText, contentType = "text/plain", content = "") => {
  const response = [];
  response.push(`HTTP/1.1 ${statusCode} ${statusText}`);
  response.push(`Content-Type: ${contentType}`);
  response.push(`Content-Length: ${content.length}\r\n`);
  response.push(content);
  return response.join("\r\n");
};

server.listen(4221, "127.0.0.1");
