from fastapi import APIRouter, Depends, HTTPException, status
from pymongo import MongoClient
import os
from models import UserInDB, UserResponse, FriendRequest
from auth import get_current_user
from utils.logging import logger, format_struct_log

router = APIRouter()

# MongoDB connection
MONGODB_URI = os.environ.get("MONGODB_URI")
client = MongoClient(MONGODB_URI)
db = client.scorer
users_collection = db.users

@router.post("/request")
async def send_friend_request(request: FriendRequest, current_user: UserInDB = Depends(get_current_user)):
    # Get friend auth_id from request
    friend_auth_id = request.user_id
    
    # Check if user exists
    friend = users_collection.find_one({"auth_id": friend_auth_id}, {"_id": 0})
    if not friend:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if already friends
    if friend_auth_id in current_user.friends:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already friends with this user"
        )
    
    # Check if request already sent
    if friend_auth_id in current_user.pending_sent_requests:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Friend request already sent"
        )
    
    # Check if request already received
    if friend_auth_id in current_user.pending_received_requests:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User has already sent you a friend request"
        )
    
    # Send the request
    users_collection.update_one(
        {"auth_id": current_user.auth_id},
        {"$push": {"pending_sent_requests": friend_auth_id}}
    )
    
    users_collection.update_one(
        {"auth_id": friend_auth_id},
        {"$push": {"pending_received_requests": current_user.auth_id}}
    )
    
    return {"message": "Friend request sent"}

@router.post("/accept")
async def accept_friend_request(request: FriendRequest, current_user: UserInDB = Depends(get_current_user)):
    friend_auth_id = request.user_id
    
    # Check if request exists
    if friend_auth_id not in current_user.pending_received_requests:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No pending request from this user"
        )
    
    # Accept the request
    users_collection.update_one(
        {"auth_id": current_user.auth_id},
        {
            "$pull": {"pending_received_requests": friend_auth_id},
            "$push": {"friends": friend_auth_id}
        }
    )
    
    users_collection.update_one(
        {"auth_id": friend_auth_id},
        {
            "$pull": {"pending_sent_requests": current_user.auth_id},
            "$push": {"friends": current_user.auth_id}
        }
    )
    
    return {"message": "Friend request accepted"}

@router.get("/list", response_model=list[UserResponse])
async def get_friends_list(current_user: UserInDB = Depends(get_current_user)):
    friends = users_collection.find({"auth_id": {"$in": current_user.friends}}, {"_id": 0})
    
    user_responses = []
    for user in friends:
        user_response = {
            "auth_id": user["auth_id"],
            "username": user["username"],
            "email": user["email"],
            "is_friend": True,
            "is_pending_friend": False,
            "is_pending_request": False,
            "created_at": user["created_at"]
        }
        user_responses.append(UserResponse(**user_response))
    return user_responses

@router.get("/requests/received", response_model=list[UserResponse])
async def get_received_requests(current_user: UserInDB = Depends(get_current_user)):
    requests = users_collection.find({"auth_id": {"$in": current_user.pending_received_requests}}, {"_id": 0})
    user_responses = []
    for user in requests:
        user_response = {
            "auth_id": user["auth_id"],
            "username": user["username"],
            "email": user["email"],
            "is_friend": False,
            "is_pending_friend": False,
            "is_pending_request": True,
            "created_at": user["created_at"]
        }
        user_responses.append(UserResponse(**user_response))
    return user_responses

@router.get("/requests/sent", response_model=list[UserResponse])
async def get_sent_requests(current_user: UserInDB = Depends(get_current_user)):
    requests = users_collection.find({"auth_id": {"$in": current_user.pending_sent_requests}}, {"_id": 0})
    user_responses = []
    for user in requests:
        user_response = {
            "auth_id": user["auth_id"],
            "username": user["username"],
            "email": user["email"],
            "is_friend": False,
            "is_pending_friend": True,
            "is_pending_request": False,
            "created_at": user["created_at"]
        }
        user_responses.append(UserResponse(**user_response))
    return user_responses

@router.get("/search")
async def search_users(query: str, current_user: UserInDB = Depends(get_current_user)):
    search_query = {
        "username": {"$regex": f"^{query}", "$options": "i"},
        "auth_id": {"$ne": current_user.auth_id},
    }
    
    users = list(users_collection.find(search_query, {"_id": 0}).limit(10))
    
    user_responses = []
    for user in users:
        user_auth_id = user["auth_id"]
        user_response = {
            "auth_id": user_auth_id,
            "username": user["username"],
            "email": user["email"],
            "is_friend": user_auth_id in current_user.friends,
            "is_pending_friend": user_auth_id in current_user.pending_sent_requests,
            "is_pending_request": user_auth_id in current_user.pending_received_requests,
            "created_at": user["created_at"]
        }
        user_responses.append(UserResponse(**user_response))
    
    return user_responses

@router.delete("/remove/{friend_id}")
async def remove_friend(friend_id: str, current_user: UserInDB = Depends(get_current_user)):
    # Check if they are actually friends
    if friend_id not in current_user.friends:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This user is not in your friends list"
        )
    
    # Remove from both users' friends lists
    users_collection.update_one(
        {"auth_id": current_user.auth_id},
        {"$pull": {"friends": friend_id}}
    )
    
    users_collection.update_one(
        {"auth_id": friend_id},
        {"$pull": {"friends": current_user.auth_id}}
    )
    
    return {"message": "Friend removed successfully"} 