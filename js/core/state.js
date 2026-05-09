import { parseCSVData, aggregateToHierarchy } from "./csv-parser.js";

export const appState = {
    rawData: null, // Flat CSV data
    filteredData: null, // Filtered hierarchical data
    currentView: "radialtree"
};

const listeners = [];

export function setState(key, value) {
    appState[key] = value;
    listeners.forEach(listener => listener({ key, value }));
}

export function subscribe(listener) {
    listeners.push(listener);
}

export async function loadDataFromCSV(url) {
    try {
        const response = await fetch(url);
        const csvText = await response.text();
        appState.rawData = parseCSVData(csvText);
        // Initial tree without filtering
        appState.filteredData = aggregateToHierarchy(appState.rawData);
        return appState.rawData;
    } catch (error) {
        console.error("Error loading CSV:", error);
        throw error;
    }
}
