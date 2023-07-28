## midi in/out
This extension lets you send and receive the following standard midi messages:
- note on 
- note off
- control change 

## Basic usage
```blocks

//Set the midi in and midi out pins
midiInOut.setMidiInPin(SerialPin.P0)
midiInOut.setMidiOutPin(SerialPin.P1)

//Send notes (note number, velocity, duration, midi channel)
midiInOut.sendNote(45,127,100,1)

// Act on incoming MIDI messages
midiInOut.onReceiveNoteOn(function (channel, noteNumber, velocity) {
    basic.showNumber(noteNumber)
})
```
## Supported targets

* for PXT/microbit

## License

MIT

## Use as Extension

This repository can be added as an **extension** in MakeCode.

* open [https://makecode.microbit.org/](https://makecode.microbit.org/)
* click on **New Project**
* click on **Extensions** under the gearwheel menu
* search for **https://github.com/captaincredible/pxt-hardware-midi** and import

## Edit this project ![Build status badge](https://github.com/captaincredible/pxt-hardware-midi/workflows/MakeCode/badge.svg)

To edit this repository in MakeCode.

* open [https://makecode.microbit.org/](https://makecode.microbit.org/)
* click on **Import** then click on **Import URL**
* paste **https://github.com/captaincredible/pxt-hardware-midi** and click import

## Blocks preview

This image shows the blocks code from the last commit in master.
This image may take a few minutes to refresh.

![A rendered view of the blocks](https://github.com/captaincredible/pxt-hardware-midi/raw/master/.github/makecode/blocks.png)

> Open this page at [https://captaincredible.github.io/pxt-hardware-midi/](https://captaincredible.github.io/pxt-hardware-midi/)

#### Metadata (used for search, rendering)

* for PXT/microbit
<script src="https://makecode.com/gh-pages-embed.js"></script><script>makeCodeRender("{{ site.makecode.home_url }}", "{{ site.github.owner_name }}/{{ site.github.repository_name }}");</script>
