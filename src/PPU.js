// Emulates the PPU used in the NES
// Written by Alan Buzdar

//Initializes CPU
function PPU () {
    // PPU memory
    var vram = Array(0x8000).fill(0);
    // Object Attribute Memory
    var spriteMem = Array(0x100).fill(0);

}