from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import shutil
import os
import uuid
from typing import List, Optional
import time
from datetime import datetime
import json
import httpx
import pathlib

from models.image_processor import process_image, get_image_description
from models.embedding_service import create_embedding, search_images

# Define base directory to ensure consistent paths
BASE_DIR = pathlib.Path(__file__).parent.absolute()
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
DB_DIR = os.path.join(BASE_DIR, "db")

app = FastAPI(title="Visual RAG - Photo Gallery")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if it doesn't exist
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(DB_DIR, exist_ok=True)

# Serve static files (uploaded images)
app.mount("/images", StaticFiles(directory=UPLOADS_DIR), name="images")

# Data models
class SearchQuery(BaseModel):
    query: str

class ImageResponse(BaseModel):
    id: str
    filename: str
    path: str
    description: str
    uploaded_at: str
    similarity: Optional[float] = None

# Background task to process uploaded image
async def process_uploaded_image(image_id: str, image_path: str):
    try:
        # Get image description from Moondream model
        description = await get_image_description(image_path)
        
        # Check if there was an error getting the description
        if description and description.startswith("Error:"):
            print(f"Error processing image {image_id}: {description}")
            description = "Failed to generate description. Please try another image format like JPEG or PNG."
        
        # Create embedding for the description
        embedding = create_embedding(description)
        
        # Save metadata and embedding to database
        image_data = {
            "id": image_id,
            "filename": os.path.basename(image_path),
            "path": f"/images/{os.path.basename(image_path)}",  # Use URL path, not file path
            "description": description,
            "uploaded_at": datetime.now().isoformat(),
            "embedding": embedding.tolist() if embedding is not None else None
        }
        
        # Save to a JSON file (in a real app, you'd use a proper database)
        db_path = os.path.join(DB_DIR, "images.json")
        
        if os.path.exists(db_path):
            with open(db_path, "r") as f:
                try:
                    data = json.load(f)
                except json.JSONDecodeError:
                    data = {"images": []}
        else:
            data = {"images": []}
        
        data["images"].append(image_data)
        
        with open(db_path, "w") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error in process_uploaded_image: {str(e)}")
        # If we encounter an exception, try to update the image record with the error
        try:
            db_path = os.path.join(DB_DIR, "images.json")
            if os.path.exists(db_path):
                with open(db_path, "r") as f:
                    try:
                        data = json.load(f)
                        # Find the image with the matching ID and update its description
                        for img in data.get("images", []):
                            if img["id"] == image_id:
                                img["description"] = f"Error processing image: {str(e)}"
                                break
                        # Write updated data back to the file
                        with open(db_path, "w") as f:
                            json.dump(data, f, indent=2)
                    except Exception:
                        pass
        except Exception:
            # If we can't even update the error, just log it
            print(f"Failed to update error status for image {image_id}")

@app.post("/api/upload", response_model=ImageResponse)
async def upload_image(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    # Generate a unique ID for the image
    image_id = str(uuid.uuid4())
    filename = f"{image_id}_{file.filename}"
    file_path = os.path.join(UPLOADS_DIR, filename)
    
    # Save the uploaded file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Process the image in the background
    background_tasks.add_task(process_uploaded_image, image_id, file_path)
    
    return {
        "id": image_id,
        "filename": filename,
        "path": f"/images/{filename}",
        "description": "Processing...",
        "uploaded_at": datetime.now().isoformat()
    }

@app.get("/api/images", response_model=List[ImageResponse])
async def get_images():
    db_path = os.path.join(DB_DIR, "images.json")
    
    if not os.path.exists(db_path):
        return []
    
    with open(db_path, "r") as f:
        try:
            data = json.load(f)
            images = data.get("images", [])
            # Remove embedding from response to keep it lightweight
            for image in images:
                if "embedding" in image:
                    del image["embedding"]
            return images
        except json.JSONDecodeError:
            return []

@app.post("/api/search", response_model=List[ImageResponse])
async def search(query: SearchQuery):
    results = search_images(query.query)
    return results

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 