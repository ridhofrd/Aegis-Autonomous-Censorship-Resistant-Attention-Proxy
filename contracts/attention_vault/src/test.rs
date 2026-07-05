#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

#[test]
#[should_panic(expected = "Daily spending limit exceeded")]
fn test_spending_limit() {
    let env = Env::default();
    env.mock_all_auths();

    let vault_id = env.register_contract(None, AttentionVaultContract);
    let vault_client = AttentionVaultContractClient::new(&env, &vault_id);

    let owner = Address::generate(&env);
    let agent = Address::generate(&env);
    let trust_registry = Address::generate(&env); // Using a dummy address, will panic if called but we want to test limit first

    // 10 USDC daily limit
    vault_client.init(&owner, &agent, &10_0000000, &trust_registry);

    let publisher = Address::generate(&env);

    // This should panic because 15 > 10 (We just mock the first limit check)
    // The contract logic checks limits before doing cross-contract calls
    vault_client.pay_publisher(&publisher, &15_0000000);
}
