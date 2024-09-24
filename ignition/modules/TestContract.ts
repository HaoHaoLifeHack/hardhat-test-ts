const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const TestContractModule = buildModule("TestContractModule", (m) => {
  const testContract = m.contract("TestContract");

  return { testContract };
});

module.exports = TestContractModule;
