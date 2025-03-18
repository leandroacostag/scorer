from fastapi import APIRouter, Depends, HTTPException, status
from pymongo import MongoClient
import os
from datetime import datetime
from typing import List, Optional
from models import MatchCreate, MatchInDB, MatchResponse, MatchValidation, UserInDB
from auth import get_current_user
import uuid

router = APIRouter()

# MongoDB connection
MONGODB_URI = os.environ.get("MONGODB_URI")
client = MongoClient(MONGODB_URI)
db = client.scorer
matches_collection = db.matches
users_collection = db.users

@router.post("/create", response_model=MatchResponse)
async def create_match(match: MatchCreate, current_user: UserInDB = Depends(get_current_user)):
    match_data = match.dict()
    
    # Create new match with UUID
    new_match = MatchInDB(
        **match_data,
        created_by=current_user.auth_id,
        match_id=str(uuid.uuid4())
    )
    
    # Insert into database
    matches_collection.insert_one(new_match.dict(by_alias=True))
    
    return MatchResponse(**new_match.dict())

@router.post("/{match_id}/validate")
async def validate_match(match_id: str, current_user: UserInDB = Depends(get_current_user)):
    # Find match
    match = matches_collection.find_one({"match_id": match_id}, {"_id": 0})
    
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )
    
    # Check if user participated in match
    user_participated = any(player["user_id"] == current_user.auth_id for player in match["players"])
    
    if not user_participated:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only participants can validate matches"
        )
    
    # Check if user already validated
    if any(validation["user_id"] == current_user.auth_id for validation in match["validations"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already validated this match"
        )
    
    # Add validation
    validation = {
        "user_id": current_user.auth_id,
        "timestamp": datetime.now()
    }
    
    matches_collection.update_one(
        {"match_id": match_id},
        {"$push": {"validations": validation}}
    )
    
    # Check if match has enough validations to be marked as validated
    updated_match = matches_collection.find_one({"match_id": match_id}, {"_id": 0})
    
    if len(updated_match["validations"]) >= len(updated_match["players"]) / 2:
        matches_collection.update_one(
            {"match_id": match_id},
            {"$set": {"is_validated": True}}
        )
    
    return {"message": "Match validated successfully"}

@router.get("/my-matches", response_model=List[MatchResponse])
async def get_user_matches(current_user: UserInDB = Depends(get_current_user)):
    """Get all matches for the current user with username information"""
    
    # Find matches where user is a player
    matches = list(matches_collection.find({
        "$or": [
            {"created_by": current_user.auth_id},
            {"players.user_id": current_user.auth_id}
        ]
    }, {"_id": 0}))
    
    # Enrich matches with username information
    for match in matches:
        # Get all unique user IDs from the match
        user_ids = [match["created_by"]] + [p["user_id"] for p in match["players"]]
        user_ids = list(set(user_ids))  # Remove duplicates
        
        # Get user details for all users in the match
        users = {
            user["auth_id"]: user["username"] 
            for user in users_collection.find({"auth_id": {"$in": user_ids}}, {"_id": 0, "auth_id": 1, "username": 1})
        }
        
        # Add creator_username to match
        match["creator_username"] = users.get(match["created_by"], "Unknown")
        
        # Add username to each player
        for player in match["players"]:
            player["username"] = users.get(player["user_id"], "Unknown")
    
    return [MatchResponse(**match) for match in matches]

@router.get("/pending-validation", response_model=List[MatchResponse])
async def get_pending_validation_matches(current_user: UserInDB = Depends(get_current_user)):
    """Get matches pending validation with username information"""
    
    # Get IDs of all friends
    friend_ids = current_user.friends
    
    # Find matches created by friends that current user hasn't validated yet
    matches = list(matches_collection.find({
        "created_by": {"$in": friend_ids},
        "validations.user_id": {"$ne": current_user.auth_id}
    }, {"_id": 0}))
    
    # Enrich matches with username information
    for match in matches:
        # Get all unique user IDs from the match
        user_ids = [match["created_by"]] + [p["user_id"] for p in match["players"]]
        user_ids = list(set(user_ids))  # Remove duplicates
        
        # Get user details for all users in the match
        users = {
            user["auth_id"]: user["username"] 
            for user in users_collection.find({"auth_id": {"$in": user_ids}}, {"_id": 0, "auth_id": 1, "username": 1})
        }
        
        # Add creator_username to match
        match["creator_username"] = users.get(match["created_by"], "Unknown")
        
        # Add username to each player
        for player in match["players"]:
            player["username"] = users.get(player["user_id"], "Unknown")
    
    return [MatchResponse(**match) for match in matches]

@router.get("/stats")
async def get_user_stats(current_user: UserInDB = Depends(get_current_user)):
    # Find all validated matches where user is a player
    matches = matches_collection.find({
        "players.user_id": current_user.auth_id,
        "is_validated": True
    }, {"_id": 0})
    
    stats = {
        "total_matches": 0,
        "wins": 0,
        "losses": 0,
        "draws": 0,
        "goals": 0,
        "assists": 0,
        "by_format": {
            "F5": 0,
            "F6": 0,
            "F7": 0,
            "F8": 0,
            "F9": 0,
            "F10": 0,
            "F11": 0
        }
    }
    
    for match in matches:
        stats["total_matches"] += 1
        stats["by_format"][match["format"]] += 1
        
        # Find user's team and stats
        user_team = None
        for player in match["players"]:
            if str(player["user_id"]) == str(current_user.auth_id):
                user_team = player["team"]
                stats["goals"] += player["goals"]
                stats["assists"] += player["assists"]
                break
        
        if user_team:
            if match["score"]["teamA"] > match["score"]["teamB"] and user_team == "A":
                stats["wins"] += 1
            elif match["score"]["teamB"] > match["score"]["teamA"] and user_team == "B":
                stats["wins"] += 1
            elif match["score"]["teamA"] < match["score"]["teamB"] and user_team == "A":
                stats["losses"] += 1
            elif match["score"]["teamB"] < match["score"]["teamA"] and user_team == "B":
                stats["losses"] += 1
            else:
                stats["draws"] += 1
    
    return stats

@router.get("/leaderboard")
async def get_leaderboard(year: Optional[str] = None, current_user: UserInDB = Depends(get_current_user)):
    try:
        # Get all friends plus current user
        friend_ids = current_user.friends + [current_user.auth_id]
        
        # Get all users with these auth_ids
        users = list(users_collection.find({"auth_id": {"$in": friend_ids}}, {"_id": 0}))
        
        # Map of auth_id to username for quick lookup
        username_map = {user["auth_id"]: user["username"] for user in users}
        
        # Initialize leaderboard with users (even those with no matches)
        leaderboard = [
            {
                "user_id": user["auth_id"],
                "username": user["username"],
                "matches_played": 0,
                "wins": 0,
                "draws": 0,
                "losses": 0,
                "goals": 0,
                "assists": 0,
                "points": 0
            }
            for user in users
        ]
        
        # Create a map for quick access to user stats
        user_stats_map = {entry["user_id"]: entry for entry in leaderboard}
        
        # Get all validated matches involving these users
        match_query = {
            "players.user_id": {"$in": friend_ids},
            "is_validated": True
        }
        
        # Add year filter if provided
        if year:
            match_query["date"] = {"$regex": f"^{year}"}
        
        matches = matches_collection.find(match_query, {"_id": 0})
        
        for match in matches:
            # Process each player in the match
            for player in match["players"]:
                player_id = player["user_id"]
                
                # Skip if player is not in our list of users
                if player_id not in user_stats_map:
                    continue
                
                user_stats = user_stats_map[player_id]
                user_stats["matches_played"] += 1
                user_stats["goals"] += player["goals"]
                user_stats["assists"] += player["assists"]
                
                # Determine win/draw/loss based on team and score
                if (player["team"] == "A" and match["score"]["teamA"] > match["score"]["teamB"]) or \
                   (player["team"] == "B" and match["score"]["teamB"] > match["score"]["teamA"]):
                    user_stats["wins"] += 1
                elif match["score"]["teamA"] == match["score"]["teamB"]:
                    user_stats["draws"] += 1
                else:
                    user_stats["losses"] += 1
                
                # Calculate points based on our formula
                # 3 points for win, 0 for draw/loss
                win_points = user_stats["wins"] * 3
                
                # Points for goals based on match format
                goal_points = 0
                if match["format"] in ["F8", "F9", "F10", "F11"]:
                    # 1 point per goal for F8 and above
                    goal_points += player["goals"]
                else:
                    # 1 point per 2 goals for F7 and below
                    goal_points += player["goals"] // 2
                
                user_stats["points"] = win_points + goal_points
        
        # Sort leaderboard by points, then wins, then goals
        leaderboard.sort(key=lambda x: (x["points"], x["wins"], x["goals"]), reverse=True)
        
        # Remove users with no matches
        leaderboard = [user for user in leaderboard if user["matches_played"] > 0]
        
        return leaderboard
    except Exception as e:
        print(f"Error in get_leaderboard: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get leaderboard: {str(e)}"
        )

@router.get("/{match_id}", response_model=MatchResponse)
async def get_match(match_id: str, current_user: UserInDB = Depends(get_current_user)):
    match = matches_collection.find_one({"match_id": match_id}, {"_id": 0})
    
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )
        
    return MatchResponse(**match)

@router.post("/{match_id}/players", response_model=MatchResponse)
async def add_player_to_match(
    match_id: str,
    player_data: dict,
    current_user: UserInDB = Depends(get_current_user)
):
    """Add a player to an existing match with their stats"""
    
    # Verify the match exists
    match = matches_collection.find_one({"match_id": match_id}, {"_id": 0})
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )
    
    # Check if user is already in the match
    existing_player = any(p["user_id"] == current_user.auth_id for p in match["players"])
    if existing_player:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already part of this match"
        )
    
    # Create player stats object
    player_stats = {
        "user_id": current_user.auth_id,
        "team": player_data.get("team", "A"),
        "goals": player_data.get("goals", 0),
        "assists": player_data.get("assists", 0),
    }
    
    # Add the player to the match
    result = matches_collection.update_one(
        {"match_id": match_id},
        {"$push": {"players": player_stats}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to add player to match"
        )
    
    # Recalculate the match score
    updated_match = matches_collection.find_one({"match_id": match_id}, {"_id": 0})
    
    # Calculate team scores based on player goals
    team_a_score = sum(p["goals"] for p in updated_match["players"] if p["team"] == "A")
    team_b_score = sum(p["goals"] for p in updated_match["players"] if p["team"] == "B")
    
    # Update match scores
    matches_collection.update_one(
        {"match_id": match_id},
        {"$set": {"score": {"teamA": team_a_score, "teamB": team_b_score}}}
    )
    
    # Add automatic validation from this user
    validation = {
        "user_id": current_user.auth_id,
        "timestamp": datetime.now()
    }
    
    matches_collection.update_one(
        {"match_id": match_id},
        {"$push": {"validations": validation}}
    )
    
    # Check if we should auto-validate the match
    # If there are at least 2 players in the match, automatically validate it
    updated_match = matches_collection.find_one({"match_id": match_id}, {"_id": 0})
    if len(updated_match["players"]) >= 2:
        matches_collection.update_one(
            {"match_id": match_id},
            {"$set": {"is_validated": True}}
        )
    
    # Return the updated match
    final_match = matches_collection.find_one({"match_id": match_id}, {"_id": 0})
    return MatchResponse(**final_match)

@router.post("/{match_id}/skip-validation")
async def skip_match_validation(match_id: str, current_user: UserInDB = Depends(get_current_user)):
    """Skip validation for a match - for when a user was added but didn't actually play"""
    # Find match
    match = matches_collection.find_one({"match_id": match_id}, {"_id": 0})
    
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )
    
    # Skip validation by adding a special validation entry
    validation = {
        "user_id": current_user.auth_id,
        "timestamp": datetime.now(),
        "skipped": True
    }
    
    # Add the validation entry
    matches_collection.update_one(
        {"match_id": match_id},
        {"$push": {"validations": validation}}
    )
    
    return {"message": "Match validation skipped successfully"} 