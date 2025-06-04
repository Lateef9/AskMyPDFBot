import sys
import os
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from supabase import create_client
from langgraph.graph import StateGraph, END
from typing import Dict, TypedDict, List

# Environment variables
from dotenv import load_dotenv
load_dotenv()

# Validate environment variables
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
openai_api_key = os.getenv("OPENAI_API_KEY")
if not all([supabase_url, supabase_key, openai_api_key]):
    missing = [k for k, v in [("SUPABASE_URL", supabase_url), ("SUPABASE_KEY", supabase_key), ("OPENAI_API_KEY", openai_api_key)] if not v]
    raise ValueError(f"Missing environment variables: {', '.join(missing)}")

# Supabase setup
supabase = create_client(supabase_url, supabase_key)

# OpenAI embeddings setup
embeddings = OpenAIEmbeddings(model="text-embedding-3-small", openai_api_key=openai_api_key)

# LangGraph state
class IngestionState(TypedDict):
    file_path: str
    documents: List
    embeddings: List

# LangGraph nodes
def load_pdf(state: IngestionState) -> IngestionState:
    loader = PyPDFLoader(os.path.normpath(state["file_path"]))
    documents = loader.load()
    return {"file_path": state["file_path"], "documents": documents, "embeddings": []}

def split_documents(state: IngestionState) -> IngestionState:
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    split_docs = text_splitter.split_documents(state["documents"])
    return {"file_path": state["file_path"], "documents": split_docs, "embeddings": []}

def generate_embeddings(state: IngestionState) -> IngestionState:
    texts = [doc.page_content for doc in state["documents"]]
    try:
        embeddings_data = embeddings.embed_documents(texts)
        if not all(len(emb) == 1536 for emb in embeddings_data):
            raise ValueError("Unexpected embedding dimensions")
    except Exception as e:
        raise RuntimeError(f"Embedding generation failed: {str(e)}")
    return {"file_path": state["file_path"], "documents": state["documents"], "embeddings": embeddings_data}

def store_in_supabase(state: IngestionState) -> IngestionState:
    try:
        for doc, embedding in zip(state["documents"], state["embeddings"]):
            data = {
                "content": doc.page_content,
                "embedding": embedding,
                "metadata": doc.metadata
            }
            supabase.table("documents").insert(data).execute()
    except Exception as e:
        raise RuntimeError(f"Supabase insert failed: {str(e)}")
    return state

# Define LangGraph workflow
workflow = StateGraph(IngestionState)
workflow.add_node("load_pdf", load_pdf)
workflow.add_node("split_documents", split_documents)
workflow.add_node("generate_embeddings", generate_embeddings)
workflow.add_node("store_in_supabase", store_in_supabase)
workflow.add_edge("load_pdf", "split_documents")
workflow.add_edge("split_documents", "generate_embeddings")
workflow.add_edge("generate_embeddings", "store_in_supabase")
workflow.add_edge("store_in_supabase", END)
workflow.set_entry_point("load_pdf")
app = workflow.compile()

# Execute workflow
if __name__ == "__main__":
    try:
        file_path = os.path.normpath(sys.argv[1])
        app.invoke({"file_path": file_path})
        print("PDF processed successfully.")
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)