import json
import os
import azure.functions as func
from pymongo import MongoClient

def main(req: func.HttpRequest) -> func.HttpResponse:
    client = MongoClient(os.environ["COSMOS_CONN_STR"])
    col = client["marketplace_db"]["minecraft_fines"]

    pipeline = [
        {"$group": {"_id": "$playerName", "total": {"$sum": "$amount"}, "count": {"$sum": 1}}}
    ]

    return func.HttpResponse(
        json.dumps(list(col.aggregate(pipeline))),
        mimetype="application/json"
    )
