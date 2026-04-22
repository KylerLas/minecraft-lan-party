const { MongoClient } = require("mongodb");

module.exports = async function (context, req) {
  const client = new MongoClient(process.env.COSMOS_CONN_STR);
  try {
    await client.connect();
    const col = client.db("marketplace_db").collection("minecraft_fines");

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
  } finally {
    await client.close();
  }
};
