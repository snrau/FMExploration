import * as druid from '@saehrimnir/druidjs'

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
