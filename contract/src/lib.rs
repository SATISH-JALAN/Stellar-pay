#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, vec,
    Address, Env, Vec, token,
};

/// Represents a single logged payment entry
#[contracttype]
#[derive(Clone, Debug)]
pub struct Payment {
    pub from: Address,
    pub to: Address,
    pub amount: i128,
    pub timestamp: u64,
    pub from_balance: i128, // on-chain balance of sender at time of logging (inter-contract call)
}

#[contracttype]
pub enum DataKey {
    PaymentCount,
    Payment(u32),
    NativeToken,
}

/// Event emitted when a payment is logged
#[contracttype]
#[derive(Clone, Debug)]
pub struct PaymentLoggedEvent {
    pub from: Address,
    pub amount: i128,
    pub count: u32,
}

const MAX_RECENT: u32 = 10;

// Stellar testnet native XLM token contract address (SAC)
// This is the Stellar Asset Contract for native XLM on testnet
const NATIVE_TOKEN_ID: &str = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

#[contract]
pub struct PaymentRegistry;

#[contractimpl]
impl PaymentRegistry {
    /// Log a payment on-chain.
    /// Makes an inter-contract call to the native XLM SAC to read the sender's balance.
    pub fn log_payment(env: Env, from: Address, to: Address, amount: i128) -> u32 {
        from.require_auth();

        // Inter-contract call: query sender's XLM balance from the Stellar Asset Contract
        let native_token_id = soroban_sdk::Address::from_str(&env, NATIVE_TOKEN_ID);
        let token_client = token::Client::new(&env, &native_token_id);
        let from_balance = token_client.balance(&from);

        let count: u32 = env
            .storage()
            .persistent()
            .get(&DataKey::PaymentCount)
            .unwrap_or(0);

        let payment = Payment {
            from: from.clone(),
            to,
            amount,
            timestamp: env.ledger().timestamp(),
            from_balance,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Payment(count), &payment);

        let new_count = count + 1;
        env.storage()
            .persistent()
            .set(&DataKey::PaymentCount, &new_count);

        // Emit event
        #[allow(deprecated)]
        env.events().publish(
            (symbol_short!("payment"),),
            PaymentLoggedEvent { from, amount, count: new_count },
        );

        new_count
    }

    /// Returns the total number of payments logged
    pub fn get_payment_count(env: Env) -> u32 {
        env.storage()
            .persistent()
            .get(&DataKey::PaymentCount)
            .unwrap_or(0)
    }

    /// Returns a specific payment by index (0-based)
    pub fn get_payment(env: Env, index: u32) -> Option<Payment> {
        env.storage()
            .persistent()
            .get(&DataKey::Payment(index))
    }

    /// Returns the most recent payments (up to 10)
    pub fn get_recent_payments(env: Env) -> Vec<Payment> {
        let count: u32 = env
            .storage()
            .persistent()
            .get(&DataKey::PaymentCount)
            .unwrap_or(0);

        let mut payments = vec![&env];
        let start = if count > MAX_RECENT { count - MAX_RECENT } else { 0 };

        for i in start..count {
            if let Some(p) = env.storage().persistent().get(&DataKey::Payment(i)) {
                payments.push_back(p);
            }
        }

        payments
    }

    /// Query a wallet's current XLM balance via inter-contract call to SAC
    pub fn get_wallet_balance(env: Env, wallet: Address) -> i128 {
        let native_token_id = soroban_sdk::Address::from_str(&env, NATIVE_TOKEN_ID);
        let token_client = token::Client::new(&env, &native_token_id);
        token_client.balance(&wallet)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env};

    #[test]
    fn test_payment_count_starts_at_zero() {
        let env = Env::default();
        let contract_id = env.register_contract(None, PaymentRegistry);
        let client = PaymentRegistryClient::new(&env, &contract_id);
        assert_eq!(client.get_payment_count(), 0);
    }

    #[test]
    fn test_get_nonexistent_payment_returns_none() {
        let env = Env::default();
        let contract_id = env.register_contract(None, PaymentRegistry);
        let client = PaymentRegistryClient::new(&env, &contract_id);
        assert!(client.get_payment(&99).is_none());
    }

    #[test]
    fn test_get_recent_payments_empty() {
        let env = Env::default();
        let contract_id = env.register_contract(None, PaymentRegistry);
        let client = PaymentRegistryClient::new(&env, &contract_id);
        let recent = client.get_recent_payments();
        assert_eq!(recent.len(), 0);
    }
}
