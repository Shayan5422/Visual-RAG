import base64
import httpx
import asyncio
import os
import pathlib
from PIL import Image
import io

# Define base directory
BASE_DIR = pathlib.Path(__file__).parent.parent.absolute()
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")

OLLAMA_BASE_URL = "http://localhost:11434/api"

def encode_image_to_base64(image_path):
    """Encode an image to base64 string."""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

async def process_image(image_path):
    """Process the image and return analysis results."""
    try:
        # This is a placeholder for any pre-processing you might want to do
        # For example, resize image if it's too large
        img = Image.open(image_path)
        max_size = 1024
        if max(img.size) > max_size:
            # Resize while maintaining aspect ratio
            img.thumbnail((max_size, max_size))
            
        # Convert the image to RGB mode (removing alpha channel if present)
        if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
            bg = Image.new('RGB', img.size, (255, 255, 255))
            bg.paste(img, mask=img.split()[3] if img.mode == 'RGBA' else None)
            img = bg
        elif img.mode != 'RGB':
            img = img.convert('RGB')
            
        # Save the processed image
        img.save(image_path, format='JPEG')
            
        return True
    except Exception as e:
        print(f"Error processing image: {e}")
        return False

async def get_image_description(image_path):
    """Send the image to Moondream model via Ollama and get a description."""
    try:
        # Process the image first - convert to JPEG if needed
        await process_image(image_path)
        
        # Get file extension
        _, ext = os.path.splitext(image_path)
        
        # If not a JPEG or PNG, convert to JPEG format
        if ext.lower() not in ['.jpg', '.jpeg', '.png']:
            # Create a new path with .jpg extension
            new_path = os.path.splitext(image_path)[0] + '.jpg'
            
            # Open and convert the image
            img = Image.open(image_path)
            
            # Convert to RGB mode if necessary
            if img.mode != 'RGB':
                img = img.convert('RGB')
                
            # Save as JPEG
            img.save(new_path, 'JPEG', quality=95)
            
            # Update the image path
            image_path = new_path
            print(f"Converted image to JPEG format: {image_path}")
        
        # Encode the image to base64
        base64_image = encode_image_to_base64(image_path)
        
        # Prepare the prompt for Moondream
        prompt = "Describe this image in detail, including all visible elements, colors, actions, and context."
        
        # Call Moondream model via Ollama API
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/generate",
                json={
                    "model": "moondream",
                    "prompt": prompt,
                    "images": [base64_image],
                    "stream": False
                },
                timeout=120.0  # Increased timeout for image processing
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get("response", "No description generated")
            else:
                error_msg = f"Error from Ollama API: {response.status_code} - {response.text}"
                print(error_msg)
                return f"Error: Failed to get description from model. Status code: {response.status_code}"
                
    except Exception as e:
        print(f"Exception during image description: {e}")
        return f"Error: {str(e)}"
    
# Test function - can be used to verify the module works correctly
async def test_image_description(image_path):
    """Test function to verify the image description works."""
    description = await get_image_description(image_path)
    print(f"Image description: {description}")
    return description

if __name__ == "__main__":
    # Test with a sample image if this file is run directly
    import sys
    
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        if os.path.exists(image_path):
            asyncio.run(test_image_description(image_path))
        else:
            print(f"Image path does not exist: {image_path}")
    else:
        print("Please provide an image path to test the description.") 