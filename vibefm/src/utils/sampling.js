import { get } from "svelte/store";
import { dx7Blocks, dx7Parameters } from "./dexed";
import { cellStateStore } from "./stores";

export function uniformSamplingFull() {
    let temp = [];
    Object.entries(dx7Parameters).forEach(([k, v], i) => {
        if (i !== v.number) console.log("Fail", i, v.number);
        const randomValue = Math.floor(Math.random() * (v.max + 1));
        temp.push(randomValue);
    });
    return temp;
}

export function getRandomConfig() {
    let changeable = getChangableParameters()
    let i = 0
    let result = 0
    let temp = Object.keys(dx7Parameters).map((param) =>{
        if(dx7Parameters[param].change){
            if(changeable[i])
                result = Math.floor(Math.random() * dx7Parameters[param].max)
            else 
                result = dx7Parameters[param].default
            i++
            return result
        }else{
            return dx7Parameters[param].default
        } 
    }
    );
    return temp
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

export function sampleRandomValue(initialValue, pmax, range = 100, round=0) {
    let output = Math.floor(Math.random() * 100)
    if (range >= 100) {
        if (initialValue === output && round<4)
            return sampleRandomValue(initialValue, pmax, range, round+1)
        else
            return output; // Allow any value between 0 and 100
    }

    let newrange = Math.ceil((pmax + 1) * range * 0.01)

    const min = Math.max(0, initialValue - newrange);
    const max = Math.min(pmax, initialValue + newrange);

    output = Math.floor(Math.random() * (max - min) + min);


    if (initialValue === output)
        return sampleRandomValue(initialValue, pmax, range, round+1)
    else
        return output; // Allow any value between 0 and 100
}

export function selectARandomBlock() {
    let block =
        dx7Blocks[
        Object.keys(dx7Blocks)[getRandom(Object.keys(dx7Blocks).length)]
        ];
    return block[Object.keys(block)[getRandom(Object.keys(block).length)]];
}

export function selectARandomOP() {
    let block =
        dx7Blocks[
        Object.keys(dx7Blocks)[getRandom(Object.keys(dx7Blocks).length)]
        ];
    return block.All
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


export function interpolate(configA, configB, percent, algoA) {
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
            return algoA ? valueA : valueB;
        } else {
            // Linear interpolation and rounding to the nearest integer
            return Math.round(valueA + (valueB - valueA) * percent);
        }
    });
}

export function getChangableParameters() {
    // Get parameter keys in order to maintain consistent index positions
    const parameters = Object.keys(dx7Parameters);

    // Gather parameters that change and the values they should cycle through
    const changeParams = parameters.filter(
        (param) => dx7Parameters[param].change,
    );


    const cells = get(cellStateStore)
    const changableParameters = changeParams.filter(d => {
        if (cells[d] === undefined && !cells[d] && dx7Parameters[d].number !== 134 && dx7Parameters[d].number < 140) {
            return true
        } else {
            return false
        }
    })


    return changableParameters.map(d => dx7Parameters[d])
}