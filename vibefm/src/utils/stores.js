import { derived, writable } from "svelte/store";

export const exportList = writable([]);

export const drpoints = writable([])
export const jsonDataList = writable([]);
export const sampledList = writable([]);
export const refList = writable([]);
export const distMatrix = writable([]);
export const edgeList = writable([]);

export const excluded = writable([]);

export const data = derived([drpoints, excluded], ([$drpoints, $excluded]) => {
    return $drpoints.filter(d => !$excluded.includes(d.id))
});

export const cellStateStore = writable({});


export const startingIndex = writable(0)