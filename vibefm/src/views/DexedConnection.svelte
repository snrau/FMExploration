<script>
    import { onMount } from "svelte";
    import {
        exportMFCC,
        sendReaper,
        doAnalysis,
    } from "../utils/serverRequests";

    let midiOutput;
    let midiAccess;

    let selectedIndex = 0;

    const dx7Blocks = {
        OP1: { EG: [105, 112], All: [105, 125], Freq: [122, 125] },
        OP2: { EG: [84, 91], All: [84, 104], Freq: [101, 104] },
        OP3: { EG: [63, 70], All: [63, 83], Freq: [80, 83] },
        OP4: { EG: [42, 49], All: [42, 62], Freq: [59, 62] },
        OP5: { EG: [21, 28], All: [21, 41], Freq: [38, 41] },
        OP6: { EG: [0, 7], All: [0, 20], Freq: [17, 20] },
        Global: { EG: [126, 133], All: [126, 144], Algorithm: [134, 134] },
    };

    const dx7Parameters = {
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
        OP2_EG_RATE4: { number: 87, max: 99, default: 0, change: true },
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
        OP1_EG_RATE4: { number: 108, max: 99, default: 0, change: true },
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

    onMount(async () => {
        try {
            // Request access to MIDI devices
            await navigator.requestMIDIAccess({ sysex: true }).then((ma) => {
                midiAccess = ma;
                // Select an output (this assumes the first available MIDI output is Dexed)
                midiOutput = Array.from(midiAccess.outputs.values()).find(
                    (port) => port.name === "loopMIDI Port",
                );
            });
        } catch (error) {
            console.error("Could not access MIDI devices:", error);
        }
    });

    function hexStringToMidiMessage(hexString1) {
        // Remove any spaces, commas, or other delimiters
        let hexString = hexString1.replace(/[\s,]/g, "");

        // Convert the cleaned hex string to an array of numbers
        const midiMessage = [];
        for (let i = 0; i < hexString.length; i += 2) {
            // Take each pair of hex digits and parse it as a number
            const byte = parseInt(hexString.substr(i, 2), 16);
            midiMessage.push(byte);
        }

        console.log(midiMessage);
        return midiMessage;
    }

    function loadACompleteBank() {
        let string =
            "F0 43 00 09 20 00 52 21 23 30 56 05 00 00 0F 63 21 0C 36 1C 27 0E 07 50 11 0F 2A 63 4D 00 00 00 63 15 08 16 08 63 02 00 4A 4F 0A 29 56 63 00 00 0F 00 43 04 76 0C 5F 02 00 50 0F 0A 2A 63 4D 00 00 0F 00 00 04 66 0C 63 02 00 63 21 15 23 63 32 00 00 00 49 00 0C 4A 1C 60 02 00 50 19 0A 2A 63 4D 00 00 0F 00 00 04 3E 08 5B 02 00 63 63 63 63 32 32 32 32 04 06 1C 00 00 00 30 18 44 4C 20 52 48 4F 44 45 53 34 20 19 20 28 5A 63 28 28 00 00 00 00 70 08 5A 06 00 63 23 1E 28 63 5F 5F 00 00 00 00 00 70 08 5F 02 00 63 2E 1E 1C 63 53 46 32 33 00 19 00 48 08 5A 06 00 63 23 1E 28 63 5F 50 00 00 00 00 00 48 08 63 02 00 63 35 1E 1C 50 28 28 28 33 00 19 00 10 08 46 02 00 63 23 1E 28 63 5F 50 00 00 00 00 00 10 08 5A 00 00 63 63 63 63 32 32 32 32 04 08 14 00 0C 0D 39 18 3C 56 61 6E 67 65 6C 69 73 3E 50 44 08 0C 5A 52 02 02 0E 00 00 04 68 00 60 06 07 3A 30 10 2D 63 5C 00 00 0C 00 00 04 58 00 63 01 29 50 44 08 0C 60 52 02 02 0E 00 00 04 68 00 5E 04 3A 50 30 10 2D 63 5C 00 00 0C 00 00 04 58 00 63 01 20 63 44 08 0C 5A 52 02 02 0E 00 00 04 60 00 59 04 38 32 0F 10 2D 63 5C 00 00 0C 00 00 04 60 00 63 09 00 61 61 61 61 31 32 32 32 05 0C 1E 26 0B 01 39 10 54 48 4F 55 47 48 54 53 2D 32 3B 63 63 27 63 63 63 00 00 00 00 00 5A 10 52 06 21 28 27 31 1D 63 30 1D 00 00 00 00 00 38 00 63 04 00 45 1D 27 28 61 3B 31 00 00 00 00 00 38 00 63 02 00 4E 3C 31 26 63 3A 4F 00 3C 00 63 00 3A 0C 63 0E 00 4E 3B 31 26 63 3A 27 00 00 00 00 00 38 00 63 02 00 31 13 27 27 63 13 63 00 00 00 00 00 38 00 63 02 01 63 63 63 63 34 32 32 32 16 07 23 00 00 00 31 18 79 61 6E 6E 69 20 20 20 20 20 5F 4D 38 00 4E 4E 00 00 29 18 00 03 3F 00 62 3C 00 63 41 00 08 52 30 00 00 20 00 00 00 3D 00 63 06 00 5A 42 00 29 52 30 00 00 00 00 07 00 39 00 63 0E 00 5D 1E 22 2E 63 50 00 00 00 00 00 00 39 00 63 02 00 5C 2E 24 13 63 57 00 00 00 00 05 03 2B 00 52 10 00 5E 22 23 26 63 50 00 00 2B 63 00 03 3B 00 63 02 00 5E 44 5F 3C 32 32 32 32 08 0F 15 00 00 00 01 18 54 6F 72 69 6D 50 6C 75 6B 34 49 46 3C 00 63 63 61 00 20 00 15 00 3B 00 2F 14 00 55 46 61 00 63 41 3C 00 20 00 00 00 29 00 36 10 00 5F 5C 1C 3C 63 5A 00 00 30 00 3C 00 3E 01 3B 0C 00 62 57 00 00 57 56 00 00 20 00 15 00 3B 08 5C 08 00 5F 5F 00 00 63 60 59 00 20 00 00 00 33 04 44 04 00 41 63 00 46 63 63 5A 00 20 00 00 00 41 10 63 02 00 00 00 00 00 32 32 32 32 10 0D 25 2A 07 63 18 18 43 4C 41 52 49 4E 45 54 20 20 5A 34 19 36 63 63 63 00 07 00 00 00 53 04 63 04 00 62 0A 06 3E 62 63 63 00 00 00 00 00 2A 10 39 04 00 50 14 10 40 63 00 2C 00 00 00 00 00 3F 08 4B 02 00 63 2D 21 40 61 5F 59 00 24 00 00 00 4A 01 51 02 00 5F 14 19 36 63 63 63 00 27 00 14 00 3C 04 5D 02 00 46 0B 07 41 63 63 63 00 00 00 00 00 39 0C 63 02 00 5E 43 5F 3C 32 32 32 32 11 07 28 34 28 4B 28 0C 42 61 73 73 6F 6F 6E 20 37 20 63 08 12 12 00 63 49 63 27 22 11 02 10 0D 4D 18 00 63 0F 1C 0E 00 58 41 63 27 22 11 02 00 09 4F 0A 32 4E 0F 14 18 4D 63 5A 63 2C 06 06 02 20 0F 53 02 32 63 1A 12 24 63 5A 46 00 38 00 00 03 50 08 63 01 2F 47 0B 1F 11 56 63 57 1D 37 12 19 09 58 09 5C 02 00 63 18 12 24 63 58 48 00 27 00 00 07 38 0C 63 00 00 61 4B 5E 42 32 32 32 32 0E 0D 21 03 00 35 02 18 52 70 74 72 52 49 53 45 20 33 62 32 62 2C 63 53 62 00 20 63 13 01 62 00 5C 06 00 57 4D 4F 22 29 62 5A 00 20 00 00 00 2D 00 63 00 00 33 0F 0B 0A 00 59 62 00 30 00 00 00 32 00 4C 04 00 57 4D 4F 21 29 62 5A 00 20 00 00 01 3B 00 5F 00 00 1D 1F 00 19 63 00 00 00 20 00 00 00 58 00 63 00 00 63 00 0D 23 63 63 63 00 20 00 00 00 41 00 5F 00 00 00 00 00 00 33 32 32 32 0D 0A 21 2A 04 63 40 18 47 6C 65 6E 64 61 27 73 20 20 47 17 12 19 63 1C 00 00 33 00 00 00 39 13 4F 04 00 63 17 12 19 63 1C 00 00 41 00 63 00 39 00 63 02 01 63 17 12 19 63 1C 00 00 00 00 00 00 72 10 5A 00 63 35 17 12 19 63 1C 00 00 40 00 3F 00 02 00 63 02 00 63 17 12 19 63 1C 00 00 00 00 00 00 52 00 63 00 00 27 17 12 19 63 1C 00 00 00 00 00 00 22 00 63 00 00 63 63 63 63 32 32 32 32 1C 05 51 0D 09 5E 33 18 43 52 45 41 54 49 4F 4E 55 53 5E 2C 29 2E 63 3F 36 00 05 00 00 0C 39 00 4F 08 00 5F 21 31 23 63 33 36 00 00 00 00 0C 3B 10 52 02 00 5E 17 40 35 63 33 36 00 00 30 00 04 3A 10 47 04 00 42 16 2A 27 63 33 35 00 17 27 00 0C 05 0C 63 02 01 63 1C 20 20 63 3A 5F 00 00 40 00 0C 40 10 4C 02 01 63 15 63 1C 63 24 2C 00 00 1E 00 08 6E 14 63 02 01 19 00 02 1D 32 32 32 32 08 00 23 27 00 00 31 18 42 61 72 20 54 61 63 6B 6E 6F 40 34 0D 48 63 57 3D 00 29 00 06 0E 2D 04 5E 08 1C 4E 3A 00 36 55 49 59 00 40 0D 28 00 5A 04 55 2A 00 41 41 16 33 63 51 23 00 33 00 25 02 59 04 4B 10 00 47 24 0E 2C 5F 5C 36 00 21 00 33 04 54 04 60 00 00 4E 11 07 34 57 5C 61 00 27 00 34 06 4A 00 4A 02 00 44 3C 4F 38 5F 4D 61 00 2A 00 03 03 3E 04 63 00 00 52 33 2E 42 32 32 32 32 11 04 1A 63 07 00 31 24 4D 72 4C 65 61 64 42 6F 64 79 63 0F 0F 21 63 5A 50 00 00 00 00 00 3A 0B 50 02 01 44 14 14 22 63 5A 50 00 00 00 00 00 52 0B 4E 02 00 63 14 14 1E 63 5A 50 00 00 00 00 00 3A 00 61 02 00 44 14 14 21 63 5A 50 00 00 00 00 00 3A 04 63 00 00 63 14 14 19 63 5A 50 00 00 00 00 00 3A 04 63 00 00 63 14 14 19 63 5A 63 00 00 00 00 00 3A 00 53 02 00 5E 43 5F 3C 32 32 32 32 02 08 19 45 0F 63 31 18 20 5A 5A 49 4E 47 20 20 20 20 00 19 00 00 63 00 00 00 29 00 00 04 38 00 00 0A 00 5F 19 19 3E 63 5F 00 00 33 00 00 03 38 00 00 02 00 41 19 1E 3E 63 61 5F 00 00 00 00 03 38 00 47 04 00 41 19 1E 3E 63 61 5F 00 00 00 00 03 20 00 63 04 00 57 5A 00 00 63 63 00 00 29 00 00 04 50 00 63 07 2F 41 3A 39 3E 63 3C 00 00 00 00 00 03 38 1C 63 02 00 63 4B 4B 3C 32 32 32 32 08 08 37 00 00 00 07 0C 46 6C 75 74 65 20 20 20 32 32 63 63 54 28 63 63 00 00 00 00 00 00 38 00 56 1A 00 63 63 23 28 63 63 00 00 00 00 00 00 38 03 3C 08 00 25 63 23 27 2D 63 23 00 00 00 00 00 38 00 63 04 00 63 14 63 1F 63 00 00 00 00 00 00 00 38 00 4B 14 00 63 1C 63 14 63 00 00 00 00 00 00 00 38 03 37 06 00 63 1F 63 21 63 00 00 00 00 00 00 00 00 00 63 04 00 63 63 63 63 32 32 32 32 02 08 30 00 00 37 33 18 54 57 49 4E 43 4C 45 20 20 20 50 2A 26 2E 63 5A 00 00 33 00 11 00 38 00 3F 16 01 4B 18 1D 06 63 59 00 00 33 00 00 00 01 04 57 00 01 39 32 38 26 63 56 63 00 11 00 00 00 2B 08 63 04 01 50 2A 26 2E 63 5A 00 00 33 00 11 00 40 00 43 16 00 4B 18 1D 06 63 59 00 00 33 00 00 00 29 04 57 00 00 39 32 38 26 63 56 63 00 11 00 00 00 53 08 63 04 00 00 00 00 00 32 32 32 32 02 03 13 1D 23 00 18 18 53 6D 6F 6F 74 68 6F 75 74 20 38 4D 32 29 63 61 44 00 0F 00 00 04 77 00 0A 04 02 4A 57 32 29 57 1B 00 00 0F 00 00 04 6F 00 62 02 04 5A 3A 32 29 60 1B 00 00 0F 00 00 04 76 00 62 02 02 53 14 32 29 63 1B 00 00 0F 00 00 04 73 00 63 00 00 63 4D 2A 23 63 00 00 00 00 00 00 00 70 00 63 00 00 58 2F 2E 2E 63 00 00 00 00 00 00 00 73 00 63 00 00 63 63 63 63 32 32 32 32 0D 0D 24 1C 02 50 70 0C 4C 4F 47 20 44 52 55 4D 20 20 63 22 1B 27 63 51 00 00 15 00 46 04 44 10 53 0A 00 5D 45 0A 2F 63 61 00 00 09 00 63 04 35 04 52 02 00 50 0E 0D 28 63 5B 00 00 0F 24 1E 05 3F 0C 63 02 00 5F 1C 1B 2F 63 5A 00 00 05 00 63 04 4A 0C 4F 0A 00 58 5C 47 3F 63 43 5B 5A 27 00 63 04 4A 04 58 02 00 58 1C 1B 32 63 5A 00 00 31 20 5F 09 3A 10 63 02 00 00 00 00 00 32 32 32 32 03 08 23 00 00 00 07 18 50 49 41 4E 4F 20 20 20 20 32 30 2D 2E 44 63 00 00 00 00 00 00 00 40 00 54 02 00 2B 32 2F 63 63 00 00 00 00 00 00 00 48 00 5D 02 00 2B 3C 2F 3E 63 00 00 00 00 00 00 00 30 00 63 02 00 31 2D 2F 44 63 00 00 00 00 00 00 00 50 03 56 02 00 27 3B 2F 63 63 00 00 00 00 00 00 00 30 00 5D 02 00 28 36 2F 3E 63 00 00 00 00 00 00 00 40 00 63 02 00 63 5B 1F 32 32 39 2E 1D 14 0E 04 27 43 00 71 30 42 41 42 59 20 43 41 54 20 20 4D 30 1C 18 63 4F 00 00 3C 36 00 01 77 13 63 1E 00 50 23 11 1C 63 46 00 00 34 00 23 03 64 14 4F 06 00 50 20 20 21 63 46 00 00 00 00 00 00 2B 0C 63 02 00 54 32 17 0A 63 46 00 00 3A 00 25 00 73 13 4F 12 00 56 2E 17 0C 63 46 00 00 34 08 00 03 1B 0F 4F 04 00 4E 20 1F 1F 63 46 00 00 3C 00 00 00 3B 0C 63 00 00 5E 43 5F 3C 32 32 32 32 02 0E 22 21 00 00 19 18 43 68 6F 72 6D 61 20 36 20 5C 47 50 4A 45 63 61 63 00 00 11 00 04 38 00 42 1E 00 47 50 4A 45 63 61 63 00 00 00 00 00 20 00 44 06 00 47 50 4A 45 63 61 63 00 00 00 00 00 38 00 57 02 00 47 50 4A 45 63 61 63 00 00 00 00 00 68 00 5C 02 00 47 50 4A 45 63 61 63 00 00 00 00 00 00 00 59 02 00 47 50 4A 45 63 61 63 00 00 00 00 00 38 00 63 02 00 54 5F 5F 3C 32 32 32 32 01 0E 00 00 00 00 20 18 4F 42 45 52 48 45 49 4D 2E 31 63 11 11 00 63 32 00 00 00 00 00 00 38 00 40 0A 00 63 1F 1F 00 61 32 00 00 22 14 2C 07 10 00 4B 04 00 63 2A 1E 24 62 50 32 00 29 63 00 02 3A 04 5D 02 00 63 1E 00 00 62 46 00 00 00 00 00 00 40 00 5C 00 62 63 32 24 28 62 5A 00 00 16 00 19 04 42 04 5A 02 00 46 28 00 2D 5E 32 00 00 2E 14 55 01 38 1C 63 00 5D 5E 63 63 63 36 32 32 32 19 0E 23 00 00 00 00 18 20 4D 4F 4E 47 4F 4C 49 41 20 63 63 22 63 63 63 63 00 00 00 00 00 70 00 3A 02 00 57 63 26 63 63 63 58 00 00 00 00 00 00 00 3E 00 00 63 63 63 63 63 63 63 00 00 00 00 00 70 00 5B 02 00 46 63 63 63 63 63 63 00 00 00 00 00 38 00 5F 01 00 63 63 63 63 63 63 63 00 00 00 00 00 40 00 42 00 00 63 63 63 63 63 63 63 00 00 00 00 00 50 00 63 02 00 63 63 63 63 32 32 32 32 00 0D 23 00 00 00 31 18 4C 45 41 44 20 53 4E 59 54 48 61 20 2D 2A 63 50 00 00 00 00 00 00 58 10 53 02 00 34 20 2D 2A 63 50 00 00 00 00 00 00 00 0B 63 01 29 61 20 2D 2A 63 50 00 00 2D 63 00 00 38 00 34 10 00 61 20 2D 2A 63 50 00 00 00 00 00 00 38 00 63 00 00 22 20 2D 2A 63 50 00 00 38 00 63 00 38 00 63 02 32 22 20 2D 2A 63 50 00 00 37 00 63 00 38 00 63 02 30 63 63 63 63 32 32 32 32 1C 0F 23 00 00 00 31 18 53 48 49 4D 4D 45 52 20 20 20 63 63 3A 63 63 63 00 00 00 00 00 00 3B 18 57 1A 00 63 63 26 63 63 54 00 00 00 00 00 00 3C 1C 51 1E 00 3B 63 29 47 63 63 00 00 00 00 00 00 34 1C 43 12 00 45 63 63 47 63 63 63 00 00 00 00 00 3C 08 54 00 00 3B 63 16 47 63 56 00 00 00 00 00 00 23 14 45 06 00 63 40 21 47 63 59 00 00 00 00 00 00 08 00 63 01 00 63 63 63 63 32 32 32 32 0F 0F 24 00 00 00 21 18 54 49 47 48 54 70 6C 75 6B 61 33 1B 22 3C 63 63 63 00 1E 1C 06 00 69 03 42 02 00 36 11 22 32 63 63 5A 00 1E 17 0A 03 69 00 47 02 00 3B 26 14 38 63 63 00 00 20 00 00 04 68 00 63 02 00 34 1B 1A 3C 63 63 58 00 1E 16 05 00 31 01 46 06 00 34 11 18 32 63 63 5A 00 1E 1C 00 07 51 00 3D 00 63 3A 26 14 38 63 63 00 00 20 00 00 04 50 00 63 00 63 63 63 63 63 2F 33 32 32 03 06 20 63 05 00 21 0C 53 74 72 42 72 73 20 5E 2F 5C 19 15 62 1E 63 00 63 00 22 0F 52 07 39 00 3A 08 00 3F 45 3C 1E 00 00 62 00 00 03 00 00 38 04 4D 00 00 63 15 62 1E 63 00 63 04 63 0C 50 02 30 04 5D 02 00 42 45 3C 1E 00 00 62 00 00 04 03 00 38 00 43 00 63 19 15 62 1E 63 00 63 00 2B 0C 57 07 08 00 56 02 00 42 45 3C 1E 00 00 62 01 01 00 00 00 38 00 63 00 63 63 63 63 63 32 32 32 32 02 0C 1B 16 05 03 26 18 41 62 61 64 6F 6E 20 20 20 20 10 18 23 19 47 4E 63 04 0F 00 00 04 47 00 4E 04 00 10 31 24 22 37 57 62 00 0F 00 00 04 37 00 62 00 00 4E 25 55 2D 56 63 4F 00 0F 00 00 04 56 00 4C 00 00 0F 55 62 2D 3B 43 50 00 0F 00 00 04 3B 03 63 00 00 2E 56 44 17 63 4E 46 00 00 00 00 00 2E 03 59 00 00 2F 39 44 2E 63 5F 3B 00 00 00 00 02 62 12 63 32 32 0D 0E 62 62 32 32 32 32 0D 0D 47 20 44 52 55 30 43 68 69 72 70 72 75 6D 20 20 5A 22 1A 63 63 63 61 63 31 00 00 00 39 00 59 02 00 5F 1C 28 28 5A 4C 4B 00 3C 00 47 00 3B 00 50 10 00 5A 4C 1E 2E 63 5A 00 00 31 00 00 00 3A 00 53 04 00 5A 22 1A 63 63 63 61 63 27 00 23 00 31 00 4E 06 00 5F 02 56 28 5A 4C 4B 00 31 00 00 00 3B 00 5E 06 00 4E 4A 1E 2E 63 5A 00 00 31 00 00 00 3A 00 52 02 00 00 00 00 00 32 32 32 32 02 08 1E 00 00 00 20 18 48 41 52 50 53 49 43 48 20 34 63 62 5B 40 37 62 62 4A 1F 17 10 08 41 08 63 16 01 63 49 56 22 3A 62 00 5E 20 1A 0F 04 10 04 63 02 01 49 38 3E 53 1E 62 2B 43 20 0E 11 01 59 0C 63 02 01 42 14 0D 20 5D 62 00 00 26 14 17 01 2A 0C 63 08 01 5A 16 15 3E 19 62 00 11 1E 0F 12 02 2B 04 4C 22 01 37 30 2E 2F 4D 62 5A 00 1E 14 15 00 53 08 61 06 01 63 63 63 63 32 32 32 32 0B 0C 2C 00 0A 0A 19 18 46 41 4E 54 4F 4D 45 53 20 20 4B 28 30 3B 63 63 63 00 21 00 00 03 00 0C 09 0F 2F 48 30 37 21 61 57 4A 00 24 00 23 00 30 14 58 10 00 51 1B 1C 24 63 62 59 00 2E 00 00 03 1B 04 56 04 00 38 10 0F 3A 63 5F 5C 00 00 00 00 02 22 18 63 04 00 47 01 02 1E 63 63 63 00 27 00 00 03 01 03 4B 06 00 2B 17 13 2F 61 61 5E 00 00 00 00 00 34 10 63 01 21 63 63 61 61 30 33 32 32 15 07 27 1F 14 00 19 0C 4F 6C 64 20 50 6F 6E 64 20 5C 60 59 1A 2E 63 00 00 00 0F 00 00 04 40 10 54 0C 00 63 38 06 2A 63 47 3F 00 0F 00 38 04 38 0C 4C 0A 00 63 22 1A 27 63 00 00 00 54 0E 63 01 3A 14 52 04 00 63 0F 0A 2F 63 5C 5C 00 38 5B 00 03 70 04 63 04 00 15 1D 07 1D 58 58 1C 00 44 00 63 02 00 00 51 04 01 44 38 0A 2F 63 62 24 00 27 63 00 0F 58 08 62 04 01 62 62 62 62 35 31 32 32 0E 0F 21 23 0F 00 10 0C 4D 45 54 48 45 4E 59 20 20 20 6B F7 ";
        const midiMessage = hexStringToMidiMessage(string);
        return midiMessage;
    }

    function uniformSamplingFull() {
        let temp = [];
        Object.entries(dx7Parameters).forEach(([k, v], i) => {
            if (i !== v.number) console.log("Fail", i, v.number);
            const randomValue = Math.floor(Math.random() * (v.max + 1));
            temp.push(randomValue);
        });
        return temp;
    }

    function uniformSamplingRestricted(changeArray) {
        let temp = Object.keys(dx7Parameters).map((param) =>
            dx7Parameters[param].change ? null : dx7Parameters[param].default,
        );
        changeArray.forEach((p) => {
            const index = p.index;
            const values = p.values;
            if (values === null) temp[index] = Math.floor(Math.random() * 128);
            else
                temp[index] = values[Math.floor(Math.random() * values.length)];
        });
        return temp;
    }

    function getChangesArrayLimited(objDict = dx7Parameters) {
        // Get parameter keys in order to maintain consistent index positions
        const parameters = Object.keys(objDict);

        // Gather parameters that change and the values they should cycle through
        const changeParams = parameters.filter(
            (param) => objDict[param].change,
        );
        return changeParams.map((param) => {
            const maxVal = objDict[param].max;
            const index = objDict[param].number;
            if (maxVal === 99) {
                // Sample 5 values in the range of 0 to 99
                return {
                    index: index,
                    values: Array.from({ length: 5 }, (_, i) =>
                        Math.round((i / 4) * maxVal),
                    ),
                };
            } else if (maxVal !== 127) {
                // Sample every value from 0 to maxVal
                if (objDict[param].number === 134)
                    return {
                        index: index,
                        values: Array.from({ length: maxVal + 1 }, (_, i) => i),
                    };
                else return { index: index, values: [0, 1, 2, 4, 8] };
            } else {
                // Use a placeholder for max=127 to indicate randomness
                return { index: index, values: null }; // Placeholder, will be replaced with random values later
            }
        });
    }

    /*
    function getChangesArrayFull(objDict = dx7Parameters) {
        // Get parameter keys in order to maintain consistent index positions
        const parameters = Object.keys(objDict);

        // Gather parameters that change and the values they should cycle through
        const changeParams = parameters.filter(
            (param) => objDict[param].change,
        );
        return changeParams.map((param) => {
            const maxVal = objDict[param].max;
            const index = objDict[param].number;
            if (index < 144) {
                return {
                    index: index,
                    values: Array.from({ length: maxVal + 1 }, (_, i) => i),
                };
            } else {
                // Use a placeholder for max=127 to indicate randomness
                return { index: index, values: null }; // Placeholder, will be replaced with random values later
            }
        });
    }

    function getChangesArrayLowsustain(objDict = dx7Parameters) {
        // Get parameter keys in order to maintain consistent index positions
        const parameters = Object.keys(objDict);

        // Gather parameters that change and the values they should cycle through
        const changeParams = parameters.filter(
            (param) => objDict[param].change,
        );
        return changeParams.map((param) => {
            const maxVal = objDict[param].max;
            const index = objDict[param].number;
            if (index < 144) {
                return {
                    index: index,
                    values: Array.from({ length: maxVal + 1 }, (_, i) => i),
                };
            } else if (index % 21 === 1 && index < 144) {
                return {
                    index: index,
                    values: Array.from({ length: 26 }, (_, i) => i),
                };
            } else {
                // Use a placeholder for max=127 to indicate randomness
                return { index: index, values: null }; // Placeholder, will be replaced with random values later
            }
        });
    }

    function getChangesArrayHighsustain(objDict = dx7Parameters) {
        // Get parameter keys in order to maintain consistent index positions
        const parameters = Object.keys(objDict);

        // Gather parameters that change and the values they should cycle through
        const changeParams = parameters.filter(
            (param) => objDict[param].change,
        );
        return changeParams.map((param) => {
            const maxVal = objDict[param].max;
            const index = objDict[param].number;
            if (index < 144) {
                return {
                    index: index,
                    values: Array.from({ length: maxVal + 1 }, (_, i) => i),
                };
            } else if (index % 21 === 1 && index < 144) {
                return {
                    index: index,
                    values: Array.from({ length: 26 }, (_, i) => i + 50),
                };
            } else {
                // Use a placeholder for max=127 to indicate randomness
                return { index: index, values: null }; // Placeholder, will be replaced with random values later
            }
        });
    }

    function getChangesArrayNonSilent(objDict = dx7Parameters) {
        // Get parameter keys in order to maintain consistent index positions
        const parameters = Object.keys(objDict);

        // Gather parameters that change and the values they should cycle through
        const changeParams = parameters.filter(
            (param) => objDict[param].change,
        );
        return changeParams.map((param) => {
            const maxVal = objDict[param].max;
            const index = objDict[param].number;
            if (index < 144) {
                return {
                    index: index,
                    values: Array.from({ length: maxVal + 1 }, (_, i) => i),
                };
            } else if (index % 21 === 16 && index < 144) {
                return {
                    index: index,
                    values: Array.from({ length: 50 }, (_, i) => i + 50),
                };
            } else {
                // Use a placeholder for max=127 to indicate randomness
                return { index: index, values: null }; // Placeholder, will be replaced with random values later
            }
        });
    }
    */

    function getRandom(max) {
        return Math.floor(Math.random() * max);
    }

    // if sample is randomly generated -> random seed else could be a parsed preset
    // change array empty or not set = fully random, else restricted
    function progressiveSubgroupSingleParamSampling(
        sample,
        num = 50,
        changeArray = [],
        primer = true,
    ) {
        const parameters = Object.values(dx7Parameters);

        const sampledCollection = [];

        const bound = primer ? num + 1 : num;
        for (let i = 0; i < bound; i++) {
            sampledCollection.push([...sample]);
        }

        if (changeArray.length === 0) {
            for (let i = 0; i < num; i++) {
                const param = getRandom(145);
                sampledCollection[i][param] = getRandom(
                    parameters[param].max + 1,
                );
            }
        } else {
            for (let i = 0; i < num; i++) {
                const param = getRandom(67);
                const parameter = changeArray[param];
                let newValue = null;
                while (
                    newValue === null ||
                    newValue === sampledCollection[i][parameter.index]
                ) {
                    newValue =
                        parameter.values[getRandom(parameter.values.length)];
                }

                sampledCollection[i][parameter.index] = newValue;
            }
        }
        return sampledCollection;
    }

    function selectARandomBlock() {
        let block =
            dx7Blocks[
                Object.keys(dx7Blocks)[getRandom(Object.keys(dx7Blocks).length)]
            ];
        return block[Object.keys(block)[getRandom(Object.keys(block).length)]];
    }

    function randomizeBlock(sample, blockrange) {
        let min = blockrange[0];
        let max = blockrange[1];
        let params = Object.values(dx7Parameters);

        for (let i = min; i <= max; i++) {
            sample[i] = getRandom(params[i].max + 1);
        }
        return sample;
    }

    // change whole blocks
    function progressiveSubgroupBlockSampling(sample, num = 50, primer = true) {
        const sampledCollection = [];

        const bound = primer ? num + 1 : num;
        for (let i = 0; i < bound; i++) {
            sampledCollection.push([...sample]);
        }

        for (let i = 0; i < num; i++) {
            const block = selectARandomBlock();
            sampledCollection[i] = randomizeBlock(sampledCollection[i], block);
        }
        return sampledCollection;
    }

    function totalCombinations(objDict) {
        let totalCombinations = 1;
        for (const param in objDict) {
            if (objDict[param].change) {
                const maxVal = objDict[param].max;
                if (maxVal === 99) {
                    // For max = 99, we have 5 possible values
                    totalCombinations *= 5;
                } else if (maxVal === 32) {
                    // For any other max value, we take all values from 0 to max
                    objDict[param].number === 134
                        ? (totalCombinations *= 32)
                        : (totalCombinations *= 5);
                }
            }
        }
        console.log(totalCombinations);
    }

    function generateCombinations(
        objDict,
        samplingStrategy = "uniformRandomRestrict",
        num = 50,
    ) {
        let changeArray =
            samplingStrategy === "uniformRandomRestrict"
                ? getChangesArrayLimited(objDict)
                : null;

        let sampledCollection = new Array(num).fill([]);

        for (let i = 0; i < num; i++) {
            let successful = true;
            do {
                successful = true;
                // sample from change array??
                if (samplingStrategy === "uniformRandomRestrict") {
                    sampledCollection[i] =
                        uniformSamplingRestricted(changeArray);
                } else if (samplingStrategy === "uniformRandomFull") {
                    sampledCollection[i] = uniformSamplingFull();
                }
                // check if already there
                for (let j = 0; j < i; j++) {
                    if (
                        JSON.stringify(sampledCollection[i]) ===
                        JSON.stringify(sampledCollection[j])
                    ) {
                        successful = false;
                        console.log(sampledCollection[i], sampledCollection[j]);
                    }
                }
            } while (successful === false);
            console.log(i + 1 + " of " + num + " done");
        }
        console.log(sampledCollection);
        return sampledCollection; //allCombinations;
    }

    let collection = [];

    function createSysexMessageFromConfig(arr) {
        const sysExMessage = [0xf0, 0x43, 0x00, 0x00, 0x01, 0x1b].concat(arr);
        const checksum = sysExMessage
            .slice(6)
            .reduce((sum, byte) => (sum + byte) & 0x7f, 0);
        sysExMessage.push((128 - checksum) & 0x7f); // Final 2's complement calculation
        sysExMessage.push(0xf7);
        return sysExMessage;
    }

    // use this table -> https://homepages.abdn.ac.uk/d.j.benson/pages/dx7/sysex-format.txt
    // create functions for changing single parameter (lookuptable probably, take osc, func, value in decimal and convert to a hex message)
    // create a function that generates a patch for a single voice
    // create a function that iterates a lot and writes patches

    function changeSingleParameter(name, value) {
        // Example "F0 43 10 01 05 0B F7"
        /*C:
SYSEX MESSAGE: Parameter Change
-------------------------------
       bits    hex  description

     11110000  F0   Status byte - start sysex
     0iiiiiii  43   ID # (i=67; Yamaha)
     0sssnnnn  10   Sub-status (s=1) & channel number (n=0; ch 1)
     0gggggpp  **   parameter group # (g=0; voice, g=2; function)
     0ppppppp  **   parameter # (these are listed in next section)
                     Note that voice parameter #'s can go over 128 so
                     the pp bits in the group byte are either 00 for
                     par# 0-127 or 01 for par# 128-155. In the latter case
                     you add 128 to the 0ppppppp byte to compute par#. 
     0ddddddd  **   data byte
     11110111  F7   Status - end sysex
*/
        // Table for max values for each parameter (based on provided table ranges)
        // Check if parameter number is within valid range

        if (!dx7Parameters.hasOwnProperty(name)) {
            console.log("Invalid parameter name.");
            return "";
        }
        let parameter = dx7Parameters[name];
        console.log(parameter);
        if (value < 0 || value > parameter.max) {
            if (value < 0) value = 0;
            else value = parameter.max;
        }
        // Determine AA byte
        let AA = parameter.number < 128 ? 0x00 : 0x01;
        // Determine BB byte
        let BB =
            parameter.number < 128 ? parameter.number : parameter.number - 128;
        // CC byte is just the value (within validated range)
        let CC = value;
        // Format the message as an array of bytes
        let sysexMessage = [0xf0, 0x43, 0x10, AA, BB, CC, 0xf7];

        return sysexMessage;
    }

    function handleSelectionChange(event) {
        selectedIndex = parseInt(event.target.value); // Update selected index
        let m = createSysexMessageFromConfig(collection[selectedIndex]);
        sendMessage(m); // Call the function with the new index
    }

    function sendMessage(m) {
        console.log(m);
        midiOutput.send(m);
    }

    function sendSysEx(action, param = "OP1_LVL1", value = 0) {
        if (midiOutput) {
            let message = null;
            if (action === "single parameter") {
                message = changeSingleParameter(param, value);
            } else if (action === "load Bank") {
                message = loadACompleteBank();
            } else {
                console.log("function not ready yet");
            }
            if (message !== null) {
                sendMessage(message);
            }
        } else {
            console.error("MIDI output not available");
        }
    }

    let voices = [];

    function importMidi(event) {
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

    // first start at 6 -> but order is different than at the top (EGR1,2, EGL1,2, EGR3,4, EGL3,4 ...)
    // global eg 108 - 115, 116 algorithm
    function parseSysEx(data) {
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
    }

    function writeSysEx(collection) {
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

    async function sendReaperOld() {
        if (collection.length === 0) return null;
        let allMessages = collection.map((arr) =>
            createSysexMessageFromConfig(arr),
        );
        /*.map((arr) =>
            arr.map((v, i) => v / Object.entries(dx7Parameters)[i][1].max),
        );*/

        console.log(allMessages);
        const response = await fetch("http://localhost:3000/send_sysex_batch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ allMessages }),
        });

        if (response.ok) {
            const response = await fetch("http://localhost:3000/analysis", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    path: "..\\luaScript\\output",
                    configs: JSON.stringify(collection),
                }),
            });

            if (response.ok) {
                console.log("Finished analysis");
            } else {
                alert("Failed to do hrps.");
            }
            console.log("Rendering done!");
        } else {
            alert("Failed to trigger rendering.");
        }
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

    const numToGenerate = 20;

    function sampleAroundMultipleVoices() {
        let temp = [];
        for (let i = 0; i < 10; i++) {
            temp = temp.concat(
                progressiveSubgroupBlockSampling(
                    voices[i],
                    numToGenerate - 5,
                    false,
                ),
            );
            temp = temp.concat(
                progressiveSubgroupSingleParamSampling(
                    voices[i],
                    numToGenerate - 5,
                    [],
                    true,
                ),
            );
        }
        return temp;
    }

    async function doAnalysisOld() {
        const response = await fetch("http://localhost:3000/analysis", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                path: "..\\luaScript\\output",
                configs: JSON.stringify(collection),
            }),
        });

        if (response.ok) {
            console.log("analysis done");
        } else {
            alert("Failed to do hrps.");
        }
    }

    async function distanceMatrix() {
        const response = await fetch("http://localhost:3000/distanceMatrix", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                path: "..\\luaScript\\output",
            }),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(
                        "Network response was not ok " + response.statusText,
                    );
                }
                return response.json();
            })
            .then((data) => {
                console.log("Distance Matrix:", data);
            });
    }

    function writeVoice(parsedVoice) {
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
        console.log(voice.length);

        return voice;
    }
</script>

<div>
    <button on:click={() => sendSysEx("load Bank")}>Load a voice bank</button>

    <button on:click={() => sendSysEx("single parameter", "ALGORITHM_NUM", 11)}
        >Algorithm to 12</button
    >
    <button
        on:click={() =>
            sendMessage(createSysexMessageFromConfig(uniformSamplingFull()))}
        >Generate Random Voice</button
    >
    <button
        on:click={() =>
            (collection = generateCombinations(
                dx7Parameters,
                "uniformRandomRestrict",
                numToGenerate,
            ))}>Sample Restricted Combinations</button
    >
    <button
        on:click={() =>
            (collection = generateCombinations(
                dx7Parameters,
                "uniformRandomFull",
                numToGenerate,
            ))}>Sample Full Combinations</button
    >
    <button
        on:click={() =>
            (collection = progressiveSubgroupSingleParamSampling(
                uniformSamplingFull(),
                numToGenerate,
            ))}>Sample Progressive from random seed</button
    >
    <div>
        <select bind:value={selectedIndex} on:change={handleSelectionChange}>
            <!-- Generate options based on indices of the items array -->
            {#each collection as item, index}
                <option value={index}>{index}</option>
            {/each}
        </select>
    </div>
    <input type="file" accept=".syx" on:change={importMidi} />
    <button
        on:click={() => {
            if (voices.length > 0)
                collection = progressiveSubgroupBlockSampling(
                    voices[0],
                    numToGenerate,
                );
        }}>sample around first voice of file</button
    >
    <button
        on:click={() => {
            if (voices.length > 0) collection = sampleAroundMultipleVoices();
        }}>sample dataset around the first 10 presets from the file</button
    >
    <button
        on:click={() => sendMessage(createSysexMessageFromConfig(voices[0]))}
        >send first voices of sysex file</button
    >

    <button on:click={() => sendReaper(collection)}
        >send collection to reaper</button
    >

    <button on:click={() => doAnalysis(collection)}>analysis</button>

    <button on:click={() => exportMFCC()}>mfcc</button>

    <button on:click={() => distanceMatrix()}>calculate Distance</button>

    <button on:click={() => writeSysEx(collection)}>export collection</button>
</div>
