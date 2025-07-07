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
    // === PRG DUMP 0x813d ===
    let prg = rom.slice(16, 16 + rom[4] * 16384);
    // (PRG dump log can be removed if not needed)
    // console.log("=== PRG DUMP 0x813d ===", Array.from(prg.slice(0x013d, 0x013d + 16)).map(b => b.toString(16).padStart(2, '0')).join(' '));
    try {
        // Remove all startup logs
        // Remove all CPU tick logs
        // Remove all main loop logs
        // Remove all frame logs
        // Remove all stuck logs
        // Remove all key state logs
        // (Just delete or comment out the relevant console.log lines)

        mem = new Memory(rom, null); // Create memory first with null PPU
        ppu = new PPU(screen, rom, mem); // Pass memory to PPU
        mem.ppu = ppu; // Update memory's PPU reference
        cpu = new CPU(mem);
        mem.cpu = cpu; // Update memory's CPU reference

        var frameCount = 0;
        var lastPC = cpu.getPC();
        var pcChangeCount = 0;
        var stuckCount = 0;
        var intervalId = setInterval(function() {
            var maxCycles = 1000;
            var cycleCount = 0;
            for (var i = 0; i < maxCycles; i++) {
                if (!ppu.stallCpu) {
                    var oldPC = cpu.getPC();
                    cpu.tick();
                    var newPC = cpu.getPC();
                    cycleCount++;
                    if (newPC === oldPC) {
                        stuckCount++;
                        if (stuckCount > 100) {
                            break;
                        }
                    } else {
                        stuckCount = 0;
                    }
                    if (newPC !== oldPC) {
                        pcChangeCount++;
                    }
                }
            }
            ppu.render();
            frameCount++;
            if (frameCount % 60 === 0) {
                var currentPC = cpu.getPC();
                pcChangeCount = 0;
                document.getElementById('ppu-status').textContent = '0x' + ppu.readStatus().toString(16);
                document.getElementById('ppu-control').textContent = '0x' + ppu.ctrl.toString(16);
                document.getElementById('ppu-mask').textContent = '0x' + ppu.mask.toString(16);
                document.getElementById('oam-data').textContent = '0x' + ppu.oam[0].toString(16) + ' ' + 
                                                               '0x' + ppu.oam[1].toString(16) + ' ' +
                                                               '0x' + ppu.oam[2].toString(16) + ' ' +
                                                               '0x' + ppu.oam[3].toString(16);
            }
        }, 16.67);
    } catch (error) {
        // Optionally keep error log
        // console.log("Error in startEmu:", error);
    }
}

document.getElementById('file-input')
  .addEventListener('change', readFile, false);

var screen = document.getElementById('screen');
var c = screen.getContext('2d');
// Remove canvas context log
// console.log("Canvas context:", !!c);
c.fillStyle = "black"; c.fillRect(0,0,256,240); 