import { useEffect, useState } from "react";
import "./App.css";

const API = "/api";

export default function App() {
  const [fines, setFines] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = () => {
    Promise.all([
      fetch(`${API}/fines`).then((r) => r.json()),
      fetch(`${API}/fines/summary`).then((r) => r.json()),
    ])
      .then(([finesData, summaryData]) => {
        setFines(finesData);
        setSummary(summaryData.sort((a, b) => b.total - a.total));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalUnpaid = fines
    .filter((f) => !f.paid)
    .reduce((sum, f) => sum + f.amount, 0);

  if (loading) return <div className="status">Loading fines...</div>;
  if (error) return <div className="status error">Error: {error}</div>;

  return (
    <div className="app">
      <header>
        <h1>Minecraft Fines Registry</h1>
        <p className="subtitle">Court of the Chicken Kingdom</p>
      </header>

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
    </div>
  );
}
