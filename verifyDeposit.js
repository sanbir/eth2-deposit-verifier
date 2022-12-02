const ethers = require("ethers")

const ABI = [
    {
        "inputs": [],
        "name": "get_deposit_root",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

// https://github.com/ethereum/consensus-specs/blob/dev/specs/phase0/beacon-chain.md#is_valid_merkle_branch
function is_valid_merkle_branch(leaf, branch, depth, index, root) {
    let value = leaf
    // for i in range(depth):
    //     if index // (2**i) % 2:
    //         value = hash(branch[i] + value)
    //     else:
    //         value = hash(value + branch[i])
    // return value == root

    index = ethers.BigNumber.from(index).toNumber()

    for (let i = 0; i < depth; i++) {
        if (Math.floor(index / Math.pow(2, i)) % 2) {
            value = ethers.utils.sha256(branch[i] + value.substring(2))
        } else {
            value = ethers.utils.sha256(value + branch[i].substring(2))
        }
    }

    return value == root
}

async function main() {
    const RPC_URL = 'https://mainnet.infura.io/v3/f52bd8e7578c435c978ab9cf68cd3a18'
    const depositContractAddress = '0x00000000219ab540356cbb839cbe05303d7705fa'
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL)
    const depositContract = new ethers.Contract(depositContractAddress, ABI, provider)

    const leaf = '0x2732b00a43ab01ce4e2b199c9f93efadfa52fa3bae3791be8395ad95a2191adc'     // deposit_data_root
    const branch = await Promise.all([...Array(32).keys()].map(
        i => provider.getStorageAt(depositContractAddress, i)
    ))
    const depth = 32
    const index = await provider.getStorageAt(depositContractAddress, 32)
    const root = await depositContract.get_deposit_root()

    const is_valid = is_valid_merkle_branch(leaf, branch, depth, index, root)

    console.log(is_valid)
    console.log(`Done.`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
