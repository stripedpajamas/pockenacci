const Pockenacci = require('.')

const pockenacci = new Pockenacci()

pockenacci.setKey('SECRET')

const { ciphertext, mac } = pockenacci.encrypt(
  'THIS IS A SECRET MESSAGE THAT WE NEED TO HIDE we really need to hide it'
)

console.log('CIPHERTEXT:\n', ciphertext)
console.log('MAC:\n', mac)