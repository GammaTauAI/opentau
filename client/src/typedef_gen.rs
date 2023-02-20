use std::collections::{BTreeMap, BTreeSet};

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, PartialOrd, Ord)]
#[serde(rename_all = "camelCase", tag = "type")]
pub enum ObjectFieldInfo {
    /// Just a normal field
    Field { id: String },
    /// A call to some method/function
    Call { id: String },
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
