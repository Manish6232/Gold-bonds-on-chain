// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Only used in tests — simulates Chainlink oracle
contract MockAggregator {
    int256 private _price;

    constructor(int256 initialPrice) {
        _price = initialPrice;
    }

    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return (1, _price, block.timestamp, block.timestamp, 1);
    }

    function setPrice(int256 newPrice) external {
        _price = newPrice;
    }
}
