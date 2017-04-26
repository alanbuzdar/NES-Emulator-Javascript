// NES Memory Handling functions
// Alan Buzdar

// memory (16 bit address bus)
// 0x0000 - 0x07FF RAM
// 0x0800 - 0x1FFF RAM Mirrors
// 0x2000 - 0x2007 PPU
// 0x2008 - 0x3FFF PPU Mirrors
// 0x4000 - 0x4017 APU and I/O
// 0x4018 - 0x401F CPU Test Mode
// 0x4020 - 0x7FFF Rom stuff 
// 0x8000 - 0xFFFF PRG-ROM
function Memory(rom) {
    var self = this;
    var RAM = Array(2048).fill(0);
    var ROM = rom;
    var prgSize = rom[4]*16384;
    var chrSize = rom[5]*8192;
    var prgROM = ROM.slice(16, 16+prgSize);

    self.read = function(address) {
        if(address < 0x2000)
            return RAM[address&0x07FF];
        if(0x8000 <= address && address <= 0xFFFF)
            return prgROM[address%prgSize];
    }

    self.write = function(address, value) {
        if(address < 0x2000)
            RAM[address&0x7FF] = value;
        if(0x8000 <= address && address <= 0xFFFF)
            prgROM[address%prgSize] = value;
    }

}