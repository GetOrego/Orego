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

  return { getState, saveState, getAsset, buy, sell, portfolioValue, formatMoney, formatQty, timeAgo, setLoggedIn, isLoggedIn, seedState, fetchLiveCryptoPrices, getLivePricesFetchedAt };
})();
