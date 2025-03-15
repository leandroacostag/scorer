from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
from jose import jwt
import os
from pymongo import MongoClient
from models import UserCreate, UserInDB, UserResponse
from datetime import datetime
from utils.logging import logger, format_struct_log
import traceback

router = APIRouter()
security = HTTPBearer()

# MongoDB connection
MONGODB_URI = os.environ.get("MONGODB_URI")
client = MongoClient(MONGODB_URI)
db = client.scorer
users_collection = db.users

# Auth0 configuration
AUTH0_DOMAIN = os.environ.get("AUTH0_DOMAIN")
AUTH0_AUDIENCE = os.environ.get("AUTH0_AUDIENCE")
AUTH0_ALGORITHMS = ["RS256"]

print(f"Auth0 config: Domain={AUTH0_DOMAIN}, Audience={AUTH0_AUDIENCE}")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    # logger.debug("Authenticating user")
    token = credentials.credentials
    # logger.debug(f"Token received: {token[:20]}...")
    
    try:
        # Get Auth0 public key
        jwks_url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
        # logger.debug(f"Fetching JWKS from: {jwks_url}")
        # logger.debug(f"Auth0 config - Domain: {AUTH0_DOMAIN}, Audience: {AUTH0_AUDIENCE}")
        
        async with httpx.AsyncClient() as client:
            jwks_response = await client.get(jwks_url)
            # logger.debug(f"JWKS status code: {jwks_response.status_code}")
            jwks = jwks_response.json()
            # logger.debug(f"JWKS response: {format_struct_log(jwks)}")

        # Verify token
        unverified_header = jwt.get_unverified_header(token)
        # logger.debug(f"Token header: {format_struct_log(unverified_header)}")
        
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
                break

        if not rsa_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unable to find appropriate key"
            )

        try:
            # This will raise an exception if the token is invalid
            payload = jwt.decode(
                token,
                rsa_key,
                algorithms=AUTH0_ALGORITHMS,
                audience=AUTH0_AUDIENCE,
                issuer=f"https://{AUTH0_DOMAIN}/"
            )
            # logger.debug("Token successfully verified")
            # logger.debug(f"Payload: {payload}")

        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.JWTClaimsError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid claims. Please check the audience and issuer."
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Unable to parse authentication token: {str(e)}"
            )

        # Get user from database using auth_id from token
        auth_id = payload['sub']
        user = users_collection.find_one({"auth_id": auth_id}, {"_id": 0})
        
        if not user:
            # logger.debug(f"Creating temporary user for auth_id: {auth_id}")
            # Create a temporary user without username
            user = {
                "auth_id": auth_id,
                "email": payload.get('email', ''),
                "friends": [],
                "pending_sent_requests": [],
                "pending_received_requests": [],
                "username": None,
                "created_at": datetime.utcnow()
            }
            result = users_collection.insert_one(user)
            # logger.debug(f"Created temporary user: {format_struct_log(user)}")
        
        if not user.get("username"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User not registered"
            )
        
        return UserInDB(**user)

    except HTTPException as he:
        logger.warning(f"Authentication failed: {he.detail}")
        raise he
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}"
        )

@router.post("/register", response_model=UserResponse)
async def register_user(user_data: UserCreate):
    logger.debug(f"Registration attempt for auth_id: {user_data.auth_id}")
    
    # First, let's check what's in the database
    all_users = list(users_collection.find({"auth_id": user_data.auth_id}))
    logger.debug(f"All users with this auth_id: {format_struct_log(all_users)}")
    
    # Check if username is already taken
    existing_username = users_collection.find_one({"username": user_data.username})
    if existing_username:
        logger.warning(f"Username '{user_data.username}' is already taken")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Check if user already exists with this auth_id
    existing_user = users_collection.find_one({"auth_id": user_data.auth_id})
    logger.debug(f"Existing user found: {format_struct_log(existing_user)}")
    
    if existing_user:
        # Let's see what fields the existing user has
        logger.debug(f"Existing user fields: {existing_user.keys()}")
        logger.debug(f"Has username? {existing_user.get('username')}")
        
        # If user exists but hasn't set username, allow update
        if not existing_user.get("username"):
            logger.info(f"Updating temporary user with username: {user_data.username}")
            now = datetime.utcnow()
            update_result = users_collection.update_one(
                {"_id": existing_user["_id"]},
                {"$set": {
                    "username": user_data.username,
                    "email": user_data.email,
                    "created_at": now
                }}
            )
            logger.debug(f"Update result: {update_result.modified_count} documents modified")
            
            # Fetch the updated user to verify changes
            updated_user = users_collection.find_one({"_id": existing_user["_id"]})
            logger.debug(f"Updated user: {format_struct_log(updated_user)}")
            
            existing_user["username"] = user_data.username
            existing_user["email"] = user_data.email
            existing_user["created_at"] = now
            return UserResponse(
                id=str(existing_user["_id"]),
                username=existing_user["username"],
                email=existing_user["email"],
                friends=existing_user.get("friends", []),
                pending_sent_requests=existing_user.get("pending_sent_requests", []),
                pending_received_requests=existing_user.get("pending_received_requests", []),
                created_at=existing_user["created_at"]
            )
        else:
            logger.warning(f"User with auth_id {user_data.auth_id} is already registered with username: {existing_user.get('username')}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already registered"
            )
    
    # Create new user
    now = datetime.utcnow()
    user = {
        "auth_id": user_data.auth_id,
        "username": user_data.username,
        "email": user_data.email,
        "friends": [],
        "pending_sent_requests": [],
        "pending_received_requests": [],
        "created_at": now
    }
    
    result = users_collection.insert_one(user)
    user["_id"] = result.inserted_id
    
    return UserResponse(
        id=str(user["_id"]),
        username=user["username"],
        email=user["email"],
        friends=user["friends"],
        pending_sent_requests=user["pending_sent_requests"],
        pending_received_requests=user["pending_received_requests"],
        created_at=user["created_at"]
    )

@router.get("/me", response_model=UserResponse)
async def get_user_profile(current_user: UserInDB = Depends(get_current_user)):
    return UserResponse(**current_user.dict()) 

@router.get("/health", response_model=dict)
async def auth_health_check():
    try:
        # Test MongoDB connection
        db_status = "connected" if users_collection.find_one({}, {"_id": 1}) is not None else "no data"
        return {
            "status": "ok",
            "mongodb": db_status,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        } 