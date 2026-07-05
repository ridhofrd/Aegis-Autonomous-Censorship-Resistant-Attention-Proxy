"use client";

import { useState } from "react";
import Link from "next/link";
import { isAllowed, setAllowed, requestAccess, signTransaction } from "@stellar/freighter-api";
import { useTheme } from "@/components/ThemeProvider";
import { Keypair } from "@stellar/stellar-sdk";
import { Client as TrustRegistry, networks } from "trust_registry";

// Hardcoded Mock Oracle Credentials (DO NOT USE IN PRODUCTION)
// We use this to simulate the Reclaim Protocol zkTLS Oracle signing the verification
const MOCK_ORACLE_SECRET = "SCH7RAX3ATSJAMQKI4J3IWJG5PWVL2YGUREKIYVX3L36NDLLBBPPKDJ6";

export default function PublisherDashboard() {
  const { theme, toggleTheme } = useTheme();
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isTrusted, setIsTrusted] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [staking, setStaking] = useState(false);

  const fetchTrustStatus = async (address: string) => {
    try {
      const trustRegistry = new TrustRegistry({
        networkPassphrase: networks.testnet.networkPassphrase,
        contractId: networks.testnet.contractId,
        rpcUrl: "https://soroban-testnet.stellar.org",
        publicKey: address,
      });
      // Simulate is_trusted read
      const tx = await trustRegistry.is_trusted({ publisher: address });
      setIsTrusted(tx.result === true);
    } catch (e) {
      console.log("Not trusted yet or error reading state", e);
    }
  };

  const connectWallet = async () => {
    try {
      let allowed = await isAllowed();
      if (!allowed) {
        await setAllowed();
        allowed = await isAllowed();
      }
      if (allowed) {
        const { address, error } = await requestAccess();
        if (address) {
          setPublicKey(address);
          await fetchTrustStatus(address);
        }
        else if (error) console.error(error);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to connect Freighter wallet");
    }
  };

  const handleStake = async () => {
    if (!publicKey) return alert("Please connect your wallet first!");
    setStaking(true);
    try {
      const trustRegistry = new TrustRegistry({
        networkPassphrase: networks.testnet.networkPassphrase,
        contractId: networks.testnet.contractId,
        rpcUrl: "https://soroban-testnet.stellar.org",
        publicKey: publicKey,
      });

      // 100 USDC (7 decimal places in Soroban standard)
      const stakeAmount = BigInt(100_0000000); 
      
      const tx = await trustRegistry.stake({
        publisher: publicKey,
        amount: stakeAmount,
      });

      const result = await tx.signAndSend({
        signTransaction: async (xdr: string) => {
          return await signTransaction(xdr, { networkPassphrase: "Test SDF Network ; September 2015" });
        }
      });

      console.log("Staking Success:", result);
      setIsTrusted(true);
      alert("Successfully staked 100 USDC and gained trusted status!");
    } catch (e) {
      console.error(e);
      alert("Failed to stake USDC. Make sure you have enough testnet balance.");
    } finally {
      setStaking(false);
    }
  };

  const verifyEmailAndSubmitProof = async () => {
    if (!publicKey) return alert("Please connect your wallet first!");
    if (!email) return alert("Please enter an institutional email.");

    // 1. Validate Domain
    const validDomains = ["@nytimes.com", "@reuters.com", "@bloomberg.com", "@wsj.com"];
    const isCredible = validDomains.some(domain => email.endsWith(domain));
    if (!isCredible) {
      return alert("Unrecognized institutional domain. Please use a valid credible email.");
    }

    setLoading(true);
    try {
      // 2. Hash the email to create the Zero-Knowledge Payload
      const encoder = new TextEncoder();
      const data = encoder.encode(email);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const payload = Buffer.from(hashBuffer);

      // 3. Mock Oracle signs the payload
      const oracleKeypair = Keypair.fromSecret(MOCK_ORACLE_SECRET);
      const signature = oracleKeypair.sign(payload); // 64-byte Ed25519 signature

      // 4. Submit Proof to Smart Contract
      const trustRegistry = new TrustRegistry({
        networkPassphrase: networks.testnet.networkPassphrase,
        contractId: networks.testnet.contractId,
        rpcUrl: "https://soroban-testnet.stellar.org",
        publicKey: publicKey,
      });

      // Build the transaction
      const tx = await trustRegistry.submit_zk_proof({
        publisher: publicKey,
        payload: payload,
        signature: signature,
      });

      // 5. User signs the transaction via Freighter
      const result = await tx.signAndSend({
        signTransaction: async (xdr: string) => {
          return await signTransaction(xdr, { networkPassphrase: "Test SDF Network ; September 2015" });
        }
      });

      console.log("Transaction Success:", result);
      setIsTrusted(true);
      alert("Successfully verified institutional credentials on-chain!");

    } catch (error) {
      console.error(error);
      alert("Failed to verify credentials or submit transaction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center">
      <nav className="w-full max-w-5xl mx-auto p-6 flex justify-between items-center border-b border-[var(--card-border)] mb-12">
        <Link href="/">
          <div className="text-xl font-bold tracking-tight text-[var(--primary)] flex items-center gap-2 cursor-pointer">
            <div className="w-6 h-6 rounded bg-[var(--primary)] text-white flex items-center justify-center text-xs">A</div>
            Aegis Publisher
          </div>
        </Link>
        <div className="flex gap-3">
          <button onClick={toggleTheme} className="btn-secondary">
            {theme === "light" ? "Dark" : "Light"}
          </button>
          {!publicKey ? (
            <button onClick={connectWallet} className="btn-primary">Connect Wallet</button>
          ) : (
            <div className="btn-secondary font-mono text-xs flex items-center">
              {publicKey.substring(0, 5)}...{publicKey.substring(publicKey.length - 4)}
            </div>
          )}
        </div>
      </nav>

      <main className="w-full max-w-3xl px-6 pb-20">
        <h1 className="text-2xl font-bold mb-6">Publisher Portal</h1>

        <div className="clean-card p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">Trust Registry Status</h2>
            <p className="text-sm text-[var(--text-secondary)] max-w-md">
              Unverified publishers cannot receive USDC micropayments. Prove your credibility to join the registry.
            </p>
          </div>
          <div>
            {isTrusted ? (
              <span className="badge-success">Verified Publisher</span>
            ) : (
              <span className="badge-warning">Unverified</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Staking Card */}
          <div className={`clean-card p-6 border-[var(--primary)] shadow-sm ${isTrusted ? "opacity-50 pointer-events-none" : ""}`}>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-base font-semibold text-[var(--primary)]">Economic Staking</h2>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-6">Lock 100 USDC in the smart contract to gain instant trust via slashable stake. (Alternative to ZK Proof).</p>
            <button 
              onClick={handleStake} 
              className="btn-secondary w-full border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white"
              disabled={staking || isTrusted}
            >
              {staking ? "Staking on-chain..." : "Stake 100 USDC"}
            </button>
          </div>

          {/* ZK Proof Card */}
          <div className={`clean-card p-6 border-[var(--primary)] shadow-sm ${isTrusted ? "opacity-50 pointer-events-none" : ""}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-semibold text-[var(--primary)]">ZK-Proof Oracle (Mock)</h2>
              <span className="badge-success !bg-[var(--primary)] !text-white text-[10px] px-2 py-0.5">Recommended</span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Enter your institutional email. We will hash it and sign it locally to simulate an Oracle ZK verification.
            </p>

            <input
              type="email"
              placeholder="journalist@nytimes.com"
              className="w-full p-2 mb-4 bg-transparent border border-[var(--card-border)] rounded text-sm text-[var(--text-color)] outline-none focus:border-[var(--primary)]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isTrusted}
            />

            <button
              onClick={verifyEmailAndSubmitProof}
              className="btn-primary w-full"
              disabled={loading || isTrusted}
            >
              {loading ? "Verifying..." : "Verify Institutional Email"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
