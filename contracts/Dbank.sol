// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DBank {
    mapping(address => uint) public balances;
    mapping(address => uint) public depositTimestamps;

    event Deposit(address indexed user, uint amount, uint timestamp);
    event Withdraw(address indexed user, uint amount, uint timestamp);

    function deposit() public payable {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        
        balances[msg.sender] += msg.value;
        depositTimestamps[msg.sender] = block.timestamp;
        
        emit Deposit(msg.sender, msg.value, block.timestamp);
    }

    function withdraw() public {
        require(balances[msg.sender] > 0, "Insufficient balance");

        uint amount = balances[msg.sender];
        uint depositTime = depositTimestamps[msg.sender];
        uint interest = calculateInterest(amount, depositTime);
        
        uint totalAmount = amount + interest;
        
        balances[msg.sender] = 0;
        payable(msg.sender).transfer(totalAmount);
        
        emit Withdraw(msg.sender, totalAmount, block.timestamp);
    }

    function calculateInterest(uint amount, uint depositTime) private view returns(uint) {
        uint timeElapsed = block.timestamp - depositTime;
        return amount * 10 / 100 * timeElapsed / 365 days;
    }

    function getBalance() public view returns(uint) {
        return balances[msg.sender];
    }
}