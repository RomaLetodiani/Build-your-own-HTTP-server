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
    const response = handleRequest(request);
    socket.write(response);
  });

  socket.on("close", () => {
    socket.end();
    server.close();
  });
});

const handleRequest = (request) => {
  const [method, urlPath] = request[0].split(" ");
  const pathParts = urlPath.split("/");
  const encoding = request.find((header) => header.startsWith("Accept-Encoding"));
  const validMethods = ["GET", "POST"];

  if (!validMethods.includes(method)) {
    return createResponse(405, "Method Not Allowed");
  }

  if (urlPath === "/") {
    return createResponse(200, "OK");
  }

  if (urlPath.startsWith("/files/") && pathParts.length > 2) {
    const fileName = pathParts[2];
    const filePath = path.join(DIRECTORY, fileName);

    if (method === "GET") {
      try {
        const fileContent = fs.readFileSync(filePath, { encoding: "utf8" });
        return createResponse(200, "OK", "application/octet-stream", fileContent);
      } catch (error) {
        return createResponse(404, "Not Found");
      }
    }

    if (method === "POST") {
      const fileContent = request[request.length - 1];
      try {
        fs.writeFileSync(filePath, fileContent, { encoding: "utf8" });
        return createResponse(201, "Created", "text/plain", fileContent);
      } catch (error) {
        return createResponse(500, "Internal Server Error");
      }
    }
  }

  if (urlPath === "/user-agent") {
    const userAgent = request.find((header) => header.startsWith("User-Agent")).split(": ")[1];
    return createResponse(200, "OK", "text/plain", userAgent);
  }

  if (encoding && pathParts.length === 3 && method === "GET") {
    const subPath = pathParts[2];
    // const encodingTypes = encoding.split(": ")[1];
    return createResponse(
      200,
      "OK",
      "text/plain",
      subPath,
      encoding.includes("gzip") ? "gzip" : ""
    );
  }

  if (pathParts.length > 2) {
    const subPath = pathParts[2];
    return createResponse(200, "OK", "text/plain", subPath);
  }

  return createResponse(404, "Not Found");
};

const createResponse = (
  statusCode,
  statusText,
  contentType = "text/plain",
  content = "",
  contentEncoding = ""
) => {
  const response = [];
  response.push(`HTTP/1.1 ${statusCode} ${statusText}`);
  contentEncoding && response.push(`Content-Encoding: ${contentEncoding}`);
  response.push(`Content-Type: ${contentType}`);
  response.push(`Content-Length: ${content.length}\r\n`);
  response.push(content);
  return response.join("\r\n");
};

server.listen(4221, "127.0.0.1");
