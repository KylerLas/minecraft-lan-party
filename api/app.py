from flask import Flask, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime

app = Flask(__name__)
CORS(app)

CONN_STR = "mongodb+srv://loremipsum:plsdonthackme1!@marketplace-listings-prod.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000"
client = MongoClient(CONN_STR)
fines = client["marketplace_db"]["minecraft_fines"]


@app.route("/fines")
def get_fines():
    results = list(fines.find().sort("timestamp", -1).limit(50))
    for doc in results:
        doc["_id"] = str(doc["_id"])
        if isinstance(doc.get("timestamp"), datetime):
            doc["timestamp"] = doc["timestamp"].isoformat()
    return jsonify(results)


@app.route("/fines/summary")
def summary():
    pipeline = [
        {"$group": {"_id": "$playerName", "total": {"$sum": "$amount"}, "count": {"$sum": 1}}}
    ]
    return jsonify(list(fines.aggregate(pipeline)))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
