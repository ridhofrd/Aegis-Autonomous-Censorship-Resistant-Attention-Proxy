#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::{Address as _, BytesN as _}, Address, Bytes, BytesN, Env, token};

#[test]
#[should_panic]
fn test_invalid_signature_panics() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, TrustRegistryContract);
    let client = TrustRegistryContractClient::new(&env, &contract_id);

    let usdc_token = Address::generate(&env);
    let oracle_pub_key = BytesN::random(&env);

    client.init(&usdc_token, &oracle_pub_key);

    let publisher = Address::generate(&env);
    let payload = Bytes::new(&env);
    // Invalid signature (all zeros) will fail cryptographic verification
    let mut sig_arr = [0u8; 64];
    let signature = BytesN::from_array(&env, &sig_arr);

    client.submit_zk_proof(&publisher, &payload, &signature);
}

#[test]
fn test_staking() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, TrustRegistryContract);
    let client = TrustRegistryContractClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    
    // Fallback registration that works across multiple SDK versions
    let usdc_token = env.register_stellar_asset_contract_v2(token_admin.clone()).address();
    
    let token_admin_client = token::StellarAssetClient::new(&env, &usdc_token);
    let token_client = token::Client::new(&env, &usdc_token);

    let oracle_pub_key = BytesN::random(&env);
    client.init(&usdc_token, &oracle_pub_key);

    let publisher = Address::generate(&env);
    
    // Mint 200 USDC to publisher
    token_admin_client.mint(&publisher, &200_0000000);
    assert_eq!(token_client.balance(&publisher), 200_0000000);

    // Stake 100 USDC
    client.stake(&publisher, &100_0000000);

    // Verify publisher balance dropped
    assert_eq!(token_client.balance(&publisher), 100_0000000);
    
    // Verify contract received USDC
    assert_eq!(token_client.balance(&contract_id), 100_0000000);

    // Verify Trusted status
    assert_eq!(client.is_trusted(&publisher), true);
}
