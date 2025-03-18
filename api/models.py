from datetime import datetime
from typing import List, Optional, Dict, Literal, Any
from pydantic import BaseModel, Field, EmailStr
import uuid


class UserBase(BaseModel):
    username: str
    email: EmailStr
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class UserCreate(BaseModel):
    username: str
    email: str
    auth_id: str

class UserInDB(BaseModel):
    auth_id: str
    username: str
    email: str
    friends: List[str] = Field(default_factory=list)
    pending_sent_requests: List[str] = Field(default_factory=list)
    pending_received_requests: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    mutual_friends: int = Field(default=0)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class UserResponse(BaseModel):
    auth_id: str
    username: str
    email: Optional[str] = None
    is_friend: Optional[bool] = None
    is_pending_friend: Optional[bool] = None
    is_pending_request: Optional[bool] = None
    created_at: datetime

    class Config:
        populate_by_name = True

class PlayerStats(BaseModel):
    user_id: str
    team: Literal["A", "B"]
    goals: int = 0
    assists: int = 0

class MatchValidation(BaseModel):
    user_id: str
    timestamp: datetime = Field(default_factory=datetime.now)

class MatchBase(BaseModel):
    date: str
    location: str
    time: str
    format: Literal["F5", "F6", "F7", "F8", "F9", "F10", "F11"]
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class MatchCreate(MatchBase):
    players: List[PlayerStats]
    winning_team: Literal["A", "B", "draw"]

class MatchInDB(MatchBase):
    match_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_by: str
    players: List[PlayerStats]
    winning_team: Literal["A", "B", "draw"]
    validations: List[MatchValidation] = []
    is_validated: bool = False
    created_at: datetime = Field(default_factory=datetime.now)

class MatchResponse(MatchBase):
    match_id: str
    created_by: str
    players: List[Dict]
    winning_team: Literal["A", "B", "draw"]
    validations: List[Dict]
    is_validated: bool
    created_at: datetime

class FriendRequest(BaseModel):
    user_id: str

class Match(BaseModel):
    match_id: str
    created_by: str
    players: List[Dict]
    winning_team: str  # "A", "B", or "draw"
    # other fields remain the same 