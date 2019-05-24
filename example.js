const Pockenacci = require('.')

function onKeyNumbering (key) {
  console.log('Got key numbers:\n\t\t', key)
}

function onKeyExpansion (keyBlock) {
  console.log('Got key block:')
  keyBlock.forEach((line) => { console.log('\t\t', line) })
}

function onLoadPlaintext (plaintext) {
  console.log('Got plaintext:')
  plaintext.forEach((block, idx) => {
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

pockenacci.setKey('SECRET')
pockenacci.loadPlaintext('THIS IS A SECRET MESSAGE THAT WE NEED TO HIDE we really need to hide it')
