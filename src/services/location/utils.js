const knex = require('knex');

const { HttpInvalidRequestError } = require('../../errors');

function _toRadians (degrees) {
  return degrees * Math.PI / 180;
}

const LATITUDE_DEGREE_LENGTH = 111; // Approximately, in kilometers.
const LONGITUDE_DEGREE_LENGTH_EQUATOR = 111.321;

/**
 * Approximately compute how many degrees in each direction does the
 * given distance go.
 *
 * @param {Number} lat in degrees
 * @param {Number} lon in degrees
 * @param {Number} distance in kilometers
 * @return {Object}
 *
 */
function _convertKilometersToDegrees (lat, lon, distance) {
  // We are invariant wrt. hemispheres.
  lat = Math.abs(lat);
  lon = Math.abs(lon);
  // The distance between longitude degrees decreases with the distance from equator.
  const scale = Math.cos(_toRadians(lat)),
    longitudeDegreeLength = scale * LONGITUDE_DEGREE_LENGTH_EQUATOR;

  return {
    lat: distance / LATITUDE_DEGREE_LENGTH,
    lon: distance / longitudeDegreeLength,
  };
}

/**
 * Return the expression for ordering by (approximate) distance
 * from the given point.
 *
 * NOTE: In order to retain portability across SQL backends, we
 * do not rely on any native geospatial functions of the
 * database. As a result, however, the ordering does not use
 * indices.
 *
 * @param {Number} lat in degrees
 * @param {Number} lon in degrees
 * @return {Object}
 *
 */
const _prepareSortingByDistance = (db, lat, lon) => {
  const scale = Math.cos(_toRadians(Math.abs(lat)));
  const scaleSquared = Math.pow(scale, 2);
  const clause = knex.raw(`*, ${LATITUDE_DEGREE_LENGTH} * ${LATITUDE_DEGREE_LENGTH} * ` +
    `(gpsCoordsLat - ${lat}) * (gpsCoordsLat - ${lat}) + ` +
    `${LONGITUDE_DEGREE_LENGTH_EQUATOR} * ${LONGITUDE_DEGREE_LENGTH_EQUATOR} * ` +
    `${scaleSquared} * (gpsCoordsLon - ${lon}) * (gpsCoordsLon - ${lon}) ` +
    'as location_distance');
  return clause;
};

const verifyLocationDistanceFormats = (locations) => {
  const regex = new RegExp('^[\\d.]+,[\\d.]+:[\\d.]+$');
  for (const location of locations) {
    const results = regex.exec(location);
    if (results === null || results.index !== 0) {
      throw new HttpInvalidRequestError(`Invalid lat,lon:distance format ${location}`);
    }
  }
};

const verifyLocationFormat = (location) => {
  const regex = new RegExp('^[\\d.]+,[\\d.]+$');
  const results = regex.exec(location);
  if (results === null || results.index !== 0) {
    throw new HttpInvalidRequestError(`Invalid lat,lon format ${location}`);
  }
};

module.exports = {
  _convertKilometersToDegrees,
  verifyLocationDistanceFormats,
  verifyLocationFormat,
  _prepareSortingByDistance,
};
