const { MongoClient } = require("mongodb");

const DEFAULTS = {
  baseDeathPenalty: 0.5,
  insuranceEnabled: true,
  bronze: { deathRate: 0.35, dailyCostRate: 0.005 },
  silver: { deathRate: 0.2, dailyCostRate: 0.01 },
  gold: { deathRate: 0.08, dailyCostRate: 0.02 },
};

module.exports = async function (context, req) {
  const client = new MongoClient(process.env.COSMOS_CONN_STR);
  try {
    await client.connect();
    const col = client.db("marketplace_db").collection("minecraft_config");
    const doc = await col.findOne({ _id: "insurance_rates" });

    // Merge DB values over defaults so partial documents still return full config
    const cfg = {
      baseDeathPenalty: doc?.baseDeathPenalty ?? DEFAULTS.baseDeathPenalty,
      insuranceEnabled: doc?.insuranceEnabled ?? DEFAULTS.insuranceEnabled,
      bronze: { ...DEFAULTS.bronze, ...(doc?.bronze ?? {}) },
      silver: { ...DEFAULTS.silver, ...(doc?.silver ?? {}) },
      gold: { ...DEFAULTS.gold, ...(doc?.gold ?? {}) },
    };

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: cfg,
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
