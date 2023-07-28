/*
Test sketch
Sends midi note on messages followed by noteOff messages from pin P1
*/
midiInOut.setMidiOutPin(SerialPin.P1)
basic.forever(function() {
    basic.showIcon(IconNames.Heart)
    let noteToSend = randint(50, 70) // select a random note number to send
    let noteDuration = 100 //set a duration of 100ms
    let velocityToSend = 127 // maximum velocity
    let midiChannelToUse = 1 // channels 1 - 16 available
    midiInOut.sendNote(noteToSend, velocityToSend, noteDuration, midiChannelToUse)
    basic.showIcon(IconNames.SmallHeart)
})

