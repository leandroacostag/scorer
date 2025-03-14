from loguru import logger
import sys
import json
from typing import Any

# Configure loguru
logger.remove()  # Remove default handler
logger.add(
    sys.stdout,
    colorize=True,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="DEBUG"
)

def format_struct_log(obj: Any) -> str:
    """Format structured data for logging"""
    try:
        return json.dumps(obj, indent=2)
    except:
        return str(obj) 