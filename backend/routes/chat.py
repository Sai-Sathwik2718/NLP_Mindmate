from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime

from backend.database.connection import get_db
from backend.models.models import Chat, Message, User, ActivityLog
from backend.models.schemas import ChatSessionCreate, ChatSessionResponse, MessageCreate, MessageResponse
from backend.services.auth_service import get_current_user
from backend.nlp.response_generator import response_generator

router = APIRouter(prefix="/chat", tags=["Chat & Conversations"])

@router.post("/sessions", response_model=ChatSessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(session_in: ChatSessionCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new chat session."""
    chat = Chat(user_id=current_user.id, title=session_in.title)
    db.add(chat)
    db.commit()
    db.refresh(chat)
    
    # Log activity
    log = ActivityLog(user_id=current_user.id, action="chat_create", details=f"Chat session {chat.id} created.")
    db.add(log)
    db.commit()
    
    return chat

@router.get("/sessions", response_model=List[ChatSessionResponse])
def list_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all chat sessions for the authenticated user, ordered by creation date."""
    chats = db.query(Chat).filter(Chat.user_id == current_user.id).order_by(Chat.created_at.desc()).all()
    return chats

@router.delete("/sessions/{chat_id}", status_code=status.HTTP_200_OK)
def delete_session(chat_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete a specific chat session and all associated messages."""
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == current_user.id).first()
    if not chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")
        
    db.delete(chat)
    db.commit()
    
    # Log activity
    log = ActivityLog(user_id=current_user.id, action="chat_delete", details=f"Chat session {chat_id} deleted.")
    db.add(log)
    db.commit()
    
    return {"message": "Chat session deleted successfully."}

@router.post("/{chat_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(chat_id: int, msg_in: MessageCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Send a message to the bot.
    Process the message using the NLP Pipeline (for intent, emotion, sentiment, crisis)
    and return the bot's response.
    """
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == current_user.id).first()
    if not chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")
        
    # Analyze user message
    from backend.nlp.pipeline import nlp_pipeline
    user_nlp = nlp_pipeline.analyze(msg_in.content)
    
    # Save User message to db
    user_msg = Message(
        chat_id=chat_id,
        sender="user",
        content=msg_in.content,
        intent=user_nlp["intent"],
        intent_confidence=user_nlp["intent_confidence"],
        sentiment=user_nlp["sentiment"],
        sentiment_confidence=user_nlp["sentiment_confidence"],
        emotion=user_nlp["emotion"],
        emotion_confidence=user_nlp["emotion_confidence"],
        is_crisis=user_nlp["is_crisis"],
        response_source="user"
    )
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)
    
    # Update Chat title if it is default 'New Chat Session' (using first 5 words of user message)
    if chat.title == "New Chat Session":
        words = msg_in.content.split()
        title_words = words[:5]
        chat.title = " ".join(title_words) + ("..." if len(words) > 5 else "")
        db.commit()

    # Generate bot response using Hybrid generator
    bot_res = response_generator.generate_response(msg_in.content, db)
    
    # Save Bot message to db
    bot_msg = Message(
        chat_id=chat_id,
        sender="bot",
        content=bot_res["response_content"],
        intent=bot_res["intent"],
        intent_confidence=bot_res["intent_confidence"],
        sentiment=bot_res["sentiment"],
        sentiment_confidence=bot_res["sentiment_confidence"],
        emotion=bot_res["emotion"],
        emotion_confidence=bot_res["emotion_confidence"],
        matched_faq_id=bot_res["matched_faq_id"],
        is_crisis=bot_res["is_crisis"],
        response_source=bot_res["source"],
        citation=bot_res["citation"]
    )
    db.add(bot_msg)
    db.commit()
    db.refresh(bot_msg)
    
    # Add temporary container for quick replies in the returned payload (not stored in DB schema)
    response_payload = MessageResponse.model_validate(bot_msg)
    # The API layer can return quick replies directly since React will need them
    # To return custom payload we can wrap it or add a custom field, but keeping schemas strictly compliant,
    # we can pass quick replies as headers or extend schema, or just let frontend query replies.
    # Actually, we can return the payload with quick replies. Let's make sure the client gets it.
    # To make it compatible, let's return a dictionary or schema that extends MessageResponse.
    # Let's inspect the returned object. A dictionary is serialized fine by FastAPI!
    return response_payload

@router.get("/{chat_id}/messages", response_model=List[MessageResponse])
def get_messages(chat_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all messages in a specific chat session, ordered chronologically."""
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == current_user.id).first()
    if not chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")
        
    messages = db.query(Message).filter(Message.chat_id == chat_id).order_by(Message.timestamp.asc()).all()
    return messages

@router.get("/search", response_model=List[MessageResponse])
def search_messages(q: str = Query(..., min_length=1), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Search for keywords across all user chat histories."""
    messages = db.query(Message).join(Chat).filter(
        Chat.user_id == current_user.id,
        Message.content.like(f"%{q}%")
    ).order_by(Message.timestamp.desc()).all()
    
    return messages

@router.get("/{chat_id}/export", response_class=PlainTextResponse)
def export_chat(chat_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Export the chat transcript as a formatted text file."""
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == current_user.id).first()
    if not chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")
        
    messages = db.query(Message).filter(Message.chat_id == chat_id).order_by(Message.timestamp.asc()).all()
    
    transcript = f"=========================================\n"
    transcript += f"       MINDMATE AI CHAT TRANSCRIPT       \n"
    transcript += f"=========================================\n"
    transcript += f"Session Title: {chat.title}\n"
    transcript += f"Export Date: {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}\n"
    transcript += f"User: {current_user.username}\n"
    transcript += f"-----------------------------------------\n\n"
    
    for msg in messages:
        sender_label = "MindMate Bot" if msg.sender == "bot" else current_user.username
        time_str = msg.timestamp.strftime('%Y-%m-%d %H:%M:%S')
        transcript += f"[{time_str}] {sender_label}:\n{msg.content}\n"
        if msg.sender == "bot" and msg.citation:
            transcript += f"  (Source: {msg.citation})\n"
        transcript += f"\n"
        
    transcript += f"-----------------------------------------\n"
    transcript += f"Disclaimer: MindMate is an educational tool and not a replacement for professional therapy.\n"
    transcript += f"=========================================\n"
    
    return PlainTextResponse(
        content=transcript,
        headers={"Content-Disposition": f"attachment; filename=mindmate_chat_{chat_id}.txt"}
    )
