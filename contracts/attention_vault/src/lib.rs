#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env};

#[contracttype]
pub enum DataKey {
    VaultOwner,               // The user who owns the vault
    AgentAddress,             // The AI Agent allowed to spend from this vault
    DailyLimit,               // The max amount the agent can spend per day
    DailySpent,               // Amount spent today
    TrustRegistryAddress,     // Address of the Trust Registry contract
    UsdcToken,                // Address of the USDC token contract
}

#[contract]
pub struct AttentionVaultContract;

#[contractimpl]
impl AttentionVaultContract {
    /// Initialize the vault with the owner, agent, limit, and external contract addresses
    pub fn init(
        env: Env, 
        owner: Address, 
        agent: Address, 
        daily_limit: i128, 
        trust_registry: Address,
        usdc_token: Address,
    ) {
        owner.require_auth();
        
        if env.storage().persistent().has(&DataKey::VaultOwner) {
            panic!("Already initialized");
        }

        env.storage().persistent().set(&DataKey::VaultOwner, &owner);
        env.storage().persistent().set(&DataKey::AgentAddress, &agent);
        env.storage().persistent().set(&DataKey::DailyLimit, &daily_limit);
        env.storage().persistent().set(&DataKey::DailySpent, &0_i128);
        env.storage().persistent().set(&DataKey::TrustRegistryAddress, &trust_registry);
        env.storage().persistent().set(&DataKey::UsdcToken, &usdc_token);
    }

    /// Deposit USDC into the vault from the owner's wallet
    pub fn deposit(env: Env, amount: i128) {
        let owner: Address = env.storage().persistent().get(&DataKey::VaultOwner).expect("Not initialized");
        owner.require_auth();
        
        if amount <= 0 {
            panic!("Deposit amount must be positive");
        }
        
        let usdc_token_addr: Address = env.storage().persistent().get(&DataKey::UsdcToken).unwrap();
        let token_client = token::Client::new(&env, &usdc_token_addr);
        
        // Transfer USDC from owner to this vault contract
        token_client.transfer(&owner, &env.current_contract_address(), &amount);
    }

    /// Agent calls this to pay a publisher. 
    pub fn pay_publisher(env: Env, publisher: Address, amount: i128) {
        let agent: Address = env.storage().persistent().get(&DataKey::AgentAddress).expect("Not initialized");
        agent.require_auth(); // Only the agent can execute this

        // 1. Check daily limit
        let daily_limit: i128 = env.storage().persistent().get(&DataKey::DailyLimit).unwrap();
        let mut daily_spent: i128 = env.storage().persistent().get(&DataKey::DailySpent).unwrap();
        
        if daily_spent + amount > daily_limit {
            panic!("Daily spending limit exceeded");
        }
        
        // 2. Verify Publisher in Trust Registry via cross-contract call
        let registry_addr: Address = env.storage().persistent().get(&DataKey::TrustRegistryAddress).unwrap();
        
        let is_trusted: bool = env.invoke_contract(
            &registry_addr,
            &soroban_sdk::Symbol::new(&env, "is_trusted"),
            soroban_sdk::vec![&env, publisher.to_val()],
        );
        
        if !is_trusted {
            panic!("Publisher is not trusted in the Registry");
        }
        
        // 3. Execute Payment: Transfer from Vault to Publisher
        let usdc_token_addr: Address = env.storage().persistent().get(&DataKey::UsdcToken).unwrap();
        let token_client = token::Client::new(&env, &usdc_token_addr);
        
        token_client.transfer(&env.current_contract_address(), &publisher, &amount);
        
        // 4. Update state
        daily_spent += amount;
        env.storage().persistent().set(&DataKey::DailySpent, &daily_spent);
    }
}

#[cfg(test)]
mod test;
