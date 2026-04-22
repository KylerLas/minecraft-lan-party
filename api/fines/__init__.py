import json
import os
import azure.functions as func
from pymongo import MongoClient
from datetime import datetime

def main(req: func.HttpRequest) -> func.HttpResponse:
    client = MongoClient(os.environ["COSMOS_CONN_STR"])
    col = client["marketplace_db"]["minecraft_fines"]

    results = list(col.find().sort("timestamp", -1).limit(50))
    for doc in results:
        doc["_id"] = str(doc["_id"])
        if isinstance(doc.get("timestamp"), datetime):
            doc["timestamp"] = doc["timestamp"].isoformat()

    return func.HttpResponse(
        json.dumps(results),
        mimetype="application/json"
    )
