use async_trait::async_trait;

use crate::{impl_langserver_commands};

use super::{abstraction::SocketAbstraction, LangServer, LangServerError};

#[derive(Debug)]
pub struct PyServer {
    socket: SocketAbstraction,
}

// NOTE: this is commented out because it's WIP. sorry for the mess!

#[async_trait]
impl LangServer for PyServer {
    async fn make(_path: &str) -> Result<Self, LangServerError> {
        // let pid = std::process::id();
        // let tmp_dir = std::env::temp_dir();
        // let tmp_socket_file = tmp_dir.join(format!("codex-{}.sock", pid));
        // println!("tmp_socket_file: {:?}", tmp_socket_file);

        // todo!("python server call");
        // let mut process = match tokio::process::Command::new("python")
        // .args([])
        // .stdout(Stdio::piped())
        // // stderr is open by default, we want to see the output
        // .spawn()
        // {
        // Ok(p) => p,
        // Err(_) => return Err(LangServerError::ProcessSpawn),
        // };

        // // before allowing to connect, wait for the process to output "Listening"
        // {
        // let stdout = process.stdout.as_mut().unwrap();
        // let reader = tokio::io::BufReader::new(stdout);
        // let mut lines = reader.lines();
        // println!("client output:");
        // while let Some(line) = lines.next_line().await.unwrap() {
        // println!("{}", line);
        // if line.contains("Listening") {
        // break;
        // }
        // }
        // }
        // println!("client ready to connect to socket!");
        // let socket_path = tmp_socket_file.to_str().unwrap().to_string();
        // let socket = SocketAbstraction {
        // socket_path,
        // process,
        // };
        // Ok(Self { socket })
        todo!()
    }

    async fn type_check(&self, _code: &str) -> Result<bool, LangServerError> {
        todo!()
    }

    fn any_type(&self) -> String {
        "Any".to_string()
    }
}

impl_langserver_commands!(PyServer);
