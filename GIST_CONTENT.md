# Integrating Pyth Entropy V2 for Verifiable Randomness in Web3 Games

A complete guide to using Pyth Entropy V2 to generate provably random events in your blockchain game or dApp.

## Why Pyth Entropy V2?

Traditional games use `Math.random()` which is:
- Predictable (can be gamed)
- Not verifiable (players can't trust it)
- Centralized (controlled by your server)

Pyth Entropy V2 provides:
- Unpredictable on-chain randomness
- Verifiable by anyone
- Fair and transparent

## The Smart Contract

Here's a production-ready Entropy V2 consumer contract:

```solidity
// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

interface IEntropyV2 {
    function getFeeV2(uint32 gasLimit) external view returns (uint128 feeAmount);
    function requestV2(uint32 gasLimit) external payable returns (uint64 assignedSequenceNumber);
}

abstract contract IEntropyConsumer {
    function _entropyCallback(
        uint64 sequence,
        address provider,
        bytes32 randomNumber
    ) external {
        address entropy = getEntropy();
        require(entropy != address(0), "Entropy address not set");
        require(msg.sender == entropy, "Only Entropy can call this function");
        entropyCallback(sequence, provider, randomNumber);
    }

    function getEntropy() internal view virtual returns (address);
    function entropyCallback(uint64 sequence, address provider, bytes32 randomNumber) internal virtual;
}

contract GameEntropyConsumer is IEntropyConsumer {
    struct RandomRequest {
        bytes32 gameId;
        address provider;
        bytes32 randomNumber;
        uint32 callbackGasLimit;
        uint64 requestedAtBlock;
        uint64 fulfilledAtBlock;
        bool fulfilled;
    }

    IEntropyV2 public immutable entropy;
    address public owner;

    mapping(uint64 => RandomRequest) public requestsBySequence;
    mapping(bytes32 => uint64) public latestSequenceByGame;

    event RandomRequested(bytes32 indexed gameId, uint64 indexed sequenceNumber, uint32 callbackGasLimit, uint256 feePaid);
    event RandomFulfilled(bytes32 indexed gameId, uint64 indexed sequenceNumber, bytes32 randomNumber);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(address entropyAddress, address initialOwner) {
        require(entropyAddress != address(0), "Entropy address required");
        entropy = IEntropyV2(entropyAddress);
        owner = initialOwner == address(0) ? msg.sender : initialOwner;
    }

    function quoteFee(uint32 gasLimit) public view returns (uint256) {
        return entropy.getFeeV2(gasLimit);
    }

    function requestRandom(bytes32 gameId, uint32 gasLimit) external payable onlyOwner returns (uint64 sequenceNumber) {
        uint256 fee = quoteFee(gasLimit);
        require(msg.value == fee, "Incorrect fee");

        sequenceNumber = entropy.requestV2{value: fee}(gasLimit);

        requestsBySequence[sequenceNumber] = RandomRequest({
            gameId: gameId,
            provider: address(0),
            randomNumber: bytes32(0),
            callbackGasLimit: gasLimit,
            requestedAtBlock: uint64(block.number),
            fulfilledAtBlock: 0,
            fulfilled: false
        });
        
        latestSequenceByGame[gameId] = sequenceNumber;
        emit RandomRequested(gameId, sequenceNumber, gasLimit, fee);
    }

    function getEntropy() internal view override returns (address) {
        return address(entropy);
    }

    function entropyCallback(uint64 sequenceNumber, address provider, bytes32 randomNumber) internal override {
        RandomRequest storage request = requestsBySequence[sequenceNumber];
        if (request.requestedAtBlock == 0) return;

        request.provider = provider;
        request.randomNumber = randomNumber;
        request.fulfilled = true;
        request.fulfilledAtBlock = uint64(block.number);

        emit RandomFulfilled(request.gameId, sequenceNumber, randomNumber);
    }

    function getGameRequest(bytes32 gameId) external view returns (
        uint64 sequenceNumber,
        address provider,
        bytes32 randomNumber,
        uint32 callbackGasLimit,
        uint64 requestedAtBlock,
        uint64 fulfilledAtBlock,
        bool fulfilled
    ) {
        sequenceNumber = latestSequenceByGame[gameId];
        RandomRequest storage request = requestsBySequence[sequenceNumber];
        
        provider = request.provider;
        randomNumber = request.randomNumber;
        callbackGasLimit = request.callbackGasLimit;
        requestedAtBlock = request.requestedAtBlock;
        fulfilledAtBlock = request.fulfilledAtBlock;
        fulfilled = request.fulfilled;
    }
}
```

## Deployment

Deploy on Base Sepolia:

```typescript
import { ethers } from "ethers";

const ENTROPY_ADDRESS = "0x41c9e39574F40Ad34c79f1C99B66A45eFB830d4c"; // Base Sepolia
const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const factory = new ethers.ContractFactory(abi, bytecode, wallet);
const contract = await factory.deploy(ENTROPY_ADDRESS, wallet.address);
await contract.waitForDeployment();

console.log("Contract deployed:", await contract.getAddress());
```

## Requesting Randomness from Next.js

```typescript
import { Contract, JsonRpcProvider, Wallet, keccak256, toUtf8Bytes } from "ethers";

const CONSUMER_ABI = [
  "function quoteFee(uint32 gasLimit) view returns (uint256)",
  "function requestRandom(bytes32 gameId, uint32 gasLimit) payable returns (uint64)",
  "function getGameRequest(bytes32 gameId) view returns (uint64, address, bytes32, uint32, uint64, uint64, bool)"
];

async function requestRandomEvent(gameId: string) {
  const provider = new JsonRpcProvider(process.env.RPC_URL);
  const signer = new Wallet(process.env.PRIVATE_KEY, provider);
  const contract = new Contract(process.env.CONTRACT_ADDRESS, CONSUMER_ABI, signer);

  const gameIdHash = keccak256(toUtf8Bytes(gameId));
  const gasLimit = 180000;
  const fee = await contract.quoteFee(gasLimit);

  const tx = await contract.requestRandom(gameIdHash, gasLimit, { value: fee });
  const receipt = await tx.wait();

  console.log("Random requested:", receipt.hash);
  return gameIdHash;
}
```

## Polling for Results

```typescript
async function waitForRandomNumber(gameId: string): Promise<string> {
  const provider = new JsonRpcProvider(process.env.RPC_URL);
  const contract = new Contract(process.env.CONTRACT_ADDRESS, CONSUMER_ABI, provider);
  
  const gameIdHash = keccak256(toUtf8Bytes(gameId));
  
  for (let i = 0; i < 30; i++) {
    const [, , randomNumber, , , , fulfilled] = await contract.getGameRequest(gameIdHash);
    
    if (fulfilled && randomNumber !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
      return randomNumber;
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error("Timeout waiting for random number");
}
```

## Using the Random Number

```typescript
function deriveRandomValue(randomNumber: string, label: string): number {
  const hash = keccak256(toUtf8Bytes(`${randomNumber}:${label}`));
  return parseInt(hash.slice(2, 10), 16) / 0xffffffff;
}

// Example: Generate random game parameters
const randomNumber = await waitForRandomNumber(gameId);

const eventType = deriveRandomValue(randomNumber, "type") > 0.5 ? "bonus" : "penalty";
const magnitude = 0.5 + deriveRandomValue(randomNumber, "magnitude") * 1.5; // 0.5 to 2.0
const duration = Math.floor(5 + deriveRandomValue(randomNumber, "duration") * 10); // 5 to 15

console.log(`Event: ${eventType}, Magnitude: ${magnitude}x, Duration: ${duration}s`);
```

## Complete Next.js API Route

```typescript
// app/api/game/random/route.ts
import { NextRequest } from "next/server";
import { Contract, JsonRpcProvider, Wallet, keccak256, toUtf8Bytes } from "ethers";

export async function POST(request: NextRequest) {
  const { gameId } = await request.json();
  
  const provider = new JsonRpcProvider(process.env.RPC_URL);
  const signer = new Wallet(process.env.PRIVATE_KEY, provider);
  const contract = new Contract(process.env.CONTRACT_ADDRESS, CONSUMER_ABI, signer);
  
  const gameIdHash = keccak256(toUtf8Bytes(gameId));
  const gasLimit = 180000;
  const fee = await contract.quoteFee(gasLimit);
  
  const tx = await contract.requestRandom(gameIdHash, gasLimit, { value: fee });
  await tx.wait();
  
  return Response.json({ 
    success: true, 
    gameId: gameIdHash,
    message: "Random number requested. Poll /api/game/status to check." 
  });
}

export async function GET(request: NextRequest) {
  const gameId = request.nextUrl.searchParams.get("gameId");
  if (!gameId) return Response.json({ error: "gameId required" }, { status: 400 });
  
  const provider = new JsonRpcProvider(process.env.RPC_URL);
  const contract = new Contract(process.env.CONTRACT_ADDRESS, CONSUMER_ABI, provider);
  
  const [, , randomNumber, , , , fulfilled] = await contract.getGameRequest(gameId);
  
  if (!fulfilled) {
    return Response.json({ status: "pending" });
  }
  
  return Response.json({ 
    status: "fulfilled", 
    randomNumber,
    derived: {
      type: deriveRandomValue(randomNumber, "type"),
      magnitude: deriveRandomValue(randomNumber, "magnitude"),
      duration: deriveRandomValue(randomNumber, "duration")
    }
  });
}
```

## Key Takeaways

1. Always check the fee before requesting: `quoteFee(gasLimit)`
2. Callbacks take 1-2 blocks (2-4 seconds on Base)
3. Use polling or events to detect when randomness is ready
4. Derive multiple values from one random number using different labels
5. Never revert in `entropyCallback` - it's recorded even if it fails

## Live Example

See this in action: [Oracle Gym](https://github.com/koushiknoah77/orcale-gym)

Contract on Base Sepolia: `0x148123bc5b719a7e169ee652a72be387c964b6f4`

## Resources

- [Pyth Entropy Docs](https://docs.pyth.network/entropy)
- [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
- [Entropy Explorer](https://entropy-explorer.pyth.network)
