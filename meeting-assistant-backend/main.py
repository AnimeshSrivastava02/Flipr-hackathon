from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from store import collection, embedding_model
import whisper
import tempfile
import ffmpeg


app = FastAPI()

# Allow extension access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = whisper.load_model("base")  # Or tiny for faster

@app.post("/upload_chunk")
async def upload_chunk(file: UploadFile = File(...)):
    try:
        # Save the uploaded WebM chunk
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp_webm:
            tmp_webm.write(await file.read())
            tmp_webm_path = tmp_webm.name

        # Convert WebM to WAV
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_wav:
            tmp_wav_path = tmp_wav.name

        ffmpeg.input(tmp_webm_path).output(tmp_wav_path).run(overwrite_output=True)

        # Transcribe using Whisper
        result = model.transcribe(tmp_wav_path)
        transcript = result["text"]

        # Store in ChromaDB
        embedding = embedding_model.encode([transcript]).tolist()[0]
        collection.add(documents=[transcript], embeddings=[embedding])

        return {"transcript": transcript}
    except Exception as e:
        print("❌ Error:", e)
        return {"error": str(e)}
