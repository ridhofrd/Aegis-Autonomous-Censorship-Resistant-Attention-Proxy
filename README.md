# Aegis Autonomous Information Proxy

Aegis is a decentralized information proxy and curated news dashboard built on the Stellar and Soroban network. In an era dominated by algorithmic bias, invasive tracking, and centralized media monopolies, Aegis restores power to the reader. 

Our mission is to provide an untracked, unbiased, and mathematically verifiable gateway to global information, while directly funding the independent publishers who maintain journalistic integrity.

## The Problem

Modern content consumption is broken:
- **Loss of Privacy:** Major aggregators track your reading habits, profiling you for targeted advertising.
- **Algorithmic Bias:** Centralized algorithms push polarizing content to maximize engagement.
- **Publisher Starvation:** Independent journalists struggle with predatory ad-revenue models and fragmented subscription systems.

## The Aegis Solution

Aegis solves this by operating as an autonomous intermediary between you and the world's information.

- **Absolute Anonymity:** Your reading habits never leave your local environment. The proxy fetches content on your behalf, ensuring publishers and aggregators cannot build profiles on your identity.
- **Core Integrity & Verifiability:** We utilize a decentralized Trust Registry on the Stellar network. Publishers stake capital to prove their authenticity. If a publisher is caught spreading verifiable spam or acting maliciously, the community can dispute and slash their stake.
- **Unbiased Control:** You determine how information is processed. By leveraging customizable analysis Personas, you dictate the perspective, length, and focus of the information you consume, completely bypassing external editorial bias.
- **Frictionless Micropayments:** Through the on-chain Attention Vault, you fund a secure smart contract with USDC. As you consume valuable content, the proxy automatically streams microscopic payments directly to verified independent publishers, bypassing traditional banking fees and paywalls.

## Key Features

### Custom Automation Jobs
Act as your own Editor-in-Chief. Create discrete background tasks mapping specific analytical Personas to specific data sources on a recurring schedule. Extract exactly the information you need, exactly when you need it.

### Personal Curation Dashboard
A unified, private environment where your customized intelligence reports are securely aggregated without exposing your IP or identity to external trackers.

### The Attention Vault Architecture
Aegis utilizes native Soroban smart contracts to handle the financial layer:
- **Attention Vault**: Users initialize a vault and deposit USDC. The proxy is authorized to stream micropayments directly to publishers up to a strict daily limit.
- **Trust Registry**: A permissionless registry where publishers stake tokens to become "Verified", creating economic incentives for high-quality, truthful reporting.

## Testnet Deployments

Aegis is actively running on the Stellar Testnet. The frontend automatically connects to these deployed smart contracts and mock assets:

- **Trust Registry Contract ID**: `CA5K5A5F2V6Y6A4Y3YDB2GQ2MTHBAF7WE3BGZKMD675C7MC6UCZY4YUN`
- **Mock USDC Token ID**: `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`
- **Agent Public Key**: `GA4POTHK3RFSDQN5CCY7CIKX2EZT3UTJZVE77JGQA5TQ642ZJ5NQKGGL`

*Ensure your Freighter Wallet is configured for "Testnet" and is funded via the Stellar Friendbot before interacting with the application.*

## Getting Started

### Prerequisites
- Node.js (v18+)
- Stellar CLI (for contract deployment)
- Freighter Wallet

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
5. Open http://localhost:3000 to access the proxy.

### Smart Contracts
The `contracts/` directory contains the Soroban Rust smart contracts. To build and test the contracts natively:
```bash
cd contracts/attention_vault
cargo test
```

## Tech Stack
- **Frontend**: Next.js (App Router), React, TailwindCSS
- **Backend/API**: Next.js API Routes, Prisma, SQLite, node-cron, rss-parser
- **Blockchain**: Stellar, Soroban, Rust, @stellar/freighter-api
