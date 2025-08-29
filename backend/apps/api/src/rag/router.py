from fastapi import APIRouter
router = APIRouter()

@router.post("/index")
def index_doc(payload: dict):
    return {"status": "indexed", "dataset_id": payload.get("dataset_id")}

@router.post("/query")
def query(payload: dict):
    return {"answer": "stubbed answer", "citations": []}
