const properties = require('./json/properties.json');
const users = require('./json/users.json');

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
 const getUserWithEmail = function (email) {
  const queryString = `
    SELECT * FROM users 
    WHERE email = $1;
  `
  return db.query(queryString, [email])
    .then(res => res.rows[0])
    .catch(err => console.error(err.stack))

}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
 const getUserWithId = function (id) {
  const queryString = `
    SELECT * FROM users 
    WHERE id = $1;
  `
  return db.query(queryString, [id])
    .then(res => res.rows[0])
    .catch(err => console.error(err.stack))
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
 const addUser = function (user) {
  const queryString = `
  INSERT INTO users (name, email, password) VALUES ($1, $2, $3) 
  RETURNING *;
  `

  return db.query(queryString, [user.name, user.email, user.password])
    .then(res => res.rows[0])
    .catch(err => console.error(err.stack))

}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
 const getAllReservations = function (guest_id, limit = 10) {
  const queryString = `
    SELECT reservations.*, properties.*, AVG(property_reviews.rating) as average_rating
    FROM reservations
    JOIN properties ON properties.id = reservations.property_id
    JOIN property_reviews ON property_reviews.property_id = properties.id
    WHERE reservations.guest_id = $1 
    GROUP BY reservations.id, properties.id
    ORDER BY reservations.end_date
    LIMIT $2;
  `;

  return db.query(queryString, [guest_id, limit])
    .then(res => res.rows)
    .catch(err => console.error(err.stack))
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
 const getAllProperties = function (options, limit = 10) {
  const queryParams = [];

  let queryString = `
    SELECT properties.*, AVG(property_reviews.rating) as average_rating
    FROM properties
    JOIN property_reviews ON properties.id = property_reviews.property_id
    WHERE TRUE `
  if (options.owner_id) {
    queryParams.push(options.owner_id);
    queryString += `AND properties.owner_id = $${queryParams.length} `;
  }

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `AND city LIKE $${queryParams.length} `;
  }

  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    queryParams.push(options.minimum_price_per_night * 100);
    queryString += `AND properties.cost_per_night >= $${queryParams.length} `
    queryParams.push(options.maximum_price_per_night * 100);
    queryString += `AND properties.cost_per_night <= $${queryParams.length} `
  } else if (options.minimum_price_per_night) {
    queryParams.push(options.minimum_price_per_night * 100);
    queryString += `AND properties.cost_per_night >= $${queryParams.length} `
  } else if (options.maximum_price_per_night) {
    queryParams.push(options.maximum_price_per_night * 100);
    queryString += `AND properties.cost_per_night <= $${queryParams.length} `
  }

  queryString += `GROUP BY properties.id `;

  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating)
    queryString += `HAVING AVG(property_reviews.rating) >= $${queryParams.length} `
  }

  queryParams.push(limit)

  queryString += `
    ORDER BY cost_per_night
    LIMIT $${queryParams.length};
    `;

  console.log(queryString, queryParams)
  return db.query(queryString, queryParams)
    .then(res => res.rows)
    .catch(err => console.error(err.stack))
}
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
 const addProperty = function (property) {
  const queryString = `
  INSERT INTO properties (
    title,
    description, 
    number_of_bedrooms,
    number_of_bathrooms,
    parking_spaces,
    cost_per_night,
    thumbnail_photo_url,
    cover_photo_url,
    street,
    country,
    city, 
    province,
    post_code,
    owner_id) 
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
  RETURNING *;
  `

  return db.query(queryString, Object.values(property))
    .then(res => res.rows[0])
    .catch(err => console.error(err.stack))
}
exports.addProperty = addProperty;
