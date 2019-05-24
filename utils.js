exports.assertFunc = function (fn) {
  if (typeof fn !== 'function') {
    throw new Error('want function, got ' + typeof fn)
  }
}

exports.assertNum = function (n) {
  if (typeof n !== 'number') {
    throw new Error('want number, got ' + typeof n)
  }
}
