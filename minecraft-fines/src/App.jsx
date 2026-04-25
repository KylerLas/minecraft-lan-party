import { useEffect, useState } from "react";
import "./App.css";

const API = "/api";

function getEffectiveDeathPenalty(player, cfg) {
  if (!cfg) return "—";
  if (!player.insuranceTier) return Math.round(cfg.baseDeathPenalty * 100) + "%";
  return Math.round((cfg[player.insuranceTier]?.deathRate ?? cfg.baseDeathPenalty) * 100) + "%";
}

function getNextChargeDisplay(player) {
  if (!player.insuranceTier || !player.insuranceNextPaymentTime) return "—";
  const diffMs = new Date(player.insuranceNextPaymentTime) - Date.now();
  if (diffMs < 0) return "Overdue";
  const mins = Math.round(diffMs / 60000);
  return mins === 0 ? "<1m" : `${mins}m`;
}

function fmt(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString();
}

const BOSSES = [
  { key: "guardianKills",  label: "Elder Guardian", emoji: "🔱", gold: 75,  color: "boss-guardian" },
  { key: "witherKills",    label: "Wither Boss",    emoji: "💀", gold: 220, color: "boss-wither"   },
  { key: "dragonKills",    label: "Ender Dragon",   emoji: "🐉", gold: 350, color: "boss-dragon"   },
];

function BossKillCards({ players }) {
  return (
    <div className="boss-cards">
      {BOSSES.map((boss) => {
        const sorted = [...players]
          .filter((p) => (p[boss.key] || 0) > 0)
          .sort((a, b) => (b[boss.key] || 0) - (a[boss.key] || 0));
        const top = sorted[0];
        const total = players.reduce((s, p) => s + (p[boss.key] || 0), 0);

        return (
          <div key={boss.key} className={`boss-card ${boss.color}`}>
            <div className="boss-emoji">{boss.emoji}</div>
            <div className="boss-name">{boss.label}</div>
            <div className="boss-reward">{boss.gold} gold purse</div>
            <div className="boss-divider" />
            <div className="boss-stat-label">Total Kills</div>
            <div className="boss-stat-value">{total}</div>
            <div className="boss-stat-label">Top Slayer</div>
            <div className="boss-top">
              {top
                ? <><span className="player">{top.playerName}</span><span className="boss-kills"> ×{top[boss.key]}</span></>
                : <span className="boss-none">None yet</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const COMMANDS = [
  {
    category: "Economy",
    entries: [
      { syntax: "/pay <player> <amount>",             desc: "Pay gold ingots to another player" },
      { syntax: "/pay <player> <amount> nugget",      desc: "Pay in raw nuggets" },
      { syntax: "/pay <player> <amount> ingot",       desc: "Pay in ingots (same as default)" },
      { syntax: "/pay <player> <amount> block",       desc: "Pay in gold blocks (×81 nuggets each)" },
      { syntax: "/request <player> <amount>",         desc: "Request gold from another player" },
      { syntax: "/requests received",                 desc: "View incoming requests with Accept / Decline buttons" },
      { syntax: "/requests sent",                     desc: "View your sent requests with a Cancel button" },
      { syntax: "/goldscore",                         desc: "Print the full gold leaderboard in chat" },
    ],
  },
  {
    category: "Purgatory",
    entries: [
      { syntax: "/pay death",                         desc: "Pay your death tax to exit ghost state and revive" },
    ],
  },
  {
    category: "Insurance — India Insures You",
    entries: [
      { syntax: "/insurance bronze",                  desc: "Subscribe to Bronze tier (35% death penalty, 0.5% daily cost)" },
      { syntax: "/insurance silver",                  desc: "Subscribe to Silver tier (20% death penalty, 1% daily cost)" },
      { syntax: "/insurance gold",                    desc: "Subscribe to Gold tier (8% death penalty, 2% daily cost)" },
      { syntax: "/insurance cancel",                  desc: "Cancel your policy at the end of the current billing cycle" },
      { syntax: "/insurance status",                  desc: "View your active tier, death penalty %, and next invoice" },
    ],
  },
  {
    category: "Bank & Market",
    entries: [
      { syntax: "/price",                             desc: "Check the current sell price of the item in your hand" },
    ],
  },
  {
    category: "General",
    entries: [
      { syntax: "/help",                              desc: "Show this command list in chat" },
    ],
  },
];

function CommandsTab() {
  return (
    <div className="commands-wrap">
      {COMMANDS.map((group) => (
        <section key={group.category} className="section">
          <h2>{group.category}</h2>
          <table>
            <thead>
              <tr>
                <th>Command</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {group.entries.map((e) => (
                <tr key={e.syntax}>
                  <td><code className="cmd-syntax">{e.syntax}</code></td>
                  <td className="cmd-desc">{e.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("fines");
  const [fines, setFines] = useState([]);
  const [summary, setSummary] = useState([]);
  const [players, setPlayers] = useState([]);
  const [insuranceCfg, setInsuranceCfg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = () => {
    Promise.all([
      fetch(`${API}/fines`).then((r) => r.json()),
      fetch(`${API}/fines/summary`).then((r) => r.json()),
      fetch(`${API}/players`).then((r) => r.json()),
      fetch(`${API}/insurance-config`).then((r) => r.json()),
    ])
      .then(([finesData, summaryData, playersData, cfgData]) => {
        setFines(finesData);
        setSummary(summaryData.sort((a, b) => b.total - a.total));
        setPlayers(playersData);
        setInsuranceCfg(cfgData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, []);

  const totalUnpaid = fines.filter((f) => !f.paid).reduce((s, f) => s + f.amount, 0);

  if (loading) return <div className="status">Loading...</div>;
  if (error) return <div className="status error">Error: {error}</div>;

  return (
    <div className="app">
      <header>
        <h1>Minecraft Admin Panel</h1>
        <p className="subtitle">Court of the Chicken Kingdom</p>
      </header>

      <div className="tabs">
        <button className={tab === "fines" ? "tab active" : "tab"} onClick={() => setTab("fines")}>
          Fines Registry
        </button>
        <button className={tab === "players" ? "tab active" : "tab"} onClick={() => setTab("players")}>
          Players
        </button>
        <button className={tab === "statistics" ? "tab active" : "tab"} onClick={() => setTab("statistics")}>
          Statistics
        </button>
        <button className={tab === "commands" ? "tab active" : "tab"} onClick={() => setTab("commands")}>
          Commands
        </button>
      </div>

      {tab === "fines" && (
        <>
          <section className="stats">
            <div className="stat-card">
              <span className="stat-value">{fines.length}</span>
              <span className="stat-label">Total Fines</span>
            </div>
            <div className="stat-card unpaid">
              <span className="stat-value">{totalUnpaid}</span>
              <span className="stat-label">Schmeckles Owed</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{fines.filter((f) => f.paid).length}</span>
              <span className="stat-label">Paid</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{fines.filter((f) => !f.paid).length}</span>
              <span className="stat-label">Unpaid</span>
            </div>
          </section>

          <section className="section">
            <h2>Player Totals</h2>
            <table>
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Total Owed</th>
                  <th>Offences</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((s) => (
                  <tr key={s._id}>
                    <td className="player">{s._id}</td>
                    <td>{s.total} schmeckles</td>
                    <td>{s.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="section">
            <h2>Fine Log</h2>
            <table>
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Reason</th>
                  <th>Amount</th>
                  <th>Paid</th>
                  <th>Collected</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {fines.map((f) => (
                  <tr key={f._id} className={f.paid ? "paid" : "unpaid"}>
                    <td className="player">{f.playerName}</td>
                    <td>{f.reason}</td>
                    <td>{f.amount} schmeckles</td>
                    <td>{f.paid ? "✅" : "❌"}</td>
                    <td>{f.collected ? "✅" : "❌"}</td>
                    <td>{new Date(f.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      {tab === "players" && (
        <>
          {insuranceCfg && (
            <section className="section">
              <h2>
                Insurance Inc&nbsp;
                <span className={insuranceCfg.insuranceEnabled ? "badge-on" : "badge-off"}>
                  {insuranceCfg.insuranceEnabled ? "ONLINE" : "OFFLINE"}
                </span>
              </h2>
              <div className="config-grid">
                <div className="config-card">
                  <span className="config-label">Base Death Penalty</span>
                  <span className="config-value">{Math.round(insuranceCfg.baseDeathPenalty * 100)}%</span>
                </div>
                {["bronze", "silver", "gold"].map((tier) => (
                  <div key={tier} className={`config-card tier-card-${tier}`}>
                    <span className="config-label">{tier.charAt(0).toUpperCase() + tier.slice(1)}</span>
                    <span className="config-value">{Math.round(insuranceCfg[tier].deathRate * 100)}% death</span>
                    <span className="config-sub">{insuranceCfg[tier].dailyCostRate * 100}% daily cost</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="section">
            <h2>Players</h2>
            <table>
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Gold</th>
                  <th>Tier</th>
                  <th>Death Penalty</th>
                  <th>Next Charge</th>
                  <th>Signed Up</th>
                  <th>Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p) => (
                  <tr key={p._id}>
                    <td className="player">{p.playerName}</td>
                    <td>{Math.round(p.gold || 0)}</td>
                    <td>
                      {p.insuranceTier ? (
                        <span className={`tier-badge tier-${p.insuranceTier}`}>
                          {p.insuranceTier.toUpperCase()}
                          {p.insurancePendingTier && (
                            <span className="pending-tier"> → {p.insurancePendingTier === "cancel" ? "cancel" : p.insurancePendingTier.toUpperCase()}</span>
                          )}
                        </span>
                      ) : "—"}
                    </td>
                    <td>{getEffectiveDeathPenalty(p, insuranceCfg)}</td>
                    <td className={getNextChargeDisplay(p) === "Overdue" ? "overdue" : ""}>{getNextChargeDisplay(p)}</td>
                    <td>{fmt(p.insuranceSignupTime)}</td>
                    <td>{fmt(p.lastSeen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
      {tab === "commands" && <CommandsTab />}

      {tab === "statistics" && (
        <>
        <BossKillCards players={players} />
        <section className="section">
          <h2>Player Statistics</h2>
          <div className="stats-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Active Gold</th>
                  <th>Deaths</th>
                  <th>Mob Kills</th>
                  <th>Boss Kills</th>
                  <th>PvP Kills (Purge)</th>
                  <th>Gold Received</th>
                  <th>Gold Spent</th>
                  <th>Total Transactions</th>
                </tr>
              </thead>
              <tbody>
                {[...players].sort((a, b) => (b.mobKills || 0) - (a.mobKills || 0)).map((p) => (
                  <tr key={p._id}>
                    <td className="player">{p.playerName}</td>
                    <td>{Math.round(p.gold || 0)}</td>
                    <td>{p.deaths || 0}</td>
                    <td>{p.mobKills || 0}</td>
                    <td>{p.bossesKilled || 0}</td>
                    <td className={(p.pvpKillsDuringPurge || 0) > 0 ? "stat-highlight" : ""}>{p.pvpKillsDuringPurge || 0}</td>
                    <td>{p.goldReceived || 0}</td>
                    <td>{p.goldSpent || 0}</td>
                    <td>{(p.transactionsSent || 0) + (p.transactionsReceived || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        </>
      )}
    </div>
  );
}
