// Emulates the PPU used in the NES
// Written by Alan Buzdar

//Initializes PPU
function PPU (screen, rom, mem) {
    var self = this;
    // PPU memory
    var vram = Array(0x4000).fill(0);
    // Object Attribute Memory
    var oam = Array(0x100).fill(0);

    // PPU Control Register 8 bits
    var ctrl = 0;
    // PPU Mask Register 8 bits
    var mask = 0x1E; // Temporarily enable sprites and background by default
    // PPU Status Register 8 bits
    var status = 0x80; // Set VBlank flag initially so game can proceed
    
    // Make variables accessible for debugging
    self.ctrl = ctrl;
    self.mask = mask;
    self.status = status;
    self.oam = oam;
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
    // First write for scroll that need 2
    var firstWriteScroll = true;
    // Stalling CPU
    var stallCpu = 0;
    // Mirroring mode
    var mirroring = rom[6];
    // Frame counter for VBlank timing
    var frameCounter = 0;
    self.frameCounter = frameCounter;
    self.nmiRequested = false;
    
    // VBlank flag timing
    var vblankSetTime = 0;
    var vblankCleared = false;

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
    
    // Add a buffer to track background palette indices
    var bgPaletteIndex = new Uint8Array(256 * 240);

    this.readStatus = function() {
        var result = status;
        // Clear VBlank flag (bit 7) and Sprite 0 Hit flag (bit 6) when status is read
        status &= 0x3F; // Clear bits 7 and 6
        firstWrite = true;
        firstWriteScroll = true;
        return result;
    }

    this.render = function() {
        // Clear image buffer
        image.fill(0);
        // Clear background palette index buffer
        bgPaletteIndex.fill(0);
        
        if(stallCpu > 0)
            stallCpu--;

        // Reset sprite 0 hit flag
        status &= 0xBF;
        var sprite0HitSet = false;
        
        // Increment frame counter and set VBlank flag every frame
        frameCounter++;
        self.frameCounter = frameCounter;
        status |= 0x80; // Set VBlank flag every frame
        vblankSetTime = frameCounter;
        vblankCleared = false;

        // NMI request at VBlank if enabled
        if (ctrl & 0x80) {
            self.nmiRequested = true;
        }
        
        // Force enable background and sprites after 100 frames
        if (frameCounter > 100) {
            mask |= 0x18; // Force enable background (bit 3) and sprites (bit 4)
        }
        
        // Render background
        if (mask & 0x08) { // Only render if background is enabled
            for(var row=0; row<30; row++){
                for(var col=0; col<32; col++){
                // Converting pixel value to table indices
                var nameT = self.readF(0x2000+col+(row<<5));
                var attrT = self.readF(0x23C0+(col>>2)+((row>>2)<<3))

                var attr = (attrT >> (((row & 0x02) << 1) + (col & 0x02))) & 0x03;
                var pattern = (nameT<<4) + ((ctrl & 0x10)<<8);
                
                // Ensure pattern address is within CHR ROM bounds
                if (pattern >= chrSize) {
                    pattern = pattern % chrSize;
                }
                
                for(var i=0; i<8; i++) {
                    var lowByte = self.readF(pattern+i);
                    var highByte = self.readF(pattern+i+8);
                    for(var bit = 7; bit>=0; bit--){
                        var pixel = (lowByte&1) + ((highByte&1)<<1);
                        lowByte >>=1; highByte>>=1;
                        var destRow = (8*row+i);
                        var destCol = (8*col+bit);
                        var index = 4*((destRow*256)+destCol)
                        // Track palette index for sprite 0 hit detection
                        bgPaletteIndex[destRow*256+destCol] = pixel;
                        // Only render non-transparent pixels
                        if(pixel != 0) {
                            var color = palette[pixel+(attr << 2)];
                            image[index] = (color>>16)&0xFF;
                            image[index+1] = (color>>8)&0xFF;
                            image[index+2] = color&0xFF;
                            image[index+3] = 255;
                        }
                    }
                }
            }
            }
        }
        // Render sprites using the dedicated function
        self.renderSprites(sprite0HitSet, bgPaletteIndex);
        var context = screen.getContext('2d');
        context.putImageData(new ImageData(image, 256, 240),0,0);
    }

    this.readOAM = function() {
        return oam[oamAddr];
    }

    // Render sprites (OAM)
    this.renderSprites = function(sprite0HitSet, bgPaletteIndex) {
        // Check if sprites are enabled
        if (!(mask & 0x10)) {
            return;
        }
        var spriteHeight = (ctrl & 0x20) ? 16 : 8;
        for (var i = 0; i < 64; i++) {
            var spriteY = oam[i * 4] + 1;
            var spriteTile = oam[i * 4 + 1];
            var spriteAttr = oam[i * 4 + 2];
            var spriteX = oam[i * 4 + 3];
            if (spriteY >= 240 || spriteY < 0) continue;
            var flipX = (spriteAttr & 0x40) ? 1 : 0;
            var flipY = (spriteAttr & 0x80) ? 1 : 0;
            var priority = (spriteAttr & 0x20) ? 1 : 0;
            var paletteOffset = (spriteAttr & 0x03) << 2;
            var patternAddr;
            if (spriteHeight == 8) {
                patternAddr = ((ctrl & 0x08) << 9) + (spriteTile << 4);
            } else {
                patternAddr = ((spriteTile & 0x01) << 12) + ((spriteTile & 0xFE) << 4);
            }
            if (patternAddr >= chrSize) {
                patternAddr = patternAddr % chrSize;
            }
            for (var row = 0; row < spriteHeight; row++) {
                var y = spriteY + row;
                if (y < 0 || y >= 240) continue;
                var patternRow = flipY ? (spriteHeight - 1 - row) : row;
                var lowByte = self.readF(patternAddr + patternRow);
                var highByte = self.readF(patternAddr + patternRow + 8);
                for (var col = 0; col < 8; col++) {
                    var x = spriteX + col;
                    if (x < 0 || x >= 256) continue;
                    var patternCol = flipX ? (7 - col) : col;
                    var pixel = ((lowByte >> (7 - patternCol)) & 1) + 
                               (((highByte >> (7 - patternCol)) & 1) << 1);
                    if (pixel == 0) continue;
                    // Sprite 0 hit detection (only set once per frame)
                    if (i == 0 && !sprite0HitSet && bgPaletteIndex[y*256+x] != 0) {
                        status |= 0x40;
                        sprite0HitSet = true;
                    }
                    var bgIndex = 4 * ((y * 256) + x);
                    var bgR = image[bgIndex];
                    var bgG = image[bgIndex + 1];
                    var bgB = image[bgIndex + 2];
                    if (i == 0 && pixel != 0) {
                        // Color sprite 0 pixels bright red for visual debug
                        image[bgIndex] = 255;
                        image[bgIndex + 1] = 0;
                        image[bgIndex + 2] = 0;
                        image[bgIndex + 3] = 255;
                    } else if (priority == 0 || (bgR == 0 && bgG == 0 && bgB == 0)) {
                        var color = palette[pixel + paletteOffset + 16];
                        image[bgIndex] = (color >> 16) & 0xFF;
                        image[bgIndex + 1] = (color >> 8) & 0xFF;
                        image[bgIndex + 2] = color & 0xFF;
                        image[bgIndex + 3] = 255;
                    }
                }
            }
        }
    }

    // Nametable mirroring. Currently only supports horizontal and vertical
    this.nameAddr = function(address) {
            if(address == 0x3F10 || address == 0x3F14 || address == 0x3F18 || address == 0x3F1C )
                return address-0x10;
            // Horizontal Mirroring
            if((mirroring & 1) == 0) {
                if( (address >= 0x2400 && address < 0x2800) || (address >= 0x2C00))
                    return address-0x400;
            }
            // Vertical Mirroring
            else {
                if(address >= 0x2800)
                    return address - 0x800;
            }
            return address;
    }

    this.readF = function(address) {
        var result;
        if(address <= 0x3EFFF) {
            if(address < 0x2000)
                result = chrROM[address];
            else
                result = vram[self.nameAddr(address)];
        }
        else {
            var addr = ((address-0x3F00)%0x20)+0x3F00;
            result = vram[addr];
        }
        
        return result;
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
        // console.log("PPU Control write:", value.toString(16));
        ctrl = value;
        self.ctrl = ctrl;
    }

    this.setMask = function(value) {
        // console.log("PPU Mask write:", value.toString(16), "Background:", (value & 0x08) ? "On" : "Off", "Sprites:", (value & 0x10) ? "On" : "Off");
        
        // Force enable background and sprites after a few frames
        if (self.frameCounter > 100) {
            value |= 0x18; // Force enable background (bit 3) and sprites (bit 4)
            // console.log("Forcing background and sprites enabled");
        }
        
        mask = value;
        self.mask = mask;
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
        if(firstWriteScroll) {
            scrollFH = value&7;
            scrollH = (value>>3)&31;
        }
        else {
            scrollFV = value&7;
            scrollV = (value>>3)&31;  
        }
        firstWriteScroll = !firstWriteScroll;
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
        // console.log("DMA transfer from address:", address.toString(16), "to OAM");
        for(var i=0; i < 256; i++) {
            oam[i] = mem.read(address+i);
        }
        stallCpu = 513;
        
        // Log first few OAM entries after DMA
        // console.log("OAM after DMA - Sprite 0:", oam[0].toString(16), oam[1].toString(16), oam[2].toString(16), oam[3].toString(16));
        // console.log("OAM after DMA - Sprite 1:", oam[4].toString(16), oam[5].toString(16), oam[6].toString(16), oam[7].toString(16));
    }
    
    // Log initial OAM state
    // console.log("Initial OAM state - Sprite 0:", oam[0].toString(16), oam[1].toString(16), oam[2].toString(16), oam[3].toString(16));

    // Increment Address register based on bit 2 PPU CTRL
    this.incrementAddr = function() {
        ppuAddr += ((ctrl & 0x04) == 0) ? 1 : 32;
    }

    this.renderSpritePixels = function(spriteX, spriteY, spriteTile, spriteAttr) {
        var flipX = (spriteAttr & 0x40) ? 1 : 0;
        var flipY = (spriteAttr & 0x80) ? 1 : 0;
        var priority = (spriteAttr & 0x20) ? 1 : 0;
        var paletteOffset = (spriteAttr & 0x03) << 2;
        
        // Calculate pattern table address
        var patternAddr;
        var spriteHeight = (ctrl & 0x20) ? 16 : 8;
        if (spriteHeight == 8) {
            patternAddr = ((ctrl & 0x08) << 9) + (spriteTile << 4);
        } else {
            // 8x16 sprites
            patternAddr = ((spriteTile & 0x01) << 12) + ((spriteTile & 0xFE) << 4);
        }
        
        // Ensure pattern address is within CHR ROM bounds
        if (patternAddr >= chrSize) {
            patternAddr = patternAddr % chrSize;
        }
        
        // Render sprite pixels
        for (var row = 0; row < spriteHeight; row++) {
            var y = spriteY + row;
            if (y < 0 || y >= 240) continue;
            
            var patternRow = flipY ? (spriteHeight - 1 - row) : row;
            var lowByte = self.readF(patternAddr + patternRow);
            var highByte = self.readF(patternAddr + patternRow + 8);
            
            for (var col = 0; col < 8; col++) {
                var x = spriteX + col;
                if (x < 0 || x >= 256) continue;
                
                var patternCol = flipX ? (7 - col) : col;
                var pixel = ((lowByte >> (7 - patternCol)) & 1) + 
                           (((highByte >> (7 - patternCol)) & 1) << 1);
                
                // Skip transparent pixels
                if (pixel == 0) continue;
                
                // Check if background pixel is non-zero (sprite 0 hit)
                var bgIndex = 4 * ((y * 256) + x);
                var bgR = image[bgIndex];
                var bgG = image[bgIndex + 1];
                var bgB = image[bgIndex + 2];
                
                // Sprite 0 hit detection
                if (spriteTile == 0 && bgR != 0 && bgG != 0 && bgB != 0) {
                    status |= 0x40; // Set sprite 0 hit flag
                }
                
                // Background priority check
                if (priority == 0 || (bgR == 0 && bgG == 0 && bgB == 0)) {
                    var color = palette[pixel + paletteOffset + 16]; // Sprite palettes start at index 16 (4 palettes * 4 colors)
                    image[bgIndex] = (color >> 16) & 0xFF;
                    image[bgIndex + 1] = (color >> 8) & 0xFF;
                    image[bgIndex + 2] = color & 0xFF;
                    image[bgIndex + 3] = 255;
                }
            }
        }
    }
}