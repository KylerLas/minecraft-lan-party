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
    </div>
  );
}
