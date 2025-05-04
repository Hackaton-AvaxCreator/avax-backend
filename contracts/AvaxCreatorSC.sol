// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract AvalCreator is Ownable, ReentrancyGuard {
    // Platform settings
    uint256 public platformFeePercentage = 1; // 1%
    address public platformWallet;
    
    // Structs
    struct PaymentRecord {  // Renombrado de Payment a PaymentRecord
        address from;
        address to;
        uint256 amount;
        string contentId;
        uint256 timestamp;
        bool verified;
    }
    
    struct ContentOwnership {
        address owner;
        uint256 price;
        bool isForSale;
        uint256 lastSaleTimestamp;
    }
    
    // Mappings
    mapping(string => PaymentRecord) public payments;  // Actualizado el tipo
    mapping(string => ContentOwnership) public contentOwnership;
    mapping(address => uint256) public userBalances;
    mapping(string => address) public contentCreators;
    
    // Events
    event Payment(
        address indexed from, 
        address indexed to, 
        uint256 amount, 
        string contentId, 
        uint256 timestamp
    );
    
    event ContentPurchased(
        address indexed buyer, 
        address indexed creator, 
        string contentId, 
        uint256 price, 
        uint256 timestamp
    );
    
    event Donation(
        address indexed from, 
        address indexed to, 
        uint256 amount, 
        string message, 
        uint256 timestamp
    );
    
    event ContentRegistered(
        string contentId, 
        address indexed creator, 
        uint256 price, 
        uint256 timestamp
    );
    
    event OwnershipTransferred(
        string contentId, 
        address indexed from, 
        address indexed to, 
        uint256 timestamp
    );
    
    constructor() Ownable(msg.sender) {
        platformWallet = msg.sender;
    }
    
    // Register new content
    function registerContent(string memory contentId, uint256 price) external {
        require(contentCreators[contentId] == address(0), "Content already registered");
        
        contentCreators[contentId] = msg.sender;
        contentOwnership[contentId] = ContentOwnership({
            owner: msg.sender,
            price: price,
            isForSale: true,
            lastSaleTimestamp: block.timestamp
        });
        
        emit ContentRegistered(contentId, msg.sender, price, block.timestamp);
    }
    
    // Purchase content
    function purchaseContent(string memory contentId, address creator) external payable nonReentrant {
        require(contentCreators[contentId] == creator, "Invalid creator");
        require(contentOwnership[contentId].owner == creator, "Creator doesn't own content");
        require(contentOwnership[contentId].isForSale, "Content not for sale");
        require(msg.value == contentOwnership[contentId].price, "Incorrect payment amount");
        
        uint256 amount = msg.value;
        uint256 platformFee = Math.mulDiv(amount, platformFeePercentage, 100);
        uint256 creatorAmount = amount - platformFee;
        
        // Transfer to creator
        payable(creator).transfer(creatorAmount);
        
        // Transfer platform fee
        payable(platformWallet).transfer(platformFee);
        
        // Transfer ownership
        contentOwnership[contentId].owner = msg.sender;
        contentOwnership[contentId].lastSaleTimestamp = block.timestamp;
        
        // Store payment
        string memory paymentId = string(abi.encodePacked(contentId, block.timestamp));
        payments[paymentId] = PaymentRecord({  // Actualizado el nombre
            from: msg.sender,
            to: creator,
            amount: amount,
            contentId: contentId,
            timestamp: block.timestamp,
            verified: true
        });
        
        emit ContentPurchased(msg.sender, creator, contentId, amount, block.timestamp);
        emit Payment(msg.sender, creator, amount, contentId, block.timestamp);
    }
    
    // Donate to user
    function donate(address to, string memory message) external payable nonReentrant {
        require(msg.value > 0, "Must send some AVAX");
        require(to != address(0), "Invalid recipient");
        
        uint256 amount = msg.value;
        uint256 platformFee = Math.mulDiv(amount, platformFeePercentage, 100);
        uint256 donationAmount = amount - platformFee;
        
        // Transfer to recipient
        payable(to).transfer(donationAmount);
        
        // Transfer platform fee
        payable(platformWallet).transfer(platformFee);
        
        emit Donation(msg.sender, to, donationAmount, message, block.timestamp);
        emit Payment(msg.sender, to, donationAmount, "", block.timestamp);
    }
    
    // Verify payment
    function verifyPayment(string memory paymentId) external view returns (bool) {
        return payments[paymentId].verified;
    }
    
    // Get content ownership
    function getContentOwnership(string memory contentId) external view returns (address) {
        return contentOwnership[contentId].owner;
    }
    
    // Get content creator
    function getContentCreator(string memory contentId) external view returns (address) {
        return contentCreators[contentId];
    }
    
    // Update platform fee (only owner)
    function updatePlatformFee(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage <= 5, "Fee too high");
        platformFeePercentage = newFeePercentage;
    }
    
    // Update platform wallet (only owner)
    function updatePlatformWallet(address newPlatformWallet) external onlyOwner {
        require(newPlatformWallet != address(0), "Invalid address");
        platformWallet = newPlatformWallet;
    }
    
    // Transfer content ownership
    function transferContentOwnership(string memory contentId, address newOwner) external {
        require(contentOwnership[contentId].owner == msg.sender, "Not content owner");
        require(newOwner != address(0), "Invalid new owner");
        
        address oldOwner = contentOwnership[contentId].owner;
        contentOwnership[contentId].owner = newOwner;
        
        emit OwnershipTransferred(contentId, oldOwner, newOwner, block.timestamp);
    }
    
    // Emergency withdraw (only owner)
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        payable(owner()).transfer(balance);
    }
    
    // Get contract balance
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    // Get payment details
    function getPayment(string memory paymentId) external view returns (
        address from,
        address to,
        uint256 amount,
        string memory contentId,
        uint256 timestamp,
        bool verified
    ) {
        PaymentRecord memory payment = payments[paymentId];  // Actualizado el tipo
        return (
            payment.from,
            payment.to,
            payment.amount,
            payment.contentId,
            payment.timestamp,
            payment.verified
        );
    }
    
    // Test functions
    function setContentPrice(string memory contentId, uint256 newPrice) external {
        require(contentOwnership[contentId].owner == msg.sender, "Not content owner");
        contentOwnership[contentId].price = newPrice;
    }
    
    function setContentSaleStatus(string memory contentId, bool forSale) external {
        require(contentOwnership[contentId].owner == msg.sender, "Not content owner");
        contentOwnership[contentId].isForSale = forSale;
    }
    
    function getContentDetails(string memory contentId) external view returns (
        address ownerAddress,
        uint256 price,
        bool isForSale,
        uint256 lastSaleTimestamp,
        address creator
    ) {
        ContentOwnership memory content = contentOwnership[contentId];
        return (
            content.owner,
            content.price,
            content.isForSale,
            content.lastSaleTimestamp,
            contentCreators[contentId]
        );
    }
}