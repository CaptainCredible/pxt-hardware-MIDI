//midi channel 0 is actually 1

const NOTE_ON = 0x90
const NOTE_OFF = 0x80

let globalMidiIn = SerialPin.P1
let globalMidiOut = SerialPin.P2

/**
 * Custom blocks
 */
//% weight=100 color=#0fbc11 icon=""
namespace midiInOut {
    /**
     * send a midi note
     * @param note note number
     */
    //% block="send noteOn $note with velocity $velocity on channel $channel"
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
    //% block="send noteOff $note with velocity $velocity on channel $channel"
    export function sendNoteOff(note: number, velocity: number, channel: number) {
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
    //% block="MIDI out pin = $midiOut MIDI in pin = $midiIn"
    export function setMidiPins(midiOut: SerialPin, midiIn: SerialPin) {
        serial.redirect(
            midiOut,
            midiIn,
            BaudRate.BaudRate31250
        ) 
        globalMidiIn = midiIn
        globalMidiOut = midiOut
    }

    /**
     * send serial
     *
     */
    //% block="send USB serial: name = $what value = $value"
    export function sendSerial(what: string, value: number) {
        serial.redirectToUSB()
        serial.writeValue(what, value)
        serial.redirect(
            globalMidiOut,
            globalMidiIn,
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



 
