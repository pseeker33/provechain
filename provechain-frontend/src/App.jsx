import { useState } from 'react';
import axios from 'axios';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import './App.css';

ChartJS.register(ArcElement, Tooltip, Legend);

function App() {
  const [wallet, setWallet] = useState('');
  const [result, setResult] = useState(null);

  const fetchScore = async () => {
    const response = await axios.get(`http://localhost:3000/wallet/${wallet}`);
    setResult(response.data);
  };

  const chartData = {
    labels: ['Score', 'Restante'],
    datasets: [{ data: result ? [result.score, 100 - result.score] : [0, 100], backgroundColor: ['#007bff', '#e0e0e0'] }],
  };

  return (
    <div className="App">
      <h1>ProveChain - Reputation Score</h1>
      <input value={wallet} onChange={(e) => setWallet(e.target.value)} placeholder="Ingresa una wallet" />
      <button onClick={fetchScore}>Calcular Score</button>
      {result && result.score !== undefined && (
        <div>
          <h2>Score: {result.score}/100</h2>
          <div style={{ maxWidth: '300px', margin: '0 auto' }}>
            <Doughnut data={chartData} />
          </div>
          <p>Transacciones: {result.txCount}</p>
          <p>Días Activo: {result.daysActive}</p>
          <p>Balance: {result.balance} ETH</p>
        </div>
      )}
    </div>
  );
}

export default App;