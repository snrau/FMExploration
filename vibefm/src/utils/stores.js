import { writable } from "svelte/store";

export const exportList = writable([]);

export const data = writable([]);
export const jsonDataList = writable([]);
export const sampledList = writable([]);
export const refList = writable([]);
export const distMatrix = writable([]);
export const edgeList = writable([]);


export const startingIndex = writable(0)