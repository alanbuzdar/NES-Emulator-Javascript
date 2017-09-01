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
function Memory(rom, ppu) {
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

        //PPU Control
        if(address <= 0x3FFF && address >= 0x2000) {
            var command = (address - 0x2000)%8;
            switch (command) {
                case 2:
                    return ppu.readStatus();
                    break;
                case 4:
                    return ppu.readOAM();
                    break;
                case 7:
                    return ppu.readData();
            }
        }
    }

    self.write = function(address, value) {
        if(address < 0x2000)
            RAM[address&0x7FF] = value;
        if(0x8000 <= address && address <= 0xFFFF)
            prgROM[address%prgSize] = value;

        //PPU Control
        if(address <= 0x3FFF && address >= 0x2000) {
            var command = (address - 0x2000)%8;
           // console.log(value + " " + command);            
            switch (command) {
                case 0:
                    ppu.setCtrl(value);
                    break;
                case 1:
                    ppu.setMask(value);
                    break;
                case 3:
                    ppu.setOAddr(value);
                    break;
                case 4:
                    ppu.writeOam(value);
                    break;
                case 5:
                    ppu.scroll(value);
                    break;
                case 6:
                    ppu.writeAddr(value);
                    break;
                case 7:
                    ppu.writeData(value);
                    break;    
            }
            
            if(address == 0x4014)
                ppu.writeDma(value);
        }
    }

}