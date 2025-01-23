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
    let mean = calculateMeanExcludingZeros(object.centroid[0])
    object.brightness = { max: max, mean: mean }
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