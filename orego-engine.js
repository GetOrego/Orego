/* Orego — Simulated Trading Engine
   Everything here is fake: no real money, no real market data.
   State lives in localStorage under 'orego_state'. */

const OREGO_ASSETS = [
  { symbol:'AAPL', name:'Apple Inc.',        class:'Stock',  price:224.80, change:1.24 },
  { symbol:'MSFT', name:'Microsoft Corp.',   class:'Stock',  price:441.15, change:0.62 },
  { symbol:'NVDA', name:'NVIDIA Corp.',      class:'Stock',  price:132.40, change:3.15 },
  { symbol:'TSLA', name:'Tesla Inc.',        class:'Stock',  price:256.90, change:-2.08 },
  { symbol:'AMZN', name:'Amazon.com Inc.',   class:'Stock',  price:198.35, change:0.91 },
  { symbol:'VOO',  name:'Vanguard S&P 500',  class:'ETF',    price:512.60, change:0.44 },
  { symbol:'QQQ',  name:'Invesco QQQ Trust', class:'ETF',    price:486.20, change:0.78 },
  { symbol:'ARKK', name:'ARK Innovation ETF',class:'ETF',    price:52.10,  change:-1.35 },
  { symbol:'BTC',  name:'Bitcoin',           class:'Crypto', price:61840.00, change:2.42 },
  { symbol:'ETH',  name:'Ethereum',          class:'Crypto', price:3120.55,  change:-0.87 },
  { symbol:'BNB',  name:'BNB',               class:'Crypto', price:588.20,   change:1.05 },
  { symbol:'SOL',  name:'Solana',            class:'Crypto', price:142.75,   change:4.60 },
];

const OregoEngine = (() => {
  const KEY = 'orego_state';

  // Maps our symbols to CoinGecko's coin IDs
  const COINGECKO_IDS = { BTC:'bitcoin', ETH:'ethereum', BNB:'binancecoin', SOL:'solana' };
  let livePricesFetchedAt = null;

  const TWELVE_DATA_API_KEY = '6db44d5044004c658fdc96af4e08f757';
  const STOCK_SYMBOLS = ['AAPL','MSFT','NVDA','TSLA','AMZN','VOO','QQQ','ARKK'];
  let liveStockPricesFetchedAt = null;

  async function fetchLiveStockPrices(){
    try{
      const symbols = STOCK_SYMBOLS.join(',');
      const url = `https://api.twelvedata.com/quote?symbol=${symbols}&apikey=${TWELVE_DATA_API_KEY}`;
      const res = await fetch(url);
      if(!res.ok) throw new Error('Twelve Data request failed: ' + res.status);
      const data = await res.json();

      // Twelve Data returns a single object when one symbol matches, or an object keyed by symbol for multiple
      STOCK_SYMBOLS.forEach(sym=>{
        const info = data[sym];
        if(!info || info.status === 'error' || !info.close) return;
        const asset = getAsset(sym);
        if(asset){
          asset.price = parseFloat(info.close);
          asset.change = parseFloat(info.percent_change || 0);
        }
      });
      liveStockPricesFetchedAt = Date.now();
      return { ok:true, at: liveStockPricesFetchedAt };
    }catch(e){
      return { ok:false, reason: e.message };
    }
  }

  function getLiveStockPricesFetchedAt(){ return liveStockPricesFetchedAt; }

  // Fetch real historical price series for a symbol. range: '1D' | '7D' | '1M'
  // Returns an array of { time, price } in chronological order, or null on failure.
  async function fetchHistoricalPrices(symbol, range){
    range = range || '7D';
    try{
      if(COINGECKO_IDS[symbol]){
        const daysMap = { '1D':1, '7D':7, '1M':30 };
        const days = daysMap[range] || 7;
        const id = COINGECKO_IDS[symbol];
        const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}`;
        const res = await fetch(url);
        if(!res.ok) throw new Error('CoinGecko history failed: ' + res.status);
        const data = await res.json();
        if(!data.prices || !data.prices.length) throw new Error('No price history returned');
        return data.prices.map(([t, p]) => ({ time: t, price: p }));
      }

      if(STOCK_SYMBOLS.includes(symbol)){
        const paramsMap = {
          '1D': { interval:'15min', outputsize:26 },
          '7D': { interval:'1h', outputsize:49 },
          '1M': { interval:'1day', outputsize:30 },
        };
        const p = paramsMap[range] || paramsMap['7D'];
        const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${p.interval}&outputsize=${p.outputsize}&apikey=${TWELVE_DATA_API_KEY}`;
        const res = await fetch(url);
        if(!res.ok) throw new Error('Twelve Data history failed: ' + res.status);
        const data = await res.json();
        if(data.status === 'error' || !data.values || !data.values.length) throw new Error(data.message || 'No price history returned');
        return data.values.slice().reverse().map(v => ({ time: new Date(v.datetime).getTime(), price: parseFloat(v.close) }));
      }

      return null;
    }catch(e){
      return null;
    }
  }

  async function fetchLiveCryptoPrices(){
    try{
      const ids = Object.values(COINGECKO_IDS).join(',');
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
      const res = await fetch(url);
      if(!res.ok) throw new Error('CoinGecko request failed: ' + res.status);
      const data = await res.json();

      Object.entries(COINGECKO_IDS).forEach(([symbol, geckoId])=>{
        const info = data[geckoId];
        if(!info) return;
        const asset = getAsset(symbol);
        if(asset){
          asset.price = info.usd;
          asset.change = info.usd_24h_change || 0;
        }
      });
      livePricesFetchedAt = Date.now();
      return { ok:true, at: livePricesFetchedAt };
    }catch(e){
      return { ok:false, reason: e.message };
    }
  }

  function getLivePricesFetchedAt(){ return livePricesFetchedAt; }

  function seedState(){
    return {
      buyingPower: 24500,
      holdings: {
        AAPL: { qty: 40,  avgCost: 205.10 },
        BTC:  { qty: 1.2, avgCost: 58200 },
        ETH:  { qty: 6,   avgCost: 3050 },
        VOO:  { qty: 25,  avgCost: 495.00 },
      },
      transactions: [
        { symbol:'BTC',  side:'buy',  qty:1.2, price:58200,  time:Date.now()-1000*60*60*20 },
        { symbol:'ETH',  side:'sell', qty:0.5, price:3180,   time:Date.now()-1000*60*60*28 },
        { symbol:'AAPL', side:'buy',  qty:10,  price:212.40, time:Date.now()-1000*60*60*44 },
        { symbol:'VOO',  side:'buy',  qty:25,  price:495.00, time:Date.now()-1000*60*60*70 },
      ],
    };
  }

  function getState(){
    try{
      const raw = localStorage.getItem(KEY);
      if(!raw) throw new Error('no state');
      return JSON.parse(raw);
    }catch(e){
      const fresh = seedState();
      localStorage.setItem(KEY, JSON.stringify(fresh));
      return fresh;
    }
  }

  function saveState(state){
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function getAsset(symbol){
    return OREGO_ASSETS.find(a => a.symbol === symbol.toUpperCase());
  }

  function setLoggedIn(){
    localStorage.setItem('orego_logged_in', '1');
    getState(); // ensure seeded
  }

  function isLoggedIn(){
    return localStorage.getItem('orego_logged_in') === '1';
  }

  function buy(symbol, qty){
    const asset = getAsset(symbol);
    if(!asset || qty <= 0) return { ok:false, reason:'Invalid order.' };
    const cost = asset.price * qty;
    const state = getState();
    if(cost > state.buyingPower) return { ok:false, reason:'Not enough buying power.' };

    state.buyingPower -= cost;
    const h = state.holdings[symbol] || { qty:0, avgCost:0 };
    const newQty = h.qty + qty;
    h.avgCost = ((h.avgCost * h.qty) + cost) / newQty;
    h.qty = newQty;
    state.holdings[symbol] = h;
    state.transactions.unshift({ symbol, side:'buy', qty, price:asset.price, time:Date.now() });
    saveState(state);
    return { ok:true, state };
  }

  function sell(symbol, qty){
    const asset = getAsset(symbol);
    const state = getState();
    const h = state.holdings[symbol];
    if(!asset || qty <= 0) return { ok:false, reason:'Invalid order.' };
    if(!h || qty > h.qty) return { ok:false, reason:'Not enough shares/coins to sell.' };

    const proceeds = asset.price * qty;
    h.qty -= qty;
    if(h.qty <= 0.00001) delete state.holdings[symbol];
    state.buyingPower += proceeds;
    state.transactions.unshift({ symbol, side:'sell', qty, price:asset.price, time:Date.now() });
    saveState(state);
    return { ok:true, state };
  }

  function portfolioValue(state){
    state = state || getState();
    let total = state.buyingPower;
    for(const sym in state.holdings){
      const asset = getAsset(sym);
      if(asset) total += asset.price * state.holdings[sym].qty;
    }
    return total;
  }

  function formatMoney(n){
    const sign = n < 0 ? '-' : '';
    return sign + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
  }

  function formatQty(n){
    return n % 1 === 0 ? String(n) : n.toFixed(4).replace(/0+$/,'').replace(/\.$/,'');
  }

  function timeAgo(ts){
    const mins = Math.floor((Date.now() - ts) / 60000);
    if(mins < 1) return 'Just now';
    if(mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins/60);
    if(hrs < 24) return hrs + 'h ago';
    const days = Math.floor(hrs/24);
    return days + 'd ago';
  }

  // Reads live public network data from Robinhood Chain via its public RPC endpoint.
  // No wallet connection required — this is a plain read-only JSON-RPC call.
  async function fetchChainNetworkStatus(){
    const RPC_URL = 'https://rpc.mainnet.chain.robinhood.com';
    const rpcCall = (method) => fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc:'2.0', method, params:[], id:1 }),
    }).then(r => r.json());

    try{
      const [blockRes, gasRes, chainRes] = await Promise.all([
        rpcCall('eth_blockNumber'),
        rpcCall('eth_gasPrice'),
        rpcCall('eth_chainId'),
      ]);
      const blockNumber = parseInt(blockRes.result, 16);
      const gasPriceGwei = parseInt(gasRes.result, 16) / 1e9;
      const chainId = parseInt(chainRes.result, 16);
      if(isNaN(blockNumber) || isNaN(chainId)) throw new Error('Malformed RPC response');
      return { ok:true, blockNumber, gasPriceGwei, chainId };
    }catch(e){
      return { ok:false, reason: e.message };
    }
  }

  return { getState, saveState, getAsset, buy, sell, portfolioValue, formatMoney, formatQty, timeAgo, setLoggedIn, isLoggedIn, seedState, fetchLiveCryptoPrices, getLivePricesFetchedAt, fetchLiveStockPrices, getLiveStockPricesFetchedAt, fetchHistoricalPrices, fetchChainNetworkStatus };
})();
