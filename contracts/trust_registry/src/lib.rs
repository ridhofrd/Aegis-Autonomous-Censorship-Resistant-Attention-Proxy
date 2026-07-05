#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, token, Address, BytesN, Env, Bytes};

#[contracttype]
pub enum DataKey {
    Trusted(Address),      // Maps a publisher's address to a boolean indicating trust
    Stake(Address),        // Maps a publisher's address to their staked USDC amount
    UsdcToken,             // Address of the USDC token contract
    OraclePubKey,          // The ED25519 public key of the trusted Oracle (e.g., Reclaim)
}

#[contract]
pub struct TrustRegistryContract;

#[contractimpl]
impl TrustRegistryContract {
    /// Initialize the Trust Registry with the USDC token address and the trusted Oracle's public key
    pub fn init(env: Env, usdc_token: Address, oracle_pub_key: BytesN<32>) {
        // Prevent double-initialization
        if env.storage().persistent().has(&DataKey::UsdcToken) {
            panic!("Already initialized");
        }
        env.storage().persistent().set(&DataKey::UsdcToken, &usdc_token);
        env.storage().persistent().set(&DataKey::OraclePubKey, &oracle_pub_key);
    }

    /// Registers a publisher via ZK-Proof by verifying a cryptographic signature from the Oracle.
    /// The `payload` represents the data the oracle verified (e.g., domain ownership).
    pub fn submit_zk_proof(env: Env, publisher: Address, payload: Bytes, signature: BytesN<64>) {
        publisher.require_auth();
        
        let oracle_pub_key: BytesN<32> = env
            .storage()
            .persistent()
            .get(&DataKey::OraclePubKey)
            .expect("Oracle public key not configured");

        // Verify that the trusted Oracle actually signed this payload
        // If the signature is invalid, this will panic and revert the transaction.
        env.crypto().ed25519_verify(&oracle_pub_key, &payload, &signature);

        // If verification succeeds, we grant the publisher "Trusted" status
        env.storage().persistent().set(&DataKey::Trusted(publisher.clone()), &true);
    }

    /// Secondary Mechanism: Staking USDC for Independent Publishers
    pub fn stake(env: Env, publisher: Address, amount: i128) {
        publisher.require_auth();
        
        if amount <= 0 {
            panic!("Stake amount must be positive");
        }

        let usdc_token_addr: Address = env
            .storage()
            .persistent()
            .get(&DataKey::UsdcToken)
            .expect("USDC token not configured");

        // Transfer USDC from the publisher to this contract
        let token_client = token::Client::new(&env, &usdc_token_addr);
        token_client.transfer(&publisher, &env.current_contract_address(), &amount);

        // Update stake record
        let mut current_stake: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Stake(publisher.clone()))
            .unwrap_or(0);
            
        current_stake += amount;
        env.storage().persistent().set(&DataKey::Stake(publisher.clone()), &current_stake);
        
        // 100 USDC (7 decimals) minimum stake to get Trusted status
        if current_stake >= 100_0000000 { 
            env.storage().persistent().set(&DataKey::Trusted(publisher.clone()), &true);
        }
    }

    /// Admin function to slash a publisher for posting fake news
    pub fn slash(env: Env, admin: Address, publisher: Address, amount: i128) {
        admin.require_auth();
        // In reality, ensure 'admin' is a decentralized jury. For MVP, anyone can slash (MOCK).
        
        let mut current_stake: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Stake(publisher.clone()))
            .unwrap_or(0);
            
        let actual_slash = if amount > current_stake { current_stake } else { amount };
        current_stake -= actual_slash;
        
        env.storage().persistent().set(&DataKey::Stake(publisher.clone()), &current_stake);
        
        // If they drop below minimum stake, revoke trust
        if current_stake < 100_0000000 {
            env.storage().persistent().set(&DataKey::Trusted(publisher.clone()), &false);
        }

        // We burn or transfer the slashed amount to a treasury.
        // For MVP, we'll just leave it in the contract but unassigned, or burn it.
        let usdc_token_addr: Address = env.storage().persistent().get(&DataKey::UsdcToken).unwrap();
        let token_client = token::Client::new(&env, &usdc_token_addr);
        token_client.burn(&env.current_contract_address(), &actual_slash);
    }

    /// Read-only function for the Aegis Agent to check if a publisher is trusted
    pub fn is_trusted(env: Env, publisher: Address) -> bool {
        env.storage()
            .persistent()
            .get(&DataKey::Trusted(publisher))
            .unwrap_or(false)
    }
}

#[cfg(test)]
mod test;
