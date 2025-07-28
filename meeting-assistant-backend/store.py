import os
import json
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer

client = chromadb.Client(Settings(persist_directory="./chroma_store"))
collection = client.get_or_create_collection("meeting_notes")
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

def load_transcript_chunks(file_path: str):
    with open(file_path, "r", encoding="utf-8") as f:
        transcript = json.load(f)
    return [f"{seg['speaker']}: {seg['text']}" for seg in transcript]

def store_meeting_to_chroma(file_path: str):
    chunks = load_transcript_chunks(file_path)
    embeddings = embedding_model.encode(chunks)
    for i, chunk in enumerate(chunks):
        collection.add(
            documents=[chunk],
            embeddings=[embeddings[i].tolist()],
            ids=[f"{os.path.basename(file_path)}_{i}"]
        )
