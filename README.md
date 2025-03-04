# Visual RAG Photo Gallery

A full-stack application that combines AI image analysis with semantic search capabilities to provide a powerful photo gallery experience. Upload your images and search for them using natural language.

## Features

- Upload and manage your image collection
- Get AI-generated descriptions of your images using Moondream model
- Search for images using natural language queries
- Semantic search using text embeddings
- Responsive UI with modern design

## Architecture

This application consists of:

1. **Frontend**: React application with Chakra UI for a beautiful, responsive user interface
2. **Backend**: FastAPI server handling image uploads, AI processing, and search
3. **AI Components**:
   - Moondream model via Ollama for image description
   - Sentence-transformers for creating embeddings
   - Vector similarity search for finding relevant images

## Prerequisites

- Python 3.8+
- Node.js 14+
- [Ollama](https://ollama.ai/) installed locally
- Moondream model pulled in Ollama (`ollama pull moondream`)

## Installation

### 1. Clone the repository

```
git clone https://github.com/yourusername/visual-rag.git
cd visual-rag
```

### 2. Install backend dependencies

```
pip install -r requirements.txt
```

### 3. Install frontend dependencies

```
cd app/frontend
npm install
```

## Running the Application

### 1. Start Ollama

Make sure Ollama is running and the Moondream model is available:

```
ollama serve
```

In another terminal:

```
ollama pull moondream
```

### 2. Start the backend server

From the project root:

```
cd app/backend
uvicorn main:app --reload
```

The API will be available at http://localhost:8000.

### 3. Start the frontend development server

In another terminal, from the project root:

```
cd app/frontend
npm start
```

The application will be available at http://localhost:3000.

## Usage

1. **Upload Images**: Drag and drop images or use the file browser to upload.
2. **View Gallery**: Browse through your uploaded images.
3. **Search Images**: Enter natural language queries to find semantically similar images.
4. **View Details**: Click on an image to see its AI-generated description and other details.

## How It Works

1. User uploads an image
2. Backend processes the image and sends it to Moondream model via Ollama
3. Moondream generates a detailed description of the image
4. The description is converted to an embedding vector using sentence-transformers
5. When a user searches, their query is also converted to an embedding
6. The system finds images with the most similar embeddings to the query
7. Results are returned based on cosine similarity between embeddings

## License

MIT

## Acknowledgements

- [Moondream](https://github.com/vikhyat/moondream) - Image understanding model
- [Ollama](https://ollama.ai/) - Run LLMs locally
- [FastAPI](https://fastapi.tiangolo.com/) - Backend framework
- [React](https://reactjs.org/) - Frontend library
- [Chakra UI](https://chakra-ui.com/) - UI component library
- [Sentence Transformers](https://www.sbert.net/) - Text embeddings 