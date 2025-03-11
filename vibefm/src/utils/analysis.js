import { scaleLinear } from "d3";

export function doAnalysisForValues(objects) {

    objects.forEach(object => {
        object = calculateBrightness(object)
        object = calculateSoundCharacter(object)
        object = calculatePower(object)
    })
    return objects
}


function calculateBrightness(object) {



    let max = Math.max(...object.centroid[0])
    object.brightness = { max: max, mean: 0 }
    object = adjustCentroid(object)

    return object
}

function adjustCentroid(object) {
    let centroid = object.centroid[0]
    let rms = object.rms[0]
    let max = Math.max(...rms)
    let min = Math.min(...rms)
    let scale = scaleLinear().domain([min, max]).range([0.1, 1])
    let adjustedCentroid = centroid.map((value, index) => {
        return value * scale(rms[index])
    })
    object.centroid = [adjustedCentroid]

    // Calculate weighted mean
    let weightedSum = 0;
    let sumOfWeights = 0;
    for (let i = 0; i < adjustedCentroid.length; i++) {
        if (adjustedCentroid[i] !== 0) {
            weightedSum += adjustedCentroid[i]
            sumOfWeights += scale(rms[i]);
        }
    }
    let weightedMean = weightedSum / sumOfWeights;

    object.brightness.mean = weightedMean;
    return object
}

function calculateSoundCharacter(object) {
    let hmean = calculateMeanExcludingZeros(object.hrps.harmonic)
    let rmean = calculateMeanExcludingZeros(object.hrps.residual)
    let pmean = calculateMeanExcludingZeros(object.hrps.percussive)
    let char = hmean > rmean ? hmean > pmean ? 'harmonic' : 'percussive' : rmean > pmean ? "residual" : "percussive"
    object.character = { character: char, harmonicMean: hmean, residualMean: rmean, percussiveMean: pmean }
    return object
}

function calculatePower(object) {
    let max = Math.max(...object.rms[0])
    let mean = calculateMeanExcludingZeros(object.rms[0])
    object.power = { max: max, mean: mean }
    return object
}

function calculateMeanExcludingZeros(values) {
    // Filter out the zeros
    const nonZeroValues = values.filter(value => value !== 0);
    // If no non-zero values exist, return null or 0 to avoid division by zero
    if (nonZeroValues.length === 0) {
        return 0; // Or null, depending on your preference
    }
    // Calculate the sum of the non-zero values
    const sum = nonZeroValues.reduce((acc, value) => acc + value, 0);
    // Calculate and return the mean
    return sum / nonZeroValues.length;
}