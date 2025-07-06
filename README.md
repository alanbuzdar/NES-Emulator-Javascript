# NES Emulator in JavaScript

A JavaScript implementation of an NES emulator with working CPU and PPU (Picture Processing Unit).

## Features

- **CPU**: MOS 6502 processor emulation with all instructions
- **PPU**: Picture Processing Unit with background and sprite rendering
- **Memory**: Complete memory mapping including RAM, ROM, and PPU registers
- **Sprite Support**: 8x8 and 8x16 sprites with flipping and priority
- **Background Rendering**: Tile-based background with attribute tables
- **Palette Support**: Full NES color palette (64 colors)

## Recent Fixes

The emulator has been updated to fix sprite rendering issues:

1. **Added Sprite Rendering**: Implemented complete sprite rendering from OAM (Object Attribute Memory)
2. **Fixed OAM Access**: Proper read/write access to sprite data
3. **Pattern Table Access**: Correct access to CHR ROM for sprite patterns
4. **Palette Calculation**: Fixed sprite palette indexing
5. **Sprite Priority**: Proper background/sprite priority handling
6. **Sprite 0 Hit Detection**: Added sprite 0 hit detection for collision detection
7. **Timing Improvements**: Better CPU/PPU synchronization

## How to Use

1. Open `index.html` in a web browser
2. Click "Choose File" and select a NES ROM file (.nes)
3. The emulator will start automatically
4. Use the debug information panel to monitor PPU registers

## Testing

The emulator should now properly display sprites in games like Super Mario Bros. The debug panel shows:
- PPU Status register
- PPU Control register  
- PPU Mask register
- First 4 bytes of OAM data

## Known Issues

- Audio is not implemented
- Some advanced PPU features may not be fully accurate
- Timing may need further refinement for some games

## File Structure

- `src/CPU.js` - 6502 CPU emulation
- `src/PPU.js` - Picture Processing Unit with sprite rendering
- `src/memory.js` - Memory mapping and I/O
- `src/main.js` - Main emulator loop and initialization
- `index.html` - Web interface
- `test/` - Test files and ROMs

Feel free to use this, but make sure to use it with ROM's you own and avoid piracy!

To run:

Open index.html and hit browse and select a .rom file.

Debugging:

Uncommenting my print statements should slow the screen down enough for you to see individual frames

Developer tools in most web browsers are also powerful debugging tools and allow for things like breakpoints.