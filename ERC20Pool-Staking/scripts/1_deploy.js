async function main() {
  console.log('Preparing deployment... \n')

  // Fetch contracts to deploy
  const Token = await ethers.getContractFactory("Token")
  const ERC20Pool = await ethers.getContractFactory('ERC20Pool')

  // Fetch accounts
  const accounts = await ethers.getSigners();
  console.log(`Accounts fetched:\n${accounts[0].address}\n${accounts[1].address}\n`)

  // Deploy contracts
  const perion = await Token.deploy('Perion', 'PERION', '1000000')

  await perion.deployed()
  let symbol = await perion.symbol()
  console.log(symbol)
  console.log(`Perion Deployed to: ${perion.address}`)

  const pool = await ERC20Pool.deploy(perion.address)
  await pool.deployed()
  console.log(`Pool contract Deployed to: ${pool.address}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });