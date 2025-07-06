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
    
    // Store PPU reference
    self.ppu = ppu;
    self.cpu = null; // Will be set by CPU
    
    // NES controller input support
    var controllerStrobe = 0;
    var lastStrobe = 0;
    var controllerState = 0;
    var controllerShift = 0;
    var writeLogCounter = 0;
    
    self.read = function(address) {
        var result;
        
        if(address < 0x2000)
            result = RAM[address&0x07FF];
        else if(0x8000 <= address && address <= 0xFFFF)
            result = prgROM[(address-0x8000)%prgSize];
        else if(address <= 0x3FFF && address >= 0x2000) {
            var command = (address - 0x2000)%8;
            switch (command) {
                case 2:
                    result = self.ppu.readStatus();
                    break;
                case 4:
                    result = self.ppu.readOAM();
                    break;
                case 7:
                    result = self.ppu.readData();
                    break;
                default:
                    result = 0;
            }
        } else if (address === 0x4016) {
            var value = controllerShift & 1;
            
            // Shift the register AFTER returning the value
            if (!controllerStrobe) controllerShift >>= 1;
            
            return value;
        } else {
            result = 0; // Default for unmapped addresses
        }
        
        return result;
    }

    self.write = function(address, value) {
        if(address >= 0x0000 && address <= 0x07FF) {
            RAM[address & 0x07FF] = value;
        } else if(address >= 0x0800 && address <= 0x1FFF) {
            RAM[address & 0x07FF] = value;
        } else if(address >= 0x700 && address <= 0x7FF) {
            // Just write to RAM for now, don't redirect to OAM
            RAM[address & 0x07FF] = value;

        } else if(address >= 0x2000 && address <= 0x3FFF) {
            var command = (address - 0x2000) % 8;
            switch (command) {
                case 0:
                    self.ppu.setCtrl(value);
                    break;
                case 1:
                    self.ppu.setMask(value);
                    break;
                case 3:
                    self.ppu.setOAddr(value);
                    break;
                case 4:
                    self.ppu.writeOam(value);
                    break;
                case 5:
                    self.ppu.scroll(value);
                    break;
                case 6:
                    self.ppu.writeAddr(value);
                    break;
                case 7:
                    self.ppu.writeData(value);
                    break;
            }
        } else if (address === 0x4016) {
            var oldStrobe = controllerStrobe;
            controllerStrobe = value & 1;
            writeLogCounter++;
            
            if (!controllerStrobe && lastStrobe) { // Only latch when strobe transitions from 1 to 0
                // Use the more responsive keyboardState object
                var keys = (typeof window !== 'undefined' && window.keyboardState) ? window.keyboardState : {};
                
                // Fallback to nesKeys if keyboardState is not available
                if (typeof window !== 'undefined' && !window.keyboardState && window.nesKeys) {
                    keys = window.nesKeys;
                }
                
                controllerState =
                    (keys.A ? 1 : 0) |
                    (keys.B ? 2 : 0) |
                    (keys.Select ? 4 : 0) |
                    (keys.Start ? 8 : 0) |
                    (keys.Up ? 16 : 0) |
                    (keys.Down ? 32 : 0) |
                    (keys.Left ? 64 : 0) |
                    (keys.Right ? 128 : 0);
                controllerShift = controllerState;
            }
            
            lastStrobe = controllerStrobe;
        } else if(address >= 0x4000 && address <= 0x401F) {
            if(address == 0x4014) {
                self.ppu.writeDma(value);
            }
                } else if(address >= 0x6000 && address <= 0x7FFF) {
            if(prgROM) {
                prgROM[(address - 0x6000)%prgSize] = value;
            }
        }
    }

}
