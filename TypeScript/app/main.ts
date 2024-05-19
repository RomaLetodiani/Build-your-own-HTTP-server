import net from "net";

import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";
import path from "path";
import zlib from "zlib";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let DIRECTORY = __dirname;
process.argv.forEach((val, index) => {
  if (val === "--directory" && process.argv[index + 1]) {
    DIRECTORY = process.argv[index + 1];
  }
});

const server = net.createServer({ keepAlive: true }, (socket) => {
  console.log("🚀 ~ Your Server Started!");
  socket.on("data", (data: Buffer) => {
    const request: string[] = data.toString().split("\r\n");
    const [response, gzip]: [string, Buffer] | [string, null] = handleRequest(request);
    socket.write(response);
    !!gzip && socket.write(gzip);
  });

  // socket.on("close", () => {
  //   socket.end();
  //   server.close();
  // });
});

const handleRequest = (request: string[]): [string, Buffer] | [string, null] => {
  const [method, urlPath] = request[0].split(" ");
  const pathParts: string[] = urlPath.split("/");
  const encoding: string | undefined = request.find((header) =>
    header.startsWith("Accept-Encoding")
  );
  const validMethods: string[] = ["GET", "POST"];

  if (!validMethods.includes(method)) {
    return [createResponse(405, "Method Not Allowed"), null];
  }

  if (urlPath === "/") {
    return [createResponse(200, "OK"), null];
  }

  if (urlPath.startsWith("/files/") && pathParts.length > 2) {
    const fileName: string = pathParts[2];
    const filePath: string = path.join(DIRECTORY, fileName);

    if (method === "GET") {
      try {
        const fileContent = fs.readFileSync(filePath, { encoding: "utf8" });
        return [createResponse(200, "OK", "application/octet-stream", fileContent), null];
      } catch (error) {
        return [createResponse(404, "Not Found", "application/octet-stream"), null];
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
    const userAgent: string | undefined = request
      .find((header) => header.startsWith("User-Agent"))
      ?.split(": ")[1];
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
    const subPath: string = pathParts[2];
    return [createResponse(200, "OK", "text/plain", subPath), null];
  }

  return [createResponse(404, "Not Found"), null];
};

const createResponse = (
  statusCode: number,
  statusText: string,
  contentType: string = "text/plain",
  content: string = "",
  contentEncoding: string = "",
  contentLength: number = 0
) => {
  const response: string[] = [];
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
