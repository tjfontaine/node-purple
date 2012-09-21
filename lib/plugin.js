var lib = require('./libpurple');
var PurplePrefType = require('./types').CONSTANTS._PurplePrefType;

var Plugin = function (instance) {
  this.instance = instance;

  Object.defineProperty(this, 'info', {
    get: function () {
      console.log('plugin', this.instance);
      return new PluginInfo(this.instance.info.deref());
    },
  });
};

var PluginInfo = function (instance) {
  this.instance = instance;

  Object.defineProperty(this, 'id', {
    enumerable: true,
    get: function () { return this.instance.id; },
  });

  Object.defineProperty(this, 'name', {
    enumerable: true,
    get: function () { return this.instance.name; },
  });

  Object.defineProperty(this, 'extra_info', {
    get: function () {
      return new ProtocolInfo(this.instance.extra_info.deref());
    }
  });
};

PluginInfo.prototype.toString = function () {
  return { id: this.id, name: this.name }.toString();
};

var ProtocolInfo = function (instance) {
  this.instance = instance;

  Object.defineProperty(this, 'options', {
    get: function () {
      var ret = [];
      var list = this.instance.protocol_options;
      var type;

      while (!list.isNull()) {
        list = list.deref();

        data = list.data.deref();

        switch (data.type) {
          case PurplePrefType.PURPLE_PREF_NONE:
            type = 'None';
            break;
          case PurplePrefType.PURPLE_PREF_BOOLEAN:
            type = 'bool';
            break;
          case PurplePrefType.PURPLE_PREF_INT:
            type = 'int';
            break;
          case PurplePrefType.PURPLE_PREF_STRING:
            type = 'string';
            break;
          case PurplePrefType.PURPLE_PREF_PATH:
            type = 'path';
            break;
          case PurplePrefType.PURPLE_PREF_STRING_LIST:
            type = 'string list';
            break;
          case PurplePrefType.PURPLE_PREF_PATH_LIST:
            type = 'path list';
            break;
        } 

        ret.push({
          type: type,
          name: data.pref_name,
        });

        list = list.next;
      }

      return ret;
    }
  });
};

module.exports = Plugin;
