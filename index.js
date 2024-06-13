import express from 'express';
import chalk from 'chalk';
import { startDB, getDB } from './db.js';

const app = express();

const PORT = process.env.PORT || 3000;

app.use((request, response, next) => {
    console.log(chalk.cyan(`${request.method} ${request.path} @ ${new Date()}`));
    next();
});
app.use(express.json());

app.get('/api/ping', (request, response) => {
    response.send('pong');
});

app.get('/api/animals', async (request, response, next) => {
    try {
        const client = getDB();

        const { rows } = await client.query(`
            SELECT id, species, extinct FROM animals;
        `);

        response.send({
            animals: rows,
        });
    } catch (e) {
        next(e);
    }
});

app.get('/api/animals/:id', async (request, response, next) => {
    try {
        const { id } = request.params;

        const numberID = parseInt(id);

        if (isNaN(numberID)) {
            response.status(400).send({
                error: true,
                message: `Can only send IDs that are numerical. You sent "${id}"`,
            });
            return;
        }

        const client = getDB();

        const { rows } = await client.query(`
            SELECT * FROM animals WHERE id = $1;
        `, [id]);

        if (!rows.length) {
            response.status(404).send({
                error: false,
                message: `No animal found with ID ${id}`,
            });
            return;
        }

        response.send({
            animal: rows[0],
        });
    } catch (e) {
        next(e);
    }
});

app.post('/api/animals', async (request, response, next) => {
    const { animal } = request.body;

    if (!animal) {
        response.status(400).send({
            error: true,
            message: `This route requires a JSON with an animal object.`,
        });
        return;
    }

    try {
        const client = getDB();

        await client.query(`
            INSERT INTO animals (species, extinct) VALUES ($1, $2);
        `, [animal.species, animal.extinct || false]);

        response.status(201).send({
            message: `Created ${animal.species}`,
        });
    } catch (e) {
        next(e);
    }
});

app.put('/api/animals/:id', async (request, response, next) => {
    const { id } = request.params;
    const { extinct } = request.body;

    // TODO: Lots of error handling missing.

    try {
        const client = getDB();

        await client.query(`
            UPDATE animals
            SET extinct = $1
            WHERE id = $2;
        `, [extinct, id]);

        response.send({
            message: `Animal with ID ${id} updated successfully.`,
        });
    } catch (e) {
        next(e);
    }
});

app.delete('/api/animals/:id', async (request, response, next) => {
    const { id } = request.params;

    // TODO: Lots of error handling missing.

    try {
        const client = getDB();

        await client.query(`
            DELETE FROM animals WHERE id = $1;
        `, [id]);

        response.status(204).send({
            message: `Animal with ID ${id} successfully deleted.`,
        });
    } catch (e) {
        next(e);
    }
});

const startApplication = async () => {
    await startDB(true);
    app.listen(PORT, () => {
        console.log(chalk.green(`Server is now listening on PORT:${PORT}`));
    });
};

startApplication();
