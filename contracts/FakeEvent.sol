// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.27;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ERC1155Pausable} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import {ERC1155Supply} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract FakeEvent is ERC1155, Ownable, ERC1155Pausable, ERC1155Supply {
    // Ticket IDs
    uint256 public constant VIP_TICKET = 0;
    uint256 public constant PREMIUM_TICKET = 1;
    uint256 public constant REGULAR_TICKET = 2;

    // Mappings for ticket prices
    mapping(uint256 => uint256) public tokenPrices;

    // Maximum supply for each ticket type
    mapping(uint256 => uint256) public maxSupply;

    // Maximum tickets that can be purchased in one transaction
    uint256 public constant MAX_TICKETS_PER_PURCHASE = 10;

    constructor(
        address initialOwner,
        string memory _uri
    ) ERC1155(_uri) Ownable(initialOwner) {
        // Initialize ticket prices
        tokenPrices[VIP_TICKET] = 150000000 gwei; // 0.15 ETH
        tokenPrices[PREMIUM_TICKET] = 100000000 gwei; // 0.10 ETH
        tokenPrices[REGULAR_TICKET] = 50000000 gwei; // 0.05 ETH

        // Initialize max supply for each ticket type
        maxSupply[VIP_TICKET] = 100;
        maxSupply[PREMIUM_TICKET] = 200;
        maxSupply[REGULAR_TICKET] = 500;
    }

    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function setTokenPrice(uint256 id, uint256 price) public onlyOwner {
        tokenPrices[id] = price;
    }

    function getTokenPrices() public view returns (uint256[] memory) {
        uint256[] memory prices = new uint256[](3);
        prices[0] = tokenPrices[VIP_TICKET];
        prices[1] = tokenPrices[PREMIUM_TICKET];
        prices[2] = tokenPrices[REGULAR_TICKET];
        return prices;
    }

    function setMaxSupply(uint256 id, uint256 supply) public onlyOwner {
        require(
            supply >= totalSupply(id),
            "New supply must be greater than current supply"
        );
        maxSupply[id] = supply;
    }

    function availableSupply(uint256 id) public view returns (uint256) {
        return maxSupply[id] - totalSupply(id);
    }

    function uri(uint256 id) public view override returns (string memory) {
        return
            string(
                abi.encodePacked(
                    super.uri(id),
                    "/",
                    Strings.toString(id),
                    ".json"
                )
            );
    }

    function _validateMint(uint256 id, uint256 quantity) internal view {
        require(
            id == VIP_TICKET || id == PREMIUM_TICKET || id == REGULAR_TICKET,
            "Invalid ticket ID"
        );
        require(quantity > 0, "Quantity must be greater than 0");
        require(
            totalSupply(id) + quantity <= maxSupply[id],
            "Minting is not available for this token"
        );
    }

    function mint(uint256 id, uint256 quantity) external payable whenNotPaused {
        require(
            quantity <= MAX_TICKETS_PER_PURCHASE,
            "Exceeds max tickets per purchase"
        );
        require(
            tokenPrices[id] * quantity == msg.value,
            "Minting amount is invalid"
        );
        _validateMint(id, quantity);
        _mint(msg.sender, id, quantity, "");
    }

    function mintBatch(
        uint256[] memory ids,
        uint256[] memory quantities
    ) external payable whenNotPaused {
        require(ids.length > 0, "No tickets to mint");
        require(ids.length == quantities.length, "Array lengths do not match");

        uint256 totalQuantity = 0;
        uint256 requiredValue = 0;

        for (uint256 i = 0; i < ids.length; i++) {
            totalQuantity += quantities[i];
            requiredValue += quantities[i] * tokenPrices[ids[i]];
            _validateMint(ids[i], quantities[i]);
        }

        require(
            totalQuantity <= MAX_TICKETS_PER_PURCHASE,
            "Exceeds max tickets per purchase"
        );
        require(requiredValue == msg.value, "Total minting amount is invalid");

        _mintBatch(msg.sender, ids, quantities, "");
    }

    function markTicketAsUsed(
        address account,
        uint256 id,
        uint256 quantity
    ) external onlyOwner {
        require(
            id == VIP_TICKET || id == PREMIUM_TICKET || id == REGULAR_TICKET,
            "Invalid ticket ID"
        );
        require(quantity > 0, "Quantity must be greater than 0");
        require(account != address(0), "Invalid account address");
        require(
            balanceOf(account, id) >= quantity,
            "Insufficient balance to mark as used"
        );

        _burn(account, id, quantity);
    }

    function withdraw() public payable onlyOwner {
        (bool success, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(success, "Failed to withdraw");
    }

    // The following functions are overrides required by Solidity.

    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155, ERC1155Pausable, ERC1155Supply) {
        super._update(from, to, ids, values);
    }
}
