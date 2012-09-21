var FFI = require('ffi');
var ref = require('ref');

var uv = require('./uv');
var types = require('./types');

var _timeouts = {};
var _timeoutid = 0;

function handle_timeout(timeout) {
  if (timeout.func(timeout.data))
    timeout.handle = setTimeout(handle_timeout, interval, timeout);
};

function timeout_add(interval, cb, data) {
  _timeoutid += 1;
  while (_timeouts[_timeoutid])
    _timeoutid += 1; //todo handle overflow (max uint32)

  _timeouts[_timeoutid] = {
    id: _timeoutid,
    interval: interval,
    func: FFI.ForeignFunction(cb, ref.types.uint32, ['pointer']),
    data: data,
  }
  // use setTimeout so common intervals interleave
  _timeouts[_timeoutid].handle = setTimeout(handle_timeout, interval, _timeouts[_timeoutid]);

  return _timeoutid;
}

var timeout_add_fptr = FFI.Callback(ref.types.uint32, [
    ref.types.uint32,
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

var timeout_remove_fptr = FFI.Callback(ref.types.uint32, [ ref.types.uint32 ], timeout_remove);

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
var handle_input_fptr = FFI.Callback(ref.types.void, ['pointer', ref.types.int32, ref.types.int32], handle_input);

function input_add(fd, cond, func, data) {
  _inputid += 1;
  while (_inputs_by_id[_inputid])
    _inputid += 1;

  var handle = {
    fd: fd,
    cond: cond,
    func: FFI.ForeignFunction(func, ref.types.void, ['pointer', ref.types.int32, ref.types.uint32]),
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

var input_add_fptr = FFI.Callback(ref.types.uint32, [
    ref.types.int32,
    ref.types.uint32,
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

var input_remove_fptr = FFI.Callback(ref.types.uint32, [ ref.types.uint32 ], input_remove);

var event_loop_ui = new types.PurpleEventLoopUiOps();
event_loop_ui._pointer.fill(0);
event_loop_ui.timeout_add = timeout_add_fptr;
event_loop_ui.timeout_remove = timeout_remove_fptr;
event_loop_ui.input_add = input_add_fptr;
event_loop_ui.input_remove = input_remove_fptr;
event_loop_ui = event_loop_ui.ref();

module.exports = event_loop_ui;
