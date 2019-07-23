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

test('pads with X to block length', (t) => {
  const { encrypt, decrypt } = pockenacci
  const { ciphertext, mac } = encrypt(
    'MESSAGE', 'SECRET'
  )

  t.is(ciphertext.length, 36)
  t.is(mac.length, 36)

  const { plaintext } = decrypt(ciphertext, mac, 'SECRET')

  t.is(plaintext, 'MESSAGEXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
})

test('supports keys > sqrt(blocksize)', (t) => {
  const { encrypt, decrypt } = pockenacci
  const { ciphertext, mac } = encrypt(
    'MESSAGE', 'SECRETKEY'
  )

  t.is(ciphertext, '152Y2X1I23JX15232X152Y2XQ5232X15LK2X')
  t.is(mac, '524106327190354410522440804406864917')

  const { plaintext } = decrypt(ciphertext, mac, 'SECRETKEY')

  t.is(plaintext, 'MESSAGEXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
})

test('throws on keywords < sqrt(blocksize)', (t) => {
  const { encrypt, decrypt } = pockenacci
  t.throws(() => encrypt('anything', 'abc'))
  t.throws(() => decrypt('anything', 'mac', 'abc'))
})
