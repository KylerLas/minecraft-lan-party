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
  const c = await getClient();
  const col = c.db("marketplace_db").collection("minecraft_fines");

  const results = await col
    .aggregate([
      { $group: { _id: "$playerName", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ])
    .toArray();

  context.res = {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(results),
  };
};
