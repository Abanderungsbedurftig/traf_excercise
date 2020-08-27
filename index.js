const path = require('path')

const config = require('./config')
const getData = require('./utils/networkData')
const getAddrConverter = require('./utils/addrConverter')

const exit = (message) => {
  console.log(message)
  process.exit(0)
}

const run = async () => {
  console.log('waiting...')
  const file = process.argv[2]
  if (!file) {
    exit('file name not specified')
  }
  const filePath = path.join(__dirname, file)
  const data = await getData(filePath)
  if (!data) {
    exit('file reading error')
  }
  const addrConverter = getAddrConverter(config.NET_MASK)
  const showingData = `
    Q1: ${data.getUniqueNodesCount()}\n
    Q2: ${data.getAvgTransmissionRate().toFixed(0)} bps\n
    Q3: ${data.getUDPMaxRate() > data.getTCPMaxRate()}\n
    Q4:\n\t${data.getDecadeMaxRate().join('\n\t')}\n
    Q5:\n\t${data.getDecadeMaxConnections(addrConverter).join('\n\t')}\n
    Q6:\n\t${data.getProxyCandidates().join('\n\t')}
  `
  console.clear()
  console.log(showingData)
}

process.on('uncaughtException', (err) => {
  console.error('uncaught error', err)
  process.exit(1)
})

run()
