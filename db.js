import pg from 'pg';
import chalk from 'chalk';
const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://localhost:5432/2402_animals';

let client = null;

export const getDB = () => {
    if (!client) {
        const errMsg = `Cannot access database before it is started!`;
        console.log(chalk.red(errMsg));
        throw new Error(errMsg);
    }

    return client;
};

export const seedDB = async () => {
    if (!client) {
        console.log(chalk.red(`Cannot seed a database that is not connected!.`));
        return;
    }

    try {
        await client.query(`
            DROP TABLE IF EXISTS animals;
            CREATE TABLE IF NOT EXISTS animals (
                id SERIAL PRIMARY KEY,
                created_at TIMESTAMP DEFAULT now(),
                species VARCHAR(255) NOT NULL,
                extinct BOOLEAN DEFAULT false
            );

            INSERT INTO animals (species, extinct)
            VALUES ('Dog', false), 
                   ('Cat', false), 
                   ('Beaver', false),
                   ('Tyrannosaurs Rex', true),
                   ('Bald Eagle', false)
        `);

        console.log(chalk.green(`Successfully seeded database!`));
    } catch (e) {
        console.log(chalk.red(`Failed to seed database!`));
        console.error(e);
    }
};

export const startDB = async (seed = false) => {
    try {
        client = new Client(DATABASE_URL);
        await client.connect();

        console.log(chalk.green(`Database @ ${DATABASE_URL} is now connected!`));

        if (seed) {
            await seedDB();
        }

        return client;
    } catch (e) {
        console.log(chalk.red(`Database @ ${DATABASE_URL} failed to connect.`));
        console.error(e);

        throw e;
    }
};
