const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const app = express();

app.use(express.json());
dotenv.config();

const CARV_API_KEY = process.env.CARV_API_KEY;
const BASE_URL = 'https://interface.carv.io/ai-agent-backend';

async function getWalletData(walletAddress) {
  try {
    const query = `
      SELECT 
        COUNT(*) AS total_transactions,
        MIN(block_timestamp) AS earliest_tx,
        SUM(CASE WHEN from_address = '${walletAddress}' THEN -value ELSE value END) AS net_balance
      FROM eth.transactions 
      WHERE (from_address = '${walletAddress}' OR to_address = '${walletAddress}')
      AND date_parse(date, '%Y-%m-%d') >= date_add('day', -30, current_date)
    `;
    
    const response = await axios.post(`${BASE_URL}/sql_query`, 
      { sql_content: query },
      { headers: { 'Authorization': CARV_API_KEY, 'Content-Type': 'application/json' } }
    );

    console.log('Respuesta de la API:', JSON.stringify(response.data, null, 2));

    const data = response.data.data.rows[0]?.items || [];
    if (!data.length) {
      console.log('No se encontraron datos en rows');
      return null;
    }

    const txCount = data[0] ? parseInt(data[0]) : 0;
    const daysActive = data[1] 
      ? Math.floor((Date.now() - new Date(data[1]).getTime()) / (1000 * 60 * 60 * 24)) 
      : 0;
    const balance = data[2] ? parseFloat(data[2]) / 1e18 : 0;

    return { txCount, daysActive, balance };
  } catch (error) {
    console.error('Error al obtener datos:', error.message);
    if (error.response) {
      console.error('Detalles del error de la API:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

function calculateReputationScore(data) {
  if (!data) return 0;
  const { txCount, daysActive, balance } = data;
  const daysScore = Math.min(daysActive / 3650, 1) * 40;
  const txScore = Math.min(txCount / 1000, 1) * 30;
  const balanceScore = Math.min(balance / 100, 1) * 30;
  return Math.min(Math.round(daysScore + txScore + balanceScore), 100);
}

app.get('/wallet/:address', async (req, res) => {
  const data = await getWalletData(req.params.address);
  if (data) {
    const score = calculateReputationScore(data);
    res.json({ ...data, score });
  } else {
    res.json({ error: 'No se pudieron obtener datos' });
  }
});

app.listen(3000, () => console.log('Servidor en puerto 3000'));