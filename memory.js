// NES Memory Handling functions
// Alan Buzdar

// memory (16 bit address bus)
// 0x0000 - 0x07FF RAM
// 0x0800 - 0x1FFF RAM Mirrors
// 0x2000 - 0x2007 PPU
// 0x2008 - 0x3FFF PPU Mirrors
// 0x4000 - 0x4017 APU and I/O
// 0x4018 - 0x401F CPU Test Mode
// 0x4020 - 0xFFFF Cartridge
function Memory(rom) {

    this.RAM = Array(2048);
    this.ROM = rom;

}