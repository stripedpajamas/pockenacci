const Pockenacci = require('.')

const pockenacci = new Pockenacci()

pockenacci.setKey('SECRET')

const { ciphertext, mac } = pockenacci.encrypt(
  'THIS IS A SECRET MESSAGE THAT WE NEED TO HIDE we really need to hide it'
)

console.log('CIPHERTEXT:')
ciphertext.forEach((block) => {
  block.forEach((line) => {
    console.log('\t', line)
  })
})
console.log('MAC:')
mac.forEach((block) => {
  block.forEach((line) => {
    console.log('\t', line)
  })
})
