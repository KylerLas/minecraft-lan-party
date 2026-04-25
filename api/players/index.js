const { MongoClient } = require("mongodb");

module.exports = async function (context, req) {
  const client = new MongoClient(process.env.COSMOS_CONN_STR);
  try {
    await client.connect();
    const col = client.db("marketplace_db").collection("minecraft_players");

    const players = await col
      .find()
      .sort({ gold: -1 })
      .project({
        playerName: 1,
        playerUuid: 1,
        gold: 1,
        deaths: 1,
        mobKills: 1,
        pvpKillsDuringPurge: 1,
        bossesKilled: 1,
        guardianKills: 1,
        witherKills: 1,
        dragonKills: 1,
        goldReceived: 1,
        goldSpent: 1,
        transactionsSent: 1,
        transactionsReceived: 1,
        insuranceTier: 1,
        insurancePendingTier: 1,
        insuranceSignupTime: 1,
        insuranceLastCharged: 1,
        insuranceNextPaymentTime: 1,
        lastSeen: 1,
      })
      .toArray();

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: players.map((p) => ({
        ...p,
        _id: p._id.toString(),
        insuranceSignupTime: p.insuranceSignupTime instanceof Date ? p.insuranceSignupTime.toISOString() : p.insuranceSignupTime,
        insuranceLastCharged: p.insuranceLastCharged instanceof Date ? p.insuranceLastCharged.toISOString() : p.insuranceLastCharged,
        insuranceNextPaymentTime: p.insuranceNextPaymentTime instanceof Date ? p.insuranceNextPaymentTime.toISOString() : p.insuranceNextPaymentTime,
        lastSeen: p.lastSeen instanceof Date ? p.lastSeen.toISOString() : p.lastSeen,
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
