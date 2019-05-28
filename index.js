const utils = require('./utils')

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
    this.charMap = new Map()
    this.chars.forEach((char, idx) => { this.charMap.set(char, idx) })

    this.blockSize = 36
    this.width = Math.sqrt(this.blockSize)
    this.key = null

    this.usedKeys = 0
  }
  setBlockSize (bs) {
    utils.assertNum(bs)
    this.blockSize = bs
    this.width = Math.sqrt(bs)
    return this
  }
  setKey (keyword) {
    // process the provided key into
    // a key consumable by Pockenacci
    if (keyword.length !== this.width) {
      throw new Error('keyword must have length ' + this.width)
    }
    this.key = this._numberKey(keyword)
    // expand key into keyblock
    this.keyBlock = this._expandKey()
  }
  encrypt (plaintext) {
    this._loadPlaintext(plaintext)
    this._permuteColumns()
    this._permuteRows()
    this._substitute()
    this._calculateMac()
    const { ciphertext, mac } = this

    return { ciphertext, mac }
  }
  _newBlock () {
    return new Array(this.width).fill(0).map(_ => [])
  }
  _numberKey (keyword) {
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
  _expandKey () {
    // a keyblock is a 6x6 array
    // so that the 6-digit keys can be
    // consumed easily
    let keyBlock = this._newBlock()
    // seed the key expansion with the key
    keyBlock.push([])
    keyBlock[0] = this.key.slice()

    // then compute the rest
    // add the number above and the number above and to the right
    // wrap around if necessary
    for (let row = 1; row <= this.width; row++) {
      for (let col = 0; col < this.width; col++) {
        let above = keyBlock[row - 1][col]
        let aboveRight = keyBlock[row - 1][(col + 1) % this.width]
        keyBlock[row][col] = (above + aboveRight) % 10
      }
    }

    // remove the original key from the block
    keyBlock = keyBlock.slice(1)
    return keyBlock
  }
  _loadPlaintext (plaintext) {
    // first pad the plaintext to a multiple of the block length
    let pt = plaintext.toUpperCase().replace(/\s/g, '')
    while (pt.length % this.blockSize !== 0) {
      pt += 'X'
    }

    const ptBlocks = []
    for (let blockIdx = 0; blockIdx * this.blockSize < pt.length; blockIdx++) {
      const idx = blockIdx * this.blockSize
      ptBlocks.push(
        this._loadBlock(
          pt.slice(idx, idx + this.blockSize)
        )
      )
    }

    // the blockified plaintext is the beginnings of the ciphertext
    this.ciphertext = ptBlocks
  }
  _loadBlock (pt) {
    // place this blocksize-length plaintext into a block format
    const ptBlock = this._newBlock()
    let ptIdx = 0
    for (let row = 0; row < this.width; row++) {
      for (let col = 0; col < this.width; col++) {
        ptBlock[row][col] = pt[ptIdx++]
      }
    }
    return ptBlock
  }
  _permuteColumns (input = this.ciphertext) {
    const key = this.keyBlock.slice(this.usedKeys, this.usedKeys + 1).pop()
    this.usedKeys++

    // we need to run this operation on all blocks
    for (let idx = 0; idx < input.length; idx++) {
      const block = input[idx]
      for (let col = 0; col < this.width; col++) {
        for (let shift = key[col] % this.width; shift > 0; shift--) {
          let prev = block[block.length - 1][col]
          for (let row = 0; row < this.width; row++) {
            let temp = block[row][col]
            block[row][col] = prev
            prev = temp
          }
        }
      }
    }
  }
  _permuteRows (input = this.ciphertext) {
    const key = this.keyBlock.slice(this.usedKeys, this.usedKeys + 1).pop()
    this.usedKeys++

    // we need to run this operation on all blocks
    for (let idx = 0; idx < input.length; idx++) {
      const block = input[idx]
      for (let row = 0; row < this.width; row++) {
        for (let shift = key[row] % this.width; shift > 0; shift--) {
          block[row].unshift(block[row].pop())
        }
      }
    }
  }
  _substitute () {
    const key = this.keyBlock.slice(this.usedKeys, this.usedKeys + 1).pop()
    this.usedKeys++

    // iterate through entire block and shift row
    // according to the current key
    for (let idx = 0; idx < this.ciphertext.length; idx++) {
      const block = this.ciphertext[idx]
      for (let row = 0; row < this.width; row++) {
        for (let col = 0; col < this.width; col++) {
          const currentVal = block[row][col]
          const currentIdx = this.charMap.get(currentVal)
          const subIdx = (currentIdx + key[col]) % this.chars.length
          block[row][col] = this.chars[subIdx]
        }
      }
    }
  }
  _substituteMac () {
    const key = this.keyBlock.slice(this.usedKeys, this.usedKeys + 1).pop()
    this.usedKeys++

    for (let idx = 0; idx < this.mac.length; idx++) {
      const block = this.mac[idx]
      for (let row = 0; row < this.width; row++) {
        for (let col = 0; col < this.width; col++) {
          const currentVal = block[row][col]
          block[row][col] = (currentVal + key[col]) % 10
        }
      }
    }
  }
  _calculateMac () {
    this._mapCiphertextToKey()
    this._permuteRows(this.mac)
    this._permuteColumns(this.mac)
    this._substituteMac()
  }
  _mapCiphertextToKey () {
    const flattenedKey = this.keyBlock.reduce((acc, line) => acc.concat(line), [])
    const macBlocks = []
    for (let idx = 0; idx < this.ciphertext.length; idx++) {
      const block = this.ciphertext[idx]
      const mac = this._newBlock()

      for (let row = 0; row < this.width; row++) {
        for (let col = 0; col < this.width; col++) {
          mac[row][col] = flattenedKey[this.charMap.get(block[row][col])]
        }
      }

      macBlocks.push(mac)
    }
    this.mac = macBlocks
  }
}

module.exports = Pockenacci
