pub mod cache;
pub mod completion;
pub mod langserver;
pub mod main_strategies;
pub mod socket;
pub mod tree;
pub mod typedef_gen;
pub mod args;

/// macro for debug printing, only prints if #cfg(debug_assertions) is true
#[macro_export]
macro_rules! debug {
    ($($arg:tt)*) => {
        #[cfg(debug_assertions)]
        println!($($arg)*);
    }
}

/// Gets the path to the given folder, relative to the root of the project.
pub fn get_path_from_rootdir(folder: String) -> String {
    std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .join(folder)
        .to_str()
        .unwrap()
        .to_string()
}
