

const NOTE_ON = 0x90
const NOTE_OFF = 0x80
/**
 * Custom blocks
 */
//% weight=100 color=#0fbc11 icon=""
namespace midiInOut {
    let MIDIOUTPIN = SerialPin.P1
    let MIDIINPIN = SerialPin.P0
    
    //% block="send $snot"
    //% snot.min=-100 snot.max=100
    export function foo(snot: number) {

    }
    
    /**
     * send a midi note
     * @param note note number
     */
    //% block="send noteOn $note with velocity $velocity on channel $channel"
    //% channel.min=1 channel.max=16 velocity.min=0 velocity.max=127 note.min=0 note.max=127
    //% channel.defl=1 velocity.defl=127 note.defl=60
    export function sendNoteOn(note: number, velocity: number, channel: number) {
        let midiMessage = pins.createBuffer(3);
        midiMessage.setNumber(NumberFormat.UInt8LE, 0, NOTE_ON | channel-1);
        midiMessage.setNumber(NumberFormat.UInt8LE, 1, note);
        midiMessage.setNumber(NumberFormat.UInt8LE, 2, velocity);
        serial.writeBuffer(midiMessage);
    }

    /**
     * send a midi noteOff
     * @param note note number
     */
    //% block="send noteOff $note with velocity $velocity on channel $channel"
    //% channel.min=1 channel.max=16 velocity.min=0 velocity.max=127 note.min=0 note.max=127
    //% channel.defl=1 velocity.defl=127 note.defl=60
    export function noteOff(note: number, velocity: number, channel: number) {
        let midiMessage = pins.createBuffer(3);
        midiMessage.setNumber(NumberFormat.UInt8LE, 0, NOTE_OFF | channel);
        midiMessage.setNumber(NumberFormat.UInt8LE, 1, note);
        midiMessage.setNumber(NumberFormat.UInt8LE, 2, velocity);
        serial.writeBuffer(midiMessage);
    }

    /**
     * set midi out pin
     */
    //% block="Set MIDI out pin to = $midiOut"
    export function setMidiOutPin(midiOut: SerialPin) {
        MIDIOUTPIN = midiOut
        serial.redirect(
            MIDIOUTPIN,
            MIDIINPIN,
            BaudRate.BaudRate31250
        )
    }

    /**
     * set midi in pin
     */
    //% block="Set MIDI in pin to = $midiIn"
    export function setMidiInPin(midiIn: SerialPin) {
        MIDIINPIN = midiIn
        serial.redirect(
            MIDIOUTPIN,
            MIDIINPIN,
            BaudRate.BaudRate31250
        )
    }

    //%block="fake received| $noteSelect"
    export function fakeReceivedNote(noteSelect: number): void {
        control.raiseEvent(1337, noteSelect+100)
    }

    //%block="on received| $noteSelect"
    export function onReceivedNote(noteSelect: number, thing: () => void) {
        control.onEvent(1337, noteSelect+100, thing);
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



 
