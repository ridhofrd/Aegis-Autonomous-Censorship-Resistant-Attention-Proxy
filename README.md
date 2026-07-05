# Aegis Autonomous Information Proxy

Aegis is a decentralized, AI-powered information proxy and curated news dashboard built on the Stellar/Soroban network. It empowers users to take control of their information diet, cut through media bias using customizable AI Personas, and directly fund high-quality, verified independent publishers via an on-chain "Attention Vault."

## 🌟 Key Features

### 1. AI-Powered Personal Curator
The core of Aegis is its intelligent curation engine. Users can subscribe to trusted independent publishers or any standard RSS feed and have the proxy actively scrape, merge, and summarize the content.

### 2. Customizable AI Personas
Don't just read the news—analyze it through different lenses. Users can create distinct "Personas" (e.g., *Standard Investigator*, *Privacy Advocate*, *On-Chain Verifier*) equipped with custom instructions. These Personas power both the interactive **AI Chat** and the automated news curation to highlight exactly what matters to you.

### 3. Native Cron Automations
Act as an Editor-in-Chief. Create multiple distinct "Jobs" mapping specific Personas to specific feeds on a recurring schedule. 
- Example: Schedule a *Morning Crypto Brief* using your *On-Chain Verifier* persona to summarize *CoinDesk* and *Bankless* every day at 7:00 AM.
- *Powered by an embedded SQLite database and a local node-cron worker.*

### 4. The Attention Vault (Soroban Smart Contracts)
Say goodbye to paywalls and generic subscription models. Aegis utilizes native Soroban smart contracts:
- **Attention Vault**: Users initialize a vault and deposit USDC. The Aegis proxy streams micropayments directly to publishers based on the content you consume and find valuable.
- **Trust Registry**: Publishers stake tokens to become "Verified." If they publish spam or malicious content, the community can dispute them, slashing their stake to maintain a high-quality ecosystem.

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v18+)
- [Stellar CLI](https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup) (for contract deployment)
- [Freighter Wallet](https://www.freighter.app/) (configured for Stellar Testnet)

### Running the Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. In a separate terminal, start the Automation Cron Worker:
   ```bash
   npm run dev:cron
   ```
5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Smart Contracts
The `contracts/` directory contains the Soroban Rust smart contracts.
- `attention_vault`: Handles user deposits and authorized micropayments.
- `trust_registry`: Handles publisher staking and slashing/disputes.

To build and test the contracts:
```bash
cd contracts/attention_vault
cargo test
```

## 🛠 Tech Stack
- **Frontend**: Next.js (App Router), React, TailwindCSS
- **Backend/API**: Next.js API Routes, Prisma, SQLite, node-cron, rss-parser
- **Blockchain**: Stellar, Soroban, Rust, @stellar/freighter-api
