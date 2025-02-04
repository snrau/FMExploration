import fs from 'fs';
import path from 'path';

export const dx7Blocks = {
    OP1: { EG: [105, 112], All: [105, 125], Freq: [122, 125] },
    OP2: { EG: [84, 91], All: [84, 104], Freq: [101, 104] },
    OP3: { EG: [63, 70], All: [63, 83], Freq: [80, 83] },
    OP4: { EG: [42, 49], All: [42, 62], Freq: [59, 62] },
    OP5: { EG: [21, 28], All: [21, 41], Freq: [38, 41] },
    OP6: { EG: [0, 7], All: [0, 20], Freq: [17, 20] },
    Global: { EG: [126, 133], All: [126, 144], Algorithm: [134, 134] },
};

export const dx7Parameters = {
    // OP6
    OP6_EG_RATE1: { number: 0, max: 99, default: 20, change: true },
    OP6_EG_RATE2: { number: 1, max: 99, default: 0, change: true },
    OP6_EG_RATE3: { number: 2, max: 99, default: 20, change: true },
    OP6_EG_RATE4: { number: 3, max: 99, default: 0, change: false },
    OP6_LVL1: { number: 4, max: 99, default: 99, change: false },
    OP6_LVL2: { number: 5, max: 99, default: 90, change: false },
    OP6_LVL3: { number: 6, max: 99, default: 0, change: false },
    OP6_LVL4: { number: 7, max: 99, default: 0, change: false },
    OP6_KBD_LEV_SCL_BRK_PT: {
        number: 8,
        max: 99,
        default: 0,
        change: false,
    }, // C3 = 0x27
    OP6_KBD_LFT_DEPTH: { number: 9, max: 99, default: 0, change: false },
    OP6_KBD_RHT_DEPTH: { number: 10, max: 99, default: 0, change: false },
    OP6_KBD_LFT_CURVE: { number: 11, max: 3, default: 3, change: false }, // 0=-LIN, -EXP, +EXP, +LIN
    OP6_KBD_RHT_CURVE: { number: 12, max: 3, default: 0, change: false },
    OP6_KBD_RATE_SCL: { number: 13, max: 7, default: 0, change: false },
    OP6_AMP_MOD_SENS: { number: 14, max: 3, default: 0, change: false },
    OP6_KEY_VEL_SENS: { number: 15, max: 7, default: 0, change: false },
    OP6_OUTPUT_LVL: { number: 16, max: 99, default: 99, change: true },
    OP6_OSC_MODE: { number: 17, max: 1, default: 0, change: false }, // 0=ratio
    OP6_OSC_FREQ_COARSE: { number: 18, max: 31, default: 1, change: true },
    OP6_OSC_FREQ_FINE: { number: 19, max: 99, default: 0, change: true },
    OP6_OSC_DETUNE: { number: 20, max: 14, default: 7, change: false }, // 0 = det=-7
    // OP5
    OP5_EG_RATE1: { number: 21, max: 99, default: 20, change: true },
    OP5_EG_RATE2: { number: 22, max: 99, default: 0, change: true },
    OP5_EG_RATE3: { number: 23, max: 99, default: 20, change: true },
    OP5_EG_RATE4: { number: 24, max: 99, default: 0, change: false },
    OP5_LVL1: { number: 25, max: 99, default: 99, change: false },
    OP5_LVL2: { number: 26, max: 99, default: 90, change: false },
    OP5_LVL3: { number: 27, max: 99, default: 0, change: false },
    OP5_LVL4: { number: 28, max: 99, default: 0, change: false },
    OP5_KBD_LEV_SCL_BRK_PT: {
        number: 29,
        max: 99,
        default: 0,
        change: false,
    },
    OP5_KBD_LFT_DEPTH: { number: 30, max: 99, default: 0, change: false },
    OP5_KBD_RHT_DEPTH: { number: 31, max: 99, default: 0, change: false },
    OP5_KBD_LFT_CURVE: { number: 32, max: 3, default: 3, change: false },
    OP5_KBD_RHT_CURVE: { number: 33, max: 3, default: 0, change: false },
    OP5_KBD_RATE_SCL: { number: 34, max: 7, default: 0, change: false },
    OP5_AMP_MOD_SENS: { number: 35, max: 3, default: 0, change: false },
    OP5_KEY_VEL_SENS: { number: 36, max: 7, default: 0, change: false },
    OP5_OUTPUT_LVL: { number: 37, max: 99, default: 99, change: true },
    OP5_OSC_MODE: { number: 38, max: 1, default: 0, change: false },
    OP5_OSC_FREQ_COARSE: { number: 39, max: 31, default: 1, change: true },
    OP5_OSC_FREQ_FINE: { number: 40, max: 99, default: 0, change: true },
    OP5_OSC_DETUNE: { number: 41, max: 14, default: 7, change: false },
    // OP4
    OP4_EG_RATE1: { number: 42, max: 99, default: 20, change: true },
    OP4_EG_RATE2: { number: 43, max: 99, default: 0, change: true },
    OP4_EG_RATE3: { number: 44, max: 99, default: 20, change: true },
    OP4_EG_RATE4: { number: 45, max: 99, default: 0, change: false },
    OP4_LVL1: { number: 46, max: 99, default: 99, change: false },
    OP4_LVL2: { number: 47, max: 99, default: 90, change: false },
    OP4_LVL3: { number: 48, max: 99, default: 0, change: false },
    OP4_LVL4: { number: 49, max: 99, default: 0, change: false },
    OP4_KBD_LEV_SCL_BRK_PT: {
        number: 50,
        max: 99,
        default: 0,
        change: false,
    },
    OP4_KBD_LFT_DEPTH: { number: 51, max: 99, default: 0, change: false },
    OP4_KBD_RHT_DEPTH: { number: 52, max: 99, default: 0, change: false },
    OP4_KBD_LFT_CURVE: { number: 53, max: 3, default: 3, change: false },
    OP4_KBD_RHT_CURVE: { number: 54, max: 3, default: 0, change: false },
    OP4_KBD_RATE_SCL: { number: 55, max: 7, default: 0, change: false },
    OP4_AMP_MOD_SENS: { number: 56, max: 3, default: 0, change: false },
    OP4_KEY_VEL_SENS: { number: 57, max: 7, default: 0, change: false },
    OP4_OUTPUT_LVL: { number: 58, max: 99, default: 99, change: true },
    OP4_OSC_MODE: { number: 59, max: 1, default: 0, change: false },
    OP4_OSC_FREQ_COARSE: { number: 60, max: 31, default: 1, change: true },
    OP4_OSC_FREQ_FINE: { number: 61, max: 99, default: 0, change: true },
    OP4_OSC_DETUNE: { number: 62, max: 14, default: 7, change: false },
    // OP3
    OP3_EG_RATE1: { number: 63, max: 99, default: 20, change: true },
    OP3_EG_RATE2: { number: 64, max: 99, default: 0, change: true },
    OP3_EG_RATE3: { number: 65, max: 99, default: 20, change: true },
    OP3_EG_RATE4: { number: 66, max: 99, default: 0, change: false },
    OP3_LVL1: { number: 67, max: 99, default: 99, change: false },
    OP3_LVL2: { number: 68, max: 99, default: 90, change: false },
    OP3_LVL3: { number: 69, max: 99, default: 0, change: false },
    OP3_LVL4: { number: 70, max: 99, default: 0, change: false },
    OP3_KBD_LEV_SCL_BRK_PT: {
        number: 71,
        max: 99,
        default: 0,
        change: false,
    },
    OP3_KBD_LFT_DEPTH: { number: 72, max: 99, default: 0, change: false },
    OP3_KBD_RHT_DEPTH: { number: 73, max: 99, default: 0, change: false },
    OP3_KBD_LFT_CURVE: { number: 74, max: 3, default: 3, change: false },
    OP3_KBD_RHT_CURVE: { number: 75, max: 3, default: 0, change: false },
    OP3_KBD_RATE_SCL: { number: 76, max: 7, default: 0, change: false },
    OP3_AMP_MOD_SENS: { number: 77, max: 3, default: 0, change: false },
    OP3_KEY_VEL_SENS: { number: 78, max: 7, default: 0, change: false },
    OP3_OUTPUT_LVL: { number: 79, max: 99, default: 99, change: true },
    OP3_OSC_MODE: { number: 80, max: 1, default: 0, change: false },
    OP3_OSC_FREQ_COARSE: { number: 81, max: 31, default: 1, change: true },
    OP3_OSC_FREQ_FINE: { number: 82, max: 99, default: 0, change: true },
    OP3_OSC_DETUNE: { number: 83, max: 14, default: 7, change: false },
    // OP2
    OP2_EG_RATE1: { number: 84, max: 99, default: 20, change: true },
    OP2_EG_RATE2: { number: 85, max: 99, default: 0, change: true },
    OP2_EG_RATE3: { number: 86, max: 99, default: 20, change: true },
    OP2_EG_RATE4: { number: 87, max: 99, default: 0, change: false },
    OP2_LVL1: { number: 88, max: 99, default: 99, change: false },
    OP2_LVL2: { number: 89, max: 99, default: 90, change: false },
    OP2_LVL3: { number: 90, max: 99, default: 0, change: false },
    OP2_LVL4: { number: 91, max: 99, default: 0, change: false },
    OP2_KBD_LEV_SCL_BRK_PT: {
        number: 92,
        max: 99,
        default: 0,
        change: false,
    },
    OP2_KBD_LFT_DEPTH: { number: 93, max: 99, default: 0, change: false },
    OP2_KBD_RHT_DEPTH: { number: 94, max: 99, default: 0, change: false },
    OP2_KBD_LFT_CURVE: { number: 95, max: 3, default: 3, change: false },
    OP2_KBD_RHT_CURVE: { number: 96, max: 3, default: 0, change: false },
    OP2_KBD_RATE_SCL: { number: 97, max: 7, default: 0, change: false },
    OP2_AMP_MOD_SENS: { number: 98, max: 3, default: 0, change: false },
    OP2_KEY_VEL_SENS: { number: 99, max: 7, default: 0, change: false },
    OP2_OUTPUT_LVL: { number: 100, max: 99, default: 99, change: true },
    OP2_OSC_MODE: { number: 101, max: 1, default: 0, change: false },
    OP2_OSC_FREQ_COARSE: {
        number: 102,
        max: 31,
        default: 1,
        change: true,
    },
    OP2_OSC_FREQ_FINE: { number: 103, max: 99, default: 0, change: true },
    OP2_OSC_DETUNE: { number: 104, max: 14, default: 7, change: false },
    //OP1
    OP1_EG_RATE1: { number: 105, max: 99, default: 20, change: true },
    OP1_EG_RATE2: { number: 106, max: 99, default: 0, change: true },
    OP1_EG_RATE3: { number: 107, max: 99, default: 20, change: true },
    OP1_EG_RATE4: { number: 108, max: 99, default: 0, change: false },
    OP1_LVL1: { number: 109, max: 99, default: 99, change: false },
    OP1_LVL2: { number: 110, max: 99, default: 90, change: false },
    OP1_LVL3: { number: 111, max: 99, default: 0, change: false },
    OP1_LVL4: { number: 112, max: 99, default: 0, change: false },
    OP1_KBD_LEV_SCL_BRK_PT: {
        number: 113,
        max: 99,
        default: 0,
        change: false,
    },
    OP1_KBD_LFT_DEPTH: { number: 114, max: 99, default: 0, change: false },
    OP1_KBD_RHT_DEPTH: { number: 115, max: 99, default: 0, change: false },
    OP1_KBD_LFT_CURVE: { number: 116, max: 3, default: 3, change: false },
    OP1_KBD_RHT_CURVE: { number: 117, max: 3, default: 0, change: false },
    OP1_KBD_RATE_SCL: { number: 118, max: 7, default: 0, change: false },
    OP1_AMP_MOD_SENS: { number: 119, max: 3, default: 0, change: false },
    OP1_KEY_VEL_SENS: { number: 120, max: 7, default: 0, change: false },
    OP1_OUTPUT_LVL: { number: 121, max: 99, default: 99, change: true },
    OP1_OSC_MODE: { number: 122, max: 1, default: 0, change: false },
    OP1_OSC_FREQ_COARSE: {
        number: 123,
        max: 31,
        default: 1,
        change: true,
    },
    OP1_OSC_FREQ_FINE: { number: 124, max: 99, default: 0, change: true },
    OP1_OSC_DETUNE: { number: 125, max: 14, default: 7, change: false },
    // General
    PITCH_EG_RATE1: { number: 126, max: 99, default: 99, change: false },
    PITCH_EG_RATE2: { number: 127, max: 99, default: 99, change: false },
    PITCH_EG_RATE3: { number: 128, max: 99, default: 99, change: false },
    PITCH_EG_RATE4: { number: 129, max: 99, default: 99, change: false },
    PITCH_EG_LVL1: { number: 130, max: 99, default: 50, change: false },
    PITCH_EG_LVL2: { number: 131, max: 99, default: 50, change: false },
    PITCH_EG_LVL3: { number: 132, max: 99, default: 50, change: false },
    PITCH_EG_LVL4: { number: 133, max: 99, default: 50, change: false },
    ALGORITHM_NUM: { number: 134, max: 31, default: 0, change: true },
    FEEDBACK: { number: 135, max: 7, default: 0, change: true },
    OSC_SYNC: { number: 136, max: 1, default: 0, change: false },
    LFO_SPEED: { number: 137, max: 99, default: 0, change: false },
    LFO_DELAY: { number: 138, max: 99, default: 0, change: false },
    LFO_PITCH_MOD_DEPTH: {
        number: 139,
        max: 99,
        default: 0,
        change: false,
    },
    LFO_AMP_MOD_DEPTH: { number: 140, max: 99, default: 0, change: false },
    LFO_SYNC: { number: 141, max: 1, default: 0, change: false },
    LFO_WAVEFORM: { number: 142, max: 5, default: 0, change: false }, // 0=TR, 1=SD, 2=SU, 3=SQ, 4=SI, 5=SH
    PITCH_MOD_SENS: { number: 143, max: 7, default: 0, change: false },
    TRANSPOSE: { number: 144, max: 48, default: 0, change: false }, // 12 = C2
    VOICE_NAME_CHAR1: { number: 145, max: 127, default: 99, change: true },
    VOICE_NAME_CHAR2: { number: 146, max: 127, default: 99, change: true },
    VOICE_NAME_CHAR3: { number: 147, max: 127, default: 99, change: true },
    VOICE_NAME_CHAR4: { number: 148, max: 127, default: 99, change: true },
    VOICE_NAME_CHAR5: { number: 149, max: 127, default: 99, change: true },
    VOICE_NAME_CHAR6: { number: 150, max: 127, default: 99, change: true },
    VOICE_NAME_CHAR7: { number: 151, max: 127, default: 99, change: true },
    VOICE_NAME_CHAR8: { number: 152, max: 127, default: 99, change: true },
    VOICE_NAME_CHAR9: { number: 153, max: 127, default: 99, change: true },
    VOICE_NAME_CHAR10: { number: 154, max: 127, default: 99, change: true },
    OPERATOR_ON_OFF: { number: 155, max: 31, default: 31, change: false }, //bit6 = 0 / bit 5: OP1 / ... / bit 0: OP6 -> 00111111 = 1F (alle an)
};


export function createSysexMessageFromConfig(arr) {
    const sysExMessage = [0xf0, 0x43, 0x00, 0x00, 0x01, 0x1b].concat(arr);
    const checksum = sysExMessage
        .slice(6)
        .reduce((sum, byte) => (sum + byte) & 0x7f, 0);
    sysExMessage.push((128 - checksum) & 0x7f); // Final 2's complement calculation
    sysExMessage.push(0xf7);
    return sysExMessage;
}

export function importSysex(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        let fileContent = null;

        reader.onload = (e) => {
            console.log(e);
            // @ts-ignore
            fileContent = new Uint8Array(e.target.result);
            parseSysEx(fileContent);
        };

        reader.readAsArrayBuffer(file);
    }
}

export function parseSysEx(data) {
    let voices = []
    // Ensure it's a Yamaha DX7 SysEx file
    const SYSEX_START = 0xf0; // Start of SysEx
    const SYSEX_END = 0xf7; // End of SysEx

    console.log(data);

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

    //sendMessage(createSysexMessageFromConfig(voices[0]));
    console.log("Extracted voices:", voices);
    return voices
}

export function parseVoice(voice) {
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
                console.log(v, LFS, LFW, LPMS);
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

export function writeSysEx(collection) {
    // Ensure it's a Yamaha DX7 SysEx file
    const NUM_VOICES = 32;

    const sysexData = [];

    for (let i = 0; i < NUM_VOICES; i++) {
        if (collection.length > i)
            sysexData.push(writeVoice(collection[i]));
        else sysexData.push(writeVoice(null));
    }
    const data = sysexData.flat();

    const masked_sum =
        data.reduce((partialSum, a) => partialSum + a, 0) & 0x0fffffff;

    const checksum = (~masked_sum + 1) & 0x0fffffff;

    // Add a SysEx header and footer if needed (for some formats)
    const header = [0xf0, 0x43, 0x00, 0x09, 0x20, 0x00]; // Example header bytes (Yamaha SysEx ID)
    const footer = [checksum, 0xf7]; // End of SysEx message
    const fullData = [...header, ...data, ...footer];

    //sendMessage(createSysexMessageFromConfig(voices[0]));
    return new Promise(() => {
        const blob = new Blob([new Uint8Array(fullData)], {
            type: "application/sysex",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "collection" + ".syx";
        link.click();
        URL.revokeObjectURL(url);
    });
}

export function writeVoice(parsedVoice) {
    if (parsedVoice === null) {
        return new Array(128).fill(0);
    }
    let voice = [];
    let DT = 0;
    let index = 0;

    while (index < parsedVoice.length - 1) {
        // Exclude the terminating 31 at the end
        if (index % 21 === 11 && index < 126) {
            const leftCurve = parsedVoice[index];
            const rightCurve = parsedVoice[index + 1];
            voice.push((rightCurve << 2) | leftCurve); // Combine leftCurve and rightCurve
            index += 2;
        } else if (index % 21 === 13 && index < 126) {
            const RS = parsedVoice[index];
            DT = parsedVoice[index + 7];
            voice.push((DT << 3) | RS); // Combine DT and RS
            index++;
        } else if (index % 21 === 14 && index < 126) {
            const AMS = parsedVoice[index];
            const KVS = parsedVoice[index + 1];
            voice.push((KVS << 2) | AMS); // Combine AMS and KVS
            index += 2;
        } else if (index % 21 === 17 && index < 126) {
            const M = parsedVoice[index];
            const FC = parsedVoice[index + 1];
            voice.push((FC << 1) | M); // Combine M and FC
            index += 2;
        } else if (index % 21 === 20 && index < 126) {
            //const value = parsedVoice[index];
            //voice.push(value);
            //voice.push(DT); // wrong, this has to go together with RS
            index++;
        } else if (index === 135) {
            // Handle FB and OKS
            const FB = parsedVoice[index];
            const OKS = parsedVoice[index + 1];
            voice.push((OKS << 3) | FB); // Combine OKS and FB
            index += 2;
        } else if (index === 141) {
            // Handle LFS, LFW, and LPMS
            const LFS = parsedVoice[index];
            const LFW = parsedVoice[index + 1];
            const LPMS = parsedVoice[index + 2];
            voice.push((LPMS << 4) | (LFW << 1) | LFS); // Combine LPMS, LFW, and LFS
            index += 3;
        } else if (index !== 155) {
            voice.push(parsedVoice[index]); // Copy other values directly
            index++;
        }
    }

    return voice;
}


