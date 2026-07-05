#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, BytesN};

#[test]
fn test_staking_and_slashing() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, TrustRegistryContract);
    let client = TrustRegistryContractClient::new(&env, &contract_id);

    let publisher = Address::generate(&env);
    let admin = Address::generate(&env);

    // Initial state: publisher is not trusted
    assert_eq!(client.is_trusted(&publisher), false);

    // Stake 50 USDC (assuming 7 decimals, so 50_0000000)
    client.stake(&publisher, &50_0000000);
    assert_eq!(client.is_trusted(&publisher), false); // Still not trusted, below 100

    // Stake another 50 USDC
    client.stake(&publisher, &50_0000000);
    assert_eq!(client.is_trusted(&publisher), true); // Now trusted (100 total)

    // Slash 20 USDC
    client.slash(&admin, &publisher, &20_0000000);
    assert_eq!(client.is_trusted(&publisher), false); // Trust revoked (down to 80)
}

#[test]
fn test_zk_proof_submission() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, TrustRegistryContract);
    let client = TrustRegistryContractClient::new(&env, &contract_id);

    let publisher = Address::generate(&env);
    let mock_proof = BytesN::from_array(&env, &[0; 32]);

    assert_eq!(client.is_trusted(&publisher), false);

    // Submit ZK proof
    client.submit_zk_proof(&publisher, &mock_proof);

    // Should immediately be trusted
    assert_eq!(client.is_trusted(&publisher), true);
}
