/**
 * Provided a latitude, longitude, and Date, returns a sorted list of tuples,
 * each containing a phase name and a Date object indicating when that phase
 * started.
 */
export declare function getSunPhases(latitude: number, longitude: number, now?: Date): (["nadir", Date] | ["nightEnd", Date] | ["nauticalDawn", Date] | ["dawn", Date] | ["sunrise", Date] | ["sunriseEnd", Date] | ["goldenHourEnd", Date] | ["solarNoon", Date] | ["goldenHour", Date] | ["sunsetStart", Date] | ["sunset", Date] | ["dusk", Date] | ["nauticalDusk", Date] | ["night", Date])[];
/**
 * Provided a latitude, longitude, and Date, returns a sorted list of tuples
 * each containing a phase name and a locale string indicating when that phase
 * started.
 */
export declare function getSunPhasesHumanized(latitude: number, longitude: number, now?: Date): string[][];
/**
 * Provided a latitude, longitude, and Date, returns a tuple containing the name
 * of the current Sun phase and the time at which it started.
 */
export declare function getCurrentSunPhase(latitude: number, longitude: number, now?: Date): [string, Date];
/**
 * Provided a latitude, longitude, and Date, returns the desired brightness
 * level based on the Sun's current position.
 */
export declare function getCurrentBrightness(latitude: number, longitude: number, now?: Date): number;
