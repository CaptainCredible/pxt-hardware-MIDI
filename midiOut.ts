

const NOTE_ON = 0x90
const NOTE_OFF = 0x80

/**
 * Custom blocks
 */
//% weight=100 color=#0fbc11 icon="X"
namespace midiInOut {
    /**
     * send a midi note
     * @param note note number
     */
    //% block
    export function sendNoteOn(note: number, velocity: number, channel: number) {
        let midiMessage = pins.createBuffer(3);
        midiMessage.setNumber(NumberFormat.UInt8LE, 0, NOTE_ON | channel);
        midiMessage.setNumber(NumberFormat.UInt8LE, 1, note);
        midiMessage.setNumber(NumberFormat.UInt8LE, 2, velocity);
        serial.writeBuffer(midiMessage);
    }

    /**
     * send a midi noteOff
     * @param note note number
     */
    //% block
    export function noteOff(note: number, velocity: number, channel: number) {
        let midiMessage = pins.createBuffer(3);
        midiMessage.setNumber(NumberFormat.UInt8LE, 0, NOTE_OFF | channel);
        midiMessage.setNumber(NumberFormat.UInt8LE, 1, note);
        midiMessage.setNumber(NumberFormat.UInt8LE, 2, velocity);
        serial.writeBuffer(midiMessage);
    }

    /**
     * set midi pins
     * @param note note number
     */
    //% block "MIDI out = $midiOut MIDI in = $midiIn"
    export function setMidiPins(midiOut: SerialPin, midiIn: SerialPin) {
        serial.redirect(
            SerialPin.P0,
            SerialPin.P8,
            BaudRate.BaudRate31250
        )
    }
}


function bytesToArray(bits: number) {
    let noteArray = [];
    let bitCheckMask = 1
    let arrayPos = 0;
    for (let i = 0; i <= 16 - 1; i++) {
        if (bitCheckMask & bits) {
            noteArray.push(i);
        }
        bitCheckMask = bitCheckMask << 1;
    }
    return noteArray;
}



 
