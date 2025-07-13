use resilient_ai_agent::db::chat_message::ChatMessageDoc;
use mongodb::bson::oid::ObjectId;
use mongodb::bson::DateTime as MongoDateTime;

#[test]
fn test_chat_message_doc_creation() {
    let id = Some(ObjectId::new());
    let doc = ChatMessageDoc {
        id: id.clone(),
        role: "user".to_string(),
        content: "Hello".to_string(),
        timestamp: MongoDateTime::now(),
    };
    assert_eq!(doc.role, "user");
    assert_eq!(doc.content, "Hello");
    assert_eq!(doc.id, id);
} 