pub mod cache;
pub mod langserver;
pub mod completion;
pub mod tree;

/// macro for debug printing, only prints if #cfg(debug_assertions) is true
#[macro_export]
macro_rules! debug {
    ($($arg:tt)*) => {
        #[cfg(debug_assertions)]
        println!($($arg)*);
    }
}
