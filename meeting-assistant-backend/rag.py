from store import collection, embedding_model
from groq import Groq
from dotenv import load_dotenv
import os

# Load API key from .env
load_dotenv()
api_key = os.getenv("GROQ_API_KEY")
print("🔑 Groq API Key Loaded:", api_key)

# Initialize Groq client
client = Groq(api_key=api_key)

def generate_summary_from_transcripts(query: str):
    query_vec = embedding_model.encode([query]).tolist()[0]
    results = collection.query(
        query_embeddings=[query_vec],
        n_results=5,
    )

    context = "\n".join(results["documents"][0])
    prompt = f"""
You are a helpful meeting assistant.

Query: {query}

Context:
{context}

Respond with a clear summary and any specific action items with deadlines or assigned persons.
"""

    response = client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.5
    )

    return {
        "answer": response.choices[0].message.content,
        "source_chunks": results["documents"][0]
    }
