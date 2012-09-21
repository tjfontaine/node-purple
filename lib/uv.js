var ffi = require('ffi');
var ref = require('ref');

module.exports = new ffi.Library(null, {
  uv_handle_size: [ref.types.size_t, [ref.types.uint32]],
  uv_default_loop: [ref.refType(ref.types.void), []],
  uv_poll_init: [ref.types.uint32, [ref.refType(ref.types.void), ref.refType(ref.types.void), ref.types.uint32]],
  uv_poll_start: [ref.types.uint32, [ref.refType(ref.types.void), ref.types.uint32, ref.refType(ref.types.void)]],
  uv_poll_stop: [ref.types.uint32, [ref.refType(ref.types.void)]],
});
