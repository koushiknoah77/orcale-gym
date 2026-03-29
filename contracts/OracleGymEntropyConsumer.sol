// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

interface IEntropyV2 {
    function getFeeV2(uint32 gasLimit) external view returns (uint128 feeAmount);

    function requestV2(uint32 gasLimit)
        external
        payable
        returns (uint64 assignedSequenceNumber);
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

    function entropyCallback(
        uint64 sequence,
        address provider,
        bytes32 randomNumber
    ) internal virtual;
}

contract OracleGymEntropyConsumer is IEntropyConsumer {
    struct ShockRequest {
        bytes32 sessionKey;
        address provider;
        bytes32 randomNumber;
        uint32 callbackGasLimit;
        uint64 requestedAtBlock;
        uint64 fulfilledAtBlock;
        bool fulfilled;
    }

    IEntropyV2 public immutable entropy;
    address public owner;

    mapping(uint64 => ShockRequest) public requestsBySequence;
    mapping(bytes32 => uint64) public latestSequenceBySession;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event ShockRequested(
        bytes32 indexed sessionKey,
        uint64 indexed sequenceNumber,
        uint32 callbackGasLimit,
        uint256 feePaid
    );
    event ShockFulfilled(
        bytes32 indexed sessionKey,
        uint64 indexed sequenceNumber,
        bytes32 randomNumber
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(address entropyAddress, address initialOwner) {
        require(entropyAddress != address(0), "Entropy address required");

        entropy = IEntropyV2(entropyAddress);
        owner = initialOwner == address(0) ? msg.sender : initialOwner;

        emit OwnershipTransferred(address(0), owner);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner required");

        address previousOwner = owner;
        owner = newOwner;

        emit OwnershipTransferred(previousOwner, newOwner);
    }

    function quoteFee(uint32 gasLimit) public view returns (uint256) {
        return entropy.getFeeV2(gasLimit);
    }

    function requestShock(bytes32 sessionKey, uint32 gasLimit)
        external
        payable
        onlyOwner
        returns (uint64 sequenceNumber)
    {
        uint256 fee = quoteFee(gasLimit);
        require(msg.value == fee, "Incorrect fee");

        sequenceNumber = entropy.requestV2{value: fee}(gasLimit);

        requestsBySequence[sequenceNumber] = ShockRequest({
            sessionKey: sessionKey,
            provider: address(0),
            randomNumber: bytes32(0),
            callbackGasLimit: gasLimit,
            requestedAtBlock: uint64(block.number),
            fulfilledAtBlock: 0,
            fulfilled: false
        });
        latestSequenceBySession[sessionKey] = sequenceNumber;

        emit ShockRequested(sessionKey, sequenceNumber, gasLimit, fee);
    }

    function getEntropy() internal view override returns (address) {
        return address(entropy);
    }

    // Entropy calls this function during the reveal transaction.
    // This callback should not revert because failed callbacks are still recorded by Entropy V2.
    function entropyCallback(
        uint64 sequenceNumber,
        address provider,
        bytes32 randomNumber
    ) internal override {
        ShockRequest storage request = requestsBySequence[sequenceNumber];
        if (request.requestedAtBlock == 0) {
            return;
        }

        request.provider = provider;
        request.randomNumber = randomNumber;
        request.fulfilled = true;
        request.fulfilledAtBlock = uint64(block.number);

        emit ShockFulfilled(request.sessionKey, sequenceNumber, randomNumber);
    }

    function getSessionRequest(bytes32 sessionKey)
        external
        view
        returns (
            uint64 sequenceNumber,
            address provider,
            bytes32 randomNumber,
            uint32 callbackGasLimit,
            uint64 requestedAtBlock,
            uint64 fulfilledAtBlock,
            bool fulfilled
        )
    {
        sequenceNumber = latestSequenceBySession[sessionKey];
        ShockRequest storage request = requestsBySequence[sequenceNumber];

        provider = request.provider;
        randomNumber = request.randomNumber;
        callbackGasLimit = request.callbackGasLimit;
        requestedAtBlock = request.requestedAtBlock;
        fulfilledAtBlock = request.fulfilledAtBlock;
        fulfilled = request.fulfilled;
    }

    function withdraw(address payable recipient, uint256 amount) external onlyOwner {
        require(recipient != address(0), "Recipient required");
        require(address(this).balance >= amount, "Insufficient balance");

        (bool sent, ) = recipient.call{value: amount}("");
        require(sent, "Withdraw failed");
    }
}
