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
        this.pc++;
        return this.pc;
    }

    // (Indirect, X)
    function IndX() {
        addr = this.memory.read((this.readNext() + this.X)%256);
        lowerNib = this.memory.read(addr);
        higherNib = this.memory.read(addr+1);
        toRead = (higherNib << 8) || lowerNib;
        return toRead; 
    }

    // (Indirect), Y
    function IndY() {
        addr = this.readNext();
        lowerNib = this.memory.read(addr);
        higherNib = this.memory.read(addr+1);
        toRead = (higherNib << 8) || lowerNib;
        return toRead + this.Y;
    }

    // Zero Page
    function ZP() {
        return this.readNext();
    }

    // Zero Page, X
    function ZPX() {
        return (this.readNext() + this.X)%256;
    }

    // Zero Page, Y
    function ZPY() {
        return (this.readNext() + this.Y)%256;
    }

    // Absolute
    function Abs() {
        lowerNib = this.readNext();
        higherNib = this.readNext();
        addr = (higherNib << 8) | lowerNib;
        return addr;
    }

    // Absolute X
    function AbsX() {
        lowerNib = this.readNext();
        higherNib = this.readNext();
        addr = (higherNib << 8) | lowerNib;
        return addr+this.X;
    }

    // Absolute Y
    function AbsY() {
        lowerNib = this.readNext();
        higherNib = this.readNext();
        addr = (higherNib << 8) | lowerNib;
        return addr+this.Y;  
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

    function setCarry(operand) {
        this.carry = operand > 0xFF ? 1 : 0;
    }

    // Bitwise Operations
    function AND(addr) {
        operand = this.memory.read(addr);
        operand &= this.A;
        this.setNegative(operand);
        this.setZero(operand);
        this.A = operand;
    }

    function ASL(addr) {
        // -1 = Accumulator
        operand = addr == -1 ? this.A : this.memory.read(addr);
        this.setCarry(operand)
        operand = (operand<<1)&0xFF;
        this.setNegative(operand);
        this.setZero(operand);
        if(addr == -1)
            this.A = operand;
        else
            this.memory.write(addr, operand);
    }

    function BIT(addr) {
        operand = this.memory.read(addr);
        this.setNegative(operand);
        this.overflow = (operand>>6)&1;
        operand &= this.A;
        this.setZero(operand);
    }

    function EOR(addr) {
        operand = this.memory.read(addr);
        operand ^= this.A;
        this.setNegative(operand);
        this.setZero(operand);
        this.A = operand;
    }

    function LSR(addr) {
        // -1 = Accumulator
        operand = addr == -1 ? this.A : this.memory.read(addr);
        operand &= 0xFF;
        this.carry = operand&1;
        operand >>= 1;
        this.setNegative(operand);
        this.setZero(operand);
        if(addr == -1)
            this.A = operand;
        else
            this.memory.write(addr, operand);
    }

    function ORA(addr) {
        operand = this.memory.read(addr);
        operand |= this.A;
        this.setNegative(operand);
        this.setZero(operand);
        this.A = operand;
    }

    function ROL(addr) {
        operand = addr == -1 ? this.A : this.memory.read(addr);
        c = this.carry;
        this.carry = (operand>>7)&1;
        operand = (operand<<1)&0xFF;
        operand |= c;
        this.setNegative(operand);
        this.setZero(operand);
        if(operand == -1)
            this.A = operand;
        else
            this.memory.write(addr, operand);
    }

    function ROR(addr) {
        operand = addr == -1 ? this.A : this.memory.read(addr);
        c = this.carry<<7;
        this.carry = operand&1;
        operand = operand>>1;
        operand |= c;
        this.setNegative(operand);
        this.setZero(operand);
        if(addr == -1)
            this.A = operand;
        else
            this.memory.write(addr, operand);
    }

    // Arithmetic Operations
    function ADC(addr) {
        operand = this.memory.read(addr);
        operand = this.A + operand + this.carry;
        this.setCarry(operand);
        operand &= 0xFF;
        this.setNegative(operand);
        this.setZero(operand);
        this.A = operand;
    }

    function DEC(addr) {
        operand = this.memory.read(addr);
        operand = (operand-1)&0xFF;
        this.setNegative(operand);
        this.setZero(operand);
        this.memory.write(addr, operand);
    }

    function DEX() {
        operand = this.X;
        operand = (operand-1)&0xFF;
        this.setNegative(operand);
        this.setZero(operand);
        this.X = operand;
    }

    function DEY() {
        operand = this.Y;
        operand = (operand-1)&0xFF;
        this.setNegative(operand);
        this.setZero(operand);
        this.Y = operand;
    }

    function INC(addr) {
        operand = this.memory.read(addr);
        operand = (operand+1)&0xFF;
        this.setNegative(operand);
        this.setZero(operand);
        this.memory.write(addr, operand);
    }

    function INX() {
        operand = this.X;
        operand = (operand+1)&0xFF;
        this.setNegative(operand);
        this.setZero(operand);
        this.X = operand;
    }

    function INY() {
        operand = this.Y;
        operand = (operand+1)&0xFF;
        this.setNegative(operand);
        this.setZero(operand);
        this.Y = operand;
    }

    function SBC(addr) {
        operand = this.memory.read(addr);
        operand = this.A - operand - (1-this.carry);
        this.setNegative(operand);
        this.setZero(operand)
        this.carry = operand < 0 ? 0:1;
        this.overflow =  ((((this.A^operand)&0x80)!=0 && ((this.A^this.memory.read(addr))&0x80)!=0)?1:0);
        operand &= 0xFF;
        this.A = operand;
    }

    // Register Operations
    function CLC() {
        this.carry = 0;
    }

    function CLD() {
        this.decimal = 0;
    }

    function CLI() {
        this.interrupt = 0;
    }

    function CLV() {
        this.overflow = 0;
    }

    function CMP(addr) {
        operand = this.A - this.memory.read(addr);
        this.carry = operand >= 0? 1:0;
        setNegative(operand);
        setZero(operand);
    }

    function CPX(addr) {
        operand = this.X - this.memory.read(addr);
        this.carry = operand >= 0? 1:0;
        setNegative(operand);
        setZero(operand);
    }

    function CPY(addr) {
        operand = this.Y - this.memory.read(addr);
        this.carry = operand >= 0? 1:0;
        setNegative(operand);
        setZero(operand);
    }

    function SEC() {
        this.carry = 1;
    }

    function SED() {
        this.decimal = 1;
    }

    function SEI() {
        this.interrupt = 1;
    }


    // tick the clock
    function tick() {
        opcode = this.readNext();
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
                this.clock+=2;
                this.CLC();
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
                this.clock+=3;
                this.BIT(ZP());
                break;
            // AND ZP
            case 0x25:
                this.clock+=3;
                this.AND(this.ZP());
                break;
            // ROL ZP
            case 0x26:
                this.clock+=5;
                this.ROL(this.ZP());
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
                this.clock+=2;
                this.ROL(-1);
                break;
            // BIT Abs
            case 0x2C:
                this.clock+=4;
                this.BIT(this.Abs());
                break;
            // AND Abs
            case 0x2D:
                this.clock+=4;
                this.AND(this.Abs());
                break;
            // ROL Abs
            case 0x2E:
                this.clock+=6;
                this.ROL(this.Abs());
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
                this.clock+=6;
                this.ROL(this.ZPX());
                break;
            // SEC
            case 0x38:
                this.clock+=2;
                this.SEC();
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
                this.ROL(this.AbsX());
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
                this.clock+=5;
                this.LSR(this.ZP());
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
                this.clock+=2;
                this.LSR(-1);
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
                this.clock+=6;
                this.LSR(this.Abs());
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
                this.clock+=6;
                this.LSR(this.ZPX());
                break;
            // CLI
            case 0x58:
                this.clock+=2;
                this.CLI();
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
                this.clock+=7;
                this.LSR(this.AbsX());
                break;
            // RTS
            case 0x60:
                break;
            // ADC Ind, X
            case 0x61:
                this.clock+=6;
                this.ADC(this.IndX());
                break;
            // ADC ZP
            case 0x65:
                this.clock+=3;
                this.ADC(this.ZP());
                break;
            // ROR ZP
            case 0x66:
                this.clock+=5;
                this.ROR(this.ZP());
                break;
            // PLA
            case 0x68:
                break;
            // ADC Imm
            case 0x69:
                this.clock+=2;
                this.ADC(this.Im());
                break;
            // ROR Acc
            case 0x6A:
                this.clock+=2;
                this.ROR(-1);
                break;
            // JMP Ind
            case 0x6C:
                break;
            // ADC Abs
            case 0x6D:
                this.clock+=4;
                this.ADC(this.Abs());
                break;
            // ROR Abs
            case 0x6E:
                this.clock+=6;
                this.ROR(this.Abs());
                break;
            // BVS
            case 0x70:
                break;
            // ADC Ind, Y
            case 0x71:
                this.clock+=5;
                this.Abs(this.IndY());
                break;
            // ADC Z, X
            case 0x75:
                this.clock+=4;
                this.ADC(this.ZPX());
                break;
            // ROR Z, X
            case 0x76:
                this.clock+=6;
                this.ROR(this.ZPX());
                break;
            // SEI
            case 0x78:
                this.clock+=2;
                this.SEI();
                break;
            // ADC Abs, Y
            case 0x79:
                this.clock+=4;
                this.ADC(this.AbsY());
                break;
            // ADC Abs, X
            case 0x7D:
                this.clock+=4;
                this.ADC(this.AbsX());
                break;
            // ROR Abs, X
            case 0x7E:
                this.clock+=7;
                this.ROR(this.AbsX());
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
                this.clock+=2;
                this.CLV();
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
                this.clock+=2;
                this.CPY(this.Im());
                break;
            // CMP Ind, X 
            case 0xC1:
                this.clock+=6;
                this.CMP(this.IndX());
                break;
            // CPY Z 
            case 0xC4:
                this.clock+=3;
                this.CPY(this.ZP());
                break;
            // CMP Z 
            case 0xC5:
                this.clock+=3;
                this.CMP(this.ZP());
                break;
            // DEC Z
            case 0xC6:
                this.clock+=5;
                this.DEC(this.ZP());
                break;
            // INY
            case 0xC8:
                this.clock+=2;
                this.INY();
                break;
            // CMP Imm 
            case 0xC9:
                this.clock+=2;
                this.CMP(this.Im());
                break;
            // DEX
            case 0xCA:
                this.clock+=2;
                this.DEX();
                break;
            // CPY Abs 
            case 0xCC:
                this.clock+=4;
                this.CPY(this.Abs());
                break;
            // CMP Abs 
            case 0xCD:
                this.clock+=4;
                this.CMP(this.Abs());
                break;
            // DEC Abs 
            case 0xCE:
                this.clock+=6;
                this.DEC(this.Abs());
                break;
            // BNE
            case 0xD0:
                break;
            // CMP Ind, Y 
            case 0xD1:
                this.clock+=5;
                this.CMP(this.IndY());
                break;
            // CMP Z, X 
            case 0xD5:
                this.clock+=4;
                this.CMP(this.ZPX());
                break;
            // DEC Z, X 
            case 0xD6:
                this.clock+=6;
                this.DEC(this.ZPX());
                break;
            // CLD 
            case 0xD8:
                this.clock+=2;
                this.CLD();
                break;
            // CMP Abs, Y 
            case 0xD9:
                this.clock+=4;
                this.CMP(this.AbsY());
                break;
            // CMP Abs, X 
            case 0xDD:
                this.clock+=4;
                this.CMP(this.AbsX());
                break;
            // DEC Abs, X
            case 0xDE:
                this.clock+=7;
                this.DEC(this.AbsX());
                break;
            // CPX Imm 
            case 0xE0:
                this.clock+=2;
                this.CPX(this.Im());
                break;
            // SBC Ind, X 
            case 0xE1:
                this.clock+=6;
                this.SBC(this.IndX());
                break;
            // CPX 	Z 
            case 0xE4:
                this.clock+=3;
                this.CPX(this.ZP());
                break;
            // SBC 	Z 
            case 0xE5:
                this.clock+=3;
                this.SBC(this.ZP());
                break;
            // INC Z 
            case 0xE6:
                this.clock+=5;
                this.INC(this.ZP());
                break;
            // INX
            case 0xE8:
                this.clock+=2;
                this.INX();
                break;
            // SBC Imm 
            case 0xE9:
                this.clock+=2;
                this.SBC(this.Im());
                break;
            // NOP
            case 0xEA:
                break;
            // CPX 	Abs 
            case 0xEC:
                this.clock+=4;
                this.CPX(this.Abs());
                break;
            // SBC Abs 
            case 0xED:
                this.clock+=4;
                this.SBC(this.Abs());
                break;
            // INC Abs 
            case 0xEE:
                this.clock+=6;
                this.INC(this.Abs());
                break;
            // BEQ
            case 0xF0:
                break;
            // SBC Ind, Y
            case 0xF1:
                this.clock+=5;
                this.SBC(this.IndY());
                break;
            // SBC Z, X 
            case 0xF5:
                this.clock+=4;
                this.SBC(this.ZPX());
                break;
            // INC Z, X 
            case 0xF6:
                this.clock+=6;
                this.INC(this.ZPX());
                break;
            // SED
            case 0xF8:
                this.clock+=2;
                this.SED();
                break;
            // SBC Abs, Y 
            case 0xF9:
                this.clock+=4;
                this.SBC(this.AbsY());
                break;
            // SBC Abs, X 
            case 0xFD:
                this.clock+=4;
                this.SBC(this.AbsX());
                break;
            // INC Abs, X 
            case 0xFE:
                this.clock+=7;
                this.INC(this.AbsX());
                break;
            
        }
    }

}