var EventEmitter = require('events').EventEmitter;
var util = require('util');

var ref = require('ref');
var ffi = require('ffi');

var lib = require('./libpurple');
var types = require('./types');

var Account = require('./account');

var Conversation = function (type, account, name) {
  var self = this;

  if (type instanceof Buffer) {
    this.instance = type;
  } else {
    this.instance = lib.purple_conversation_new(type, account, name);
  }

  Object.defineProperty(this, 'account', {
    get: function () {
      return new Account(lib.purple_conversation_get_account(self.instance));
    },
    set: function (value) {
      lib.purple_conversation_set_account(self.instance, value.instance);
    },
  });

  Object.defineProperty(this, 'title', {
    get: function () {
      return lib.purple_conversation_get_title(self.instance);
    },
    set: function (value) {
      lib.purple_conversation_set_account(self.instance, value);
    },
  });

  Object.defineProperty(this, 'name', {
    get: function () {
      return lib.purple_conversation_get_name(self.instance);
    },
    set: function (value) {
      lib.purple_conversation_set_name(self.instance, value);
    },
  });

  this.send = function (message, flags) {
    var type = lib.purple_conversation_get_type(self.instance);
    var child;
    flags = types.CONSTANTS[''].PURPLE_MESSAGE_AUTO_RESP;
    switch (type) {
      case Conversation.IM:
        child = lib.purple_conversation_get_im_data(self.instance);
        lib.purple_conv_im_send(child, message);
        break;
      case Conversation.CHAT:
        child = lib.purple_conversation_get_chat_data(self.instance);
        lib.purple_conv_chat_send(child, message);
        break;
    };
  }
};
util.inherits(Conversation, EventEmitter);

Conversation.UNKNOWN = 0;
Conversation.IM =  1;
Conversation.CHAT = 2;
Conversation.MISC = 3;
Conversation.ANY = 4;

var IM = function (instance) {
  this.instance = instance;
};

module.exports = Conversation;
