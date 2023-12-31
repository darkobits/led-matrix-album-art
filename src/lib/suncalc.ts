import * as R from 'ramda';
import SunCalc from 'suncalc';


/**
 * @private
 *
 * Map of Sun phases to brightness values.
 *
 * TODO: Move this to a global configuration file.
 */
const phasesToBrightness: Record<string, number> = {
  // Nadir: Darkest moment of the night, Sun is in the lowest position.
  nadir: 40,
  // Night End: Morning astronomical twilight starts.
  nightEnd: 40,
  // Nautical Dawn: Morning nautical twilight starts.
  nauticalDawn: 50,
  // Dawn: Morning nautical twilight ends, morning civil twilight starts.
  dawn: 60,
  // Sunrise: Top edge of the Sun appears on the horizon.
  sunrise: 70,
  // Sunrise End: Bottom edge of the Sun touches the horizon.
  sunriseEnd: 80,
  // Golden Hour End: Soft light, best time for photography ends.
  goldenHourEnd: 100,
  // Solar Noon: Sun is in the highest position.
  solarNoon: 100,
  // Golden Hour: Evening golden hour starts.
  goldenHour: 100,
  // Sunset Start: Bottom edge of the Sun touches the horizon.
  sunsetStart: 80,
  // Sunset: Sun disappears below the horizon, evening civil twilight starts.
  sunset: 70,
  // Dusk: Evening nautical twilight starts.
  dusk: 60,
  // Nautical Dusk: Evening astronomical twilight starts.
  nauticalDusk: 50,
  // Night: Dark enough for astronomical observations.
  night: 40
};


/**
 * Provided a latitude, longitude, and Date, returns a sorted list of tuples,
 * each containing a phase name and a Date object indicating when that phase
 * started.
 */
export function getSunPhases(latitude: number, longitude: number, now = new Date()) {
  const times = SunCalc.getTimes(
    now,
    latitude,
    longitude
  );

  return R.sort((a, b) => {
    const [, d1] = a;
    const [, d2] = b;

    if (d1.getTime() > d2.getTime()) return 1;
    if (d1.getTime() < d2.getTime()) return -1;
    return 0;
  }, R.toPairs(times));
}


/**
 * Provided a latitude, longitude, and Date, returns a sorted list of tuples
 * each containing a phase name and a locale string indicating when that phase
 * started.
 */
export function getSunPhasesHumanized(latitude: number, longitude: number, now = new Date()) {
  const phases = getSunPhases(latitude, longitude, now);

  return R.map(([phaseName, phaseStart]) => {
    return [phaseName, phaseStart.toLocaleString()];
  }, phases);
}


/**
 * Provided a latitude, longitude, and Date, returns a tuple containing the name
 * of the current Sun phase and the time at which it started.
 */
export function getCurrentSunPhase(latitude: number, longitude: number, now = new Date()) {
  const sortedPhases = getSunPhases(latitude, longitude, now);

  const currentPhase = R.last<[string, Date]>(R.dropLastWhile(x => {
    const [, d1] = x;
    return d1.getTime() >= now.getTime();
  }, sortedPhases));

  if (!currentPhase) throw new Error('Unable to calculate current sun phase.');

  return currentPhase;
}


/**
 * Provided a latitude, longitude, and Date, returns the desired brightness
 * level based on the Sun's current position.
 */
export function getCurrentBrightness(latitude: number, longitude: number, now = new Date()) {
  const [phaseName] = getCurrentSunPhase(latitude, longitude, now);
  return phasesToBrightness[phaseName];
}
