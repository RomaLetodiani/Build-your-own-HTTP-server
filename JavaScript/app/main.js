const net = require("net");

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

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
    const [response, gzip] = handleRequest(request);
    socket.write(response);
    !!gzip && socket.write(gzip);
  });

  // socket.on("close", () => {
  //   socket.end();
  //   server.close();
  // });
});

const handleRequest = (request) => {
  const [method, urlPath] = request[0].split(" ");
  const pathParts = urlPath.split("/");
  const encoding = request.find((header) => header.startsWith("Accept-Encoding"));
  const validMethods = ["GET", "POST"];

  if (!validMethods.includes(method)) {
    return [createResponse(405, "Method Not Allowed"), null];
  }

  if (urlPath === "/") {
    return [createResponse(200, "OK"), null];
  }

  if (urlPath.startsWith("/files/") && pathParts.length > 2) {
    const fileName = pathParts[2];
    const filePath = path.join(DIRECTORY, fileName);

    if (method === "GET") {
      try {
        const fileContent = fs.readFileSync(filePath, { encoding: "utf8" });
        return [createResponse(200, "OK", "application/octet-stream", fileContent), null];
      } catch (error) {
        return [createResponse(404, "Not Found"), null];
      }
    }

    if (method === "POST") {
      const fileContent = request[request.length - 1];
      try {
        fs.writeFileSync(filePath, fileContent, { encoding: "utf8" });
        return [createResponse(201, "Created", "text/plain", fileContent), null];
      } catch (error) {
        return [createResponse(500, "Internal Server Error"), null];
      }
    }
  }

  if (urlPath === "/user-agent") {
    const userAgent = request.find((header) => header.startsWith("User-Agent")).split(": ")[1];
    return [createResponse(200, "OK", "text/plain", userAgent), null];
  }

  if (encoding && pathParts.length === 3 && method === "GET") {
    const subPath = pathParts[2];
    if (encoding.includes("gzip")) {
      const gzip = zlib.gzipSync(subPath);
      return [createResponse(200, "OK", "text/plain", "", "gzip", gzip.length), gzip];
    } else {
      return [createResponse(200, "OK", "text/plain", subPath), null];
    }
  }

  if (pathParts.length > 2) {
    const subPath = pathParts[2];
    return [createResponse(200, "OK", "text/plain", subPath), null];
  }

  return [createResponse(404, "Not Found"), null];
};

const createResponse = (
  statusCode,
  statusText = "OK",
  contentType = "text/plain",
  content = "",
  contentEncoding = "",
  contentLength = 0
) => {
  const response = [];
  response.push(`HTTP/1.1 ${statusCode} ${statusText}`);
  contentEncoding && response.push(`Content-Encoding: ${contentEncoding}`);
  response.push(`Content-Type: ${contentType}`);
  if (contentLength) {
    response.push(`Content-Length: ${contentLength}\r\n\r\n`);
  } else {
    response.push(`Content-Length: ${content.length}\r\n`);
    response.push(content);
  }
  return response.join("\r\n");
};

server.listen(4221, "127.0.0.1");
