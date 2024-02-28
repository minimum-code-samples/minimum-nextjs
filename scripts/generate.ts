import { envfile } from './env'; // This has to be first to bootstrap the variables.

import argon2 from 'argon2';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { makeJwt } from '@src/lib/server/authentication';

const _JWT = 'jwt';
const _HASH = 'hash';

const argv = yargs(hideBin(process.argv))
	.usage('Usage: npm run generate -- -h')
	.command(`${_HASH} <password>`, 'Generates the password hash for the supplied password.', (yargs) => {
		yargs.positional('password', {
			type: 'string',
			description: 'The password to hash.',
		});
	})
	.command(
		_JWT,
		'Generates a JWT based on the supplied values and environment variables. To change the file containing the environment variables, modify APP_ENV in package.json',
		(yargs) => {
			yargs
				.option('sub', {
					alias: 's',
					describe: 'The `sub` field for the JWT.',
					type: 'string',
				})
				.option('name', {
					alias: 'n',
					describe: 'The `name` field for the JWT.',
					type: 'string',
				})
				.demandOption(['sub', 'name'], 'Both options are required.');
		}
	)
	.demandCommand(1)
	.parseSync();

async function main() {
	switch (argv._[0]) {
		case _HASH: {
			await hash();
			return;
		}
		case _JWT: {
			await jwt();
			return;
		}
		default: {
			console.error(`Invalid command (${argv._[0]})`);
			return;
		}
	}
}

async function hash() {
	try {
		const hash = await argon2.hash(argv.password as string);

		console.info(
			`Argon2 hash of input string "${argv.password}" (a different hash is generated every time even for the smae input string):`
		);
		console.info(`  ${hash} (${hash.length} characters)`);
	} catch (err: any) {
		console.error(`Password hashing halted to an error. (${err.toString()})`);
	}
}

async function jwt() {
	console.info(`Generating JWT using environment variables from "${envfile}"`);

	const result = await makeJwt(argv.sub as string, argv.name as string);

	console.info(`JWT:`);
	console.info(`${result} (${result!.length} characters)`);
}

main();
