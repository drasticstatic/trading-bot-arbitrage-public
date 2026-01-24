// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

/// @notice Minimal UniswapV3-like pool mock for testing price math.
contract MockV3Pool {
    address public token0;
    address public token1;

    uint160 private sqrtPriceX96;

    constructor(address _token0, address _token1, uint160 _sqrtPriceX96) {
        token0 = _token0;
        token1 = _token1;
        sqrtPriceX96 = _sqrtPriceX96;
    }

    function setSqrtPriceX96(uint160 _sqrtPriceX96) external {
        sqrtPriceX96 = _sqrtPriceX96;
    }

    function slot0()
        external
        view
        returns (
            uint160 _sqrtPriceX96,
            int24 tick,
            uint16 observationIndex,
            uint16 observationCardinality,
            uint16 observationCardinalityNext,
            uint32 feeProtocol,
            bool unlocked
        )
    {
        return (sqrtPriceX96, 0, 0, 0, 0, 0, true);
    }
}

