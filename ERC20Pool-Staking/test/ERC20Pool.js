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


})