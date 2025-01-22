let midiOutput;
let midiAccess;

export async function requestMidiAccess() {

    await navigator.requestMIDIAccess({ sysex: true }).then((ma) => {
        midiAccess = ma;
        // Select an output (this assumes the first available MIDI output is Dexed)
        midiOutput = Array.from(midiAccess.outputs.values()).find(
            (port) => port.name === "loopMIDI Port",
        );
    });

    return { out: midiOutput, acc: midiAccess }
}

export function sendMessage(m, mout = null) {
    if (mout)
        mout.send(m)
    else if(midiOutput)
        midiOutput.send(m);
    else
        console.log("No Midi Output")
}