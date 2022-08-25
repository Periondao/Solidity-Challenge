<script>
  import { ethers } from 'ethers';
  import Pool from '../artifacts/contracts/ERC20Pool.sol/ERC20Pool.json';
  import svelteLogo from './assets/svelte.svg'


    /* ========== Variables ========== */

  const poolAddress = "0x625662606c5Bd61f349F8Db55306c23AC08F4EaB"; // Enviroment variable/Pool Address
  const perionAddress = "0xd88a5cCe20629c850F15534532a5BEFAD0B2Da6c"; // Enviroment variable/Perion token address
  let amount, unstakeAmount, rewardAmount, stakedPerion;

    /* ========== Functions ========== */

  const decimals = (n) => {
    // Turn bigNumbers into readable numbers.
    return n / 1000000000000000000
  }

  // Connect MetaMask
  async function getSigner() {
  // @ts-ignore
  let provider = new ethers.providers.Web3Provider(window.ethereum)
  // MetaMask requires requesting permission to connect users accounts
  await provider.send("eth_requestAccounts", []);
  let signer = provider.getSigner()
  console.log('Connected MetaMask!', provider)
  return signer;
  }

	async function stakeTokens(amount) {

		const stakeAmount = ethers.utils.parseUnits(amount.toString(), 18);
    const signer = await getSigner()

    let abi = ["function approve(address _spender, uint256 _value) public returns (bool success)"]
    let contract = new ethers.Contract(perionAddress, abi, signer)
    let result = await contract.approve(poolAddress, stakeAmount)
    console.log("Allowance approved for:", result)

    // Connect with Pool contract and stake allowed tokens
		const poolContract = new ethers.Contract(poolAddress, Pool.abi, signer)
    result = await poolContract.stake(stakeAmount)

		console.log('Tokens Staked!', result)
	}

  async function unstakeTokens(amount) {

    const unstakeAmount = ethers.utils.parseUnits(amount.toString(), 18);
    const signer = await getSigner()

    // Connect with Pool contract and unstake amount of tokens
    const poolContract = new ethers.Contract(poolAddress, Pool.abi, signer)
    let result = await poolContract.withdraw(unstakeAmount)

    console.log('Tokens Unstaked!', result)
  }

  async function claimRewards() {

  const signer = await getSigner()

  // Connect with Pool contract and claim rewards
  const poolContract = new ethers.Contract(poolAddress, Pool.abi, signer)
  let result = await poolContract.getReward()

  console.log('Rewards Claimed!', result)
  }

  async function startRewards(amount) {

  const signer = await getSigner()
  const rewardAmount = ethers.utils.parseUnits(amount.toString(), 18);

  const poolContract = new ethers.Contract(poolAddress, Pool.abi, signer)
  let result = await poolContract.notifyRewardAmount(rewardAmount)

  console.log(`Rewards started with: ${amount} Perion tokens!`)
  }

  async function queryStaked() {
  const signer = await getSigner()
  const poolContract = new ethers.Contract(poolAddress, Pool.abi, signer)
  stakedPerion = decimals(await poolContract.totalStaked())
  console.log(`Amount of staked Perion is: ${stakedPerion}`)

  }
</script>

<main>
  <div>
    <a href="https://vitejs.dev" target="_blank">
      <img src="/vite.svg" class="logo" alt="Vite Logo" />
    </a>
    <a href="https://svelte.dev" target="_blank">
      <img src={svelteLogo} class="logo svelte" alt="Svelte Logo" />
    </a>
  </div>
  <h1>Vite + Svelte</h1>


  <div>
		<button on:click={getSigner}>Connect MetaMask</button>
	</div>
  <div>
		<button on:click={queryStaked}>Fetch Staked Perion</button>
    <h2>{stakedPerion}</h2>
  </div>
  <div>
    <input bind:value={amount} placeholder="Set amount of Perion tokens to">
		<button on:click={() => stakeTokens(amount)}>Stake Perion Tokens</button>
	</div>
  <div>
    <input bind:value={unstakeAmount} placeholder="Set amount of Perion tokens to">
		<button on:click={() => unstakeTokens(unstakeAmount)}>Unstake Perion Tokens</button>
	</div>
  <div>
    <h2>Claim your Rewards!</h2>
		<button on:click={() => claimRewards()}>Claim earned Perion Tokens</button>
	</div>

  <div>
    <input bind:value={rewardAmount} placeholder="Rewards">
		<button on:click={() => startRewards(rewardAmount)}> Start rewards period with {rewardAmount} Perion</button>
	</div>

</main>

<style>
  .logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
  }
  .logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
  }
  .logo.svelte:hover {
    filter: drop-shadow(0 0 2em #ff3e00aa);
  }
</style>
