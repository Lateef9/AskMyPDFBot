import sys
import os
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
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

# OpenAI setup
embeddings = OpenAIEmbeddings(model="text-embedding-3-small", openai_api_key=openai_api_key)
llm = ChatOpenAI(model="gpt-3.5-turbo", openai_api_key=openai_api_key)

# LangGraph state
class RetrievalState(TypedDict):
    query: str
    documents: List[Dict]
    answer: str

# LangGraph nodes
def retrieve_documents(state: RetrievalState) -> RetrievalState:
    try:
        query_embedding = embeddings.embed_query(state["query"])
        if len(query_embedding) != 1536:
            raise ValueError(f"Query embedding has {len(query_embedding)} dimensions, expected 1536")
        response = supabase.rpc("match_documents", {
            "query_embedding": query_embedding,
            "match_count": 4
        }).execute()
        documents = [{"page_content": doc["content"], "metadata": doc["metadata"]} for doc in response.data]
    except Exception as e:
        raise RuntimeError(f"Retrieval failed: {str(e)}")
    return {"query": state["query"], "documents": documents, "answer": ""}

def generate_answer(state: RetrievalState) -> RetrievalState:
    try:
        # Format prompt directly
        context = "\n".join([doc["page_content"] for doc in state["documents"]])
        prompt_text = f"Answer the question based on the following context:\n{context}\n\nQuestion: {state['query']}"
        response = llm.invoke(prompt_text)
        answer = response.content
    except Exception as e:
        raise RuntimeError(f"Answer generation failed: {str(e)}")
    return {"query": state["query"], "documents": state["documents"], "answer": answer}

# Define LangGraph workflow
workflow = StateGraph(RetrievalState)
workflow.add_node("retrieve_documents", retrieve_documents)
workflow.add_node("generate_answer", generate_answer)
workflow.add_edge("retrieve_documents", "generate_answer")
workflow.add_edge("generate_answer", END)
workflow.set_entry_point("retrieve_documents")
app = workflow.compile()

# Execute workflow and stream output
if __name__ == "__main__":
    try:
        query = sys.argv[1]
        result = app.invoke({"query": query})
        answer = result["answer"]
        for chunk in answer.split():
            print(chunk, flush=True)
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)