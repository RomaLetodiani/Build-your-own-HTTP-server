use std::env;
use std::fs;
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::Path;
use std::thread;
use flate2::write::GzEncoder;
use flate2::Compression;

#[derive(Debug)]
struct Request {
    method: String,
    path: String,
    user_agent: Option<String>,
    accept_encoding: Option<String>,
    body: Option<String>,
}

fn parse_request(mut stream: &TcpStream) -> Request {
    let mut buffer = [0; 1024];
    stream.read(&mut buffer).unwrap();
    
    let request = String::from_utf8_lossy(&buffer[..]);
    let lines: Vec<&str> = request.split("\r\n").collect();
    
    let first_line: Vec<&str> = lines[0].split_whitespace().collect();
    let method = first_line[0].to_string();
    let path = first_line[1].to_string();
    
    let user_agent = lines.iter()
        .find(|line| line.starts_with("User-Agent: "))
        .map(|line| line.replace("User-Agent: ", ""));
        
    let accept_encoding = lines.iter()
        .find(|line| line.starts_with("Accept-Encoding: "))
        .map(|line| line.replace("Accept-Encoding: ", ""));
        
    let body = lines.last()
        .map(|&line| line.to_string())
        .filter(|line| !line.is_empty());

    Request {
        method,
        path,
        user_agent,
        accept_encoding,
        body,
    }
}

fn create_response(
    status_code: u16,
    status_text: &str,
    content_type: &str,
    content: &str,
    content_encoding: Option<&str>,
    content_length: Option<usize>,
) -> Vec<u8> {
    let mut response = format!(
        "HTTP/1.1 {} {}\r\nContent-Type: {}\r\n",
        status_code, status_text, content_type
    );
    
    if let Some(encoding) = content_encoding {
        response.push_str(&format!("Content-Encoding: {}\r\n", encoding));
    }
    
    if let Some(length) = content_length {
        response.push_str(&format!("Content-Length: {}\r\n\r\n", length));
    } else {
        response.push_str(&format!("Content-Length: {}\r\n\r\n{}", content.len(), content));
    }
    
    response.into_bytes()
}

fn handle_client(mut stream: TcpStream, directory: Option<String>) {
    let request = parse_request(&stream);
    let path_parts: Vec<&str> = request.path.split('/').collect();
    
    let response = match (request.method.as_str(), request.path.as_str()) {
        ("GET", "/") => {
            create_response(200, "OK", "text/plain", "", None, None)
        },
        
        ("GET", "/user-agent") => {
            let user_agent = request.user_agent.unwrap_or_default();
            create_response(200, "OK", "text/plain", &user_agent, None, None)
        },
        
        _ if request.path.starts_with("/files/") && path_parts.len() > 2 => {
            if let Some(dir) = directory {
                let file_name = path_parts[2];
                let file_path = Path::new(&dir).join(file_name);
                
                match request.method.as_str() {
                    "GET" => {
                        match fs::read_to_string(&file_path) {
                            Ok(content) => create_response(
                                200, "OK", "application/octet-stream", &content, None, None
                            ),
                            Err(_) => create_response(404, "Not Found", "text/plain", "", None, None)
                        }
                    },
                    "POST" => {
                        if let Some(content) = request.body {
                            fs::write(file_path, content).unwrap();
                            create_response(201, "Created", "text/plain", "", None, None)
                        } else {
                            create_response(400, "Bad Request", "text/plain", "", None, None)
                        }
                    },
                    _ => create_response(405, "Method Not Allowed", "text/plain", "", None, None)
                }
            } else {
                create_response(404, "Not Found", "text/plain", "", None, None)
            }
        },
        
        _ if path_parts.len() == 3 && request.accept_encoding.is_some() => {
            let content = path_parts[2];
            if request.accept_encoding.unwrap().contains("gzip") {
                let mut encoder = GzEncoder::new(Vec::new(), Compression::default());
                encoder.write_all(content.as_bytes()).unwrap();
                let compressed = encoder.finish().unwrap();
                
                let mut response = create_response(
                    200, "OK", "text/plain", "", Some("gzip"), Some(compressed.len())
                );
                response.extend(compressed);
                response
            } else {
                create_response(200, "OK", "text/plain", content, None, None)
            }
        },
        
        _ if path_parts.len() > 2 => {
            create_response(200, "OK", "text/plain", path_parts[2], None, None)
        },
        
        _ => create_response(404, "Not Found", "text/plain", "", None, None)
    };
    
    stream.write_all(&response).unwrap();
}

fn main() {
    let args: Vec<String> = env::args().collect();
    let directory = args.iter()
        .position(|arg| arg == "--directory")
        .and_then(|i| args.get(i + 1))
        .map(String::from);

    let listener = TcpListener::bind("127.0.0.1:4221").unwrap();
    println!("🚀 ~ Your Server Started!");

    for stream in listener.incoming() {
        match stream {
            Ok(stream) => {
                let directory = directory.clone();
                thread::spawn(move || {
                    handle_client(stream, directory);
                });
            }
            Err(e) => {
                eprintln!("Error: {}", e);
            }
        }
    }
}
