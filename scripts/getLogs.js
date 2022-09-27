const { Contract, providers, utils } = require('ethers')
const { existsSync, readFileSync, writeFileSync } = require("fs")
const { ethToCosmos, ethToOsmosis, ethToEvmos } = require('@tharsis/address-converter')

const magicTxAddress = "0xdb41965Dd2ca8214F913809C4429B18b8C50a1b0"
const magicTxAbi = [{ "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "sender", "type": "address" }, { "indexed": false, "internalType": "bytes", "name": "data", "type": "bytes" }], "name": "MagicTxData", "type": "event" }, { "stateMutability": "nonpayable", "type": "fallback" }, { "inputs": [{ "internalType": "bytes", "name": "data", "type": "bytes" }], "name": "magicTxData", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "string", "name": "memo", "type": "string" }], "name": "magicTxMemo", "outputs": [], "stateMutability": "nonpayable", "type": "function" }]

const provider = new providers.JsonRpcProvider("https://eth.bd.evmos.org:8545")
const contract = new Contract(magicTxAddress, magicTxAbi, provider)

const main = async () => {

  const startBlock = 4919243
  const endBlock = await provider.getBlockNumber()
  let events

  const fn = `events-${startBlock}-${endBlock}.json`
  if (!existsSync(fn)) {
    events = await readEvents(contract, "MagicTxData", startBlock, endBlock)
    writeFileSync(fn, JSON.stringify(events, null, "  ") + "\n", "utf8")
  } else {
    events = JSON.parse(readFileSync(fn, "utf8"))
  }

  const memoTable = events.map(e => {
    const [sender, data] = e.args
    const evmosAddress = ethToEvmos(sender)
    const memo = utils.toUtf8String(data)
    return { ethAddr: sender, evmosAddress, memo }
  })

  console.table(memoTable)
}

async function readEvents(contract, filter, startBlock, endBlock) {
  let allEvents = []
  const blockStep = 5000

  for (let i = startBlock; i < endBlock; i += blockStep) {
    const _startBlock = i
    const _endBlock = Math.min(endBlock, i + blockStep - 1)
    console.log(`Read events at blocks ${_startBlock}-${_endBlock}`)
    const events = (await contract.queryFilter(filter, _startBlock, _endBlock))
    for (let k = 0; k < events.length; k++) {
      const { args } = contract.interface.parseLog(events[k])
      events[k].args = args
    }
    allEvents = [...allEvents, ...events]
  }
  return allEvents.filter(e => !e.removed).sort((a, b) => {
    let deltaBlock = a.blockNumber - b.blockNumber
    let deltaTxIdx = a.transactionIndex - b.transactionIndex
    return deltaBlock !== 0 ? deltaBlock : (deltaTxIdx !== 0 ? deltaTxIdx : a.logIndex - b.logIndex)
  })
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
