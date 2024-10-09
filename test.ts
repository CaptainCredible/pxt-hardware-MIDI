//tests go here, will not be compiled when it is used as an extension
let statusByte: number = 0
let note: number = 0
let velocity: number = 0
let inNoteOnMessage: boolean = false
basic.showLeds(`
. . . . .
. . # . .
. . # . .
. . . . .
. . . . .
`)

midiInOut.setMidiPins(SerialPin.P2, SerialPin.P1);

input.onButtonPressed(Button.A, function() {
    let myNote = randint(40,80)
    led.plot(2, 3);
    midiInOut.sendNoteOn(myNote, 127, 1)
    basic.pause(100)
    led.unplot(2, 3);
    midiInOut.sendNoteOff(myNote, 127, 1)
    basic.pause(100)
})



loops.everyInterval(1, function() {
    // Continuously read from the serial input

    let incomingByte = serial.readBuffer(1)[0] // Read one byte at a time
    //basic.pause(100)
    // Ignore timing clock (248) and active sensing (254)
    if (incomingByte == 248 || incomingByte == 254) {
        return // Skip processing for 248 and 254
    }
    
    //basic.pause(100)
    // Check if it's a status byte (Note On)
    if (incomingByte >= 128) {
        // Status byte, check if it's Note On (0x90 to 0x9F)
        if (incomingByte == 144) {
            statusByte = incomingByte
            inNoteOnMessage = true // Set flag to expect note and velocity bytes
        } else {
            inNoteOnMessage = false // Not a Note On message
        }
    } else {
        // If it's a data byte and we're in a Note On message
        if (inNoteOnMessage) {
            if (note == 0) {
                note = incomingByte // First data byte is the note
            } else {
                velocity = incomingByte // Second data byte is the velocity
                handleNoteOn(note, velocity)
                // Reset after handling
                inNoteOnMessage = false
                note = 0
                velocity = 0
            }
        }
    }
})



// Function to handle Note On message
function handleNoteOn(note: number, velocity: number) {
    
        midiInOut.sendSerial("Note", note)
    
    if (velocity > 0) {
        // Respond to the note on event
        //basic.showNumber(note) // Display note number on the LED matrix
        music.playTone(helperNoteFreq[note%24], music.beat(BeatFraction.Half)) // Play a tone based on note number
    } else {
        basic.clearScreen() // Clear LED if velocity is 0 (Note Off)
    }
}

let helperNoteFreq: number[] = [131, 139, 147, 156, 165, 175, 185, 196, 208, 220, 233, 247, 262, 277, 294, 311, 330, 349, 370, 392, 415, 440, 466, 494, 523, 555, 587, 622, 659, 698, 740, 784, 831, 880, 932, 988]
