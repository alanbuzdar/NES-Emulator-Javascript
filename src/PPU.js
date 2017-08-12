// Emulates the PPU used in the NES
// Written by Alan Buzdar

//Initializes CPU
function PPU (screen) {
    // PPU memory
    var vram = Array(0x8000).fill(0);
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
    
    
    
}