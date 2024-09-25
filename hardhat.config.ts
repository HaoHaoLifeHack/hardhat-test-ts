import { config as dotenvConfig } from "dotenv";
import "@nomicfoundation/hardhat-toolbox";
import "solidity-coverage";
import "@nomicfoundation/hardhat-foundry";

dotenvConfig({ path: "./.env" });

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.SEPOLIA_ALCHEMY_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY],
    },
    hardhat: {
      forking: {
        url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.SEPOLIA_ALCHEMY_API_KEY}`,
        blockNumber: 6000000,
      },
    },
  },
  etherscan: {
    apiKey: `https://eth-sepolia.g.alchemy.com/v2/${process.env.SEPOLIA_ALCHEMY_API_KEY}`,
  },
  coverage: {
    // 在這裡添加要忽略的合約
    exclude: [
      "contracts/Lock.sol", // 替換為您要忽略的合約路徑
      "contracts/mockCalculator.sol",
    ],
  },
};

export default config;
