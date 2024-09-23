import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "solidity-coverage";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  coverage: {
    // 在這裡添加要忽略的合約
    exclude: [
      "contracts/Lock.sol", // 替換為您要忽略的合約路徑
      "contracts/mockCalculator.sol",
    ],
  },
};

export default config;
