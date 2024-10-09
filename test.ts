/*
Test sketch
Sends midi note on messages followed by noteOff messages on pin P1. 
Also displays the noteNumber of any incomoing noteOn MIDI messages on pin P0
*/
midiInOut.setMidiOutPin(SerialPin.P8)
midiInOut.setMidiInPin(SerialPin.P1)

led.toggle(2, 2)

/*
basic.forever(function() {
    
    led.toggle(2, 2)
    basic.pause(400)
    let noteToSend = randint(50, 70) // select a random note number to send
    let noteDuration = 100 //set a duration of 100ms
    let velocityToSend = 127 // maximum velocity
    let midiChannelToUse = 1 // channels 1 - 16 available
    midiInOut.sendNote(noteToSend, velocityToSend, noteDuration, midiChannelToUse)
    led.toggle(2,2)
    basic.pause(400)
    
})
*/

midiInOut.onReceiveNoteOn(function(channel: number, noteNumber: number, velocity: number) {
    midiInOut.sendSerial("hello ", noteNumber)
    led.plotBarGraph(noteNumber, 127)
})
midiInOut.onReceiveControlChange(function(channel: number, CCNumber: number, value: number) {
    led.plotBarGraph(value, 127)
})