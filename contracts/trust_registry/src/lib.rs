#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, BytesN};

#[contracttype]
pub enum DataKey {
    Trusted(Address), // Maps a publisher's address to a boolean indicating trust
    Stake(Address),   // Maps a publisher's address to their staked USDC amount
}

#[contract]
pub struct TrustRegistryContract;

#[contractimpl]
impl TrustRegistryContract {

    /// Registers a publisher via ZK-Proof (Zero Trust Architecture)
    /// In a production environment, this would verify a Reclaim Protocol ZK-proof.
    /// For the MVP hackathon scope, we mock the verification.
    pub fn submit_zk_proof(env: Env, publisher: Address, _proof_bytes: BytesN<32>) {
        publisher.require_auth();
        
        // MVP MOCK: We assume the proof_bytes are valid and verified here.
        // If valid, we immediately grant the publisher "High Trust" status.
        env.storage().persistent().set(&DataKey::Trusted(publisher.clone()), &true);
    }

    /// Secondary Mechanism: Staking USDC for Independent Publishers
    /// A publisher stakes USDC to gain trust if they don't have institutional credentials.
    pub fn stake(env: Env, publisher: Address, amount: i128) {
        publisher.require_auth();
        
        // Ensure the stake is a positive amount
        if amount <= 0 {
            panic!("Stake amount must be positive");
        }

        // In a full implementation, we would transfer USDC from the publisher 
        // to this contract using the soroban_sdk::token::Client.
        // For MVP, we simply record the stake in state.

        let mut current_stake: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Stake(publisher.clone()))
            .unwrap_or(0);
            
        current_stake += amount;
        env.storage().persistent().set(&DataKey::Stake(publisher.clone()), &current_stake);
        
        // Assuming a minimum stake of 100 USDC to get Trusted status
        if current_stake >= 100_0000000 { // 100 USDC (7 decimals)
            env.storage().persistent().set(&DataKey::Trusted(publisher.clone()), &true);
        }
    }

    /// Admin function to slash a publisher for posting fake news
    pub fn slash(env: Env, admin: Address, publisher: Address, amount: i128) {
        admin.require_auth();
        // MVP MOCK: In reality, we'd ensure 'admin' is a decentralized jury or owner.
        
        let mut current_stake: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Stake(publisher.clone()))
            .unwrap_or(0);
            
        if amount > current_stake {
            current_stake = 0;
        } else {
            current_stake -= amount;
        }
        
        env.storage().persistent().set(&DataKey::Stake(publisher.clone()), &current_stake);
        
        // Revoke trust if stake falls below minimum threshold
        if current_stake < 100_0000000 {
            env.storage().persistent().set(&DataKey::Trusted(publisher.clone()), &false);
        }
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
