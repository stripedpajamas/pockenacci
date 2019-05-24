const utils = require('./utils')

class Pockenacci {
  constructor () {
    this.blockSize = 36
    this.width = Math.sqrt(this.blockSize)
    this.key = null

    // events to make UI easier
    this._onKeyNumbering = () => {}
    this._onKeyExpansion = () => {}
    this._onLoadPlaintext = () => {}
  }
  onKeyNumbering (fn) {
    utils.assertFunc(fn)
    this._onKeyNumbering = fn
    return this
  }
  onKeyExpansion (fn) {
    utils.assertFunc(fn)
    this._onKeyExpansion = fn
    return this
  }
  onLoadPlaintext (fn) {
    utils.assertFunc(fn)
    this._onLoadPlaintext = fn
    return this
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
  loadPlaintext (plaintext) {
    this.plaintext = this._loadPlaintext(plaintext)
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
    this._onKeyNumbering(key)
    return key
  }
  _expandKey () {
    // a keyblock is a 6x6 array
    // so that the 6-digit keys can be
    // consumed easily
    let keyBlock = new Array(this.width + 1).fill(0).map(_ => [])

    // seed the key expansion with the key
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
    this._onKeyExpansion(keyBlock)
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

    this._onLoadPlaintext(ptBlocks)
    return ptBlocks
  }
  _loadBlock (pt) {
    // place this blocksize-length plaintext into a block format
    const ptBlock = new Array(this.width).fill(0).map(_ => [])
    let ptIdx = 0
    for (let row = 0; row < this.width; row++) {
      for (let col = 0; col < this.width; col++) {
        ptBlock[row][col] = pt[ptIdx++]
      }
    }
    return ptBlock
  }
}

module.exports = Pockenacci
