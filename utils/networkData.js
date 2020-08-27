const fs = require('fs')

const getMaxRate = (data) => {
  return data
    .map((d) => ({ ...d, rate: d.bytes / d.time }))
    .sort((a, b) => b.rate - a.rate)
}

const getDataFromFile = (path) => {
  return fs.promises.readFile(path)
    .then((data) => data.toString())
    .catch((err) => {
      console.error(err)
      return
    })
}

const parseString = (str) => {
  const [ipSrc, macSrc, ipDst, macDst, isUDP, bytes, time] = str.split(';')
  return { ipSrc, macSrc, ipDst, macDst, isUDP, bytes, time }
}

module.exports = async (path) => {
  let data = await getDataFromFile(path)
  if (!data) {
    return
  }
  data = data.split('\n')
    .map((str) => parseString(str))
    .filter((d) => !!d.ipDst && !!d.ipSrc && !!d.macDst && !!d.macSrc && !!d.bytes && !!d.time)

  return {
    getAvgTransmissionRate: () => {
      if (data.length === 0) {
        console.log('empty array')
        return
      }
      const rateSum = data.map((d) => Number(d.bytes / d.time))
        .reduce((acc, d) => acc + d, 0)
      return rateSum / data.length
    },

    getUniqueNodesCount: () => {
      const nodes = data.reduce((acc, d) => {
        acc.push(d.macSrc)
        acc.push(d.macDst)
        return acc
      }, [])
      const uniqueNodes = new Set(nodes)
      return uniqueNodes.size
    },
    
    getUDPMaxRate: () => getMaxRate(data.filter((d) => d.isUDP))[0],
    
    getTCPMaxRate: () => getMaxRate(data.filter((d) => !d.isUDP))[0],

    getDecadeMaxRate: () => getMaxRate(data).slice(0, 10).map((d) => d.macSrc),

    getDecadeMaxConnections: (converter) => {
      const repeatingAddr = data.map((d) => converter.netAddrToBinary(d.ipSrc))
        .reduce((acc, binaryAddr) => {
          acc[binaryAddr] = (acc[binaryAddr] || 0) + 1
          return acc
        }, {})
      return Object.keys(repeatingAddr)
        .sort((a, b) => repeatingAddr[b] - repeatingAddr[a])
        .slice(0, 10)
        .map((bAddr) => `${converter.binaryToNetAddr(bAddr)} - ${repeatingAddr[bAddr]}`)
    },

    getProxyCandidates: () => {
      const proxyCandidate = data.reduce((acc, d) => {
        const keySrc = `${d.ipSrc}/${d.isUDP}`
        const keyDst = `${d.ipDst}/${d.isUDP}`
        acc[keySrc] = acc[keySrc] ? { ...acc[keySrc], out: [...acc[keySrc].out, keyDst] } : { in: [], out: [keyDst] }
        acc[keyDst] = acc[keyDst] ? { ...acc[keyDst], in: [...acc[keyDst].in, keySrc] } : { in: [keySrc], out: [] }
        return acc
      }, {})

      return Object.keys(proxyCandidate).filter((key) => {
          let count = 0
          if (proxyCandidate[key].in.length > 1 && proxyCandidate[key].out.length > 1) {
            proxyCandidate[key].in.forEach((inp) => {
              count = proxyCandidate[key].out.includes(inp) ? count + 1 : count
            })
          }
          return count > 1
        })
        .map((key) => key.split('/')[0])
    },
  }
}
