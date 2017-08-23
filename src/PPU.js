// Emulates the PPU used in the NES
// Written by Alan Buzdar

//Initializes CPU
function PPU (screen, rom) {
    var self = this;
    // PPU memory
    var vram = Array(0x4000).fill(0);
    // Object Attribute Memory
    var spriteMem = Array(0x100).fill(0);
    // PPU Control Register 8 bits
    var ctrl = 0;
    // PPU Mask Register 8 bits
    var mask = 0;
    // PPU Status Register 8 bits
    var status = 0;
    // OAMADDR Register 8 bits
    var oamAddr = 0;
    // OAMDATA Register 8 bits
    var oamData = 0;
    // Scroll Control Register 8 bits
    var scroll = 0;
    // PPUADDR Register 8 bits
    var ppuAddr = 0;
    // PPUDATA Register 8 bits
    var ppuData = 0;
    // OAMDMA Register 8 bits
    var dma = 0;
    // PPUADDR buffer
    var ppuBuffer = 0;


    var prgSize = rom[4]*16384;
    var chrSize = rom[5]*8192;
    var chrROM = rom.slice(16+prgSize, 16+prgSize+chrSize);
    
    this.readStatus = function() {
        var result = status;
        status &= 0b01111111;
        return result;
    }

    // Apparently not implemented in many versions, including famicom
    this.readOAM = function() {
        
    }
    
    this.readData = function() {
        if(ppuAddr <= 0x3EFFF) {
            var result = ppuBuffer;
            if(ppuAddr < 0x2000)
                ppuBuffer = chrROM[ppuAddr];

        }

        var addr = ((ppuAddr-0x3F00)%0x20)+0x3F00;
        var result = vram[addr];
        incrementAddr();
        return result;
    }

    this.writeOam = function(value) {
        
    }

    this.scroll = function(value) {
        
    }
    
    this.writeAddr = function(value) {
        
    }

    this.writeData = function(value) {
        
    }

    this.writeDma = function(value) {
        
    }

    // Increment Address register based on bit 2 PPU CTRL
    this.incrementAddr = function() {
        ppuAddr += ((ctrl>>2)&1) == 0 ? 1: 32;
    }
}