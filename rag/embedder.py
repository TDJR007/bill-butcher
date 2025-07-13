#rag/embedder.py

from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
import os

from dotenv import load_dotenv
load_dotenv()

EMBDED_MODEL = os.getenv("EMBED_MODEL")
CHROMA_DB_PATH = os.getenv("CHROMA_DB_PATH")
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "700"))  # Default fallback
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "100"))  # Default fallback

def embed_pdf(file_path: str, collection_name: str, persist_dir: str = CHROMA_DB_PATH):
    loader = PyPDFLoader(file_path)
    docs = loader.load()

    splitter = RecursiveCharacterTextSplitter(chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP)
    splits = splitter.split_documents(docs)

    embedder = HuggingFaceEmbeddings(model_name=EMBDED_MODEL)

    vectordb = Chroma(
        collection_name=collection_name,
        embedding_function=embedder,
        persist_directory=persist_dir
    )
    vectordb.add_documents(splits)
    # Auto-persists when persist_directory is set

def get_vectorstore(collection_name: str, persist_dir: str = CHROMA_DB_PATH):
    embedder = HuggingFaceEmbeddings(model_name=EMBDED_MODEL)
    return Chroma(
        collection_name=collection_name,
        embedding_function=embedder,
        persist_directory=persist_dir
    )