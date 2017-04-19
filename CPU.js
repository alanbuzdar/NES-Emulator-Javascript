// Emulates the MOS 6502 Processor used in the NES
// Written by Alan Buzdar

//Initializes CPU
function CPU (mem) {

    // all memory
    this.memory = mem;

    // program counter (16 bits)
    this.pc = 0;
    // stack pointer (8 bits)
    this.sp = 0;
    // p register (8 bits)
    // carry, zero, interrupt, decimal, BRK, unused, overflow, negative
    this.p = 0;
    // Accumulation register (8 bits)
    this.x = 0;
    // x register (8 bits)
    this.y = 0;
    // y register (8 bits)
    this.z = 0;



}