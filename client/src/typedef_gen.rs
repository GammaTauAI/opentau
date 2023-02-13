use std::collections::HashMap;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", tag = "type")]
pub enum ObjectFieldInfo {
    /// Just a normal field
    Field { id: String },
    /// A call to some method/function
    Call { id: String },
    /// A field that is an object
    Object {
        id: String,
        fields: Vec<ObjectFieldInfo>,
    },
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ObjectFuncInfo {
    /// The parameters of the function. Maps [name] -> [Option<Vec<FieldInfo>>]
    /// It will only be Some if the parameter is an object, and the Vec<FieldInfo>
    /// is the fields of the object.
    pub params: HashMap<String, Option<Vec<ObjectFieldInfo>>>,
    /// The return info of the function. If it is an object, it will be Some(Vec<FieldInfo>)
    /// where the Vec<FieldInfo> is the fields of the object.
    /// If this is None, it means that either the function does not return anything,
    /// or it returns a non-object type.
    pub ret: Option<Vec<ObjectFieldInfo>>,
}

/// Represents the object info map for a given file
/// The names of the functions are the keys.
/// These should be delimited with "$" for functions that
/// are scoped inside other functions, where the first part is the name of the
/// parent function, and the second part is the name of the child function.
/// The value is the object information related to the function.
pub type ObjectInfoMap = HashMap<String, ObjectFuncInfo>;
