use tokio::net::UnixStream;


pub struct IncoderClient {
    /// Unix socket to communicate with the model server
    socket: UnixStream,
}
