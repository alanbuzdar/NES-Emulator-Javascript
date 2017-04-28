// Entry point to JS
// Alan Buzdar

function readFile(e) {
  var file = e.target.files[0];
  if (!file) {
    return;
  }
  var reader = new FileReader();
  reader.onload = function(e) {
    var contents = new Uint8Array(e.target.result);
    startEmu(contents);
  };
  reader.readAsArrayBuffer(file);
}

function startEmu(rom) {
    mem = new Memory(rom);
    cpu = new CPU(mem);

    // var x = 0;
    // var intervalId = setInterval(function() {
    //   cpu.tick();
    //   if(++x == 4000) window.clearInterval(intervalId);
    // }, 1);

    for(var i=0; i<6000; i++)
      cpu.tick();
}

document.getElementById('file-input')
  .addEventListener('change', readFile, false);

