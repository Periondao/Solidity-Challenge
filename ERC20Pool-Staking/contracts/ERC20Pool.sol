//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Context.sol";

interface IToken {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (uint256);
}

contract ERC20Pool is Pausable, Ownable, ReentrancyGuard {

  IToken perionToken;

      struct StakeInfo {
        uint256 startTS;
        uint256 endTS;
        uint256 amount;
        uint256 claimed;
    }

  event Staked(address indexed from, uint256 amount);
  event Unstaked(address indexed from, uint256 amount);

  // 7 Days (7 * 24 * 60 * 60)
  uint256 public rewardDuration = 604800;

  uint256 public totalStakers;
  uint256 public totalStaked;

  mapping(address => StakeInfo) public stakeInfos;
  mapping(address => bool) public addressStaked;

    constructor(IToken _tokenAddress) {
        require(address(_tokenAddress) != address(0),"Token Address cannot be address 0");
        perionToken = _tokenAddress;
        totalStakers = 0;
        totalStaked = 0;
    }

    // Staking functionality
    function stakeToken(uint256 stakeAmount) external payable whenNotPaused {
        require(stakeAmount > 0, "Stake amount should be correct");
        require(addressStaked[_msgSender()] == false, "You already participated");
        require(perionToken.balanceOf(_msgSender()) >= stakeAmount, "Insufficient Balance");

           perionToken.transferFrom(_msgSender(), address(this), stakeAmount);
            totalStakers++;
            totalStaked = totalStaked + stakeAmount;
            addressStaked[_msgSender()] = true;

            stakeInfos[_msgSender()] = StakeInfo({
                startTS: block.timestamp,
                endTS: block.timestamp,
                amount: stakeAmount,
                claimed: 0
            });

        emit Staked(_msgSender(), stakeAmount);
    }

    // Unstaking functionality
    function unstakeToken() external returns (bool){
        require(addressStaked[_msgSender()] == true, "You have no staked token");
        require(stakeInfos[_msgSender()].claimed == 0, "Already unstaked!");

        uint256 stakeAmount = stakeInfos[_msgSender()].amount;
        stakeInfos[_msgSender()].claimed == stakeAmount;
        perionToken.transfer(_msgSender(), stakeAmount);
        totalStaked = totalStaked - stakeAmount;


        emit Unstaked(_msgSender(), stakeAmount);

        return true;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

}
