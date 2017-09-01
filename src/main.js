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
    ppu = new PPU(screen, rom);
    mem = new Memory(rom, ppu);
    cpu = new CPU(mem);
    
    var x = 0;
    var intervalId = setInterval(function() {
      for(i=0; i<20; i++){
        if( /*x%3 == 0 && */ !ppu.stallCpu)
          cpu.tick();
      }
      ppu.render();
      x++;
      }, 17);

}

document.getElementById('file-input')
  .addEventListener('change', readFile, false);

var screen = document.getElementById('screen');
var c = screen.getContext('2d');
c.fillStyle = "black"; c.fillRect(0,0,256,240); 