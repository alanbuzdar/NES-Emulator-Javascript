// Emulates the MOS 6502 Processor used in the NES
// Written by Alan Buzdar

//Initializes CPU
function CPU (mem) {

    // all memory
    this.memory = mem;
    // program counter (16 bits)
    this.pc = 0;
    // stack pointer (8 bits)
    this.sp = 0xFD;
    // p register (8 bits)
    // carry, zero, interrupt, decimal, BRK, unused, overflow, negative
    this.carry = 0;
    this.zero = 0;
    this.interrupt = 0;
    this.decimal = 0;
    this.BRK = 0;
    this.overflow = 0;
    this.negative = 0;

    // Accumulation register (8 bits)
    this.A = 0;
    // x register (8 bits)
    this.X = 0;
    // y register (8 bits)
    this.Y = 0;
    // clock
    this.clock = 0;

    // Addressing Modes
    // Immediate
    function Im() {
        return readNext();
    }

    // (Indirect, X)
    function IndX() {
        addr = this.memory.read((readNext() + this.X)%256);
        lowerNib = this.memory.read(addr);
        higherNib = this.memory.read(addr+1);
        toRead = (higherNib << 8) || lowerNib;
        return this.memory.read(toRead); 
    }

    // (Indirect), Y
    function IndY() {
        addr = readNext();
        lowerNib = this.memory.read(addr);
        higherNib = this.memory.read(addr+1);
        toRead = (higherNib << 8) || lowerNib;
        return this.memory.read(toRead + this.Y);
    }

    // Zero Page
    function ZP() {
        return this.memory.read(readNext());
    }

    // Zero Page, X
    function ZPX() {
        return this.memory.read((readNext() + this.X)%256);
    }

    // Zero Page, Y
    function ZPY() {
        return this.memory.read((readNext() + this.Y)%256);
    }

    // Absolute
    function Abs() {
        lowerNib = readNext();
        higherNib = readNext();
        addr = (higherNib << 8) | lowerNib;
        return this.memory.read(addr);
    }

    // Absolute X
    function AbsX() {
        lowerNib = readNext();
        higherNib = readNext();
        addr = (higherNib << 8) | lowerNib;
        return this.memory.read(addr+this.X);
    }

    // Absolute Y
    function AbsY() {
        lowerNib = readNext();
        higherNib = readNext();
        addr = (higherNib << 8) | lowerNib;
        return this.memory.read(addr+this.Y);  
     }

     // Fetch next byte
    function readNext() {
        return this.memory.get(this.pc++);
    }

    // Sets Zero Flag based on operand
    function setZero(operand) {
        this.zero = operand == 0 ? 1 : 0;
    }

    // Sets Negative Flag based on operand
    function setNegative(operand) {
        this.negative = operand > 0x7f ? 1 : 0;
    }

    // Operations
    function ORA(operand) {
        operand |= this.A;
        setNegative(operand);
        setZero(operand);
        this.A = operand;
    }

    function AND(operand) {
        operand &= this.A;
        setNegative(operand);
        setZero(operand);
        this.A = operand;
    }

    function EOR(operand) {
        operand ^= this.A;
        setNegative(operand);
        setZero(operand);
        this.A = operand;
    }

    function ASL(operand) {
        // -1 = Accumulator
        temp = operand == -1 ? this.A : this.memory.read(operand);
        this.carry = (temp>>7)&1;
        temp = (temp<<1)&255;
        setNegative(temp);
        setZero(temp);
        if(operand == -1)
            this.A = temp;
        else
            this.memory.write(operand, temp);
    }

    // tick the clock
    function tick() {
        opcode = readNext();
        switch (opcode) {
            // BRK
            case 0x00:
                break;
            // ORA Ind, X
            case 0x01:
                this.clock+=6;
                this.ORA(this.IndX());
                break;  
            // ORA ZP
            case 0x05:
                this.clock+=3;
                this.ORA(this.ZP());
                break;
            // ASL ZP
            case 0x06:
                this.clock+=5;
                this.ASL(this.ZP());
                break;
            // PHP
            case 0x08:
                break;
            // ORA Im
            case 0x09:
                this.clock+=2;
                this.ORA(this.Im());
                break;
            // ASL Acc
            case 0x0A:
                this.clock+=2;
                this.ASL(-1);
                break;
            // ORA Abs
            case 0x0D:
                this.clock+=4;
                this.ORA(this.Abs());
                break;
            // ASL Abs
            case 0x0E:
                this.clock+=6;
                this.ASL(this.Abs());
                break;
            // BPL
            case 0x10:
                break;
            // ORA Ind, Y
            case 0x11:
                this.clock+=6;
                this.ORA(this.IndY());
                break;
            // ORA Z, X
            case 0x15:
                this.clock+=4;
                this.ORA(this.ZPX());
                break;
            // ASL Z, X
            case 0x16:
                this.clock+=6;
                this.ASL(this.ZPX());
                break;
            // CLC
            case 0x18:
                break;
            // ORA Abs, Y
            case 0x19:
                this.clock+=4;
                this.ORA(this.AbsY());
                break;
            // ORA Abs, X
            case 0x1D:
                this.clock+=4;
                this.ORA(this.AbsX());
                break;
            // ASL Abs, X
            case 0x1E:
                this.clock+=7;
                this.ASL(this.AbsX());
                break;
            // JSR
            case 0x20:
                break;
            // AND Ind, X
            case 0x21:
                this.clock+=6;
                this.AND(this.IndX());
                break;
            // BIT ZP
            case 0x24:
                break;
            // AND ZP
            case 0x25:
                this.clock+=3;
                this.AND(this.ZP());
                break;
            // ROL ZP
            case 0x26:
                break;
            // PLP
            case 0x28:
                break;
            // AND Imm
            case 0x29:
                this.clock+=2;
                this.AND(this.Im());
                break;
            // ROL Acc
            case 0x2A:
                break;
            // BIT Abs
            case 0x2C:
                break;
            // AND Abs
            case 0x2D:
                this.clock+=4;
                this.AND(this.Abs());
                break;
            // ROL Abs
            case 0x2E:
                break;
            // BMI
            case 0x30:
                break;
            // AND Ind, Y
            case 0x31:
                this.clock+=5;
                this.AND(this.IndY());
                break;
            // AND Z, X
            case 0x35:
                this.clock+=4;
                this.AND(this.ZPX());
                break;
            // ROL Z, X
            case 0x36:
                break;
            // SEC
            case 0x38:
                break;
            // AND Abs, Y
            case 0x39:
                this.clock+=4;
                this.AND(this.AbsY());
                break;
            // AND Abs, X
            case 0x3D:
                this.clock+=4;
                this.AND(this.AbsX());
                break;
            // ROL Abs, X
            case 0x3E:
                break;
            // RTI
            case 0x40:
                break;
            // EOR Ind, X
            case 0x41:
                this.clock+=4;
                this.EOR(this.IndX());
                break;
            // EOR ZP
            case 0x45:
                this.clock+=3;
                this.EOR(this.ZP());
                break;
            // LSR ZP
            case 0x46:
                break;
            // PHA
            case 0x48:
                break;
            // EOR Imm
            case 0x49:
                this.clock+=2;
                this.EOR(this.Im());
                break;
            // LSR Acc
            case 0x4A:
                break;
            // JMP Abs
            case 0x4C:
                break;
            // EOR Abs
            case 0x4D:
                this.clock+=4;
                this.EOR(this.Abs());
                break;
            // LSR Abs
            case 0x4E:
                break;
            // BVC
            case 0x50:
                break;
            // EOR Ind, Y
            case 0x51:
                this.clock+=5;
                this.EOR(this.IndY());
                break;
            // EOR Z, X
            case 0x55:
                this.clock+=4;
                this.EOR(this.ZPX());
                break;
            // LSR Z, X
            case 0x56:
                break;
            // CLI
            case 0x58:
                break;  
            // EOR Abs, Y
            case 0x59:
                this.clock+=4;
                this.EOR(this.AbsY());
                break;
            // EOR Abs, X
            case 0x5D:
                this.clock+=4;
                this.EOR(this.AbsX());
                break;
            // LSR ABs, X
            case 0x5E:
                break;
            // RTS
            case 0x60:
                break;
            // ADC Ind, X
            case 0x61:
                break;
            // ADC ZP
            case 0x65:
                break;
            // ROR ZP
            case 0x66:
                break;
            // PLA
            case 0x68:
                break;
            // ADC Imm
            case 0x69:
                break;
            // ROR Acc
            case 0x6A:
                break;
            // JMP Ind
            case 0x6C:
                break;
            // ADC Abs
            case 0x6D:
                break;
            // ROR Abs
            case 0x6E:
                break;
            // BVS
            case 0x70:
                break;
            // ADC Ind, Y
            case 0x71:
                break;
            // ADC Z, X
            case 0x75:
                break;
            // ROR Z, X
            case 0x76:
                break;
            // SEI
            case 0x78:
                break;
            // ADC Abs, Y
            case 0x79:
                break;
            // ADC Abs, X
            case 0x7D:
                break;
            // ROR Abs, X
            case 0x7E:
                break;
            // STA Ind, X
            case 0x81:
                break;
            // STY Z
            case 0x84:
                break;
            // STA Z
            case 0x85:
                break;
            // STX Z
            case 0x86:
                break;
            // DEY
            case 0x88:
                break;
            // TXA
            case 0x8A:
                break;
            // STY Abs
            case 0x8C:
                break;
            // STA Abs
            case 0x8D:
                break;
            // STX Abs
            case 0x8E:
                break;
            // BCC
            case 0x90:
                break;
            // STA Ind, Y
            case 0x91:
                break;
            // STY Z, X
            case 0x94:
                break;
            // STA Z, X
            case 0x95:
                break;
            // STX Z, Y
            case 0x96:
                break;
            // TYA
            case 0x98:
                break;
            // STA Abs, Y
            case 0x99:
                break;
            // TXS
            case 0x9A:
                break;
            // STA Abs, X
            case 0x9D:
                break;
            // LDY Imm
            case 0xA0:
                break;
            // LDA Ind, X
            case 0xA1:
                break;
            // LDX Imm
            case 0xA2:
                break;
            // LDY Z
            case 0xA4:
                break;
            // LDA Z
            case 0xA5:
                break;
            // LDX Z
            case 0xA6:
                break;
            // TAY
            case 0xA8:
                break;
            // LDA Imm
            case 0xA9:
                break;
            // TAX
            case 0xAA:
                break;
            // LDY 	Abs
            case 0xAC:
                break;
            // LDA Abs 
            case 0xAD:
                break;  
            // LDX Abs 
            case 0xAE:
                break;
            // BCS
            case 0xB0:
                break;
            // LDA 	Ind, Y 
            case 0xB1:
                break;
            // LDY 	Z, X 
            case 0xB4:
                break;
            // LDA 	Z, X 
            case 0xB5:
                break;
            // LDX 	Z, Y 
            case 0xB6:
                break;
            // CLV
            case 0xB8:
                break;
            // LDA 	Abs, Y 
            case 0xB9:
                break;
            // TSX 
            case 0xBA:
                break;
            // LDY Abs, X 
            case 0xBC:
                break;
            // LDA Abs, X 
            case 0xBD:
                break;
            // LDX Abs, Y
            case 0xBE:
                break;
            // CPY Imm 
            case 0xC0:
                break;
            // CMP Ind, X 
            case 0xC1:
                break;
            // CPY Z 
            case 0xC4:
                break;
            // CMP Z 
            case 0xC5:
                break;
            // DEC Z
            case 0xC6:
                break;
            // INY
            case 0xC8:
                break;
            // CMP Imm 
            case 0xC9:
                break;
            // DEX
            case 0xCA:
                break;
            // CPY Abs 
            case 0xCC:
                break;
            // CMP Abs 
            case 0xCD:
                break;
            // DEC Abs 
            case 0xCE:
                break;
            // BNE
            case 0xD0:
                break;
            // CMP Ind, Y 
            case 0xD1:
                break;
            // CMP Z, X 
            case 0xD5:
                break;
            // DEC Z, X 
            case 0xD6:
                break;
            // CLD 
            case 0xD8:
                break;
            // CMP Abs, Y 
            case 0xD9:
                break;
            // CMP Abs, X 
            case 0xDD:
                break;
            // DEC Abs, X
            case 0xDE:
                break;
            // CPX Imm 
            case 0xE0:
                break;
            // SBC Ind, X 
            case 0xE1:
                break;
            // CPX 	Z 
            case 0xE4:
                break;
            // SBC 	Z 
            case 0xE5:
                break;
            // INC Z 
            case 0xE6:
                break;
            // INX
            case 0xE8:
                break;
            // SBC Imm 
            case 0xE9:
                break;
            // NOP
            case 0xEA:
                break;
            // CPX 	Abs 
            case 0xEC:
                break;
            // SBC Abs 
            case 0xED:
                break;
            // INC Abs 
            case 0xEE:
                break;
            // BEQ
            case 0xF0:
                break;
            // SBC Ind, Y
            case 0xF1:
                break;
            // SBC Z, X 
            case 0xF5:
                break;
            // INC Z, X 
            case 0xF6:
                break;
            // SED
            case 0xF8:
                break;
            // SBC Abs, Y 
            case 0xF9:
                break;
            // SBC Abs, X 
            case 0xFD:
                break;
            // INC Abs, X 
            case 0xFE:
                break;
            
        }
    }

}