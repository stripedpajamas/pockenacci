const Pockenacci = require('.')

function onKeyNumbering (key) {
  console.log('Got key numbers:\n\t\t', key)
}

function onKeyExpansion (keyBlock) {
  console.log('Got key block:')
  keyBlock.forEach((line) => { console.log('\t\t', line) })
}

function onLoadPlaintext (plaintext) {
  console.log('Loaded initial plaintext:')
  plaintext.forEach((block, idx) => {
    console.log('\tBlock %d', idx)
    block.forEach((line) => {
      console.log('\t\t', line)
    })
  })
}

function onPermuteColumns (ciphertext) {
  console.log('Permuted columns:')
  ciphertext.forEach((block, idx) => {
    console.log('\tBlock %d', idx)
    block.forEach((line) => {
      console.log('\t\t', line)
    })
  })
}

function onPermuteRows (ciphertext) {
  console.log('Permuted rows:')
  ciphertext.forEach((block, idx) => {
    console.log('\tBlock %d', idx)
    block.forEach((line) => {
      console.log('\t\t', line)
    })
  })
}

const pockenacci = new Pockenacci()
  .onKeyNumbering(onKeyNumbering)
  .onKeyExpansion(onKeyExpansion)
  .onLoadPlaintext(onLoadPlaintext)
  .onPermuteColumns(onPermuteColumns)
  .onPermuteRows(onPermuteRows)

pockenacci.setKey('SECRET')
pockenacci.encrypt('THIS IS A SECRET MESSAGE THAT WE NEED TO HIDE we really need to hide it')
