from store import store_meeting_to_chroma

# Load your transcript and store into ChromaDB
store_meeting_to_chroma("transcripts/meeting_2025-07-25.json")

print("Transcript stored in ChromaDB.")
