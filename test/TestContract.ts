import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import {
  TestContract,
  MockCalculator,
  TestInternalFunction,
} from "../typechain-types"; // Replace with the actual path to your type-chain file

describe("TestContract", function () {
  let testContract: TestContract; // Assuming TestContract is the contract name
  let mockCalculator: MockCalculator; // Assuming MockCalculator is the contract name
  let testInternalFunction: TestInternalFunction; // Assuming TestInternalFunction is the contract name
  let owner: HardhatEthersSigner;
  let otherAccount: HardhatEthersSigner;
  let constantA: number;
  let constantB: number;
  let zeroAddress: string;
  let depositAmount: bigint;
  let initialEtherAmount: string;

  beforeEach(async () => {
    const {
      testContract: _testContract,
      mockCalculator: _mockCalculator,
      testInternalFunction: _testInternalFunction,
      owner: _owner,
      otherAccount: _otherAccount,
      constantA: _constantA,
      constantB: _constantB,
      zeroAddress: _zeroAddress,
      depositAmount: _depositAmount,
    } = await loadFixture(deployTestContractFixture);

    testContract = _testContract;
    mockCalculator = _mockCalculator;
    testInternalFunction = _testInternalFunction;
    owner = _owner;
    otherAccount = _otherAccount;
    constantA = _constantA;
    constantB = _constantB;
    zeroAddress = _zeroAddress;
    depositAmount = _depositAmount;
    initialEtherAmount = ethers.toBeHex(_depositAmount);
  });
  async function deployTestContractFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();
    const constantA = 2;
    const constantB = 3;
    const zeroAddress = "0x0000000000000000000000000000000000000000";
    const ONE_ETHER = ethers.parseEther("1");
    const TEN_MILLION_ETHER = ethers.parseEther("10000000");
    const depositAmount = ONE_ETHER;
    const initialEtherAmount = ethers.toBeHex(TEN_MILLION_ETHER);

    // Set the balance of the other account
    await network.provider.send("hardhat_setBalance", [
      otherAccount.address,
      initialEtherAmount.toString(),
    ]);

    const TestContract = await ethers.getContractFactory("TestContract");
    const testContract = await TestContract.deploy();
    const MockCalculator = await ethers.getContractFactory("MockCalculator");
    const mockCalculator = await MockCalculator.deploy();
    const TestInternalFunction = await ethers.getContractFactory(
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
      zeroAddress,
      depositAmount,
    };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async () => {
      expect(await testContract.owner()).to.equal(owner.address);
    });
  });

  describe("InteractWithCalculator", function () {
    it("Should add by the calculator interface", async function () {
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
  describe("Add by override function", function () {
    it("Should add by the calculator", async function () {
      // 記錄傳遞的參數
      console.log("Constant A:", constantA);
      console.log("Constant B:", constantB);
      const result = await testContract.add(constantA, constantB);
      // 記錄合約返回的結果
      console.log("Result from contract:", result.toString());
      expect(result).to.equal(constantA + constantB);
    });
  });

  describe("Deposit", function () {
    it("Should deposit", async function () {
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
    it("Should handle zero deposits", async () => {
      await expect(testContract.connect(otherAccount).deposit({ value: 0 }))
        .to.emit(testContract, "Deposit")
        .withArgs(otherAccount.address, 0);
    });
    it("Should handle large deposits", async () => {
      const largeAmount = ethers.parseEther("1000");

      await expect(
        testContract.connect(otherAccount).deposit({ value: largeAmount })
      )
        .to.emit(testContract, "Deposit")
        .withArgs(otherAccount.address, largeAmount);
    });
  });

  describe("AddData", () => {
    it("Should add data correctly", async () => {
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
    it("Should add empty info string correctly", async () => {
      // 1. 呼叫 addData with empty info，並確認事件是否被正確觸發
      const tx = await testContract.addData("");
      // 2. 確認事件 DataAdded 是否正確觸發，並使用事件參數確認 counter 的值
      await expect(tx).to.emit(testContract, "DataAdded").withArgs(1, ""); // 假設 counter 從 1 開始
      // larger integer in solidity will convert to BigInt in TS which 0n means 10 notation
      console.log("dataRecords:", await testContract.dataRecords(0));

      // 3. 確認資料是否正確地存儲
      const newData = await testContract.dataRecords(1);
      expect(newData.id).to.equal(1);
      expect(newData.info).to.equal("");

      // 檢查 dataIds 是否正確添加
      const dataId = await testContract.dataIds(0); // 第一筆資料的 ID
      expect(dataId).to.equal(1);
    });

    it("Should add large info string correctly", async () => {
      const longString = "abcdefghijklmnopqrstuvwxyz".repeat(40);
      console.log("longString:", longString);
      // 1. 呼叫 addData with empty info，並確認事件是否被正確觸發
      const tx = await testContract.addData(longString);
      // 2. 確認事件 DataAdded 是否正確觸發，並使用事件參數確認 counter 的值
      await expect(tx)
        .to.emit(testContract, "DataAdded")
        .withArgs(1, longString);

      // 3. 確認資料是否正確地存儲
      const newData = await testContract.dataRecords(1);
      console.log("newData:", newData);
      expect(newData.id).to.equal(1);
      expect(newData.info).to.equal(longString);

      // 檢查 dataIds 是否正確添加
      const dataId = await testContract.dataIds(0); // 第一筆資料的 ID
      expect(dataId).to.equal(1);
    });
  });

  describe("TestInternalFunction", function () {
    it("Should multiply by two constants", async () => {
      const result = await testInternalFunction.calculate(constantA, constantB);
      expect(result).to.equal(constantA * constantB);
    });
    it("Should call private function", async () => {
      const result = await testInternalFunction
        .connect(owner)
        .privateFunction();
      expect(result).to.equal("This is a private function");
    });
  });

  describe("FallbackAndReceive", function () {
    it("Should call fallback function when sending data", async () => {
      // 建一個沒有匹配到函數簽名的數據
      const data = "0x12345678";

      // 向合約發送交易，附帶數據
      const tx = await owner.sendTransaction({
        to: testContract.getAddress(),
        data,
      });
      await tx.wait();

      // 檢查狀態變量或事件，確認 fallbac 函數被執行
      const balance = await ethers.provider.getBalance(
        testContract.getAddress()
      );
      expect(balance).to.equal(ethers.parseEther("0"));
    });

    it("Should call receive function when sending Ether", async () => {
      // 向合約發送 Ether
      const tx = await owner.sendTransaction({
        to: testContract.getAddress(),
        value: ethers.parseEther("1"),
      });
      await tx.wait();

      // 檢查狀態變量或事件，確認 receive 函數被執行
      const balance = await ethers.provider.getBalance(
        testContract.getAddress()
      );
      expect(balance).to.equal(ethers.parseEther("1"));
    });
  });
  describe("Withdraw", function () {
    it("Should call withdraw function", async () => {
      const tx = await owner.sendTransaction({
        to: testContract.getAddress(),
        value: ethers.parseEther("1"),
      });
      await tx.wait();
      await testContract.withdraw(ethers.parseEther("1"));
      const balance = await ethers.provider.getBalance(
        testContract.getAddress()
      );
      expect(balance).to.equal(ethers.parseEther("0"));
    });
  });
  describe("TransferOwnership", function () {
    it("Should call transferOwnership function", async () => {
      await testContract.transferOwnership(otherAccount.address);
      expect(await testContract.owner()).to.equal(otherAccount.address);
    });
    it("Should handle invalid addresses in transferOwnership", async function () {
      await expect(
        testContract.transferOwnership(zeroAddress)
      ).to.be.revertedWith("Invalid address: zero address");
    });
  });
  describe("OnlyActive", function () {
    it("Should return the current state of the contract", async () => {
      const currentState = await testContract.getContractState();
      expect(currentState).to.equal(0); // Assuming State.Active is represented by 0
    });

    it("Should revert when calling functions when contract is inactive", async () => {
      await testContract.setInactive();
      await expect(testContract.addData("Test information")).to.be.revertedWith(
        "Contract is not active"
      );
    });

    it("Should revert when calling addData from a non-onlyActive function", async () => {
      // Create a helper function that doesn't have the onlyActive modifier
      const helperFunction = async () => {
        await testContract.addData("Test information");
      };

      // Set the contract to inactive
      await testContract.setInactive();

      // Call the helper function
      await expect(helperFunction()).to.be.revertedWith(
        "Contract is not active"
      );
    });
  });
});
