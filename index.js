const utils = require('./utils')

class Pockenacci {
  constructor () {
    this.blockSize = 36
    this.keySize = Math.sqrt(this.blockSize)
    this.key = null

    // events to make UI easier
    this._onKeyNumbering = () => {}
    this._onKeyExpansion = () => {}
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
  setBlockSize (bs) {
    utils.assertNum(bs)
    this.blockSize = bs
    this.keySize = Math.sqrt(bs)
  }
  setKey (keyword) {
    // process the provided key into
    // a key consumable by Pockenacci
    if (keyword.length !== this.keySize) {
      throw new Error('keyword must have length ' + this.keySize)
    }
    this.key = this._numberKey(keyword)
    // expand key into keyblock
    this.keyBlock = this._expandKey()
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
    let keyBlock = new Array(this.keySize + 1).fill(0).map(_ => [])

    // seed the key expansion with the key
    keyBlock[0] = this.key.slice()

    // then compute the rest
    // add the number above and the number above and to the right
    // wrap around if necessary
    for (let row = 1; row <= this.keySize; row++) {
      for (let col = 0; col < this.keySize; col++) {
        let above = keyBlock[row - 1][col]
        let aboveRight = keyBlock[row - 1][(col + 1) % this.keySize]
        keyBlock[row][col] = (above + aboveRight) % 10
      }
    }

    // remove the original key from the block
    keyBlock = keyBlock.slice(1)
    this._onKeyExpansion(keyBlock)
    return keyBlock
  }
}

module.exports = Pockenacci
