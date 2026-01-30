require("dotenv").config()
require("@nomicfoundation/hardhat-toolbox")

const privateKey = process.env.PRIVATE_KEY || ""

// Fork block selection:
// - If FORK_BLOCK_NUMBER is set, Hardhat will fork at that exact block (deterministic).
// - If not set, Hardhat will fork from the latest block at startup (freshest state).
const forkBlockNumber = process.env.FORK_BLOCK_NUMBER
  ? Number.parseInt(process.env.FORK_BLOCK_NUMBER, 10)
  : undefined
const hardhatForkingConfig = {
  url: `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
  ...(Number.isFinite(forkBlockNumber) ? { blockNumber: forkBlockNumber } : {}),
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.18",
  networks: {
    hardhat: {
      chainId: 31337,
      forking: {
        ...hardhatForkingConfig,
      },
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    arbitrum: {
      url: process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc",
      chainId: 42161,
      accounts: privateKey ? [privateKey] : [],
    }
  }
};
