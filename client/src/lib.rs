pub mod cache;
pub mod main_strategies;
pub mod completion;
pub mod langserver;
pub mod tree;
pub mod typedef_gen;
pub mod socket;

/// macro for debug printing, only prints if #cfg(debug_assertions) is true
#[macro_export]
macro_rules! debug {
    ($($arg:tt)*) => {
        #[cfg(debug_assertions)]
        println!($($arg)*);
    }
}
