// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.18;

import "@balancer-labs/v2-interfaces/contracts/vault/IVault.sol";
import "@balancer-labs/v2-interfaces/contracts/vault/IFlashLoanRecipient.sol";
import "@balancer-labs/v2-interfaces/contracts/solidity-utils/openzeppelin/IERC20.sol";
import {ISwapRouter} from "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

/**
 * @dev Algebra protocol router interface (used by Camelot V3 on Arbitrum).
 *      Differs from Uniswap V3: no `fee` parameter — the pool sets fees dynamically.
 */
interface IAlgebraSwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }
    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
}

/**
 * @title Arbitrage
 * @notice Secure flash loan arbitrage contract for Uniswap V3 / Pancakeswap V3
 * @dev Security features:
 *   - Owner-only trade execution
 *   - Reentrancy protection
 *   - Whitelisted routers only
 *   - Emergency withdrawal
 *   - Ownership transfer with 2-step confirmation
 */
contract Arbitrage is IFlashLoanRecipient {
    // ============ Constants ============
    IVault private constant vault =
        IVault(0xBA12222222228d8Ba445958a75a0704d566BF2C8);

    // ============ State Variables ============
    address public owner;
    address public pendingOwner;
    bool private locked;
    bool public paused;

    // Whitelisted routers - only these can be used for swaps
    mapping(address => bool) public whitelistedRouters;

    // Algebra-protocol routers (e.g. Camelot V3) — use different swap interface (no fee param)
    mapping(address => bool) public algebraRouters;

    // ============ Structs ============
    struct Trade {
        address[] routerPath;
        address[] tokenPath;
        uint24 fee0;  // Fee for first swap (buy)
        uint24 fee1;  // Fee for second swap (sell)
    }

    // ============ Events ============
    event TradeExecuted(
        address indexed executor,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 profit
    );
    event SwapExecuted(
        address indexed router,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint24 fee
    );

    event FlashLoanRequested(address indexed token, uint256 amount);
    event FlashLoanReceived(address indexed token, uint256 amount, uint256 fee, uint256 amountOwed);
    event FlashLoanRepaid(address indexed token, uint256 amountOwed);
    event RouterWhitelisted(address indexed router, bool status);
    event AlgebraRouterSet(address indexed router, bool isAlgebra);
    event OwnershipTransferInitiated(address indexed currentOwner, address indexed pendingOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event EmergencyWithdraw(address indexed token, uint256 amount);
    event Paused(bool status);

    // ============ Modifiers ============
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier noReentrant() {
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract paused");
        _;
    }

    // ============ Constructor ============
    constructor() {
        owner = msg.sender;

        // Whitelist known good routers (Arbitrum mainnet addresses)
        // Uniswap V3 Router
        whitelistedRouters[0xE592427A0AEce92De3Edee1F18E0157C05861564] = true;
        // Pancakeswap V3 Router
        whitelistedRouters[0x1b81D678ffb9C0263b24A97847620C99d213eB14] = true;
        // Sushiswap V3 Router
        whitelistedRouters[0x8A21F6768C1f8075791D08546Dadf6daA0bE820c] = true;
        // Camelot V3 Router (Algebra protocol — no fee param)
        whitelistedRouters[0xc873fEcbd354f5A56E00E710B90EF4201db2448d] = true;
        algebraRouters[0xc873fEcbd354f5A56E00E710B90EF4201db2448d] = true;
    }

    // ============ External Functions ============

    /**
     * @notice Execute an arbitrage trade using flash loan
     * @dev Only owner can call, protected against reentrancy
     * @param _routerPath Array of 2 router addresses [buyRouter, sellRouter]
     * @param _tokenPath Array of 2 token addresses [token0, token1]
     * @param _fee0 Fee tier for first swap (buy on DEX1)
     * @param _fee1 Fee tier for second swap (sell on DEX2)
     * @param _flashAmount Amount of token0 to flash loan
     */
    function executeTrade(
        address[] memory _routerPath,
        address[] memory _tokenPath,
        uint24 _fee0,
        uint24 _fee1,
        uint256 _flashAmount
    ) external onlyOwner noReentrant whenNotPaused {
        // Validate routers are whitelisted
        require(_routerPath.length == 2, "Invalid router path");
        require(_tokenPath.length == 2, "Invalid token path");
        require(whitelistedRouters[_routerPath[0]], "Router 0 not whitelisted");
        require(whitelistedRouters[_routerPath[1]], "Router 1 not whitelisted");
        require(_flashAmount > 0, "Amount must be > 0");

        bytes memory data = abi.encode(
            Trade({routerPath: _routerPath, tokenPath: _tokenPath, fee0: _fee0, fee1: _fee1})
        );

        IERC20[] memory tokens = new IERC20[](1);
        tokens[0] = IERC20(_tokenPath[0]);

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = _flashAmount;

        emit FlashLoanRequested(_tokenPath[0], _flashAmount);

        vault.flashLoan(this, tokens, amounts, data);
    }

    /**
     * @notice Callback from Balancer vault after flash loan
     * @dev Only callable by the Balancer vault
     */
    function receiveFlashLoan(
        IERC20[] memory, /* tokens */
        uint256[] memory amounts,
        uint256[] memory feeAmounts,
        bytes memory userData
    ) external override {
        require(msg.sender == address(vault), "Only vault");

        Trade memory trade = abi.decode(userData, (Trade));
        uint256 flashAmount = amounts[0];
        uint256 amountOwed = flashAmount + feeAmounts[0];

        emit FlashLoanReceived(trade.tokenPath[0], flashAmount, feeAmounts[0], amountOwed);

        // First swap: token0 -> token1 (using fee0)
        _swapOnV3(
            trade.routerPath[0],
            trade.tokenPath[0],
            flashAmount,
            trade.tokenPath[1],
            0,
            trade.fee0
        );

        // Second swap: token1 -> token0 (using fee1)
        uint256 token1Balance = IERC20(trade.tokenPath[1]).balanceOf(address(this));
        _swapOnV3(
            trade.routerPath[1],
            trade.tokenPath[1],
            token1Balance,
            trade.tokenPath[0],
            amountOwed, // Minimum we need to repay
            trade.fee1
        );

        // Repay flash loan
        uint256 currentBalance = IERC20(trade.tokenPath[0]).balanceOf(address(this));
        require(currentBalance >= amountOwed, "Insufficient to repay");

        _safeTransfer(trade.tokenPath[0], address(vault), amountOwed);

        emit FlashLoanRepaid(trade.tokenPath[0], amountOwed);

        // Transfer profits to owner
        uint256 profit = IERC20(trade.tokenPath[0]).balanceOf(address(this));
        if (profit > 0) {
            _safeTransfer(trade.tokenPath[0], owner, profit);
        }

        emit TradeExecuted(owner, trade.tokenPath[0], trade.tokenPath[1], flashAmount, profit);
    }

    // ============ Admin Functions ============

    /**
     * @notice Whitelist or remove a router
     */
    function setRouterWhitelist(address _router, bool _status) external onlyOwner {
        require(_router != address(0), "Invalid router");
        whitelistedRouters[_router] = _status;
        emit RouterWhitelisted(_router, _status);
    }

    /**
     * @notice Mark a whitelisted router as Algebra-protocol (e.g. Camelot V3).
     *         Algebra routers use a different exactInputSingle signature (no fee param).
     *         Router must already be whitelisted before calling this.
     */
    function setAlgebraRouter(address _router, bool _isAlgebra) external onlyOwner {
        require(whitelistedRouters[_router], "Router not whitelisted");
        algebraRouters[_router] = _isAlgebra;
        emit AlgebraRouterSet(_router, _isAlgebra);
    }

    /**
     * @notice Pause/unpause the contract
     */
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit Paused(_paused);
    }

    /**
     * @notice Initiate ownership transfer (2-step for safety)
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        require(_newOwner != owner, "Already owner");
        pendingOwner = _newOwner;
        emit OwnershipTransferInitiated(owner, _newOwner);
    }

    /**
     * @notice Accept ownership (must be called by pending owner)
     */
    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "Not pending owner");
        emit OwnershipTransferred(owner, pendingOwner);
        owner = pendingOwner;
        pendingOwner = address(0);
    }

    /**
     * @notice Emergency withdraw any stuck tokens
     */
    function emergencyWithdraw(address _token) external onlyOwner {
        uint256 balance = IERC20(_token).balanceOf(address(this));
        require(balance > 0, "No balance");
        IERC20(_token).transfer(owner, balance);
        emit EmergencyWithdraw(_token, balance);
    }

    /**
     * @notice Emergency withdraw ETH if any
     */
    function emergencyWithdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH");
        (bool success, ) = owner.call{value: balance}("");
        require(success, "ETH transfer failed");
    }

    // -- INTERNAL FUNCTIONS -- //

    function _swapOnV3(
        address _router,
        address _tokenIn,
        uint256 _amountIn,
        address _tokenOut,
        uint256 _amountOut,
        uint24 _fee
    ) internal {
        require(_router != address(0), "Invalid router");
        require(_tokenIn != address(0) && _tokenOut != address(0), "Invalid token");
        require(_tokenIn != _tokenOut, "Same token");
        require(_amountIn > 0, "AmountIn=0");

        // Approve token to swap (support tokens that return no bool on approve)
        // Some tokens require allowance to be set to 0 before setting a new value.
        _safeApprove(_tokenIn, _router, 0);
        _safeApprove(_tokenIn, _router, _amountIn);

        uint256 amountOut;

        if (algebraRouters[_router]) {
            // Algebra protocol (Camelot V3) — no fee param, pool sets fees dynamically
            IAlgebraSwapRouter.ExactInputSingleParams memory params = IAlgebraSwapRouter
                .ExactInputSingleParams({
                    tokenIn: _tokenIn,
                    tokenOut: _tokenOut,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountIn: _amountIn,
                    amountOutMinimum: _amountOut,
                    sqrtPriceLimitX96: 0
                });

            try IAlgebraSwapRouter(_router).exactInputSingle(params) returns (uint256 out) {
                amountOut = out;
            } catch (bytes memory reason) {
                if (reason.length == 0) revert("Algebra swap failed");
                assembly { revert(add(reason, 32), mload(reason)) }
            }
        } else {
            // Uniswap V3 / PancakeSwap V3 — requires explicit fee tier
            ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
                .ExactInputSingleParams({
                    tokenIn: _tokenIn,
                    tokenOut: _tokenOut,
                    fee: _fee,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountIn: _amountIn,
                    amountOutMinimum: _amountOut,
                    sqrtPriceLimitX96: 0
                });

            try ISwapRouter(_router).exactInputSingle(params) returns (uint256 out) {
                amountOut = out;
            } catch (bytes memory reason) {
                if (reason.length == 0) revert("V3 swap failed");
                assembly { revert(add(reason, 32), mload(reason)) }
            }
        }

        emit SwapExecuted(_router, _tokenIn, _tokenOut, _amountIn, amountOut, _fee);
    }

    function _safeApprove(address token, address spender, uint256 value) internal {
        _callOptionalReturn(
            token,
            abi.encodeWithSelector(IERC20.approve.selector, spender, value),
            "ERC20 approve failed"
        );
    }

    function _safeTransfer(address token, address to, uint256 value) internal {
        _callOptionalReturn(
            token,
            abi.encodeWithSelector(IERC20.transfer.selector, to, value),
            "ERC20 transfer failed"
        );
    }

    function _callOptionalReturn(address token, bytes memory data, string memory defaultError) internal {
        (bool success, bytes memory returndata) = token.call(data);
        if (!success) {
            if (returndata.length > 0) {
                assembly {
                    revert(add(returndata, 32), mload(returndata))
                }
            }
            revert(defaultError);
        }

        // Tokens may return no value, or a single boolean.
        if (returndata.length > 0) {
            require(abi.decode(returndata, (bool)), defaultError);
        }
    }

    // Allow contract to receive ETH
    receive() external payable {}
}
