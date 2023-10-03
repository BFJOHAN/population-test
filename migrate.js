const NeDB = require('nedb');
const db = new NeDB({ filename: 'population.db', autoload: true });
const axios = require('axios');
const stream = require('stream');
const csvParse = require('fast-csv').parse;

//Create an index for quick search
db.ensureIndex({ fieldName: 'statecity', unique: true });

// populate the database from CSV file
async function populateDB() {
  const CSV_URL =
    'https://raw.githubusercontent.com/Trazi-Ventures/sample-data-interview/main/city_populations.csv';
  const response = await axios.get(CSV_URL, { responseType: 'stream' });

  response.data
    .pipe(csvParse({ headers: ['city', 'state', 'population'] }))
    .on('error', (error) => console.error(error))
    .on('data', (data) => {
      // Ensure state and city fields exist and have content
      if (data.state && data.city) {
        // Create an index combining state and city for efficient retrieval
        data.statecity = (data.state + data.city).toUpperCase();
        data.population = parseInt(data.population); // convert population to integer
        db.insert(data);
      }
    });
}

populateDB();
