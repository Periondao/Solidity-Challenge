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

    it('Tracks total stakers.', async () => {
      expect(await pool.totalStakers()).to.equal(0)
    })

    it('Tracks total of staked tokens.', async () => {
      expect(await pool.totalStaked()).to.equal(0)
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

        // Connect user1 with the pool contract
        transaction = await pool.connect(user1).stakeToken(amount)
        result = await transaction.wait()

      })

      it('tracks total stakers and total token staked', async () => {
        expect(await pool.totalStakers()).to.equal(1)
        expect(await pool.totalStaked()).to.equal(amount)
      })

      it('emits a Staked event', async () => {
        const event = result.events[1] // 2 events are emitted
        expect(event.event).to.equal('Staked')

        const args = event.args
        expect(args.from).to.equal(user1.address)
        expect(args.amount).to.equal(amount)
      })

    })

    describe('Failure', () => {
      it('fails when no tokens are approved', async () => {
        // Don't approve any tokens before depositing
        await expect(pool.connect(user1).stakeToken(amount)).to.be.reverted
      })
    })

  })

  describe('Unstaking Tokens', () => {
    let transaction, result
    let stake = tokens(20)

    beforeEach(async () => {
      // Approve amount
      transaction = await perion.connect(user1).approve(pool.address, stake)
      result = await transaction.wait()

      // Connect user1 with the pool contract and stake
      transaction = await pool.connect(user1).stakeToken(stake)
      result = await transaction.wait()

      // Connect user1 with the pool contract and unstake his tokens
      transaction = await pool.connect(user1).unstakeToken()
      result = await transaction.wait()
    })

    describe('Success', () => {

      it('tracks total stakers and total token staked', async () => {
        expect(await pool.totalStakers()).to.equal(1)
        expect(await pool.totalStaked()).to.equal(0)
      })

      it('emits a Unstaked event', async () => {
        const event = result.events[2] // It emits three events
        expect(event.event).to.equal('Unstaked')

        const args = event.args
        expect(args.from).to.equal(user1.address)
        expect(args.amount).to.equal(stake)
      })

    })

    describe('Failure', () => {

      it('fails when the user has no tokens', async () => {
        // Don't approve any tokens before depositing
        await expect(pool.connect(user2).unstakeToken()).to.be.reverted
      })
    })

  })

})