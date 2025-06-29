#rag/llm_config.py:

from langchain_groq import ChatGroq
import os
from dotenv import load_dotenv

load_dotenv()

def get_llm():
    return ChatGroq(
        model_name=os.getenv("GROQ_MODEL"),
        groq_api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.3
    )