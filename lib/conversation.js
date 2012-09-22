var EventEmitter = require('events').EventEmitter;
var util = require('util');

var ref = require('ref');
var ffi = require('ffi');

var lib = require('./libpurple');
var types = require('./types');

var Account = require('./account');

var Conversation = function (type, account, name) {
  var self = this, child, conv_type;

  if (type instanceof Buffer) {
    this.instance = type;
  } else {
    this.instance = lib.purple_conversation_new(type, account, name);
  }

  Object.defineProperty(this, 'type', {
    get: function () {
      if (!conv_type)
        conv_type = lib.purple_conversation_get_type(self.instance);
      return conv_type;
    },
  });

  switch (this.type) {
    case Conversation.IM:
      child = lib.purple_conversation_get_im_data(self.instance);
      defineIM();
      break;
    case Conversation.CHAT:
      child = lib.purple_conversation_get_chat_data(self.instance);
      defineChat();
      break;
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

  function defineIM() {
    self.send = function (message, flags) {
      lib.purple_conv_im_send(child, message);
    }
  }

  function defineChat() {
    self.send = function (message, flags) {
      lib.purple_conv_chat_send(child, message);
    }
  }
};
util.inherits(Conversation, EventEmitter);

Conversation.UNKNOWN = 0;
Conversation.IM =  1;
Conversation.CHAT = 2;
Conversation.MISC = 3;
Conversation.ANY = 4;

module.exports = Conversation;
