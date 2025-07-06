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
    try {
        console.log("Starting NES emulator...");
        console.log("ROM size:", rom.length);
        console.log("PRG size:", rom[4] * 16384);
        console.log("CHR size:", rom[5] * 8192);
        console.log("Mirroring:", rom[6]);
        
        // Check reset vector - handle different ROM sizes
        var prgSize = rom[4] * 16384;
        var resetVectorOffset = 16 + prgSize - 4; // Reset vector is at the end of PRG ROM
        var resetLow = rom[resetVectorOffset];
        var resetHigh = rom[resetVectorOffset + 1];
        var resetAddr = resetLow | (resetHigh << 8);
        console.log("Reset vector:", resetAddr.toString(16), "(low:", resetLow.toString(16), "high:", resetHigh.toString(16), ")");
        
        mem = new Memory(rom, null); // Create memory first with null PPU
        ppu = new PPU(screen, rom, mem); // Pass memory to PPU
        mem.ppu = ppu; // Update memory's PPU reference
        cpu = new CPU(mem);
        mem.cpu = cpu; // Update memory's CPU reference
        
        console.log("Initial PC:", cpu.getPC().toString(16));
        
        // Test CPU execution immediately
        console.log("Testing CPU execution...");
        for (var i = 0; i < 5; i++) {
            var oldPC = cpu.getPC();
            cpu.tick();
            var newPC = cpu.getPC();
            console.log("CPU tick", i, "PC:", oldPC.toString(16), "->", newPC.toString(16));
        }
        
        console.log("CPU test completed, final PC:", cpu.getPC().toString(16));
        
        var frameCount = 0;
        console.log("Starting main loop...");
        var intervalId = setInterval(function() {
            // Run CPU for ~29,830 cycles per frame (1.79MHz / 60Hz)
            for (var i = 0; i < 29830; i++) {
                if (!ppu.stallCpu) {
                    cpu.tick();
                }
            }
            
            // Render frame
            ppu.render();
            frameCount++;
            
            // Update debug info every 60 frames (less frequent)
            if (frameCount % 60 === 0) {
                document.getElementById('ppu-status').textContent = '0x' + ppu.readStatus().toString(16);
                document.getElementById('ppu-control').textContent = '0x' + ppu.ctrl.toString(16);
                document.getElementById('ppu-mask').textContent = '0x' + ppu.mask.toString(16);
                document.getElementById('oam-data').textContent = '0x' + ppu.oam[0].toString(16) + ' ' + 
                                                               '0x' + ppu.oam[1].toString(16) + ' ' +
                                                               '0x' + ppu.oam[2].toString(16) + ' ' +
                                                               '0x' + ppu.oam[3].toString(16);
            }
        }, 16.67); // ~60 FPS (1000ms / 60)
        
        console.log("Main loop started successfully");
        
    } catch (error) {
        console.log("Error in startEmu:", error);
    }
}

document.getElementById('file-input')
  .addEventListener('change', readFile, false);

var screen = document.getElementById('screen');
var c = screen.getContext('2d');
console.log("Canvas context:", !!c);
c.fillStyle = "black"; c.fillRect(0,0,256,240); 