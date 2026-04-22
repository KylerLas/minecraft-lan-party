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

    const body = await col
      .aggregate([
        { $group: { _id: "$playerName", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ])
      .toArray();

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body,
    };
  } catch (err) {
    context.res = {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: { error: err.message },
    };
  }
};
