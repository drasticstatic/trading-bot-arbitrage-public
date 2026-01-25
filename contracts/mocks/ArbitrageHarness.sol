// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.18;

import "../Arbitrage.sol";

/**
 * @notice Test harness to expose internal safe ERC20 helpers for unit tests.
 */
contract ArbitrageHarness is Arbitrage {
    function harnessSafeApprove(address token, address spender, uint256 value) external {
        _safeApprove(token, spender, value);
    }

    function harnessSafeTransfer(address token, address to, uint256 value) external {
        _safeTransfer(token, to, value);
    }
}
