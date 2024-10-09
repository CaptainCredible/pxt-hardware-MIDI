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
 * send serial
 *
 */
    //% block="send USB serial: name = $what value = $value"
    export function sendSerial(what: string, value: number) {
        serial.redirectToUSB()
        serial.writeValue(what, value)
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
     */
    //% block="send noteOn $note with velocity $velocity and duration $duration ms on channel $channel"
    //% channel.min=1 channel.max=16 velocity.min=0 velocity.max=127 note.min=0 note.max=127
    //% channel.defl=1 velocity.defl=127 duration.defl=100 note.defl=60
    //% weight=451 inlineInputMode=inline
    export function sendNote(note: number, velocity: number, duration: number, channel: number) {
        let midiMessage = pins.createBuffer(3);
        sendNoteOn(note, velocity, channel)
        control.inBackground(function () {
            basic.pause(duration)
            sendNoteOff(note, velocity, channel)
        })
    }

    /**
         * send a midi control change 
         */
    //% block="send controlChange $control with value $value on channel $channel"
    //% channel.min=1 channel.max=16 value.min=0 value.max=127 control.min=0 note.max=127
    //% channel.defl=1 value.defl=0 control.defl=10
    //% weight=450
    export function sendControlChange(control: number, value: number, channel: number) {
        let midiMessage = pins.createBuffer(3);
        midiMessage.setNumber(NumberFormat.UInt8LE, 0, NOTE_ON | channel - 1);
        midiMessage.setNumber(NumberFormat.UInt8LE, 1, control);
        midiMessage.setNumber(NumberFormat.UInt8LE, 2, value);
        serial.writeBuffer(midiMessage);
    }

    /**
     * send a midi noteOn 
     */
    //% block="send noteOn $note with velocity $velocity on channel $channel"
    //% channel.min=1 channel.max=16 velocity.min=0 velocity.max=127 note.min=0 note.max=127
    //% channel.defl=1 velocity.defl=127 note.defl=60
    //% weight=450 advanced=true
    export function sendNoteOn(note: number, velocity: number, channel: number) {
        let midiMessage = pins.createBuffer(3);
        midiMessage.setNumber(NumberFormat.UInt8LE, 0, NOTE_ON | channel - 1);
        midiMessage.setNumber(NumberFormat.UInt8LE, 1, note);
        midiMessage.setNumber(NumberFormat.UInt8LE, 2, velocity);
        serial.writeBuffer(midiMessage);
    }


    /**
     * send a midi noteOff
     */
    //% block="send noteOff $note with velocity $velocity on channel $channel"
    //% channel.min=1 channel.max=16 velocity.min=0 velocity.max=127 note.min=0 note.max=127
    //% channel.defl=1 velocity.defl=127 note.defl=60
    //% weight=400 advanced=true
    export function sendNoteOff(note: number, velocity: number, channel: number) {
        let midiMessage = pins.createBuffer(3);
        midiMessage.setNumber(NumberFormat.UInt8LE, 0, NOTE_OFF | channel - 1);
        midiMessage.setNumber(NumberFormat.UInt8LE, 1, note);
        midiMessage.setNumber(NumberFormat.UInt8LE, 2, velocity);
        serial.writeBuffer(midiMessage);
    }



    let onReceiveNoteOnHandler: (channel: number, noteNuber: number, velocity: number) => void;
    //%block
    //%draggableParameters=reporter
    //%weight=350
    export function onReceiveNoteOn(cb: (channel: number, noteNumber: number, velocity: number) => void) {
        if (!midiListenerExists) {
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
            midiListenerExists = true;

            let statusByte: number = 0;
            let dataBytesRead: number = 0;
            let data1: number = 0;
            let data2: number = 0;

            // Use a 1ms interval loop to initiate the MIDI parser
            loops.everyInterval(1, function () {
                // Lock the parser in a while loop to process all incoming bytes
                while (true) {
                    // Read one byte from the serial buffer
                    let midiBuffer = serial.readBuffer(1);

                    // If buffer is empty, break out of the while loop
                    if (midiBuffer.length == 0) {
                        break;
                    }

                    let midiByte = midiBuffer[0];

                    // If it's a clock message (0xF8), ignore and break out of the loop
                    if (midiByte == 248) { // 248 is the decimal value for 0xF8 (Timing Clock)
                        break;
                    }

                    // If the byte is a status byte (>= 128), handle it
                    if (midiByte >= 128) {
                        statusByte = midiByte;
                        dataBytesRead = 0; // Reset data byte count
                    } else {
                        // Handle data bytes based on the current status byte
                        if (dataBytesRead == 0) {
                            data1 = midiByte;
                            dataBytesRead = 1;
                        } else if (dataBytesRead == 1) {
                            data2 = midiByte;
                            dataBytesRead = 2;

                            // Now we have both data bytes, process the message
                            const messageType = (statusByte & 0xF0) >> 4;
                            const channelNumber = statusByte & 0x0F;

                            switch (messageType) {
                                case 8:
                                    // Note Off
                                    if (onReceiveNoteOffHandler) {
                                        onReceiveNoteOffHandler(channelNumber, data1, data2);
                                    }
                                    break;
                                case 9:
                                    // Note On
                                    if (onReceiveNoteOnHandler) {
                                        onReceiveNoteOnHandler(channelNumber, data1, data2);
                                    }
                                    break;
                                case 11:
                                    // Control Change
                                    if (onReceiveCCHandler) {
                                        onReceiveCCHandler(channelNumber, data1, data2);
                                    }
                                    break;
                                default:
                                // Unhandled message type
                            }

                            // Reset data bytes count after handling the message
                            dataBytesRead = 0;
                        }
                    }
                }
            });
        }
    }

    /* //OLD LISTENER 3BYTES AT A TIME, BREAKS 
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
    */
} // end of namespace
