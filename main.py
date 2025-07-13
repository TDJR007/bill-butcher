#File: main.py (fastAPI app)

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
import json

from rag.embedder import embed_pdf
from rag.pipeline import build_rag_chain


from pydantic import BaseModel

app = FastAPI()

# Allow frontend (adjust origins in production!)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 😂
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "./data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")

    # Save file to disk
    with open(file_path, "wb") as f:
        f.write(await file.read())

    # Embed file into vector store
    embed_pdf(file_path, f"bill_{file_id}")

    return {"file_id": file_id, "msg": "uploaded & embedded", "success": True}

class AskRequest(BaseModel):
    file_id: str
    question: str


@app.post("/ask_stream")
async def ask_stream(data: AskRequest):
    
    chain = build_rag_chain(data.file_id)

    if not chain:
        return {"answer": "Something's proper messed with the RAG chain. Check your embeddings!"}

    def generate_response():
        try:
            for chunk in chain.stream({"input": data.question}):
                if "answer" in chunk:
                    yield f"data: {json.dumps({'chunk': chunk['answer']})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        generate_response(),
        media_type="text/event-stream",  # 👈 this is the standard for streaming!
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )

@app.post("/ask")
async def ask(data: AskRequest):

    chain = build_rag_chain(data.file_id)
    if not chain:
        return {"answer": "Something's proper messed with the RAG chain. Check your embeddings!"}

    # Use `input` key for latest LangChain-style prompt
    response = chain.invoke({"input": data.question})
    
    # Debug the response
    print(f"🔍 Chain response: {response}")
    
    return {"answer": response.get("answer", "No answer returned - that's weird!")}
