pub struct Cache {
    stop_at: usize, // TODO: document
    redis: redis::Connection,
}

impl Cache {
    pub fn new(redis_url: &str, stop_at: usize) -> Result<Self, Box<dyn std::error::Error>> {
        let client = redis::Client::open(redis_url)?;
        let conn = client.get_connection()?;
        Ok(Self {
            redis: conn,
            stop_at,
        })
    }
}
