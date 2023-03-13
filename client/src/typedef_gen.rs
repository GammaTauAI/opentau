use std::collections::{BTreeMap, BTreeSet};

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, PartialOrd, Ord)]
#[serde(rename_all = "camelCase", tag = "type")]
pub enum ObjectFieldInfo {
    /// Just a normal field
    Field { id: String },
    /// A call to some method/function. The args are the parameters of the call,
    /// where it will be a Some only if the parameter is an object.
    /// The inner vec is the path to the object. For example,
    /// f(obj) is just [obj], but f(obj.a.b) is [obj, a, b].
    Call {
        id: String,
        args: Vec<Option<Vec<String>>>,
    },
    /// A field that is an object
    Object {
        id: String,
        fields: BTreeSet<ObjectFieldInfo>,
    },
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, PartialOrd, Ord)]
pub struct ObjectFuncInfo {
    /// The parameters of the function. Maps [name] -> [Set<FieldInfo>].
    /// The parameters in the set are only objects, no primitive parameters.
    pub params: BTreeMap<String, BTreeSet<ObjectFieldInfo>>,
    /// The return info of the function.
    /// where the Set<FieldInfo> is the fields of the object.
    /// If this is None, it means that either the function does not return anything,
    /// or it returns a non-object type.
    pub ret: Option<BTreeSet<ObjectFieldInfo>>,
}

/// Represents the object info map for a given file
/// The names of the functions are the keys.
/// These should be delimited with "$" for functions that
/// are scoped inside other functions, where the first part is the name of the
/// parent function, and the second part is the name of the child function.
/// The value is the object information related to the function.
pub type ObjectInfoMap = BTreeMap<String, ObjectFuncInfo>;

// Typedef instructions for edit-based models
pub const TYPEDEF_INSTRUCTIONS: &str = r#"Substitute the identifiers denoted with _hole_ with the correct type annotations.
For interfaces, substitute the identifier _name_ with the correct name. Interfaces with _hole_{idx} placeholders are linked to inner structs in main interfaces."#;
