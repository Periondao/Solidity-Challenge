<script>
  import { ethers } from 'ethers';
  import Pool from '../artifacts/contracts/ERC20Pool.sol/ERC20Pool.json';
  import Token from '../artifacts/contracts/Token.sol/Token.json';
  import svelteLogo from './assets/svelte.svg'
  import Counter from './lib/Counter.svelte'

    /* ========== Variables ========== */

  const poolAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // Enviroment variable/Pool Address
  const perionAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3"; // Enviroment variable/Perion token address
  let amount = 0

    /* ========== Functions ========== */

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

  	// Fetch token contract from the blockchain.
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

  <div class="card">
    <Counter />
  </div>

  <div>
		<button on:click={getSigner}>Connect MetaMask</button>
	</div>
  <div>
    <input bind:value={amount} placeholder="Set amount of Perion tokens to stake">
		<button on:click={() => stakeTokens(amount)}>Stake Perion Tokens</button>
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
