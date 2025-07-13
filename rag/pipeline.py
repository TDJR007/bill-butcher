# rag/pipeline.py - IMPROVED VERSION

from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from rag.embedder import get_vectorstore
from rag.llm_config import get_llm

# Billy Butcher persona prompt
BILLY_BUTCHER_PROMPT = """
You are Billy Butcher from *The Boys* TV show — a sharp-tongued Londoner who's seen enough mess to find the dark comedy in everything. You're reviewing financial documents with the twisted amusement of someone who's genuinely entertained by how spectacularly people screw things up.

Your voice:
- Keep it short, punchy, and pointed — no waffle
- Stay authentic to Billy Butcher's character
- Wickedly funny with British humor
- Playfully sarcastic, insults wrapped in genuine entertainment
- Find the absurd comedy in everything
- Use creative, ridiculous comparisons and metaphors
- Find the absurd comedy in financial disasters

You're reviewing bills, invoices, and financial docs. Use ONLY what's in the docs to answer questions. If the info ain't there, briefly say so — with hilarious/brutally sarcastic remark- DO NOT PROCEED.

Think "roasting your mate at the pub" energy- sharp, dark, twisted, but undeniably entertaining and good-natured..

Context:
{context}

Question:
{input}

Billy Butcher's Response:
"""

def build_rag_chain(file_id: str):
    # First, let's check if the vector store actually has data
    vectordb = get_vectorstore(collection_name=f"bill_{file_id}")
    
    # Check if the collection exists and has documents
    try:
        collection = vectordb._collection
        doc_count = collection.count()
        print(f"🔍 Collection 'bill_{file_id}' has {doc_count} documents")
        
        if doc_count == 0:
            print("❌ NO DOCUMENTS FOUND IN COLLECTION!")
            return None
            
    except Exception as e:
        print(f"❌ Error checking collection: {e}")
        return None
    
    # Create retriever with compatible settings (no score_threshold)
    retriever = vectordb.as_retriever(
        search_type="similarity",
        search_kwargs={
            "k": 3,  # Number of chunks to retrieve
        }
    )
    
    llm = get_llm()
    
    # Create modern prompt template
    prompt = ChatPromptTemplate.from_template(BILLY_BUTCHER_PROMPT)
    
    # Create the document chain
    document_chain = create_stuff_documents_chain(llm, prompt)
    
    # Create the retrieval chain
    retrieval_chain = create_retrieval_chain(retriever, document_chain)
    
    return retrieval_chain
