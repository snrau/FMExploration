import * as druid from '@saehrimnir/druidjs'
import { distMatrix } from './stores'
import { get } from 'svelte/store'

export function getDrProjectedPoints(distMatrix, drmethod = 'mds', precomputed = true) {
    const druidMatrix = druid.Matrix.from(distMatrix)

    let DR
    // MDS if false
    if (drmethod = 'mds') {
        if (precomputed) {
            //DR = new druid.MDS(druidMatrix, { d: 2, metric: 'precomputed' }).transform()
            let DRn = new druid.MDS(druidMatrix, { d: 2, metric: 'precomputed' })
            DR = DRn.transform()
            /*} 
            // console.log("perp: "+perplexity+", eps: 10, Anzahl: "+temp.length);
            */
        } else {
            let DRn = new druid.MDS(druidMatrix, { d: 2 })
            DR = DRn.transform()
        }
    } else if (drmethod = 'umap') {
        if (precomputed) {
            let DRn = new druid.UMAP(druidMatrix, { n_neighbors: Math.min(distMatrix.length, 15), local_connectivity: 3, min_dist: 1, d: 2, metric: 'precomputed' })
            //DRn._X = druidMatrix
            DR = DRn.transform()
        } else {
            let DRn = new druid.UMAP(druidMatrix, { n_neighbors: Math.min(distMatrix.length, 15), local_connectivity: 3, min_dist: 1, d: 2 })
            //DRn._X = druidMatrix
            DR = DRn.transform()
        }
    } else if (drmethod = 'tsne') {
        let DRn
        let perplexity = 40
        if (distMatrix.length >= 55) {
            perplexity = 50
        } else if (distMatrix.length <= 10) {
            perplexity = 5
        } else {
            perplexity = distMatrix.length - 5
        }
        if (precomputed) {
            DRn = new druid.TSNE(druidMatrix, { perplexity: perplexity, epsilon: 10, d: 2, metric: 'precomputed' })
        } else {
            DRn = new druid.TSNE(druidMatrix, { perplexity: perplexity, epsilon: 10, d: 2 })
        }
        DR = DRn.transform()
    }

    // @ts-ignore
    const points = DR.to2dArray
    return points
}

export function euclideanDistance(mfcc1, mfcc2) {
    if (mfcc1.length !== mfcc2.length) {
        let m1l = mfcc1.length % 20
        let m2l = mfcc2.length % 20
        let minlength = Math.max(m1l, m2l)
        let t1 = []
        let t2 = []
        for(let i = 0; i<20;i++){
            t1 = t1.concat(mfcc1.slice(i*m1l, (i*m1l)+minlength))
            t2 = t2.concat(mfcc2.slice(i*m2l, (i*m2l)+minlength))
        }
        Math.sqrt(t1.reduce((sum, val, i) => sum + Math.pow(val - t2[i], 2), 0));
    }
    return Math.sqrt(mfcc1.reduce((sum, val, i) => sum + Math.pow(val - mfcc2[i], 2), 0));
}

export function calculateGlobalMeanDist(distanceMatrix) {
    let totalDistance = 0;
    let count = 0;

    for (let i = 0; i < distanceMatrix.length; i++) {
        for (let j = i; j < distanceMatrix[i].length; j++) {
            if (i !== j) { // Exclude diagonal elements
                totalDistance += distanceMatrix[i][j];
                count++;
            }
        }
    }

    const globalMeanDist = totalDistance / count;
    return globalMeanDist;
}

export function newPointOOD(newPoint, points, distMatrix1 = null) {
    if (!newPoint) {
        throw new Error("Invalid input: points must be a non-empty array.");
    }
    if (!Array.isArray(points) || points.length === 0) {
        // Apply repulsion effect
        newPoint.x = 0;
        newPoint.y = 0;
        // Calculate final estimated position
        return newPoint
    }
    if (distMatrix1 === null)
        distMatrix1 = get(distMatrix)

    let globalMeanDist = calculateGlobalMeanDist(distMatrix1) * 3 / 4;

    // Compute distances between newPoint and all existing points
    let distances = points.map(p => ({
        x: p.x,
        y: p.y,
        dist: euclideanDistance(newPoint.analysis.mfcc.flat(), p.analysis.mfcc.flat())
    }));

    // Compute mean distance
    let meanDist = distances.reduce((sum, d) => sum + d.dist, 0) / distances.length;

    // Identify close and distant points
    let closePoints = distances.filter(d => d.dist < globalMeanDist);
    let distantPoints = distances.filter(d => d.dist >= globalMeanDist);

    let sumWeights = 1e-6;
    let weightedX = 0, weightedY = 0;

    // Process close points with normal weighted averaging
    closePoints.forEach(({ x, y, dist }) => {
        let weight = Math.exp(-dist / (meanDist / 2)); // Stronger influence for close points
        sumWeights += weight;
        weightedX += x * weight;
        weightedY += y * weight;
    });

    let inlierX = weightedX / sumWeights;
    let inlierY = weightedY / sumWeights;

    // Process distant points with repulsion
    let repulsionFactor = closePoints.length === 0 ? 0.05 : 0.005; // Adjust this value for weaker/stronger repulsion
    let repulsionX = 0, repulsionY = 0;

    distantPoints.forEach(({ x, y, dist }) => {
        let directionX = inlierX - x;
        let directionY = inlierY - y;
        let length = Math.sqrt(directionX * directionX + directionY * directionY) + 1e-6; // Avoid division by zero

        let repulsionWeight = (1 + (dist - globalMeanDist) / globalMeanDist) * repulsionFactor;
        repulsionX += (directionX / length) * repulsionWeight;
        repulsionY += (directionY / length) * repulsionWeight;
    });

    // Apply repulsion effect
    newPoint.x = inlierX + repulsionX;
    newPoint.y = inlierY + repulsionY;
    // Calculate final estimated position
    return newPoint
}