// Emulates the PPU used in the NES
// Written by Alan Buzdar

//Initializes CPU
function PPU (screen, rom) {
    var self = this;
    // PPU memory
    var vram = Array(0x4000).fill(0);
    // Object Attribute Memory
    var oam = Array(0x100).fill(0);
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
    // Scroll Control Registers
    var scrollH = 0;
    var scrollFH = 0;
    var scrollV = 0;
    var scrollFV = 0;
    var countH = 0;
    var countFH = 0;
    var countV = 0;
    var countFV = 0
    // PPUADDR Register 16 bits
    var ppuAddr = 0;
    // PPUDATA Register 8 bits
    var ppuData = 0;
    // OAMDMA Register 8 bits
    var dma = 0;
    // PPUADDR buffer
    var ppuBuffer = 0;
    // First write for registers that need 2
    var firstWrite = true;
    // Stalling CPU
    var stallCpu = 0;
    // Mirroring mode
    var mirroring = rom[6];

    var prgSize = rom[4]*16384;
    var chrSize = rom[5]*8192;
    var chrROM = rom.slice(16+prgSize, 16+prgSize+chrSize);
    
    this.readStatus = function() {
        var result = status;
        status &= 0b01111111;
        return result;
    }

    this.render = function() {

    }

    // Apparently not implemented in many versions, including famicom
    this.readOAM = function() {

    }

    // Nametable mirroring. Currently only supports horizontal and vertical
    this.nameAddr = function(address) {
            // Horizontal Mirroring
            if(mirroring&1==0) {
                if( (address >= $2400 && address < $2800) || (address >= $2C00))
                    return address-$400;
            }
            // Vertical Mirroring
            else {
                if(address > $2800)
                    return address - $800;
            }
            return address;
    }
    
    this.readData = function() {
        var result;
        if(ppuAddr <= 0x3EFFF) {
            result = ppuBuffer;
            if(ppuAddr < 0x2000)
                ppuBuffer = chrROM[ppuAddr];
            else
                ppuBuffer = vram[nameAddr(ppuAddr)];
        }
        else {
            var addr = ((ppuAddr-0x3F00)%0x20)+0x3F00;
            result = vram[addr];
        }
        incrementAddr();
        return result;
    }

    this.writeOam = function(value) {
        oam[oamAddr] == value;
        oamAddr++;
        oamAddr %= 0x100;        
    }

    this.scroll = function(value) {
        if(firstWrite) {
            scrollFH = value&7;
            scrollH = (value>>3)&31;
        }
        else {
            scrollFV = value&7;
            scrollV = (value>>3)&31;  
        }
        firstWrite = !firstWrite;
    }
    
    this.writeAddr = function(value) {
        if(firstWrite) {
            ppuAddr = (value<<8);
        }
        else {
            ppuAddr += value&0xFF;                
        }
        firstWrite = !firstWrite;
    }

    this.writeData = function(value) {
        if(ppuAddr <= 0x3EFFF) {
            if(ppuAddr < 0x2000)
                chrROM[ppuAddr] = value;
            else
                vram[nameAddr(ppuAddr)] = value;
        }
        else {
            var addr = ((ppuAddr-0x3F00)%0x20)+0x3F00;
            vram[addr] = value;
        }
        incrementAddr();        
    }

    this.writeDma = function(value) {
        var address = 256*value;
        for(var i=0; i < 256; i++) {
            oam[i] = mem.RAM[address+i];
            
        }
        stallCpu = 513;
    }

    // Increment Address register based on bit 2 PPU CTRL
    this.incrementAddr = function() {
        ppuAddr += ((ctrl>>2)&1) == 0 ? 1: 32;
    }
}