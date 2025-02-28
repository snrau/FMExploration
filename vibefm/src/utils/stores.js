import { derived, writable } from "svelte/store";

export const exportList = writable([]);

export const drpoints = writable([])
export const jsonDataList = writable([]);
export const sampledList = writable([]);
export const refList = writable([]);
export const distMatrix = writable([]);
export const edgeList = writable([]);

export const excluded = writable([]);

export const data = derived([drpoints, refList, excluded], ([$drpoints, $refList, $excluded]) => {
    let temp = $drpoints.concat($refList);
    return temp.filter(d => !$excluded.includes(d.id))
});

export const cellStateStore = writable({});

export const interpolatedConfig = writable([]);


export const startingIndex = writable(0)

export const updateView = writable(false)