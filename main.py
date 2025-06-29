from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import StreamingResponse
import os
import uuid
import json
from rag.embedder import embed_pdf
from rag.pipeline import build_rag_chain

app = FastAPI()

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())
    os.makedirs("./data/uploads", exist_ok=True)
    path = f"./data/uploads/{file_id}_{file.filename}"
    with open(path, "wb") as f:
        f.write(await file.read())
    
    embed_pdf(path, f"bill_{file_id}")
    return {"file_id": file_id, "msg": "uploaded & embedded"}

@app.post("/ask")
async def ask(file_id: str = Form(...), question: str = Form(...)):
    chain = build_rag_chain(file_id)

    # Updated for new chain structure - use "input" instead of "query"
    response = chain.invoke({"input": question})
    # Return just the answer from the response dict
    return {"answer": response["answer"]}

@app.post("/ask_stream")
async def ask_stream(file_id: str = Form(...), question: str = Form(...)):
    chain = build_rag_chain(file_id)
    
    def generate_response():
        try:
            for chunk in chain.stream({"input": question}):
                if "answer" in chunk:
                    yield f"data: {json.dumps({'chunk': chunk['answer']})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(
        generate_response(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/plain"
        }
    )