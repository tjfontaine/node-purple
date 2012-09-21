var os = require('os');
var path = require('path');

var FFI = require('ffi');
var ref = require('ref');

var LIBRARY_PATHS = [];

switch (os.platform()) {
  case 'darwin':
    //LIBRARY_PATHS.push('/Applications/Adium.app/Contents/Frameworks/libpurple.framework/libpurple');
    //LIBRARY_PATHS.push(path.join(process.env.HOME, 'Applications/Adium.app/Contents/Frameworks/libpurple.framework/libpurple'));
    LIBRARY_PATHS.push('/Users/tjfontaine/Development/adium/Dependencies/build/lib/libpurple.0.dylib');
    break;
  case 'win32':
    break;
  default:
    LIBRARY_PATHS.push('/usr/lib/libpurple.so.0');
    break;
}

exports.LIBRARY_PATHS = LIBRARY_PATHS;

var lib;

var types = require('./lib/types');
var eventloop = require('./lib/eventloop');

var Purple = function (args) {
  var uiops;

  if (!(this instanceof Purple)) {
    return new Purple(args);
  }

  if (!lib) {
    lib = require('./lib/libpurple').initialize(LIBRARY_PATHS);
  }

  if (!args) {
    args = {};
  }

  lib.purple_debug_set_enabled(args.debug ? 1 : 0);

  uiops = new types.PurpleCoreUiOps();
  uiops._pointer.fill(0);

  lib.purple_core_set_ui_ops(uiops);

  lib.purple_eventloop_set_ui_ops(eventloop);

  if (!lib.purple_core_init(args.ui_id ? args.ui_id : 'NodejsPurple')) {
    throw new Error("libpurple failed to initialize");
  }

  if (args.custom_user_directory)
    lib.purple_util_set_user_dir(args.custom_user_directory);

  if (args.custom_plugin_path)
    lib.purple_plugins_add_search_path(args.custom_plugin_path);

  lib.purple_set_blist(lib.purple_blist_new());
  lib.purple_blist_load();
  lib.purple_prefs_load();

  if (args.plugin_save_pref)
    lib.purple_plugins_load_saved(args.plugin_save_pref ? 1 : 0);

  lib.purple_pounces_load();

  var util = require('util');
  Object.defineProperty(this, 'protocols', {
    get: function () {
      var ret = [];
      var list = lib.purple_plugins_get_protocols();
      var data;

      while (!list.isNull()) {
        list = list.deref();

        data = list.data.deref();
        data = data.info.deref();

        ret.push({
          id: data.id,
          name: data.name,
          summary: data.summary,
          description: data.description,
        });

        list = list.next;
      }
      return ret;
    }
  });
};

module.exports = Purple;
