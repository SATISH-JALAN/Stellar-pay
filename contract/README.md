# Payment Registry - Soroban Smart Contract

A Soroban smart contract deployed on Stellar testnet that logs and tracks XLM payments made through the Stellar Pay frontend.

## Deployed Contract

- **Contract ID:** `CBVJZXZVMIFJNZMD63BIJWMLXJQD4M42ZZCE2QIIZ5S5D5ITDAB4QUID`
- **Network:** Stellar Testnet
- **Deploy TX:** `268c3c108c719dc0c06c8f71c7d774fbbfe415fd3cba47ff664ea530c6b8cff3`
- **Explorer:** [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CBVJZXZVMIFJNZMD63BIJWMLXJQD4M42ZZCE2QIIZ5S5D5ITDAB4QUID)

## Contract Functions

| Function                        | Description                                        |
| ------------------------------- | -------------------------------------------------- |
| `log_payment(from, to, amount)` | Logs a payment on-chain, requires auth from sender |
| `get_payment_count()`           | Returns total number of logged payments            |
| `get_payment(index)`            | Returns a specific payment by index                |
| `get_recent_payments()`         | Returns the last 10 payments                       |

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install)
- [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools/cli/install-cli)

```bash
# Install Rust wasm target
rustup target add wasm32-unknown-unknown

# Install Stellar CLI
cargo install --locked stellar-cli --features opt
```

## Build

```bash
cd contract
stellar contract build
```

Output: `target/wasm32-unknown-unknown/release/payment_registry.wasm`

## Test

```bash
cd contract
cargo test
```

## Deploy to Testnet

```bash
# 1. Generate a keypair (if you don't have one)
stellar keys generate --global deployer --network testnet

# 2. Fund it via Friendbot
stellar keys fund deployer --network testnet

# 3. Deploy the contract
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/payment_registry.wasm \
  --source deployer \
  --network testnet

# 4. Invoke a function (example)
stellar contract invoke \
  --id CBVJZXZVMIFJNZMD63BIJWMLXJQD4M42ZZCE2QIIZ5S5D5ITDAB4QUID \
  --source deployer \
  --network testnet \
  -- get_payment_count
```

## Frontend Integration

The contract is called from `client/src/utils/soroban.ts`:

- `prepareLogPaymentTx()` - builds and simulates the `log_payment` transaction
- `getPaymentCount()` - reads the current payment count via simulation
