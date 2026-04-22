const { MongoClient } = require("mongodb");

module.exports = async function (context, req) {
  const client = new MongoClient(process.env.COSMOS_CONN_STR);
  try {
    await client.connect();
    const col = client.db("marketplace_db").collection("minecraft_fines");

    const results = await col.find().sort({ timestamp: -1 }).limit(50).toArray();

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: results.map((doc) => ({
        ...doc,
        _id: doc._id.toString(),
        timestamp: doc.timestamp instanceof Date ? doc.timestamp.toISOString() : doc.timestamp,
      })),
    };
  } catch (err) {
    context.res = {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: { error: err.message },
    };
  } finally {
    await client.close();
  }
};
