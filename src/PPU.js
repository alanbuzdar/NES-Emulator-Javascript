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

    var image = new Uint8ClampedArray(240*256*4);

    var palette = [
        0x7C7C7C,
        0x0000FC,
        0x0000BC,
        0x4428BC,
        0x940084,
        0xA80020,
        0xA81000,
        0x881400,
        0x503000,
        0x007800,
        0x006800,
        0x005800,
        0x004058,
        0x000000,
        0x000000,
        0x000000,
        0xBCBCBC,
        0x0078F8,
        0x0058F8,
        0x6844FC,
        0xD800CC,
        0xE40058,
        0xF83800,
        0xE45C10,
        0xAC7C00,
        0x00B800,
        0x00A800,
        0x00A844,
        0x008888,
        0x000000,
        0x000000,
        0x000000,
        0xF8F8F8,
        0x3CBCFC,
        0x6888FC,
        0x9878F8,
        0xF878F8,
        0xF85898,
        0xF87858,
        0xFCA044,
        0xF8B800,
        0xB8F818,
        0x58D854,
        0x58F898,
        0x00E8D8,
        0x787878,
        0x000000,
        0x000000,
        0xFCFCFC,
        0xA4E4FC,
        0xB8B8F8,
        0xD8B8F8,
        0xF8B8F8,
        0xF8A4C0,
        0xF0D0B0,
        0xFCE0A8,
        0xF8D878,
        0xD8F878,
        0xB8F8B8,
        0xB8F8D8,
        0x00FCFC,
        0xF8D8F8,
        0x000000,
        0x000000];
    
    this.readStatus = function() {
        var result = status;
        status &= 0b01111111;
        return result;
    }

    this.render = function() {
        //image.fill(0);
        if(stallCpu > 0)
            stallCpu--;

        for(var row=0; row<30; row++){
            for(var col=0; col<32; col++){
                // Converting pixel value to table indices
                var nameT = self.readData(0x2000+col+(row<<5));
                var attrT = self.readData(0x23C0+(col>>2)+((row>>2)<<3))

                var topL = (attrT>>0) & 0b11;
                var topR = (attrT>>2) & 0b11;
                var bottomL = (attrT>>4) & 0b11;
                var bottomR = (attrT>>6) & 0b11;
                var attr = (attrT >> (((row & 0x02) << 1) + (col & 0x02))) & 0x03;
                var pattern = (nameT<<4) + ((ctrl & 0x10)<<8);
                for(var i=0; i<8; i++) {
                    var lowByte = self.readData(pattern+i);
                    var highByte = self.readData(pattern+i+8);
                    for(var bit = 7; bit>=0; bit--){
                        var pixel = (lowByte&1) + ((highByte&1)<<1);
                        lowByte >>=1; highByte>>=1;
                        // Background Pixel
                       // if(pixel == 0) {
                            var color = palette[pixel+(attr << 2)];
                            var destRow = (8*row+i);
                            var destCol = (8*col+bit);
                            var index = 4*((destRow*256)+destCol)
                            image[index] = (color>>16)&0xFF;
                            image[index+1] = (color>>8)&0xFF;
                            image[index+2] = color&0xFF;
                            image[index+3] = 255;
                            //console.log(color);
                            
                       // }
                        //else {
                            //console.log(pixel);
                            
                        //}

                    }
                }
            }
        }
        var context = screen.getContext('2d');
        context.putImageData(new ImageData(image, 256, 240),0,0);
    }

    // Apparently not implemented in many versions, including famicom
    this.readOAM = function() {

    }

    // Nametable mirroring. Currently only supports horizontal and vertical
    this.nameAddr = function(address) {
            if(address == 0x3F10 || address == 0x3F14 || address == 0x3F18 || address == 0x3F1C )
                return address-0x10;
            // Horizontal Mirroring
            if(mirroring&1==0) {
                if( (address >= 0x2400 && address < 0x2800) || (address >= 0x2C00))
                    return address-0x400;
            }
            // Vertical Mirroring
            else {
                if(address > 0x2800)
                    return address - 0x800;
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
                ppuBuffer = vram[self.nameAddr(ppuAddr)];
        }
        else {
            var addr = ((ppuAddr-0x3F00)%0x20)+0x3F00;
            result = vram[addr];
        }
        self.incrementAddr();
        return result;
    }

    this.setCtrl = function(value) {
        ctrl = value;        
    }

    this.setMask = function(value) {
        mask = value;        
    }

    this.setOAddr = function(value) {
        oamAddr = value;        
    }

    this.writeOam = function(value) {
        oam[oamAddr] = value;
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
            ppuAddr += (value&0xFF);                
        }
        firstWrite = !firstWrite;
    }

    this.writeData = function(value) {
        if(ppuAddr <= 0x3EFF) {
            if(ppuAddr < 0x2000)
                chrROM[ppuAddr] = value;
            else
                vram[self.nameAddr(ppuAddr)] = value;
        }
        else {
            var addr = ((ppuAddr-0x3F00)%0x20)+0x3F00;
            vram[addr] = value;
        }
        self.incrementAddr();        
    }

    this.writeDma = function(value) {
        var address = 256*value;
        for(var i=0; i < 256; i++) {
            oam[i] = mem.read(address+i);
            console.log(oam[i])
        }
        stallCpu = 513;
    }

    // Increment Address register based on bit 2 PPU CTRL
    this.incrementAddr = function() {
        ppuAddr += ((ctrl>>2)&1) == 0 ? 1: 32;
    }
}