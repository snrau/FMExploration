export async function importSysexFile(event) {
    return new Promise((resolve, reject) => {
        const file = event.target.files[0];
        if (!file) {
            reject(new Error("No file selected"));
            return;
        }

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                // @ts-ignore
                const fileContent = new Uint8Array(e.target.result);
                const content = parseSysEx(fileContent);
                resolve(content);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsArrayBuffer(file);
    });
}

// first start at 6 -> but order is different than at the top (EGR1,2, EGL1,2, EGR3,4, EGL3,4 ...)
// global eg 108 - 115, 116 algorithm
function parseSysEx(data) {
    let voices = []
    // Ensure it's a Yamaha DX7 SysEx file
    const SYSEX_START = 0xf0; // Start of SysEx
    const SYSEX_END = 0xf7; // End of SysEx

    if (data[0] !== SYSEX_START || data[data.length - 1] !== SYSEX_END) {
        console.error("Invalid SysEx file.");
        return;
    }

    // Extract voice data (32 voices, each 128 bytes)
    const VOICE_START = 6; // Typically, the first 6 bytes are the header
    const VOICE_SIZE = 128;
    const NUM_VOICES = 32;

    for (let i = 0; i < NUM_VOICES; i++) {
        const start = VOICE_START + i * VOICE_SIZE;
        const end = start + VOICE_SIZE;
        const voice = data.slice(start, end);
        voices.push(parseVoice(voice));
    }

    return voices
}

function parseVoice(voice) {
    let temp = [];
    let DT = 0;
    voice.forEach((v, i) => {
        if (i % 17 === 11 && i < 102) {
            const leftCurve = v & 0b11; // Mask 0b00000011 to get bits 0-1
            // Extract SCL LEFT CURVE (bits 2–3)
            const rightCurve = (v >> 2) & 0b11; // Shift right 2 bits, mask 0b00000011 to get bits 2-3
            temp.push(leftCurve);
            temp.push(rightCurve);
        } else if (i % 17 === 12 && i < 102) {
            const RS = v & 0b111;
            DT = (v >> 3) & 0b1111;
            temp.push(RS);
        } else if (i % 17 === 13 && i < 102) {
            const AMS = v & 0b11; // Mask 0b00000011 to get bits 0-1
            // Extract SCL LEFT CURVE (bits 2–3)
            const KVS = (v >> 2) & 0b111; // Shift right 2 bits, mask 0b00000011 to get bits 2-3
            temp.push(AMS);
            temp.push(KVS);
        } else if (i % 17 === 15 && i < 102) {
            const M = v & 0b1; // Mask 0b00000011 to get bits 0-1
            const FC = (v >> 1) & 0b11111; // Shift right 2 bits, mask 0b00000011 to get bits 2-3
            temp.push(M);
            temp.push(FC);
        } else if (i % 17 === 16 && i < 102) {
            temp.push(v);
            temp.push(DT);
        } else if (i < 102) {
            temp.push(v);
        } else {
            if (i === 111) {
                const FB = v & 0b111; // Mask 0b00000011 to get bits 0-1
                const OKS = (v >> 3) & 0b1; // Shift right 2 bits, mask 0b00000011 to get bits 2-3
                temp.push(FB);
                temp.push(OKS);
            } else if (i === 116) {
                const LFS = v & 0b1; // Mask 0b00000011 to get bits 0-1
                const LFW = (v >> 1) & 0b111; // Shift right 2 bits, mask 0b00000011 to get bits 2-3
                const LPMS = (v >> 4) & 0b111; //maybe 0b11
                temp.push(LFS);
                temp.push(LFW);
                temp.push(LPMS);
            } else {
                temp.push(v);
            }
        }
    });
    temp.push(31);
    return temp;
}


export function getNamefromConfig(config) {
    return config
        .slice(145, 155)
        .map((code) => String.fromCharCode(code))
        .join("")
}

export function getShortNamefromConfig(config) {
    return config
        .slice(145, 155)
        .map((code) => {
            if (code !== 32)
                return String.fromCharCode(code)
            else
                return ""
        })
        .join("")
}