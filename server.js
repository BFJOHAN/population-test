const fastify = require('fastify')({ logger: true });
const NeDB = require('nedb');
const db = new NeDB({ filename: 'population.db', autoload: true });

// Need to promisify db.findOne() for use with async/await syntax
const util = require('util');
const findOne = util.promisify(db.findOne).bind(db);

// Route to get city population
fastify.get('/api/population/state/:state/city/:city', async (request, res) => {
  try {
    const statecity = (
      request.params.state + request.params.city
    ).toUpperCase();
    const doc = await findOne({ statecity: statecity });
    if (!doc) {
      res.status(400).send({ error: 'State/City combination not found' });
    } else {
      res.send({ population: doc.population });
    }
  } catch (err) {
    res.send(err);
  }
});

// Route to set city population
fastify.put('/api/population/state/:state/city/:city', async (req, res) => {
  try {
    const statecity = (req.params.state + req.params.city).toUpperCase();
    const population = parseInt(req.body);

    if (isNaN(population)) {
      return res.status(400).send({ error: 'Invalid population' });
    }

    db.update(
      { statecity: statecity },
      { $set: { population: population } },
      { upsert: true },
      (err, numAffected, affectedDocuments, upsert) => {
        if (err) {
          return res.status(400).send({ error: 'Could not set population' });
        } else {
          res.status(upsert ? 201 : 200).send({
            message: 'Population updated',
            affectedCount: numAffected,
          });
        }
      }
    );
  } catch (err) {
    res.send(err);
  }
});

// Run the server
fastify.listen(5555, (err, address) => {
  if (err) throw err;
  fastify.log.info(`server listening on ${address}`);
});
