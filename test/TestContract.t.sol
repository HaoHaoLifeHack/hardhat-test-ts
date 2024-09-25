// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import {TestContract} from "../contracts/TestContract.sol";
import {MockCalculator} from "../contracts/MockCalculator.sol";
import {TestInternalFunction} from "../contracts/TestInternalFunction.sol";

//import "../src/TestContract.sol";

contract TestContractTest is Test {
    // Signers for testing accounts
    address owner;
    address otherAccount;

    TestContract testContract;
    MockCalculator mockCalculator;
    TestInternalFunction testInternalFunction;

    // Constants used in tests
    uint256 constantA = 2;
    uint256 constantB = 3;
    string constant zeroAddress = "0x0000000000000000000000000000000000000000";
    uint256 depositAmount = 1 ether;
    uint256 initialEtherAmount = 10_000_000 ether; // 10 million ETH in string format

    // Events for logging
    event Deposit(address indexed sender, uint256 amount);
    event DataAdded(uint256 indexed id, string info);
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    function setUp() public {
        // Get signers for testing accounts
        owner = makeAddr("owner");
        otherAccount = makeAddr("otherAccount");

        // Set up the initial balance of the other account
        vm.deal(otherAccount, initialEtherAmount);

        // Deploy the contracts
        vm.prank(owner);
        testContract = new TestContract();
        mockCalculator = new MockCalculator();
        testInternalFunction = new TestInternalFunction();
    }

    function testDeployment_setsOwnerCorrectly() public view {
        assertEq(testContract.owner(), owner);
    }

    function testInteractWithCalculator_addsByCalculatorInterface()
        public
        view
    {
        // Log constants for clarity
        console.log("Constant A:", constantA);
        console.log("Constant B:", constantB);

        uint256 result = testContract.interactWithCalculator(
            address(mockCalculator),
            constantA,
            constantB
        );

        assertEq(result, constantA + constantB);
    }

    function testAdd_addsByCalculator() public view {
        // Log constants for clarity
        console.log("Constant A:", constantA);
        console.log("Constant B:", constantB);

        uint256 result = testContract.add(constantA, constantB);

        assertEq(result, constantA + constantB);
    }

    function testDeposit_handlesDeposits() public {
        // 設置預期的事件, // 1, 2, 3 是有建立的indexed的索引參數的期望值，
        // 當有設置indexed方便進行事件過濾; 4. 事件的data即那些沒有標記為 indexed 的參數
        // vm.expectEmit(true, true, false, true);
        // emit PropertyRegistered(0, propertyOwner, address(ret)); // 使用具體的期望值

        // Deposit from otherAccount and check Deposit event
        vm.expectEmit(true, false, false, false);
        emit Deposit(otherAccount, depositAmount);
        vm.prank(otherAccount);
        testContract.deposit{value: depositAmount}();

        assertEq(testContract.balances(otherAccount), depositAmount);

        // Test zero deposit
        vm.expectEmit(true, false, false, false);
        emit Deposit(otherAccount, 0);
        vm.prank(otherAccount);
        testContract.deposit{value: 0}();
        // // Test large deposit
        // uint256 largeAmount = 1000 ether;
        // vm.expectEmit(true, false, false, false);
        // vm.prank(otherAccount);
        // testContract.deposit{value: largeAmount}();
    }

    function testAddData() public {
        // test normal data add
        string memory data = "Test data";
        vm.expectEmit(true, false, false, false);
        emit DataAdded(1, data);
        testContract.addData(data);

        (uint256 id, string memory info) = testContract.dataRecords(1);
        assertEq(id, 1);
        assertEq(info, data);

        // test empty string
        vm.expectEmit(true, false, false, false);
        emit DataAdded(2, "");
        testContract.addData("");

        // test long string
        bytes memory concatenatedBytes = abi.encodePacked("abc", "def", "ghi");
        string memory longString = string(concatenatedBytes);

        vm.expectEmit(true, false, false, false);
        emit DataAdded(3, longString);
        testContract.addData(longString);
    }

    function testWithdraw() public {
        // deposit in testContract
        vm.prank(otherAccount);
        testContract.deposit{value: depositAmount}();

        // test normal withdraw
        uint256 amount = 1 ether;
        vm.prank(address(otherAccount));
        testContract.withdraw(amount);
        assertEq(testContract.balances(address(otherAccount)), 0);
    }

    function testTransferOwnership() public {
        // test normal transfer
        address newOwner = makeAddr("newOwner");
        vm.prank(owner);
        testContract.transferOwnership(newOwner);
        assertEq(testContract.owner(), newOwner);
    }

    function testTransferOwnershipToNonOwner() public {
        vm.expectRevert("Invalid address: zero address");
        vm.prank(owner);
        testContract.transferOwnership(address(0));
    }

    function testOnlyActiveModifier() public {
        // test Inactive
        vm.prank(owner);
        testContract.setInactive();
        vm.expectRevert("Contract is not active");
        testContract.addData("test");
    }

    function testCalculate() public view {
        uint256 result = testInternalFunction.calculate(5, 5);
        assertEq(result, 25);
    }

    function testPrivate() public view {
        string memory result = testInternalFunction.privateFunction();
        assertEq(result, "This is a private function");
    }
}
