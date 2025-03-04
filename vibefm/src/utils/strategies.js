import { dx7Parameters } from "./dexed";
import { getChangableParameters, getChangesArrayLimited, getRandom, getRandomConfig, randomizeBlock, sampleRandomValue, selectARandomBlock, selectARandomOP, uniformSamplingFull, uniformSamplingRestricted } from "./sampling";

// change whole blocks
export function progressiveSubgroupBlockSampling(sample, num = 50, primer = true) {
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

export function generateCombinations(
    objDict,
    samplingStrategy = "uniformRandomFull",
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
                }
            }
        } while (successful === false);
        console.log(i + 1 + " of " + num + " done");
    }
    console.log(sampledCollection);
    return sampledCollection; //allCombinations;
}

export function sampleAroundMultipleVoices(voices, numToGenerate) {
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

export function progressiveSubgroupSingleParamSampling(
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

export function randomizeName(config) {
    let c = [...config]
    c = c.map((v, i) => {
        if (i >= 145 && i < 155)
            return getRandom(127)
        else
            return v
    })
    return c
}

function checkIfAlreadyThere(sampledCollection, gen, i) {
    let successful = true;
    sampledCollection.forEach((sampled, j) => {
        if (j < i) {
            if (
                JSON.stringify(gen) ===
                JSON.stringify(sampled)
            ) {
                successful = false;
            }
        } else return successful
    })
    return successful
}

export function sampleBlockValues(config, percent, bound = 8) {
    let configs = []
    const params = getChangableParameters()

    for (let i = 0; i < bound; i++) {
        configs.push(randomizeName(config));
    }
    for (let i = 0; i < bound; i++) {
        let gen = [...configs[i]]
        const block = selectARandomOP();
        const blockParams = params.filter(p => p.number >= block[0] && p.number <= block[1])
        do {
            blockParams.forEach(p => {
                const v = sampleRandomValue(configs[i][p.number], p.max, percent)
                gen[p.number] = v
            })
        } while (!checkIfAlreadyThere(configs, gen, i))
        configs[i] = [...gen]

    }
    return configs
}


export function sampleSingleValues(config, percent) {
    let configs = []
    const params = getChangableParameters()
    params.forEach(p => {
        let c = randomizeName(config)
        let v = sampleRandomValue(config[p.number], p.max, percent)
        c[p.number] = v
        configs.push(c)
    })
    return configs
}

export function sampleAllValues(config, percent, bound = 8) {
    let configs = []
    const params = getChangableParameters()

    for (let i = 0; i < bound; i++) {
        configs.push(randomizeName(config));
    }
    for (let i = 0; i < bound; i++) {
        let gen = [...configs[i]]
        do {
            params.forEach(p => {
                const v = sampleRandomValue(configs[i][p.number], p.max, percent)
                gen[p.number] = v
            })
        } while (!checkIfAlreadyThere(configs, gen, i))
        configs[i] = [...gen]
    }
    return configs
}

export function getMultipleRandoms(num) {
    let randoms = []
    for (let i = 0; i < num; i++) {
        let gen = []
        do {
            gen = getRandomConfig()
        } while (!checkIfAlreadyThere(randoms, gen, i))
        randoms.push(gen)
    }
    return randoms
}