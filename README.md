# pockenacci

a quick PoC JS implementation of Justin Troutman's [Pockenacci](https://github.com/justintroutman/pocketblock/blob/master/pockenacci.md) block cipher

```javascript
const Pockenacci = require('.')

const pockenacci = new Pockenacci()

pockenacci.setKey('SECRET')

const { ciphertext, mac } = pockenacci.encrypt(
  'THIS IS A SECRET MESSAGE THAT WE NEED TO HIDE we really need to hide it'
)
/*
ciphertext:
  1EMOIM MS1KM0 LEIU1K 1HVYQI OSPNZ1 0D4SQM
  5TV355 5L43PM 5DT35M 1E5OIM QY53M5 LX5UZ5

mac:
  084189 676048 088240 286468 648248 666060
  868047 468089 608000 888040 648664 680664
*/

try {
  const { plaintext } = pockenacci.decrypt(ciphertext, mac, 'SECRET')
} catch (e) {
  // throws on invalid mac
}

/*
plaintext:
  THIS IS A SECRET MESSAGE THAT WE NEED TO HIDE we really need to hide it
*/
```

## todo
- [x] key expansion
- [x] encryption
- [x] mac checking
- [x] decryption

## License
MIT