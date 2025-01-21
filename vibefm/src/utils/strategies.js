import { dx7Parameters } from "./dexed";
import { getChangesArrayLimited, getRandom, randomizeBlock, selectARandomBlock, uniformSamplingFull, uniformSamplingRestricted } from "./sampling";

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
