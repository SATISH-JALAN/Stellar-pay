#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, vec, Address, Env, Vec,
};

/// Represents a single logged payment entry
#[contracttype]
#[derive(Clone, Debug)]
pub struct Payment {
    pub from: Address,
    pub to: Address,
    pub amount: i128,
    pub timestamp: u64,
}

/// Storage keys
#[contracttype]
pub enum DataKey {
    PaymentCount,
    Payment(u32),
}

const MAX_RECENT: u32 = 10;

#[contract]
pub struct PaymentRegistry;

#[contractimpl]
impl PaymentRegistry {
    /// Log a payment on-chain.
    /// Called automatically when a payment is sent through the frontend.
    pub fn log_payment(env: Env, from: Address, to: Address, amount: i128) -> u32 {
        // Require the sender to authorize this call
        from.require_auth();

        // Get current count
        let count: u32 = env
            .storage()
            .persistent()
            .get(&DataKey::PaymentCount)
            .unwrap_or(0);

        let payment = Payment {
            from,
            to,
            amount,
            timestamp: env.ledger().timestamp(),
        };

        // Store the payment
        env.storage()
            .persistent()
            .set(&DataKey::Payment(count), &payment);

        // Increment count
        let new_count = count + 1;
        env.storage()
            .persistent()
            .set(&DataKey::PaymentCount, &new_count);

        // Emit event
        env.events().publish(
            (symbol_short!("payment"), symbol_short!("logged")),
            new_count,
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
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env};

    #[test]
    fn test_log_and_count() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, PaymentRegistry);
        let client = PaymentRegistryClient::new(&env, &contract_id);

        let from = Address::generate(&env);
        let to = Address::generate(&env);

        assert_eq!(client.get_payment_count(), 0);

        client.log_payment(&from, &to, &1_000_000);
        assert_eq!(client.get_payment_count(), 1);

        client.log_payment(&from, &to, &2_000_000);
        assert_eq!(client.get_payment_count(), 2);
    }

    #[test]
    fn test_get_payment() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, PaymentRegistry);
        let client = PaymentRegistryClient::new(&env, &contract_id);

        let from = Address::generate(&env);
        let to = Address::generate(&env);

        client.log_payment(&from, &to, &5_000_000);

        let payment = client.get_payment(&0).unwrap();
        assert_eq!(payment.amount, 5_000_000);
        assert_eq!(payment.from, from);
        assert_eq!(payment.to, to);
    }

    #[test]
    fn test_get_recent_payments() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, PaymentRegistry);
        let client = PaymentRegistryClient::new(&env, &contract_id);

        let from = Address::generate(&env);
        let to = Address::generate(&env);

        for i in 1..=5_i128 {
            client.log_payment(&from, &to, &(i * 1_000_000));
        }

        let recent = client.get_recent_payments();
        assert_eq!(recent.len(), 5);
    }

    #[test]
    fn test_nonexistent_payment_returns_none() {
        let env = Env::default();
        let contract_id = env.register_contract(None, PaymentRegistry);
        let client = PaymentRegistryClient::new(&env, &contract_id);

        assert!(client.get_payment(&99).is_none());
    }
}
