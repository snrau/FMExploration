import { dx7Blocks, dx7Parameters } from "./dexed";

export function uniformSamplingFull() {
    let temp = [];
    Object.entries(dx7Parameters).forEach(([k, v], i) => {
        if (i !== v.number) console.log("Fail", i, v.number);
        const randomValue = Math.floor(Math.random() * (v.max + 1));
        temp.push(randomValue);
    });
    return temp;
}

export function uniformSamplingRestricted(changeArray) {
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

export function getChangesArrayLimited(objDict = dx7Parameters) {
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

export function getRandom(max) {
    return Math.floor(Math.random() * max);
}

export function selectARandomBlock() {
    let block =
        dx7Blocks[
        Object.keys(dx7Blocks)[getRandom(Object.keys(dx7Blocks).length)]
        ];
    return block[Object.keys(block)[getRandom(Object.keys(block).length)]];
}

export function randomizeBlock(sample, blockrange) {
    let min = blockrange[0];
    let max = blockrange[1];
    let params = Object.values(dx7Parameters);

    for (let i = min; i <= max; i++) {
        sample[i] = getRandom(params[i].max + 1);
    }
    return sample;
}


export function interpolate(configA, configB, percent) {
    if (!Array.isArray(configA) || !Array.isArray(configB)) {
        throw new Error("Both configs must be arrays");
    }

    if (configA.length !== configB.length) {
        throw new Error("Configs must have the same length");
    }

    return configA.map((valueA, index) => {
        const valueB = configB[index];

        if (index === 134) {
            // Discrete switch at 50%
            return percent < 0.5 ? valueA : valueB;
        } else {
            // Linear interpolation and rounding to the nearest integer
            return Math.round(valueA + (valueB - valueA) * percent);
        }
    });
}