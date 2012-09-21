var lib = require('./libpurple');
var Plugin = require('./plugin');

var Connection = function (account, register, password) {
  if (account instanceof Buffer) {
    this.instance = account;
  }

  Object.defineProperty(this, 'prpl', {
    get: function () {
      return new Plugin(lib.purple_connection_get_prpl(this.instance.deref()));
    },
  });
};

module.exports = Connection;
