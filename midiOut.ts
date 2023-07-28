

const NOTE_ON = 0x90
const NOTE_OFF = 0x80



enum midiMessageEventBus {
    //% block="noteOff"
    noteOff = 208,
    //% block="noteOn"
    noteOn = 209,
    //% block="aftertouch"
    aftertouch = 210,
    //% block="controlChange"
    controlChange = 211,
    //% block="programChange"
    programChange = 212,
    //% block="channelPressure"
    channelPressure = 213,
    //% block="pitchBend"
    pitchBend = 124
}

function split32To8Array(input: number): number[] {
    const result: number[] = []
    // Extract 8-bit chunks using bit masking and shifting
    for (let i = 3; i >= 0; i--) {
        const int8Chunk = (input >> (i * 8)) & 0xFF
        result.push(int8Chunk)
    }
    return result
}

function packTo32bit(msb: number, b: number, lsb: number): number {
    let output = (msb << 16) + (b << 8) + lsb
    return output
}

/**
 * Custom blocks
 */
//% weight=100 color=#0fbc11 icon=""
namespace midiInOut {
    let MIDIOUTPIN = SerialPin.P1
    let MIDIINPIN = SerialPin.P0    
    
    //TESTBLOCK:
    
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
        control.raiseEvent(1234, noteSelect+100)
    }

    let onReceiveNoteOnHandler: (channel: number, noteNuber: number, velocity: number) => void;
    //%block
    export function onReceiveNoteOn(cb: (channel: number, noteNuber: number, velocity: number) => void) {
        //init();
        if(!midiListenerExists){
            setupMidiListener();
        }
        onReceiveNoteOnHandler = cb;
    }

    let noteOnEvent = 2000

    function messageType(byte: number) {
        let messageTypeBits = (byte & 0xF0) >> 4;
        return messageTypeBits
    }

    let midiInData = pins.createBuffer(3)
    let midiListenerExists = false;
    function setupMidiListener() {
        if (!midiListenerExists) {
            loops.everyInterval(5, function () {
                if (midiInData = serial.readBuffer(3)) {
                    let statusByte = midiInData.getNumber(NumberFormat.UInt8LE, 0)
                    const messageTypeBits = (statusByte & 0xF0) >> 4;
                    const channelNumber = statusByte & 0x0F;
                    const data1 = midiInData.getNumber(NumberFormat.UInt8LE, 1)
                    const data2 = midiInData.getNumber(NumberFormat.UInt8LE, 2)
                    let midiEventNumber = messageTypeBits + 200
                    //let midiDataPacked = packTo32bit(channelNumber, data1, data2)
                    //control.raiseEvent(midiEventNumber, midiDataPacked)
                    if (onReceiveNoteOnHandler) {
                        onReceiveNoteOnHandler(channelNumber,data1,data2)
                    }
                }
            })
        }
    }


 } // end of namespace


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


let noteFreq: number[] = [131, 139, 147, 156, 165, 175, 185, 196, 208, 220, 233, 247, 262, 277, 294, 311, 330, 349, 370, 392, 415, 440, 466, 494, 523, 555, 587, 622, 659, 698, 740, 784, 831, 880, 932, 988]
