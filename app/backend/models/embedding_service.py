import numpy as np
import json
import os
import pathlib
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any, Optional

# Define base directory to ensure consistent paths
BASE_DIR = pathlib.Path(__file__).parent.parent.absolute()
DB_DIR = os.path.join(BASE_DIR, "db")

# Initialize the embedding model
try:
    # Choose a good model for multilingual text
    model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
except Exception as e:
    print(f"Error loading embedding model: {e}")
    model = None

def create_embedding(text: str) -> Optional[np.ndarray]:
    """
    Create an embedding vector for the given text using sentence-transformers.
    
    Args:
        text: The text to create an embedding for
        
    Returns:
        A numpy array containing the embedding vector, or None if there was an error
    """
    if model is None:
        print("Embedding model not initialized")
        return None
    
    try:
        # Generate embeddings
        embedding = model.encode(text)
        return embedding
    except Exception as e:
        print(f"Error creating embedding: {e}")
        return None

def cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
    """
    Calculate cosine similarity between two vectors.
    
    Args:
        vec1: First vector
        vec2: Second vector
        
    Returns:
        Cosine similarity score (higher means more similar)
    """
    dot_product = np.dot(vec1, vec2)
    norm_vec1 = np.linalg.norm(vec1)
    norm_vec2 = np.linalg.norm(vec2)
    
    if norm_vec1 == 0 or norm_vec2 == 0:
        return 0
    
    return dot_product / (norm_vec1 * norm_vec2)

def search_images(query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Search for images based on the semantic similarity between the query and image descriptions.
    
    Args:
        query: The search query
        top_k: Number of top results to return
        
    Returns:
        List of image data with similarity scores
    """
    # Create embedding for the query
    query_embedding = create_embedding(query)
    
    if query_embedding is None:
        return []
    
    # Load image data from the JSON file
    db_path = os.path.join(DB_DIR, "images.json")
    
    if not os.path.exists(db_path):
        return []
    
    try:
        with open(db_path, "r") as f:
            data = json.load(f)
            images = data.get("images", [])
    except (json.JSONDecodeError, IOError) as e:
        print(f"Error loading image database: {e}")
        return []
    
    # Calculate similarity scores
    results = []
    for image in images:
        # Skip images without embeddings
        if "embedding" not in image or image["embedding"] is None:
            continue
        
        # Convert the stored list back to numpy array
        image_embedding = np.array(image["embedding"])
        
        # Calculate similarity
        similarity = cosine_similarity(query_embedding, image_embedding)
        
        # Create a copy of the image data without the embedding (to save bandwidth)
        image_result = {k: v for k, v in image.items() if k != "embedding"}
        image_result["similarity"] = float(similarity)
        
        results.append(image_result)
    
    # Sort by similarity (highest first)
    results.sort(key=lambda x: x["similarity"], reverse=True)
    
    # Return top k results
    return results[:top_k]

# Test function
def test_search(query: str):
    """Test the search functionality."""
    results = search_images(query)
    print(f"Search results for '{query}':")
    for i, result in enumerate(results, 1):
        print(f"{i}. {result['filename']} - Similarity: {result['similarity']:.4f}")
        print(f"   Description: {result['description'][:100]}...")
    
    return results

if __name__ == "__main__":
    # Test the search if this file is run directly
    import sys
    
    if len(sys.argv) > 1:
        query = sys.argv[1]
        test_search(query)
    else:
        print("Please provide a search query to test the search functionality.") 