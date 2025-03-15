from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from auth import router as auth_router
from friends import router as friends_router
from matches import router as matches_router
from utils.logging import logger, format_struct_log
import traceback
import uvicorn
import os


app = FastAPI(title="Scorer API")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log request and response details"""
    # Generate request ID
    request_id = str(id(request))[:8]
    
    # Log request details
    logger.info(f"[{request_id}] Request started")
    
    # Create request details dictionary
    request_details = {
        'method': request.method,
        'url': str(request.url),
        'headers': dict(request.headers),
        'path_params': request.path_params,
        'query_params': str(request.query_params)
    }
    
    # Log formatted request details
    logger.debug(f"[{request_id}] Request details: {format_struct_log(request_details)}")
    
    try:
        # Get request body if available
        body = await request.body()
        if body:
            logger.debug(f"[{request_id}] Request body: {body.decode()}")
    except:
        pass

    try:
        response = await call_next(request)
        
        # Log response details
        logger.info(f"[{request_id}] Request completed with status {response.status_code}")
        return response
    
    except Exception as e:
        # Log error details
        logger.error(f"[{request_id}] Request failed: {str(e)}")
        logger.error(f"[{request_id}] Traceback: {traceback.format_exc()}")
        return JSONResponse(
            status_code=500,
            content={"detail": str(e)}
        )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.warning(f"HTTP {exc.status_code} error: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:3000")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(friends_router, prefix="/api/friends", tags=["Friends"])
app.include_router(matches_router, prefix="/api/matches", tags=["Matches"])

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)