const DEFAULTS = {
  blockSize: 36,
  chars: [
    'A', 'B', 'C', 'D', 'E', 'F',
    'G', 'H', 'I', 'J', 'K', 'L',
    'M', 'N', 'O', 'P', 'Q', 'R',
    'S', 'T', 'U', 'V', 'W', 'X',
    'Y', 'Z', '0', '1', '2', '3',
    '4', '5', '6', '7', '8', '9'
  ]
}

function newBlock (blockSize) {
  return new Array(Math.sqrt(blockSize)).fill(0).map(_ => [])
}

function isRawNumeric (key) {
  for (let x of key) {
    if (isNaN(parseInt(x))) return false
  }
  return true
}

function numberKey (keyword) {
  if (isRawNumeric(keyword)) return keyword.split('').map(Number)
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
  keyBlock.unshift(key.slice(0, width))

  // if key is longer than sqrt(blocksize)
  // we need to add those leftovers to the keyblock
  const leftovers = key.slice(width)
  let keyBlockRow = 1
  let keyBlockCol = 0
  while (leftovers.length) {
    if (!keyBlock[keyBlockRow]) {
      keyBlock[keyBlockRow] = []
    }
    if (keyBlock[keyBlockRow].length === width) {
      keyBlockRow++
      break
    }
    keyBlock[keyBlockRow][keyBlockCol] = leftovers.shift()
    keyBlockCol++
  }

  // then compute the rest
  // add the number above and the number above and to the right
  // wrap around if necessary
  for (let row = 1; row <= width; row++) {
    for (let col = 0; col < width; col++) {
      let above = keyBlock[row - 1][col]
      let aboveRight = keyBlock[row - 1][(col + 1) % width]
      // mix any part of the key that went beyond sqrt(blocksize)
      // into the resulting expanded key
      keyBlock[row][col] = ((keyBlock[row][col] || 0) + (above + aboveRight)) % 10
    }
  }

  // remove the original key from the block
  keyBlock = keyBlock.slice(1)
  return keyBlock
}

function getKeyBlock (keyword, options = {}) {
  // process the provided key into
  // a key consumable by pockenacci
  const { blockSize, reverse } = Object.assign({}, options, DEFAULTS)
  if (keyword.length < Math.sqrt(blockSize)) {
    throw new Error('keyword must have length at least ' + Math.sqrt(blockSize))
  }
  const keyBlock = Object.freeze(
    expandKey(numberKey(keyword), blockSize).map(Object.freeze)
  )
  // why -4 ? because the last three keys are reserved for MAC creation
  let keyIdx = reverse ? keyBlock.length - 4 : 0

  return {
    getNextKey () { return keyBlock[reverse ? keyIdx-- : keyIdx++] },
    getFullKey () { return keyBlock },
    getMacKey () { return keyBlock.slice(-3) }
  }
}

function blockify (input, blockSize) {
  // first pad the input to a multiple of the block length
  let pt = input.toUpperCase().replace(/\s/g, '')
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
function permuteColumns (input, key, options = {}) {
  // we need to run this operation on all blocks
  const cmp = (a, b) => options.reverse ? a >= b : a <= b
  for (let idx = 0; idx < input.length; idx++) {
    const block = input[idx]
    for (let col = 0; col < block.length; col++) {
      for (let shift = key[col] % block.length; shift > 0; shift--) {
        const top = options.reverse ? block.length - 1 : 0
        const bottom = options.reverse ? 0 : block.length - 1
        const inc = options.reverse ? -1 : 1

        let prev = block[bottom][col]
        for (let row = top; cmp(row, bottom); row += inc) {
          let temp = block[row][col]
          block[row][col] = prev
          prev = temp
        }
      }
    }
  }
}

// input array is mutated
function permuteRows (input, key, options = {}) {
  // we need to run this operation on all blocks
  const get = (arr) => options.reverse ? arr.shift() : arr.pop()
  const set = (arr, x) => options.reverse ? arr.push(x) : arr.unshift(x)
  for (let idx = 0; idx < input.length; idx++) {
    const block = input[idx]
    for (let row = 0; row < block.length; row++) {
      for (let shift = key[row] % block.length; shift > 0; shift--) {
        set(block[row], get(block[row]))
      }
    }
  }
}

// input array is mutated
function substitute (input, key, options = { chars: [] }) {
  // iterate through entire block and shift row
  // according to the current key
  const getSubstitution = (current, key, chars) => options.reverse
    ? chars[((current - key) + chars.length) % chars.length]
    : chars[(current + key) % chars.length]

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
        block[row][col] = getSubstitution(currentIdx, key[col], options.chars)
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

function calculateMac (input, chars, fullKeyBlock, keys) {
  const macBlocks = mapCiphertextToKey(input, chars, fullKeyBlock)
  permuteRows(macBlocks, keys[0])
  permuteColumns(macBlocks, keys[1])
  substitute(macBlocks, keys[2], { macMode: true })

  return macBlocks
}

function encrypt (plaintext, keyword, options = {}) {
  if (!keyword) throw new Error('cannot encrypt without a key')

  // produce key block from keyword
  const { blockSize, chars } = Object.assign({}, options, DEFAULTS)
  const { getFullKey, getNextKey, getMacKey } = getKeyBlock(keyword, { blockSize })

  const blocks = blockify(plaintext, blockSize)

  permuteColumns(blocks, getNextKey())
  permuteRows(blocks, getNextKey())
  substitute(blocks, getNextKey(), { chars })

  const macBlocks = calculateMac(blocks, chars, getFullKey(), getMacKey())

  // join everything together
  const ciphertext = blocks
    .map(block => block
      .map(line => line.join(''))
      .join('')
    ).join('')
  const mac = macBlocks
    .map(block => block
      .map(line => line.join(''))
      .join('')
    ).join('')

  return { ciphertext, mac }
}

function decrypt (ciphertext, mac, keyword, options = {}) {
  if (!keyword) throw new Error('cannot decrypt without a key')

  // produce key block from keyword
  const reverse = true
  const { blockSize, chars } = Object.assign({}, options, DEFAULTS)
  const { getFullKey, getNextKey, getMacKey } = getKeyBlock(keyword, { blockSize, reverse })

  const blocks = blockify(ciphertext, blockSize)

  // check validity of ciphertext based on mac
  const macBlocks = calculateMac(blocks, chars, getFullKey(), getMacKey(), { reverse })
  const expectedMac = macBlocks
    .map(block => block
      .map(line => line.join(''))
      .join('')
    ).join('')
  if (mac !== expectedMac) {
    throw new Error('invalid ciphertext')
  }

  substitute(blocks, getNextKey(), { chars, reverse })
  permuteRows(blocks, getNextKey(), { reverse })
  permuteColumns(blocks, getNextKey(), { reverse })

  // join everything together
  const plaintext = blocks
    .map(block => block
      .map(line => line.join(''))
      .join('')
    ).join('')

  return { plaintext }
}

module.exports = { encrypt, decrypt }
