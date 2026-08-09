# OREGO

**A simulated investing platform for stocks, ETFs, and crypto — inspired by modern trading app UX.**

Orego is a client-side demo of a retail investing experience: browse a market, place simulated buy/sell orders, track a portfolio, and review transaction history — all running entirely in the browser with no backend server.

🔗 **Live demo:** `https://getorego.github.io/Orego/`
🐦 **X (Twitter):** [@GetOrego](https://x.com/GetOrego)

> **Disclaimer:** Orego is an independent demo/portfolio project. It is not a real brokerage, does not handle real money, and is not affiliated with, endorsed by, or connected to Robinhood Markets, Inc. or any licensed financial institution.

---

## ✨ Features

- **Market** — browse simulated stocks, ETFs, and crypto with search & filters
- **Trade** — buy/sell flow with live order summary and buying power checks
- **Portfolio** — holdings, average cost, and live gain/loss
- **Assets** — allocation breakdown by asset class (Stock / ETF / Crypto / Cash)
- **Transactions** — full history of simulated buy/sell orders
- **Dashboard** — account overview with recent activity
- **Wallet** — optional real Web3 integration: connect a browser wallet (e.g. MetaMask) and read live, read-only on-chain data (address, ETH balance, block height) from **Robinhood Chain** (Chain ID `4663`), Robinhood's public Layer-2 network. No funds can be moved through this app.
- **Settings** — reset simulated demo data at any time

All trading data (buying power, holdings, transaction history) is simulated and stored locally in the browser via `localStorage`. No real market data, brokerage account, or money is involved anywhere except the optional read-only Wallet page, which only *reads* public on-chain data and never signs or sends transactions.

---

## 🗂 File structure

```
├── index.html                 # Landing page
├── orego-signup.html          # Sign up
├── orego-login.html           # Log in
├── orego-refined.html         # Dashboard
├── orego-market.html          # Market / browse assets
├── orego-trade.html           # Buy/sell order screen
├── orego-portfolio.html       # Holdings & portfolio value
├── orego-assets.html          # Asset allocation breakdown
├── orego-transactions.html    # Transaction history
├── orego-wallet.html          # Real wallet connection (Robinhood Chain, read-only)
├── orego-settings.html        # Account settings / reset demo data
└── orego-engine.js            # Shared simulated trading engine (state, pricing, buy/sell logic)
```

Every page is a self-contained static HTML file styled consistently (dark theme, gold/green accents). `orego-engine.js` is the single shared module all trading pages depend on for state management.

---

## 🛠 Tech stack

- Plain HTML, CSS, and vanilla JavaScript — no build step, no framework
- `localStorage` for simulated account state
- [ethers.js](https://docs.ethers.org/) (via CDN) for the optional Wallet page's on-chain reads
- Fonts: Space Grotesk, Inter, IBM Plex Mono (Google Fonts)

---

## 🚀 Running locally

No build tools required — it's static HTML.

1. Clone or download this repository
2. Open `index.html` directly in a browser, **or** serve the folder with any static file server:
   ```bash
   npx serve .
   ```

## 📦 Deploying (GitHub Pages)

1. Push this repository to GitHub
2. Go to **Settings → Pages**
3. Set **Branch** to `main`, folder to `/ (root)`
4. Save — your site will be live at `https://<username>.github.io/<repo>/`

---

## ⚠️ Notes on the Wallet page

The **Wallet** page connects to the real, public **Robinhood Chain** network using officially published parameters:

| Property | Value |
|---|---|
| Network name | Robinhood Chain |
| Chain ID | 4663 |
| RPC URL | `https://rpc.mainnet.chain.robinhood.com` |
| Currency | ETH |
| Block explorer | `robinhoodchain.blockscout.com` |

This feature is strictly **read-only**: it can display your connected address, ETH balance, and the chain's latest block number, but it has no ability to send transactions, sign anything beyond a connection request, or move funds in any way.

---

## 📄 License

This project is for demo/portfolio purposes.
