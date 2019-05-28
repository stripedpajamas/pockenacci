function newBlock (blockSize) {
  return new Array(Math.sqrt(blockSize)).fill(0).map(_ => [])
}

function numberKey (keyword) {
  const sortedKey = keyword
    .split('')
    .map((letter, idx) => ({ letter, idx }))
    .sort((a, b) => {
      if (a.letter < b.letter) return -1
      if (b.letter < a.letter) return 1
      return 0
    })
  const key = []
  let counter = 1
  for (let el of sortedKey) {
    key[el.idx] = counter++
  }
  return key
}

function expandKey (key, blockSize) {
  const width = Math.sqrt(blockSize)
  // a keyblock is a 6x6 array
  // so that the 6-digit keys can be
  // consumed easily
  let keyBlock = newBlock(blockSize)
  // seed the key expansion with the key
  keyBlock.push([])
  keyBlock[0] = key.slice()

  // then compute the rest
  // add the number above and the number above and to the right
  // wrap around if necessary
  for (let row = 1; row <= width; row++) {
    for (let col = 0; col < width; col++) {
      let above = keyBlock[row - 1][col]
      let aboveRight = keyBlock[row - 1][(col + 1) % width]
      keyBlock[row][col] = (above + aboveRight) % 10
    }
  }

  // remove the original key from the block
  keyBlock = keyBlock.slice(1)
  return keyBlock
}

function blockifyPlaintext (plaintext, blockSize) {
  // first pad the plaintext to a multiple of the block length
  let pt = plaintext.toUpperCase().replace(/\s/g, '')
  while (pt.length % blockSize !== 0) {
    pt += 'X'
  }

  const width = Math.sqrt(blockSize)

  const ptBlocks = []
  for (let blockIdx = 0; blockIdx * blockSize < pt.length; blockIdx++) {
    const idx = blockIdx * blockSize
    const chunk = pt.slice(idx, idx + blockSize)

    const ptBlock = newBlock(blockSize)
    let ptIdx = 0
    for (let row = 0; row < width; row++) {
      for (let col = 0; col < width; col++) {
        ptBlock[row][col] = chunk[ptIdx++]
      }
    }

    ptBlocks.push(ptBlock)
  }

  return ptBlocks
}

// input array is mutated
function permuteColumns (input, key) {
  // we need to run this operation on all blocks
  for (let idx = 0; idx < input.length; idx++) {
    const block = input[idx]
    for (let col = 0; col < block.length; col++) {
      for (let shift = key[col] % block.length; shift > 0; shift--) {
        let prev = block[block.length - 1][col]
        for (let row = 0; row < block.length; row++) {
          let temp = block[row][col]
          block[row][col] = prev
          prev = temp
        }
      }
    }
  }
}

// input array is mutated
function permuteRows (input, key) {
  // we need to run this operation on all blocks
  for (let idx = 0; idx < input.length; idx++) {
    const block = input[idx]
    for (let row = 0; row < block.length; row++) {
      for (let shift = key[row] % block.length; shift > 0; shift--) {
        block[row].unshift(block[row].pop())
      }
    }
  }
}

// input array is mutated
function substitute (input, key, options = { chars: [], macMode: false }) {
  // iterate through entire block and shift row
  // according to the current key
  for (let idx = 0; idx < input.length; idx++) {
    const block = input[idx]
    for (let row = 0; row < block.length; row++) {
      for (let col = 0; col < block.length; col++) {
        const currentVal = block[row][col]
        if (options.macMode) {
          block[row][col] = (currentVal + key[col]) % 10
          continue
        }
        const currentIdx = options.chars.indexOf(currentVal)
        const subIdx = (currentIdx + key[col]) % options.chars.length
        block[row][col] = options.chars[subIdx]
      }
    }
  }
}

function mapCiphertextToKey (input, chars, keyBlock) {
  const charMap = new Map()
  chars.forEach((char, idx) => { charMap.set(char, idx) })

  const flattenedKey = keyBlock.reduce((acc, line) => acc.concat(line), [])
  const macBlocks = []
  for (let idx = 0; idx < input.length; idx++) {
    const block = input[idx]
    const mac = newBlock(flattenedKey.length)

    for (let row = 0; row < block.length; row++) {
      for (let col = 0; col < block.length; col++) {
        mac[row][col] = flattenedKey[charMap.get(block[row][col])]
      }
    }

    macBlocks.push(mac)
  }

  return macBlocks
}

// keys are consumed from remainingKeys (array is modified)
function calculateMac (input, chars, fullKeyBlock, remainingKeys) {
  const macBlocks = mapCiphertextToKey(input, chars, fullKeyBlock)
  permuteRows(macBlocks, remainingKeys.shift())
  permuteColumns(macBlocks, remainingKeys.shift())
  substitute(macBlocks, remainingKeys.shift(), { macMode: true })

  return macBlocks
}

class Pockenacci {
  constructor () {
    this.chars = [
      'A', 'B', 'C', 'D', 'E', 'F',
      'G', 'H', 'I', 'J', 'K', 'L',
      'M', 'N', 'O', 'P', 'Q', 'R',
      'S', 'T', 'U', 'V', 'W', 'X',
      'Y', 'Z', '0', '1', '2', '3',
      '4', '5', '6', '7', '8', '9'
    ]

    this.blockSize = 36
    this.keyBlock = null
  }
  setBlockSize (bs) {
    this.blockSize = bs
    return this
  }
  setKey (keyword) {
    // process the provided key into
    // a key consumable by Pockenacci
    if (keyword.length !== Math.sqrt(this.blockSize)) {
      throw new Error('keyword must have length ' + Math.sqrt(this.blockSize))
    }

    // expand key into keyblock
    this.keyBlock = expandKey(numberKey(keyword), this.blockSize)
    return this
  }
  encrypt (plaintext) {
    if (!this.keyBlock) throw new Error('setKey before encrypting')

    const keys = this.keyBlock.slice()
    const blocks = blockifyPlaintext(plaintext, this.blockSize)

    permuteColumns(blocks, keys.shift())
    permuteRows(blocks, keys.shift())
    substitute(blocks, keys.shift(), { chars: this.chars })

    const mac = calculateMac(blocks, this.chars, this.keyBlock, keys)

    return { ciphertext: blocks, mac }
  }
}

module.exports = Pockenacci
