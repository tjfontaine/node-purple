var lib = require('./libpurple');
var types = require('./types');

var Status = function (title, type) {
  if (title instanceof Buffer) {
    this.instance = title;
  } else {
    this.instance = lib.purple_savedstatus_new(title, type);
  }
};

Status.UNSET = 0;
Status.OFFLINE = 1;
Status.AVAILABLE = 2;
Status.UNAVAILABLE = 3;
Status.INVISIBLE = 4;
Status.AWAY = 5;
Status.EXTENDED_AWAY = 6;
Status.MOBILE = 7;
Status.TUNE = 8;
Status.MOOD = 9;
Status.NUM_PRIMITIVES = 10;

module.exports = Status;
