var purple = require('./purple');

var p = new purple({
  //debug: true,
});

p.protocols.forEach(function(prpl) {
  console.log(prpl.id, prpl.name);
});
