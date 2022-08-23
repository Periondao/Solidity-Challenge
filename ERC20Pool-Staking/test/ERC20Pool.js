const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  // Helper function for decimals.
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('ERC20Pool', () => {
  // Assigning global variables inside the function.

  let team, user1

  beforeEach(async () => {
    const ERC20Pool = await ethers.getContractFactory('ERC20Pool')
    const Token = await ethers.getContractFactory('Token')

    perion = await Token.deploy('Perion', 'PERION', '1000000')

    accounts = await ethers.getSigners()
    team = accounts[0]
    user1 = accounts[1]

    let transaction = await perion.connect(team).transfer(user1.address, tokens(100))
    await transaction.wait()

    pool = await ERC20Pool.deploy(perion.address)
  })

  describe('Deployment', () => {

    it('Tracks total stakers.', async () => {
      expect(await pool.totalStakers()).to.equal(0)
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

      it('tracks the stake transaction info', async () => {
        expect(await pool.totalStakers()).to.equal(1)

      })

      it('emits a Staked event', async () => {
        const event = result.events[1] // 2 events are emitted
        expect(event.event).to.equal('Staked')

        const args = event.args
        expect(args.from).to.equal(user1.address)
        expect(args.amount).to.equal(amount)
      })

    })

  })

})