const stringToIp = (str) => str.split(':')[0]

const ipToInt = (ip) => ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0

const binaryToInt = (bstr) => parseInt((bstr + '').replace(/[^01]/gi, ''), 2)

module.exports = (netMask) => ({
  netAddrToBinary: (str) => ipToInt(stringToIp(str)).toString(2).slice(0, netMask),
 
  binaryToNetAddr: (str) => {
    const octetsCount = Math.ceil(netMask / 8)
    const nullCount = 4 - octetsCount
    let result = ''
    for (let i = 1; i < octetsCount + 1; i++) {
      if (i !== 1) result += '.'
      result += binaryToInt(str.slice((i - 1) * 8, i * 8))
    }
    for (let i = 0; i < nullCount; i++) {
      result += '.0'
    }
    return `${result}/${netMask}`
  },
})