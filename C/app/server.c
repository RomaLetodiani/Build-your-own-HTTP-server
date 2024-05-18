#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netinet/ip.h>

#define MAX_PARTS 256
#define MAX_HEADERS 10

struct Header
{
	char key[64];
	char value[256];
};

struct Request
{
	char method[16];
	char path[256];
	char http_ver[16];
	char user_agent[256];
	struct Header *headers;
	char *body;
	ssize_t body_len;
};

struct Request parse_request(char *buf, ssize_t len)
{
	printf("🚀 ~ Parsing request...\n");
	struct Request request;
	memset(&request, 0, sizeof(struct Request));

	// Use sscanf to parse the request line
	sscanf(buf, "%s %s %s", request.method, request.path, request.http_ver);

	// Parse headers
	char *header_lines[MAX_HEADERS]; // Assuming there can be up to MAX_HEADERS header lines
	int num_headers = 0;

	// Split headers into lines
	char *line = strtok(buf, "\r\n");
	while (line != NULL && num_headers < MAX_HEADERS)
	{
		header_lines[num_headers++] = line;
		line = strtok(NULL, "\r\n");
	}

	// Find User-Agent header
	for (int i = 1; i < num_headers; i++)
	{
		char *header_name = strtok(header_lines[i], ":");
		if (header_name != NULL && strcmp(header_name, "User-Agent") == 0)
		{
			// Found User-Agent header, copy its value
			char *header_value = strtok(NULL, " ");
			if (header_value != NULL)
			{
				strncpy(request.user_agent, header_value, sizeof(request.user_agent) - 1);
				request.user_agent[sizeof(request.user_agent) - 1] = '\0'; // Ensure null-termination
				break;
			}
		}
	}

	printf("🚀 ~ Request parsed\n");

	return request;
}

void send_response(int client_socket, int status_code, const char *status_text, const char *content_type, const char *content);
char **splitPath(const char *path, int *numParts);

int main(int argc, char *argv[])
{
	// Disable output buffering
	setbuf(stdout, NULL);

	// Start your server here!
	printf("🚀 ~ Your Server Started!\n");

	char *directory = NULL;
	if (argc > 1 && strcmp(argv[1], "--directory") == 0 && argc > 2)
	{
		directory = argv[2];
	}

	int server_fd, client_socket, client_addr_len;
	struct sockaddr_in client_addr;

	server_fd = socket(AF_INET, SOCK_STREAM, 0);
	if (server_fd == -1)
	{
		printf("Socket creation failed: %s...\n", strerror(errno));
		return 1;
	}

	// Since the tester restarts your program quite often, setting REUSE_PORT
	// ensures that we don't run into 'Address already in use' errors
	int reuse = 1;
	if (setsockopt(server_fd, SOL_SOCKET, SO_REUSEPORT, &reuse, sizeof(reuse)) < 0)
	{
		printf("SO_REUSEPORT failed: %s \n", strerror(errno));
		return 1;
	}

	struct sockaddr_in serv_addr =
		{
			.sin_family = AF_INET,
			.sin_port = htons(4221),
			.sin_addr = {htonl(INADDR_ANY)},
		};

	if (bind(server_fd, (struct sockaddr *)&serv_addr, sizeof(serv_addr)) != 0)
	{
		printf("Bind failed: %s \n", strerror(errno));
		return 1;
	}

	int connection_backlog = 5;
	if (listen(server_fd, connection_backlog) != 0)
	{
		printf("Listen failed: %s \n", strerror(errno));
		return 1;
	}

	printf("🚀 ~ Waiting for a client to connect...\n");
	client_addr_len = sizeof(client_addr);

	while (1)
	{
		if ((client_socket = accept(server_fd, (struct sockaddr *)&client_addr, (socklen_t *)&client_addr_len)) == -1)
		{
			printf("ERROR: %m\n");
			exit(1);
		}
		printf("🚀 ~ Client connected\n");
		char response[2048] = {0};
		char buf[2048] = {0};
		ssize_t len = read(client_socket, buf, sizeof(buf));
		if (len == -1)
		{
			perror("ERROR");
			exit(1);
		}
		struct Request request = parse_request(buf, len);
		int numParts;
		char **pathParts = splitPath(request.path, &numParts);

		if (strcmp(request.path, "/") == 0)
		{
			send_response(client_socket, 200, "OK", "text/plain", "");
		}
		else if (strcmp(request.path, "/user-agent") == 0)
		{
			send_response(client_socket, 200, "OK", "text/plain", request.user_agent);
		}
		else if (numParts > 1)
		{
			send_response(client_socket, 200, "OK", "text/plain", pathParts[1]);
		}
		else
		{
			send_response(client_socket, 404, "Not Found", "text/plain", "");
		}

		// Free allocated memory for path parts
		for (int i = 0; i < numParts; i++)
		{
			free(pathParts[i]);
		}
		free(pathParts);

		// Close the client socket
		close(client_socket);
	}
	// Close the client socket
	close(server_fd);

	return 0;
}

void send_response(int client_socket, int status_code, const char *status_text, const char *content_type, const char *content)
{
	char header[2048];
	int header_length = snprintf(header, sizeof(header), "HTTP/1.1 %d %s\r\nContent-Type: %s\r\nContent-Length: %zu\r\n\r\n%s", status_code, status_text, content_type, strlen(content), content);
	write(client_socket, header, header_length);
}

char **splitPath(const char *path, int *numParts)
{
	// Copy the path to avoid modifying the original string
	char *path_copy = strdup(path);
	if (path_copy == NULL)
	{
		perror("Failed to allocate memory");
		exit(1);
	}

	// Allocate memory for the array of string pointers
	char **pathParts = malloc(MAX_PARTS * sizeof(char *));
	if (pathParts == NULL)
	{
		perror("Failed to allocate memory");
		free(path_copy);
		exit(1);
	}

	int i = 0;
	char *token = strtok(path_copy, "/");
	while (token != NULL && i < MAX_PARTS)
	{
		pathParts[i] = strdup(token);
		if (pathParts[i] == NULL)
		{
			perror("Failed to allocate memory");
			exit(1);
		}
		i++;
		token = strtok(NULL, "/");
	}

	// Set the number of parts found
	*numParts = i;

	// Clean up
	free(path_copy);

	return pathParts;
}