

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
//% weight=500 color=#0fbc11 icon=""
namespace midiInOut {
    let MIDIOUTPIN = SerialPin.P1
    let MIDIINPIN = SerialPin.P0    


    /**
     * set midi in pin
     */
    //% block="Set MIDI in pin to = $midiIn"
    //% weight=510
    export function setMidiInPin(midiIn: SerialPin) {
        MIDIINPIN = midiIn
        serial.redirect(
            MIDIOUTPIN,
            MIDIINPIN,
            BaudRate.BaudRate31250
        )
    }

    /**
     * set midi out pin
     */
    //% block="Set MIDI out pin to = $midiOut"
    //% weight=500
    export function setMidiOutPin(midiOut: SerialPin) {
        MIDIOUTPIN = midiOut
        serial.redirect(
            MIDIOUTPIN,
            MIDIINPIN,
            BaudRate.BaudRate31250
        )
    }


    /**
     * send a midi note
     * @param note note number
     */
    //% block="send noteOn $note with velocity $velocity and duration $duration ms on channel $channel"
    //% channel.min=1 channel.max=16 velocity.min=0 velocity.max=127 note.min=0 note.max=127
    //% channel.defl=1 velocity.defl=127 duration.defl=100 note.defl=60
    //% weight=451 inlineInputMode=inline
    export function sendNote(note: number, velocity: number, duration: number, channel: number) {
        let midiMessage = pins.createBuffer(3);
        sendNoteOn(note, velocity, channel)
        control.inBackground(function() {
            basic.pause(duration)
            sendNoteOff(note, velocity, channel)
        })
    }

    /**
     * send a midi noteOn 
     * @param note note number
     */
    //% block="send noteOn $note with velocity $velocity on channel $channel"
    //% channel.min=1 channel.max=16 velocity.min=0 velocity.max=127 note.min=0 note.max=127
    //% channel.defl=1 velocity.defl=127 note.defl=60
    //% weight=450
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
    //% weight=400
    export function sendNoteOff(note: number, velocity: number, channel: number) {
        let midiMessage = pins.createBuffer(3);
        midiMessage.setNumber(NumberFormat.UInt8LE, 0, NOTE_OFF | channel-1);
        midiMessage.setNumber(NumberFormat.UInt8LE, 1, note);
        midiMessage.setNumber(NumberFormat.UInt8LE, 2, velocity);
        serial.writeBuffer(midiMessage);
    }



    let onReceiveNoteOnHandler: (channel: number, noteNuber: number, velocity: number) => void;
    //%block
    //%draggableParameters=reporter
    //%weight=350
    export function onReceiveNoteOn(cb: (channel: number, noteNumber: number, velocity: number) => void) {
        if(!midiListenerExists){
            setupMidiListener();
        }
        onReceiveNoteOnHandler = cb;
    }

    let onReceiveNoteOffHandler: (channel: number, noteNuber: number, velocity: number) => void;
    //%block
    //%draggableParameters=reporter
    //%weight=325
    export function onReceiveNoteOff(cb: (channel: number, noteNumber: number, velocity: number) => void) {
        if (!midiListenerExists) {
            setupMidiListener();
        }
        onReceiveNoteOffHandler = cb;
    }

    let onReceiveCCHandler: (channel: number, CCNumber: number, value: number) => void;
    //%block
    //%draggableParameters=reporter
    //%weight=300
    export function onReceiveControlChange(cb: (channel: number, CCNumber: number, value: number) => void) {
        if (!midiListenerExists) {
            setupMidiListener();
        }
        onReceiveCCHandler = cb;
    }

    function messageType(byte: number) {
        let messageTypeBits = (byte & 0xF0) >> 4;
        return messageTypeBits
    }

    let midiInData = pins.createBuffer(3)
    let midiListenerExists = false;
    function setupMidiListener() {
        if (!midiListenerExists) {
            midiListenerExists = true
            loops.everyInterval(5, function () {
                if (midiInData = serial.readBuffer(3)) {
                    let statusByte = midiInData.getNumber(NumberFormat.UInt8LE, 0)
                    const messageType = (statusByte & 0xF0) >> 4;
                    const channelNumber = statusByte & 0x0F;
                    const data1 = midiInData.getNumber(NumberFormat.UInt8LE, 1)
                    const data2 = midiInData.getNumber(NumberFormat.UInt8LE, 2)
                    switch (messageType) {
                        case 8:
                            //messageType = 'Note Off';
                            if (onReceiveNoteOffHandler) {
                                onReceiveNoteOnHandler(channelNumber, data1, data2)
                            }
                            break;
                        case 9:
                            //messageType = 'Note On';
                            if (onReceiveNoteOnHandler) {
                                onReceiveNoteOnHandler(channelNumber, data1, data2)
                            }
                            break;
                        case 10:
                            //messageType = 'Aftertouch';
                            break;
                        case 11:
                            //messageType = 'Control Change';
                            if (onReceiveCCHandler) {
                                onReceiveNoteOnHandler(channelNumber, data1, data2)
                            }

                            break;
                        case 12:
                            //messageType = 'Program Change';
                            break;
                        case 13:
                            //messageType = 'Channel Pressure';
                            break;
                        case 14:
                            //messageType = 'Pitch Bend';
                            break;
                        default:
                            //messageType = 'Unknown';
                    }
                }
            })
        }
    }
 } // end of namespace