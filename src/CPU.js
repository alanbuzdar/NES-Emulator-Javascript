// Emulates the MOS 6502 Processor used in the NES
// Written by Alan Buzdar

//Initializes CPU
function CPU (mem) {
    const DEBUG = false;
        
    // all memory
    var memory = mem;
    // program counter (16 bits)
    var pc = DEBUG ? 0xC000 : memory.read(0xFFFC) | (memory.read(0xFFFD) << 8);
    // stack pointer (8 bits)
    var sp = 0xFD;
    // p register (8 bits)
    // carry, zero, interrupt, decimal, brk, unused, overflow, negative
    var carry = 0;
    var zero = 0;
    var interrupt = 0;
    var decimal = 0;
    var brk = 0;
    var overflow = 0;
    var negative = 0;
    setFlags(0x24);
    // Accumulation register (8 bits)
    var A = 0;
    // x register (8 bits)
    var X = 0;
    // y register (8 bits)
    var Y = 0;
    // clock
    var clock = 0;
    // debug counter
    var debugCounter = 0;
    var lastPC = 0;

    if(DEBUG)
        document.getElementById("debug").innerHTML = '<textarea id="textarea" cols="80" rows="40" style="resize: none;" data-role="none"></textarea>'


    // Stack
    function push(value) {
        memory.write((sp--)|0x100, value);
        sp = (sp&0xFF);
    }

    function pop() {
        sp++;
        sp = sp&0xFF;
        return memory.read(sp|0x100);
    }

    // Addressing Modes
    // Immediate
    function Im() {
        return pc++;
    }

    // Indirect Absolute
    function Ind() {
        lowerNib = readNext();
        higherNib = readNext();
        toRead = (higherNib << 8) | lowerNib;
        secondByte = (higherNib << 8) | ((lowerNib+1)&0xFF);

        return memory.read(toRead) | (memory.read(secondByte)<<8);        
    }

    // (Indirect, X)
    function IndX() {
        addr = (readNext() + X)&0xFF;
        lowerNib = memory.read(addr);
        higherNib = memory.read((addr+1)&0xFF);
        toRead = (higherNib << 8) | lowerNib;
        return toRead; 
    }

    // (Indirect), Y
    function IndY() {
        addr = readNext();
        lowerNib = memory.read(addr);
        higherNib = memory.read((addr+1)&0xFF);
        toRead = (higherNib << 8) | lowerNib;
        result = (toRead+Y)&0xFFFF;
        clock += ((toRead&0xFF00) != (result&0xFF00)? 1 : 0);
        return result;
    }

    // Zero Page
    function ZP() {
        return readNext();
    }

    // Zero Page, X
    function ZPX() {
        return (readNext() + X)%256;
    }

    // Zero Page, Y
    function ZPY() {
        return (readNext() + Y)%256;
    }

    // Absolute
    function Abs() {
        lowerNib = readNext();
        higherNib = readNext();
        addr = (higherNib << 8) | lowerNib;
        return addr;
    }

    // Absolute X
    function AbsX() {
        lowerNib = readNext();
        higherNib = readNext();
        addr = (higherNib << 8) | lowerNib;
        result = (addr+X)&0xFFFF;
        clock += ((addr&0xFF00) != (result&0xFF00)? 1 : 0);

        return result;
    }

    // Absolute Y
    function AbsY() {
        lowerNib = readNext();
        higherNib = readNext();
        addr = (higherNib << 8) | lowerNib;
        result = (addr+Y)&0xFFFF;
        clock += ((addr&0xFF00) != (result&0xFF00)? 1 : 0);

        return result;  
     }

     // Fetch next byte
    function readNext() {
        return memory.read(pc++);
    }

    // Sets all flags from 8 bit int
    function setFlags(status) {
        carry = status&1;
        zero = (status>>1)&1;
        interrupt = (status>>2)&1;
        decimal = (status>>3)&1;
        brk = (status>>4)&1;
        overflow = (status>>6)&1;
        negative = (status>>7)&1;
    }

    // Sets Zero Flag based on operand
    function setZero(operand) {
        zero = operand == 0 ? 1 : 0;
    }

    // Sets Negative Flag based on operand
    function setNegative(operand) {
        negative = (operand>>7)&1 ? 1 : 0;
    }

    function setCarry(operand) {
        carry = operand > 0xFF ? 1 : 0;
    }

    // Bitwise Operations
    function AND(addr) {
        operand = memory.read(addr);
        operand &= A;
        setNegative(operand);
        setZero(operand);
        A = operand;
    }

    function ASL(addr) {
        // -1 = Accumulator
        operand = addr == -1 ? A : memory.read(addr);
        carry = (operand>>7)&1;
        operand = (operand<<1)&0xFF;
        setNegative(operand);
        setZero(operand);
        if(addr == -1)
            A = operand;
        else
            memory.write(addr, operand);
    }

    function BIT(addr) {
        operand = memory.read(addr);
        setNegative(operand);
        overflow = (operand>>6)&1;
        operand &= A;
        setZero(operand);
    }

    function EOR(addr) {
        operand = memory.read(addr);
        operand ^= A;
        setNegative(operand);
        setZero(operand);
        A = operand;
    }

    function LSR(addr) {
        // -1 = Accumulator
        operand = addr == -1 ? A : memory.read(addr);
        operand &= 0xFF;
        carry = operand&1;
        operand >>= 1;
        setNegative(operand);
        setZero(operand);
        if(addr == -1)
            A = operand;
        else
            memory.write(addr, operand);
    }

    function ORA(addr) {
        operand = memory.read(addr);
        operand |= A;
        setNegative(operand);
        setZero(operand);
        A = operand;
    }

    function ROL(addr) {
        operand = addr == -1 ? A : memory.read(addr);
        c = carry;
        carry = (operand>>7)&1;
        operand = (operand<<1)&0xFF;
        operand |= c;
        setNegative(operand);
        setZero(operand);
        if(addr == -1)
            A = operand;
        else
            memory.write(addr, operand);
    }

    function ROR(addr) {
        operand = addr == -1 ? A : memory.read(addr);
        c = carry<<7;
        carry = operand&1;
        operand = operand>>1;
        operand |= c;
        setNegative(operand);
        setZero(operand);
        if(addr == -1)
            A = operand;
        else
            memory.write(addr, operand);
    }

    // Arithmetic Operations
    function ADC(addr) {
        var load = memory.read(addr);
        operand = A + load + carry;
        overflow = (!((A ^ load) & 0x80) && ((A ^ operand) & 0x80))?1:0;
        setCarry(operand);
        operand &= 0xFF;
        setNegative(operand);
        setZero(operand);
        A = operand;
    }

    function DEC(addr) {
        operand = memory.read(addr);
        operand = (operand-1)&0xFF;
        setNegative(operand);
        setZero(operand);
        memory.write(addr, operand);
    }

    function DEX() {
        operand = X;
        operand = (operand-1)&0xFF;
        setNegative(operand);
        setZero(operand);
        X = operand;
    }

    function DEY() {
        operand = Y;
        operand = (operand-1)&0xFF;
        setNegative(operand);
        setZero(operand);
        Y = operand;
    }

    function INC(addr) {
        operand = memory.read(addr);
        operand = (operand+1)&0xFF;
        setNegative(operand);
        setZero(operand);
        memory.write(addr, operand);
    }

    function INX() {
        operand = X;
        operand = (operand+1)&0xFF;
        setNegative(operand);
        setZero(operand);
        X = operand;
    }

    function INY() {
        operand = Y;
        operand = (operand+1)&0xFF;
        setNegative(operand);
        setZero(operand);
        Y = operand;
    }

    function SBC(addr) {
        operand = memory.read(addr);
        operand = A - operand - (1-carry);
        setNegative(operand);
        setZero(operand)
        carry = operand < 0 ? 0:1;
        overflow =  ((((A^operand)&0x80)!=0 && ((A^memory.read(addr))&0x80)!=0)?1:0);
        operand &= 0xFF;
        A = operand;
    }

    // Jump Operations
    function JMP(addr) {
        pc = addr;
    }

    function JSR(addr) {
        pc--;
        push((pc>>8)&0xFF);
        push(pc&0xFF);
        pc = addr;
    }

    function RTI() {
        PLP();
        pc = pop();
        pc += (pop()<<8);

    }

    function RTS() {
        pc = pop();
        pc |= (pop()<<8);
        pc++;
        // TODO handle 0xFFFF for music
    }


    // Register Operations
    function CLC() {
        carry = 0;
    }

    function CLD() {
        decimal = 0;
    }

    function CLI() {
        interrupt = 0;
    }

    function CLV() {
        overflow = 0;
    }

    function CMP(addr) {
        var memValue = memory.read(addr);
        operand = A - memValue;
        carry = operand >= 0? 1:0;
        setNegative(operand);
        setZero(operand&0xFF);
        if(zero == 1) carry = 1;
        

    }

    function CPX(addr) {
        operand = X - memory.read(addr);
        carry = operand >= 0? 1:0;
        setNegative(operand);
        setZero(operand&0xFF);
        if(zero == 1) carry = 1;
    }

    function CPY(addr) {
        operand = Y - memory.read(addr);
        carry = operand >= 0? 1:0;
        setNegative(operand);
        setZero(operand&0xFF);
        if(zero == 1) carry = 1;
    }

    function SEC() {
        carry = 1;
    }

    function SED() {
        decimal = 1;
    }

    function SEI() {
        interrupt = 1;
    }

    // Storage Operations
    function LDA(addr) {
        operand = memory.read(addr);
        setNegative(operand);
        setZero(operand);
        A = operand;
    }

    function LDX(addr) {
        operand = memory.read(addr);
        setNegative(operand);
        setZero(operand);
        X = operand;
    }

    function LDY(addr) {
        operand = memory.read(addr);
        setNegative(operand);
        setZero(operand);
        Y = operand;
    }

    function STA(addr) {
        memory.write(addr, A);
    }

    function STX(addr) {
        memory.write(addr,X);
    }

    function STY(addr) {
        memory.write(addr,Y);
    }

    function TAX() {
        setNegative(A);
        setZero(A);
        X = A;
    }

    function TAY() {
        setNegative(A);
        setZero(A);
        Y = A;
    }

    function TSX() {
        X = sp;
        setNegative(X);
        setZero(X);
    }

    function TXA() {
        setNegative(X);
        setZero(X);
        A = X;
    }

    function TXS() {
        sp = X&0xFF;
    }

    function TYA() {
        setNegative(Y);
        setZero(Y);
        A = Y;
    }

    // Branch operations
    function BCC(offset) {
        addr = memory.read(offset);
        if(addr<128)
            addr += pc;
        else
            addr += pc-256;
        
        if(carry==0) {
            clock += ((pc&0xFF00) != (addr&0xFF00)? 2 : 1);
            pc = addr;
        }
    }
    
    function BCS(offset) {
        addr = memory.read(offset);
        if(addr<128)
            addr += pc;
        else
            addr += pc-256;
        
        if(carry==1) {
            clock += ((pc&0xFF00) != (addr&0xFF00)? 2 : 1);
            pc = addr;
        }
    }

    function BEQ(offset) {
        addr = memory.read(offset);
        if(addr<128)
            addr += pc;
        else
            addr += pc-256;
        

        
        if(zero==1) {
            clock += ((pc&0xFF00) != (addr&0xFF00)? 2 : 1);
            pc = addr;
        }
    }

    function BMI(offset) {
        addr = memory.read(offset);
        if(addr<128)
            addr += pc;
        else
            addr += pc-256;
        
        if(negative==1) {
            clock += ((pc&0xFF00) != (addr&0xFF00)? 2 : 1);
            pc = addr;
        }
    }

    function BNE(offset) {
        addr = memory.read(offset);
        if(addr<128)
            addr += pc;
        else
            addr += pc-256;
        

        
        if(zero==0) {
            clock += ((pc&0xFF00) != (addr&0xFF00)? 2 : 1);
            pc = addr;
        }
    }

    function BPL(offset) {
        addr = memory.read(offset);
        if(addr<128)
            addr += pc;
        else
            addr += pc-256;
        
        if(negative==0) {
            clock += ((pc&0xFF00) != (addr&0xFF00)? 2 : 1);
            pc = addr;
        }
    }

    function BVC(offset) {
        addr = memory.read(offset);
        if(addr<128)
            addr += pc;
        else
            addr += pc-256;
        
        if(overflow==0) {
            clock += ((pc&0xFF00) != (addr&0xFF00)? 2 : 1);
            pc = addr;
        }
    }

    function BVS(offset) {
        addr = memory.read(offset);
        if(addr<128)
            addr += pc;
        else
            addr += pc-256;
        
        if(overflow==1) {
            clock += ((pc&0xFF00) != (addr&0xFF00)? 2 : 1);
            pc = addr;
        }
    }

    // Stack operations
    function PHA() {
        push(A);
    }

    function getP() {
            return carry|
            (zero<<1)|
            (interrupt<<2)|
            (decimal<<3)|
            (brk<<4)|
            (1<<5)|
            (overflow<<6)|
            (negative<<7)
    }

    function PHP() {
        push(
            (getP()|0x10)
        );
    }

    function PLA() {
        A = pop();
        setZero(A);
        setNegative(A);
    }

    function PLP() {
        status = pop();
        status &= 0xEF;
        setFlags(status);
    }

    // System operations
    function BRK() {
        pc+=2;
        push((pc>>8)&0xFF);
        push(pc&0xFF);
        PHP();
        pc = memory.read(0xFFFE) | (memory.read(0xFFFF) << 8);
        pc--;
    }

    function d2h(d) {
        var s = (d&0xFF).toString(16);
        if(s.length < 2) {
            s = '0' + s;
        }
        return s;
    }
    // Getter for PC
    this.getPC = function() {
        return pc;
    }
    
    // tick the clock
    this.tick = function() {
        // NMI handling
        if (memory.ppu && memory.ppu.nmiRequested) {
            memory.ppu.nmiRequested = false;
            // Push PC and status to stack
            push((pc >> 8) & 0xFF);
            push(pc & 0xFF);
            push(getP() & 0xEF); // Clear B flag
            // Set PC to NMI vector
            pc = memory.read(0xFFFA) | (memory.read(0xFFFB) << 8);
            // Set interrupt disable flag
            interrupt = 1;
            clock += 7; // NMI takes 7 cycles
            return;
        }
        if(DEBUG){
            var CYC = (clock*3)%341;
            document.getElementById("textarea").innerHTML += ((pc<0x1000 ? "0" : "") + pc.toString(16)+" A:"+d2h(A)+" X:"+d2h(X)+" Y:"+d2h(Y)+" P:"+d2h(getP())+" SP:"+d2h(sp)+" CYC:"+(CYC < 10 ? " " : "")+(CYC < 100 ? " " : "") + CYC + "&#13");
        }
        var opcode = readNext();
        

        

        

        
        switch (opcode) {
            // BRK
            case 0x00:
                clock+=7;
                BRK();
                break;
            // ORA Ind, X
            case 0x01:
                clock+=6;
                ORA(IndX());
                break;  
            // ORA ZP
            case 0x05:
                clock+=3;
                ORA(ZP());
                break;
            // ASL ZP
            case 0x06:
                clock+=5;
                ASL(ZP());
                break;
            // PHP
            case 0x08:
                clock+=3;
                PHP();
                break;
            // ORA Im
            case 0x09:
                clock+=2;
                ORA(Im());
                break;
            // ASL Acc
            case 0x0A:
                clock+=2;
                ASL(-1);
                break;
            // ORA Abs
            case 0x0D:
                clock+=4;
                ORA(Abs());
                break;
            // ASL Abs
            case 0x0E:
                clock+=6;
                ASL(Abs());
                break;
            // BPL
            case 0x10:
                clock+=2;
                BPL(Im());
                break;
            // ORA Ind, Y
            case 0x11:
                clock+=5;
                ORA(IndY());
                break;
            // ORA Z, X
            case 0x15:
                clock+=4;
                ORA(ZPX());
                break;
            // ASL Z, X
            case 0x16:
                clock+=6;
                ASL(ZPX());
                break;
            // CLC
            case 0x18:
                clock+=2;
                CLC();
                break;
            // ORA Abs, Y
            case 0x19:
                clock+=4;
                ORA(AbsY());
                break;
            // ORA Abs, X
            case 0x1D:
                clock+=4;
                ORA(AbsX());
                break;
            // ASL Abs, X
            case 0x1E:
                clock+=7;
                ASL(AbsX());
                break;
            // JSR
            case 0x20:
                clock+=6;
                JSR(Abs());
                break;
            // AND Ind, X
            case 0x21:
                clock+=6;
                AND(IndX());
                break;
            // BIT ZP
            case 0x24:
                clock+=3;
                BIT(ZP());
                break;
            // AND ZP
            case 0x25:
                clock+=3;
                AND(ZP());
                break;
            // ROL ZP
            case 0x26:
                clock+=5;
                ROL(ZP());
                break;
            // PLP
            case 0x28:
                clock+=4;
                PLP();
                break;
            // AND Imm
            case 0x29:
                clock+=2;
                AND(Im());
                break;
            // ROL Acc
            case 0x2A:
                clock+=2;
                ROL(-1);
                break;
            // BIT Abs
            case 0x2C:
                clock+=4;
                BIT(Abs());
                break;
            // AND Abs
            case 0x2D:
                clock+=4;
                AND(Abs());
                break;
            // ROL Abs
            case 0x2E:
                clock+=6;
                ROL(Abs());
                break;
            // BMI
            case 0x30:
                clock+=2;
                BMI(Im());
                break;
            // AND Ind, Y
            case 0x31:
                clock+=5;
                AND(IndY());
                break;
            // AND Z, X
            case 0x35:
                clock+=4;
                AND(ZPX());
                break;
            // ROL Z, X
            case 0x36:
                clock+=6;
                ROL(ZPX());
                break;
            // SEC
            case 0x38:
                clock+=2;
                SEC();
                break;
            // AND Abs, Y
            case 0x39:
                clock+=4;
                AND(AbsY());
                break;
            // AND Abs, X
            case 0x3D:
                clock+=4;
                AND(AbsX());
                break;
            // ROL Abs, X
            case 0x3E:
                clock+=7;
                ROL(AbsX());
                break;
            // RTI
            case 0x40:
                clock+=6;
                RTI();
                break;
            // EOR Ind, X
            case 0x41:
                clock+=6;
                EOR(IndX());
                break;
            // EOR ZP
            case 0x45:
                clock+=3;
                EOR(ZP());
                break;
            // LSR ZP
            case 0x46:
                clock+=5;
                LSR(ZP());
                break;
            // PHA
            case 0x48:
                clock+=3;
                PHA();
                break;
            // EOR Imm
            case 0x49:
                clock+=2;
                EOR(Im());
                break;
            // LSR Acc
            case 0x4A:
                clock+=2;
                LSR(-1);
                break;
            // JMP Abs
            case 0x4C:
                clock+=3;
                JMP(Abs());
                break;
            // EOR Abs
            case 0x4D:
                clock+=4;
                EOR(Abs());
                break;
            // LSR Abs
            case 0x4E:
                clock+=6;
                LSR(Abs());
                break;
            // BVC
            case 0x50:
                clock+=2;
                BVC(Im());
                break;
            // EOR Ind, Y
            case 0x51:
                clock+=5;
                EOR(IndY());
                break;
            // EOR Z, X
            case 0x55:
                clock+=4;
                EOR(ZPX());
                break;
            // LSR Z, X
            case 0x56:
                clock+=6;
                LSR(ZPX());
                break;
            // CLI
            case 0x58:
                clock+=2;
                CLI();
                break;  
            // EOR Abs, Y
            case 0x59:
                clock+=4;
                EOR(AbsY());
                break;
            // EOR Abs, X
            case 0x5D:
                clock+=4;
                EOR(AbsX());
                break;
            // LSR ABs, X
            case 0x5E:
                clock+=7;
                LSR(AbsX());
                break;
            // RTS
            case 0x60:
                clock+=6;
                RTS();
                break;
            // ADC Ind, X
            case 0x61:
                clock+=6;
                ADC(IndX());
                break;
            // ADC ZP
            case 0x65:
                clock+=3;
                ADC(ZP());
                break;
            // ROR ZP
            case 0x66:
                clock+=5;
                ROR(ZP());
                break;
            // PLA
            case 0x68:
                clock+=4;
                PLA();
                break;
            // ADC Imm
            case 0x69:
                clock+=2;
                ADC(Im());
                break;
            // ROR Acc
            case 0x6A:
                clock+=2;
                ROR(-1);
                break;
            // JMP Ind
            case 0x6C:
                clock+=5;
                JMP(Ind());
                break;
            // ADC Abs
            case 0x6D:
                clock+=4;
                ADC(Abs());
                break;
            // ROR Abs
            case 0x6E:
                clock+=6;
                ROR(Abs());
                break;
            // BVS
            case 0x70:
                clock+=2;
                BVS(Im());
                break;
            // ADC Ind, Y
            case 0x71:
                clock+=5;
                ADC(IndY());
                break;
            // ADC Z, X
            case 0x75:
                clock+=4;
                ADC(ZPX());
                break;
            // ROR Z, X
            case 0x76:
                clock+=6;
                ROR(ZPX());
                break;
            // SEI
            case 0x78:
                clock+=2;
                SEI();
                break;
            // ADC Abs, Y
            case 0x79:
                clock+=4;
                ADC(AbsY());
                break;
            // ADC Abs, X
            case 0x7D:
                clock+=4;
                ADC(AbsX());
                break;
            // ROR Abs, X
            case 0x7E:
                clock+=7;
                ROR(AbsX());
                break;
            // STA Ind, X
            case 0x81:
                clock+=6;
                var prevClock = clock;
                STA(IndX());
                clock = prevClock;
                break;
            // STY Z
            case 0x84:
                clock+=3;
                STY(ZP());
                break;
            // STA Z
            case 0x85:
                clock+=3;
                STA(ZP());
                break;
            // STX Z
            case 0x86:
                clock+=3;
                STX(ZP());
                break;
            // DEY
            case 0x88:
                clock+=2;
                DEY();
                break;
            // TXA
            case 0x8A:
                clock+=2;
                TXA();
                break;
            // STY Abs
            case 0x8C:
                clock+=4;
                STY(Abs());
                break;
            // STA Abs
            case 0x8D:
                clock+=4;
                STA(Abs());
                break;
            // STX Abs
            case 0x8E:
                clock+=4;
                STX(Abs());
                break;
            // BCC
            case 0x90:
                clock+=2;
                BCC(Im());
                break;
            // STA Ind, Y
            case 0x91:
                clock+=6;
                var prevClock = clock;
                STA(IndY());
                clock = prevClock;
                break;
            // STY Z, X
            case 0x94:
                clock+=4;
                STY(ZPX());
                break;
            // STA Z, X
            case 0x95:
                clock+=4;
                STA(ZPX());
                break;
            // STX Z, Y
            case 0x96:
                clock+=4;
                STX(ZPY());
                break;
            // TYA
            case 0x98:
                clock+=2;
                TYA();
                break;
            // STA Abs, Y
            case 0x99:
                clock+=5;
                var prevClock = clock;
                STA(AbsY());
                clock = prevClock;
                break;
            // TXS
            case 0x9A:
                clock+=2;
                TXS();
                break;
            // STA Abs, X
            case 0x9D:
                clock+=5;
                var prevClock = clock;                
                STA(AbsX());
                clock = prevClock;
                break;
            // LDY Imm
            case 0xA0:
                clock+=2;
                LDY(Im());
                break;
            // LDA Ind, X
            case 0xA1:
                clock+=6;
                LDA(IndX());
                break;
            // LDX Imm
            case 0xA2:
                clock+=2;
                LDX(Im());
                break;
            // LDY Z
            case 0xA4:
                clock+=3;
                LDY(ZP());
                break;
            // LDA Z
            case 0xA5:
                clock+=3;
                LDA(ZP());
                break;
            // LDX Z
            case 0xA6:
                clock+=3;
                LDX(ZP());
                break;
            // TAY
            case 0xA8:
                clock+=2;
                TAY();
                break;
            // LDA Imm
            case 0xA9:
                clock+=2;
                LDA(Im());
                break;
            // TAX
            case 0xAA:
                clock+=2;
                TAX();
                break;
            // LDY 	Abs
            case 0xAC:
                clock+=4;
                LDY(Abs());
                break;
            // LDA Abs 
            case 0xAD:
                clock+=4;
                LDA(Abs());
                break;  
            // LDX Abs 
            case 0xAE:
                clock+=4;
                LDX(Abs());
                break;
            // BCS
            case 0xB0:
                clock+=2;
                BCS(Im());
                break;
            // LDA 	Ind, Y 
            case 0xB1:
                clock+=5;
                LDA(IndY());
                break;
            // LDY 	Z, X 
            case 0xB4:
                clock+=4;
                LDY(ZPX());
                break;
            // LDA 	Z, X 
            case 0xB5:
                clock+=4;
                LDA(ZPX());
                break;
            // LDX 	Z, Y
            case 0xB6:
                clock+=4;
                LDX(ZPY())
                break;
            // CLV
            case 0xB8:
                clock+=2;
                CLV();
                break;
            // LDA 	Abs, Y 
            case 0xB9:
                clock+=4;
                LDA(AbsY());
                break;
            // TSX 
            case 0xBA:
                clock+=2;
                TSX();
                break;
            // LDY Abs, X 
            case 0xBC:
                clock+=4;
                LDY(AbsX());
                break;
            // LDA Abs, X 
            case 0xBD:
                clock+=4;
                LDA(AbsX());
                break;
            // LDX Abs, Y
            case 0xBE:
                clock+=4;
                LDX(AbsY());
                break;
            // CPY Imm 
            case 0xC0:
                clock+=2;
                CPY(Im());
                break;
            // CMP Ind, X 
            case 0xC1:
                clock+=6;
                CMP(IndX());
                break;
            // CPY Z 
            case 0xC4:
                clock+=3;
                CPY(ZP());
                break;
            // CMP Z 
            case 0xC5:
                clock+=3;
                CMP(ZP());
                break;
            // DEC Z
            case 0xC6:
                clock+=5;
                DEC(ZP());
                break;
            // INY
            case 0xC8:
                clock+=2;
                INY();
                break;
            // CMP Imm 
            case 0xC9:
                clock+=2;
                CMP(Im());
                break;
            // DEX
            case 0xCA:
                clock+=2;
                DEX();
                break;
            // CPY Abs 
            case 0xCC:
                clock+=4;
                CPY(Abs());
                break;
            // CMP Abs 
            case 0xCD:
                clock+=4;
                CMP(Abs());
                break;
            // DEC Abs 
            case 0xCE:
                clock+=6;
                DEC(Abs());
                break;
            // BNE
            case 0xD0:
                clock+=2;
                BNE(Im());
                break;
            // CMP Ind, Y 
            case 0xD1:
                clock+=5;
                CMP(IndY());
                break;
            // CMP Z, X 
            case 0xD5:
                clock+=4;
                CMP(ZPX());
                break;
            // DEC Z, X 
            case 0xD6:
                clock+=6;
                DEC(ZPX());
                break;
            // CLD 
            case 0xD8:
                clock+=2;
                CLD();
                break;
            // CMP Abs, Y 
            case 0xD9:
                clock+=4;
                CMP(AbsY());
                break;
            // CMP Abs, X 
            case 0xDD:
                clock+=4;
                CMP(AbsX());
                break;
            // DEC Abs, X
            case 0xDE:
                clock+=7;
                DEC(AbsX());
                break;
            // CPX Imm 
            case 0xE0:
                clock+=2;
                CPX(Im());
                break;
            // SBC Ind, X 
            case 0xE1:
                clock+=6;
                SBC(IndX());
                break;
            // CPX 	Z 
            case 0xE4:
                clock+=3;
                CPX(ZP());
                break;
            // SBC 	Z 
            case 0xE5:
                clock+=3;
                SBC(ZP());
                break;
            // INC Z 
            case 0xE6:
                clock+=5;
                INC(ZP());
                break;
            // INX
            case 0xE8:
                clock+=2;
                INX();
                break;
            // SBC Imm 
            case 0xE9:
                clock+=2;
                SBC(Im());
                break;
            // NOP
            case 0xEA:
                clock+=2;
                break;
            // CPX 	Abs 
            case 0xEC:
                clock+=4;
                CPX(Abs());
                break;
            // SBC Abs 
            case 0xED:
                clock+=4;
                SBC(Abs());
                break;
            // INC Abs 
            case 0xEE:
                clock+=6;
                INC(Abs());
                break;
            // BEQ
            case 0xF0:
                clock+=2;
                BEQ(Im());
                break;
            // SBC Ind, Y
            case 0xF1:
                clock+=5;
                SBC(IndY());
                break;
            // SBC Z, X 
            case 0xF5:
                clock+=4;
                SBC(ZPX());
                break;
            // INC Z, X 
            case 0xF6:
                clock+=6;
                INC(ZPX());
                break;
            // SED
            case 0xF8:
                clock+=2;
                SED();
                break;
            // SBC Abs, Y 
            case 0xF9:
                clock+=4;
                SBC(AbsY());
                break;
            // SBC Abs, X 
            case 0xFD:
                clock+=4;
                SBC(AbsX());
                break;
            // INC Abs, X 
            case 0xFE:
                clock+=7;
                INC(AbsX());
                break;
            
        }
    }

}