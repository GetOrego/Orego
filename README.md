# OREGO

**A simulated investing platform for stocks, ETFs, and crypto — inspired by modern trading app UX.**

Orego is a client-side practice investing experience: browse a market, place simulated buy/sell orders, track a portfolio, and review transaction history — all running entirely in the browser with no backend server.

🔗 **Live site:** `https://getorego.github.io/Orego/`
🐦 **X (Twitter):** [@UseOrego](https://x.com/UseOrego)

> **Disclaimer:** Orego is an independent practice trading project. It is not a real brokerage, does not handle real money, and is not affiliated with, endorsed by, or connected to Robinhood Markets, Inc. or any licensed financial institution.

---

## ✨ Features

- **Market** — browse simulated stocks, ETFs, and crypto with search & filters
- **Trade** — buy/sell flow with live order summary and buying power checks
- **Portfolio** — holdings, average cost, and live gain/loss
- **Assets** — allocation breakdown by asset class (Stock / ETF / Crypto / Cash)
- **Transactions** — full history of simulated buy/sell orders
- **Dashboard** — account overview with recent activity
- **Settings** — reset simulated practice data at any time

All trading data (buying power, holdings, transaction history) is simulated and stored locally in the browser via `localStorage`. Stock/ETF and crypto **prices** are fetched live from real market data providers (see below); no real brokerage account or money is involved anywhere in the app.

### Live price data

- **Crypto** (BTC, ETH, BNB, SOL) — fetched live from the [CoinGecko](https://www.coingecko.com/en/api) public API, no key required.
- **Stocks & ETFs** (AAPL, MSFT, NVDA, TSLA, AMZN, VOO, QQQ, ARKK) — fetched live from [Twelve Data](https://twelvedata.com/) using a free-tier API key.

If either provider is unreachable (rate limit, offline, etc.), Orego falls back to the last known price so the app never breaks.

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
├── orego-settings.html        # Account settings / reset practice data
└── orego-engine.js            # Shared simulated trading engine (state, pricing, buy/sell logic)
```

Every page is a self-contained static HTML file styled consistently (dark theme, gold/green accents). `orego-engine.js` is the single shared module all trading pages depend on for state management.

---

## 🛠 Tech stack

- Plain HTML, CSS, and vanilla JavaScript — no build step, no framework
- `localStorage` for simulated account state
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

---

## 📄 License

This project is for practice/portfolio purposes.
