const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  // Helper function for decimals.
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('ERC20Pool', () => {
  // Assigning global variables inside the function.

  let team, user1, user2

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
  })

  describe('Deployment', () => {

    it('Tracks total staked tokens.', async () => {
      expect(await pool.totalSupply()).to.equal(0)
    })

    it('The owner is the deployer', async () => {
      expect(await pool.owner()).to.equal(team.address)
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
        expect(await pool.totalSupply()).to.equal(amount)
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

        // Connect user1 with the pool contract and stake amount
        transaction = await pool.connect(user1).stake(stake)
        result = await transaction.wait()

        // Connect user1 with the pool contract and withdraw amount
        transaction = await pool.connect(user1).withdraw(withdraw)
        result = await transaction.wait()

      })

      it('Tracks total token staked', async () => {
         expect(await pool.totalSupply()).to.equal(remainder)
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


})