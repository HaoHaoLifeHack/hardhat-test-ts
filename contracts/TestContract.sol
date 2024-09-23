// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interface example
interface ICalculator {
    function add(uint256 a, uint256 b) external pure returns (uint256);
}

// Library example
library MathLib {
    function multiply(uint256 a, uint256 b) internal pure returns (uint256) {
        return a * b;
    }
}

// Base contract for ownership
contract Owned {
    address public owner;

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    constructor() {
        owner = msg.sender;
    }

    // Modifier for functions that can only be called by the owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    // Function to transfer ownership
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Invalid address: zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}

// Derived contract that includes multiple features
contract TestContract is Owned, ICalculator {
    using MathLib for uint256;

    // Enum for contract state
    enum State {
        Active,
        Inactive
    }

    // Struct for storing data
    struct Data {
        uint256 id;
        string info;
    }

    // Mappings for balances and data records
    mapping(address => uint256) public balances;
    mapping(uint256 => Data) public dataRecords;

    // Dynamic array to store data IDs
    uint256[] public dataIds;

    // Events for logging
    event Deposit(address indexed sender, uint256 amount);
    event DataAdded(uint256 indexed id, string info);

    // State variables
    uint256 private counter;
    State public state;

    // Constructor to initialize state
    constructor() {
        counter = 0;
        state = State.Active;
    }

    // External function implementing the interface
    function add(
        uint256 a,
        uint256 b
    ) external pure override returns (uint256) {
        return a + b;
    }

    // Public payable function to accept deposits
    function deposit() public payable {
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    // Public function to add data, restricted by a modifier
    function addData(string memory info) public onlyActive returns (uint256) {
        counter++;
        Data memory newData = Data({id: counter, info: info});
        dataRecords[counter] = newData;
        dataIds.push(counter);
        emit DataAdded(counter, info);
        return counter;
    }

    // Internal function using a library
    function _calculate(uint256 a, uint256 b) internal pure returns (uint256) {
        return a.multiply(b);
    }

    // Private function (example, not callable from other contracts)
    function _privateFunction() private pure returns (string memory) {
        return "This is a private function";
    }

    // Modifier to check if the contract is active
    modifier onlyActive() {
        require(state == State.Active, "Contract is not active");
        _;
    }

    // Fallback function to handle unknown function calls
    fallback() external payable {
        deposit();
    }

    // Receive function to handle plain Ether transfers
    receive() external payable {
        deposit();
    }

    // Function to interact with another contract via an interface
    function interactWithCalculator(
        address calculatorAddress,
        uint256 a,
        uint256 b
    ) public view returns (uint256) {
        ICalculator calculator = ICalculator(calculatorAddress);
        return calculator.add(a, b);
    }

    // Function demonstrating error handling and withdrawals
    function withdraw(uint256 amount) public {
        uint256 balance = balances[msg.sender];
        require(balance >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
    }

    // Overridden function with additional logic
    function transferOwnership(address newOwner) public override onlyOwner {
        // Additional custom logic can be added here
        super.transferOwnership(newOwner);
    }

    function setInactive() public onlyOwner {
        state = State.Inactive;
    }  

    function getContractState() public onlyOwner view returns (State) {
        return state;
    }
}
