let midiOutput;
let midiAccess;

let audio = null

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
    else if (midiOutput)
        midiOutput.send(m);
    else
        console.log("not sent")
}

export function playWav(point) {
    const folder = point.analysis.sampled ? "sampled" : "reference";
    const filePath = `./${folder}/${point.label}.wav`;

    if (audio) {
        audio.pause()
        audio = null
        return
    }

    audio = new Audio(filePath);
    audio.play()
        .then()
        .catch((error) => console.error(`Error playing ${point.label}.wav:`, error));

    // When the audio ends, reset the audio instance
    audio.addEventListener("ended", () => {
        audio = null;
    });
}