const test = require('ava')
const pockenacci = require('.')

test('encrypts according to spec', (t) => {
  const { encrypt } = pockenacci
  const { ciphertext, mac } = encrypt(
    'THIS IS A SECRET MESSAGE THAT WE NEED TO HIDE', 'SECRET'
  )

  t.is(ciphertext, '1EMOIMMS1KM0LEIU1K1HVYQIOSPNZ10D4SQM')
  t.is(mac, '084189676048088240286468648248666060')
})

test('decrypts according to spec', (t) => {
  const { decrypt } = pockenacci
  const { plaintext } = decrypt(
    '1EMOIMMS1KM0LEIU1K1HVYQIOSPNZ10D4SQM',
    '084189676048088240286468648248666060',
    'SECRET'
  )

  t.is(plaintext, 'THISISASECRETMESSAGETHATWENEEDTOHIDE')
})

test('throws on invalid mac', (t) => {
  const { decrypt } = pockenacci
  t.throws(() => {
    decrypt(
      '1EMOIMMS1KM0LEIU1K1HVYQIOSPNZ10D4SQM',
      '084189676048088240286468648248666061', // should end in 0
      'SECRET'
    )
  })
})
