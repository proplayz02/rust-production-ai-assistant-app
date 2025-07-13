use serde::{Deserialize, Serialize};
use mongodb::bson::{oid::ObjectId, DateTime as MongoDateTime};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatMessageDoc {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub role: String,
    pub content: String,
    pub timestamp: MongoDateTime,
} 