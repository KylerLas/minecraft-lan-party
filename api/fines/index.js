const { MongoClient } = require("mongodb");

let client;

async function getClient() {
  if (!client) {
    client = new MongoClient(process.env.COSMOS_CONN_STR);
    await client.connect();
  }
  return client;
}

module.exports = async function (context, req) {
  try {
    const c = await getClient();
    const col = c.db("marketplace_db").collection("minecraft_fines");

    const results = await col.find().sort({ timestamp: -1 }).limit(50).toArray();

    const body = results.map((doc) => ({
      ...doc,
      _id: doc._id.toString(),
      timestamp: doc.timestamp instanceof Date ? doc.timestamp.toISOString() : doc.timestamp,
    }));

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: body.length > 0 ? body : [{ _id: "test", playerName: "TestPlayer", reason: "Function is alive", amount: 0, paid: false, collected: false, timestamp: new Date().toISOString() }],
    };
  } catch (err) {
    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: [{ _id: "error", playerName: "ERROR", reason: err.message, amount: 0, paid: false, collected: false, timestamp: new Date().toISOString() }],
    };
  }
};
