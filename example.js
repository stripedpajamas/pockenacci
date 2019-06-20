const { encrypt } = require('.')

const { ciphertext, mac } = encrypt(
  'THIS IS A SECRET MESSAGE THAT WE NEED TO HIDE we really need to hide it',
  'SECRET'
)

console.log('CIPHERTEXT:\n', ciphertext)
console.log('MAC:\n', mac)