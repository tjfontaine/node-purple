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

var _timeouts = {};
var _timeoutid = 0;

function handle_timeout(timeout) {
  if (timeout.func(timeout.data))
    timeout.handle = setTimeout(handle_timeout, interval, timeout);
};

function timeout_add(interval, cb, data) {
  _timeoutid += 1;
  while (_timeouts[_timeoutid])
    _timeoutid += 1; //todo handle overflow

  _timeouts[_timeoutid] = {
    id: _timeoutid,
    interval: interval,
    func: FFI.ForeignFunction(cb, 'uint32', ['pointer']),
    data: data,
  }
  // use setTimeout so common intervals interleave
  _timeouts[_timeoutid].handle = setTimeout(handle_timeout, interval, _timeouts[_timeoutid]);

  return _timeoutid;
}

var timeout_add_fptr = FFI.Callback('uint32', [
    'uint32',
    ref.refType(ref.types.void),
    ref.refType(ref.types.void),
  ], timeout_add);

function timeout_remove(handle) {
  var timeout = _timeouts[handle];
  if (timeout) {
    clearTimeout(timeout.handle);
    delete _timeouts[handle];
    return 1;
  } else {
    return 0;
  }
}

var timeout_remove_fptr = FFI.Callback('uint32', [ 'uint32' ], timeout_remove);

var uv = require('./lib/uv');

var _inputs_by_id = {};
var _inputs_by_poll = {};
var _inputid = 0;

var uv_poll_size = uv.uv_handle_size(8);
var default_loop = uv.uv_default_loop();

function handle_input(poll_t, stat, events) {
  var handle = _inputs_by_poll[poll_t.address()];
  if (handle) {
    handle.func(handle.data, handle.fd, events);
  }
};
var handle_input_fptr = FFI.Callback('void', ['pointer', 'int32', 'int32'], handle_input);

function input_add(fd, cond, func, data) {
  _inputid += 1;
  while (_inputs_by_id[_inputid])
    _inputid += 1;

  var handle = {
    fd: fd,
    cond: cond,
    func: FFI.ForeignFunction(func, 'void', ['pointer', 'int32', 'uint32']),
    data: data,
  }

  handle.poll_t = new Buffer(uv_poll_size);
  handle.poll_t.fill(0);

  _inputs_by_id[_inputid] = handle;
  _inputs_by_poll[handle.poll_t.address()] = handle;

  uv.uv_poll_init(default_loop, handle.poll_t, fd);
  uv.uv_poll_start(handle.poll_t, cond, handle_input_fptr);

  return _inputid;
}

var input_add_fptr = FFI.Callback('uint32', [
    'int32',
    'uint32',
    ref.refType(ref.types.void),
    ref.refType(ref.types.void),
  ], input_add);

function input_remove(handle) {
  var input = _inputs_by_id[handle];
  if (input) {
    uv.uv_poll_stop(input.poll_t);
    delete _inputs_by_id[handle];
    delete _inputs_by_poll[input.poll_t.address()];
    return 1;
  } else {
    return 0;
  }
}

var input_remove_fptr = FFI.Callback('uint32', [ 'uint32' ], input_remove);

var event_loop_ui = new types.PurpleEventLoopUiOps();
event_loop_ui._pointer.fill(0);
event_loop_ui.timeout_add = timeout_add_fptr;
event_loop_ui.timeout_remove = timeout_remove_fptr;
event_loop_ui.input_add = input_add_fptr;
event_loop_ui.input_remove = input_remove_fptr;
event_loop_ui = event_loop_ui.ref();

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

  lib.purple_eventloop_set_ui_ops(event_loop_ui);

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
