const Pockenacci = require('.')

function onKeyNumbering (key) {
  console.log('Got key numbers:\n\t\t', key)
}

function onKeyExpansion (keyBlock) {
  console.log('Got key block:')
  keyBlock.forEach((line) => { console.log('\t\t', line) })
}

const pockenacci = new Pockenacci()
  .onKeyNumbering(onKeyNumbering)
  .onKeyExpansion(onKeyExpansion)

pockenacci.setKey('SECRET')
