const { expect } = require('chai');
const { ethers } = require('hardhat');
const hre = require("hardhat")

const tokens = (n) => {
  // Helper function for decimals.
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const decimals = (n) => {
  // Turn bigNumbers into readable numbers.
  return n / 1000000000000000000
}

// Manipulating EVM via Increasing Block Timestamp for testing
async function increaseTime(amount) {
  await hre.network.provider.send("evm_increaseTime", [amount])
//  console.log("EVM time " + amount + " seconds increased!")
  }

// Manipulating EVM via Mining Blocks
async function mineBlocks(amount) {
  for (let i = 0; i < amount; i++) {
  await hre.network.provider.send("evm_mine")
  }
//  console.log(amount + " Blocks Mined!")
  }

describe('ERC20Pool', () => {
  // Assigning global variables inside the function.

  let team, user1, user2, afterStaking, beforeStaking, final

  beforeEach(async () => {
    const ERC20Pool = await ethers.getContractFactory('ERC20Pool')
    const Token = await ethers.getContractFactory('Token')

    perion = await Token.deploy('Perion', 'PERION', '1000000')

    accounts = await ethers.getSigners()
    team = accounts[0]
    user1 = accounts[1]
    user2 = accounts[2]

    let transaction = await perion.connect(team).transfer(user1.address, tokens(100))
    await transaction.wait()

    pool = await ERC20Pool.deploy(perion.address)

    transaction = await perion.connect(team).transfer(pool.address, tokens(10000))
    await transaction.wait()

    transaction = await pool.connect(team).notifyRewardAmount(tokens(2000))
    await transaction.wait()
  })

  describe('Deployment', () => {

    it('Tracks total staked tokens.', async () => {
      expect(await pool.totalStaked()).to.equal(0)
    })

    it('The owner is the deployer', async () => {
      expect(await pool.owner()).to.equal(team.address)
    })

    it('The contract holds PERION in it', async () => {
      expect(await perion.balanceOf(pool.address)).to.equal(tokens(10000))
    })
  })

  describe('Staking Tokens', () => {
    let transaction, result
    let amount = tokens(10)

    describe('Success', () => {
      beforeEach(async () => {

        // Approve amount
        transaction = await perion.connect(user1).approve(pool.address, amount)
        result = await transaction.wait()

        // Connect user1 with the pool contract and stake amount
        transaction = await pool.connect(user1).stake(amount)
        result = await transaction.wait()

      })

      it('Tracks total token staked', async () => {
        expect(await pool.totalStaked()).to.equal(amount)
      })

      it('Emits a Staked event', async () => {
        const event = result.events[1] // 2 events are emitted
        expect(event.event).to.equal('Staked')

        const args = event.args
        expect(args.user).to.equal(user1.address)
        expect(args.amount).to.equal(amount)
      })

    })

    describe('Failure', () => {
      it('Fails when no tokens are approved', async () => {
        // Don't approve any tokens before depositing
        await expect(pool.connect(user1).stake(amount)).to.be.reverted
      })
    })

  })

  describe('Unstaking Tokens', () => {
    let transaction, result
    let stake = tokens(15)
    let withdraw = tokens(5)
    let remainder = tokens(15 - 5)

    describe('Success', () => {
      beforeEach(async () => {

        // Approve stake amount
        transaction = await perion.connect(user1).approve(pool.address, stake)
        result = await transaction.wait()

        beforeStaking = await perion.balanceOf(user1.address)
        // Connect user1 with the pool contract and stake amount
        transaction = await pool.connect(user1).stake(stake)
        result = await transaction.wait()

        afterStaking = await perion.balanceOf(user1.address)
        // Connect user1 with the pool contract and withdraw amount
        transaction = await pool.connect(user1).withdraw(withdraw)
        result = await transaction.wait()
        let afterUnstaking = await perion.balanceOf(user1.address)

        final = decimals(afterStaking) + 5;
      })

      it('Tracks total token staked', async () => {
         expect(await pool.totalStaked()).to.equal(remainder)
      })

      it('User1 receives back the unstaked tokens', async () => {
        expect(decimals(await perion.balanceOf(user1.address))).to.equal(final)
     })

      it('emits a Withdrawn event', async () => {
        const event = result.events[2] // 3 events are emitted
        expect(event.event).to.equal('Withdrawn')

        const args = event.args
        expect(args.user).to.equal(user1.address)
        expect(args.amount).to.equal(withdraw)
      })

    })

    describe('Failure', () => {
      it('Fails when withdrawing more tokens that is staked', async () => {
        await expect(pool.connect(user1).withdraw(tokens(20))).to.be.reverted
      })

      it('Fails trying to withdraw when no token is staked', async () => {
        await expect(pool.connect(user2).withdraw(tokens(20))).to.be.reverted
      })
    })

  })

  describe('Claiming Rewards', () => {
    let transaction, result, beforeStaking, afterStaking, final
    let currentReward = 0
    let stake = tokens(15)

    describe('Success', () => {
      beforeEach(async () => {

        // Approve stake amount
        transaction = await perion.connect(user1).approve(pool.address, stake)
        result = await transaction.wait()

        beforeStaking = await perion.balanceOf(user1.address)

        // Connect user1 with the pool contract and stake amount
        transaction = await pool.connect(user1).stake(stake)
        result = await transaction.wait()
        afterStaking = await perion.balanceOf(user1.address)

                // Time speed the blockchain
                increaseTime(86400) // more than 7 days
                mineBlocks(25)


        // Connect user1 with the pool contract and claim rewards
        transaction = await pool.connect(user1).getReward()
        result = await transaction.wait()

        final = await perion.balanceOf(user1.address)

        currentReward = final - afterStaking

        let rewardGiven = result.events[2].args.reward
       // console.log(decimals(currentReward), decimals(rewardGiven))
      })

      it('Tracks total token staked', async () => {
         expect(await pool.totalStaked()).to.equal(stake)
      })

      it('Emits a Claimed event', async () => {
        const event = result.events[2] // 3 events are emitted
        expect(event.event).to.equal('RewardPaid')

        const args = event.args
        expect(args.user).to.equal(user1.address)
        expect(decimals(args.reward)).to.equal(decimals(currentReward))
      })

      it('User1 should claim the 100% total after 7 days', async () => {
        const event = result.events[2]
        const args = event.args
        expect(decimals(args.reward)).to.equal(2000)
      })

    })

   /* describe('Failure', () => {
      it('Fails when withdrawing more tokens that is staked', async () => {
        await expect(pool.connect(user1).withdraw(tokens(20))).to.be.reverted
      })

      it('Fails trying to withdraw when no token is staked', async () => {
        await expect(pool.connect(user2).withdraw(tokens(20))).to.be.reverted
      })
    }) */

  })

})