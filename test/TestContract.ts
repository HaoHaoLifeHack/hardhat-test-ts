import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("TestContract", function () {
  async function deployTestContractFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.ethers.getSigners();
    const constantA = 2;
    const constantB = 3;
    const ONE_ETHER = hre.ethers.parseEther("1");
    const depositAmount = ONE_ETHER;
    const TestContract = await hre.ethers.getContractFactory("TestContract");
    const testContract = await TestContract.deploy();
    const MockCalculator = await hre.ethers.getContractFactory(
      "MockCalculator"
    );
    const mockCalculator = await MockCalculator.deploy();
    const TestInternalFunction = await hre.ethers.getContractFactory(
      "TestInternalFunction"
    );
    const testInternalFunction = await TestInternalFunction.deploy();

    return {
      testContract,
      mockCalculator,
      testInternalFunction,
      owner,
      otherAccount,
      constantA,
      constantB,
      depositAmount,
    };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async () => {
      const { testContract, owner } = await loadFixture(
        deployTestContractFixture
      );

      expect(await testContract.owner()).to.equal(owner.address);
    });
  });

  describe("Interactions", function () {
    it("Should allow owner to change ownership", async () => {
      const { testContract, owner, otherAccount } = await loadFixture(
        deployTestContractFixture
      );

      await testContract.transferOwnership(otherAccount.address);
      expect(await testContract.owner()).to.equal(otherAccount.address);
    });
  });

  describe("Calculator", function () {
    it("Should add by the calculator", async function () {
      const { testContract, mockCalculator, constantA, constantB } =
        await loadFixture(deployTestContractFixture);
      // 記錄傳遞的參數
      console.log("Constant A:", constantA);
      console.log("Constant B:", constantB);
      const result = await testContract.interactWithCalculator(
        mockCalculator.getAddress(),
        constantA,
        constantB
      );
      // 記錄合約返回的結果
      console.log("Result from contract:", result.toString());
      expect(result).to.equal(constantA + constantB);
    });
  });

  describe("Deposit", function () {
    it("Should deposit", async function () {
      const { testContract, otherAccount, depositAmount } = await loadFixture(
        deployTestContractFixture
      );
      // otherAccount 進行 ETH 存入，並檢查是否觸發 Deposit 事件
      await expect(
        testContract.connect(otherAccount).deposit({ value: depositAmount })
      )
        .to.emit(testContract, "Deposit")
        .withArgs(otherAccount.address, depositAmount); // 檢查事件參數是否正確

      expect(await testContract.balances(otherAccount.address)).to.equal(
        depositAmount
      );
    });
  });

  describe("Test addData function with private counter", () => {
    it("Should add data correctly", async () => {
      const { testContract, owner } = await loadFixture(
        deployTestContractFixture
      );

      // 1. 呼叫 addData，並確認事件是否被正確觸發
      const tx = await testContract.addData("Test information");

      // 2. 確認事件 DataAdded 是否正確觸發，並使用事件參數確認 counter 的值
      await expect(tx)
        .to.emit(testContract, "DataAdded")
        .withArgs(1, "Test information"); // 假設 counter 從 1 開始

      // 3. 確認資料是否正確地存儲
      const newData = await testContract.dataRecords(1);
      expect(newData.id).to.equal(1);
      expect(newData.info).to.equal("Test information");

      // 檢查 dataIds 是否正確添加
      const dataId = await testContract.dataIds(0); // 第一筆資料的 ID
      expect(dataId).to.equal(1);
    });
  });

  describe("TestInternalFunction", function () {
    it("Should multiply by two constants", async () => {
      const { testInternalFunction, constantA, constantB } = await loadFixture(
        deployTestContractFixture
      );
      const result = await testInternalFunction.calculate(constantA, constantB);
      expect(result).to.equal(constantA * constantB);
    });
    it("Should call private function", async () => {
      const { testInternalFunction, owner } = await loadFixture(
        deployTestContractFixture
      );
      const result = await testInternalFunction
        .connect(owner)
        .privateFunction();
      expect(result).to.equal("This is a private function");
    });
  });

  describe("FallbackAndReceive", function () {
    it("Should call fallback function when sending data", async () => {
      const { testContract, owner } = await loadFixture(
        deployTestContractFixture
      );
      // 建一個沒有匹配到函數簽名的數據
      const data = "0x12345678";

      // 向合約發送交易，附帶數據
      const tx = await owner.sendTransaction({
        to: testContract.getAddress(),
        data,
      });
      await tx.wait();

      // 檢查狀態變量或事件，確認 fallbac 函數被執行
      const balance = await hre.ethers.provider.getBalance(
        testContract.getAddress()
      );
      expect(balance).to.equal(hre.ethers.parseEther("0"));
    });

    it("Should call receive function when sending Ether", async () => {
      const { testContract, owner } = await loadFixture(
        deployTestContractFixture
      );
      // 向合約發送 Ether
      const tx = await owner.sendTransaction({
        to: testContract.getAddress(),
        value: hre.ethers.parseEther("1"),
      });
      await tx.wait();

      // 檢查狀態變量或事件，確認 receive 函數被執行
      const balance = await hre.ethers.provider.getBalance(
        testContract.getAddress()
      );
      expect(balance).to.equal(hre.ethers.parseEther("1"));
    });
  });
  describe("Withdraw", function () {
    it("Should call withdraw function", async () => {
      const { testContract, owner } = await loadFixture(
        deployTestContractFixture
      );
      const tx = await owner.sendTransaction({
        to: testContract.getAddress(),
        value: hre.ethers.parseEther("1"),
      });
      await tx.wait();
      await testContract.withdraw(hre.ethers.parseEther("1"));
      const balance = await hre.ethers.provider.getBalance(
        testContract.getAddress()
      );
      expect(balance).to.equal(hre.ethers.parseEther("0"));
    });
  });
  describe("TransferOwnership", function () {
    it("Should call transferOwnership function", async () => {
      const { testContract, owner, otherAccount } = await loadFixture(
        deployTestContractFixture
      );
      await testContract.transferOwnership(otherAccount.address);
      expect(await testContract.owner()).to.equal(otherAccount.address);
    });
  });
  describe("OnlyActive", function () {
    it("Should revert when calling functions when contract is inactive", async () => {
      const { testContract, owner } = await loadFixture(
        deployTestContractFixture
      );
      await testContract.setInactive();
      console.log("State: ", await testContract.getContractState());
      await expect(testContract.addData("Test information")).to.be.revertedWith(
        "Contract is not active"
      );
    });
  });
});
