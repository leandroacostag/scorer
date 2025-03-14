import os
from pathlib import Path
from dotenv import load_dotenv
import uvicorn

# Load .env from root directory
root_dir = Path(__file__).parent.parent
env_path = root_dir / '.env'
load_dotenv(env_path)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 