import { createPool, Pool } from 'mysql';
import { promisify } from 'util';
import Logger, { LogType } from '../util/logger';

let connection: any;

let intervalID: NodeJS.Timer;

/** Create a connection pool based on the variables present in the .env file
 * 
 */
function connect(): void {
  connection = createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_USER_PASSWORD,
    database: process.env.DB_NAME
  });

  connection.query = promisify(connection.query);

  connection.on('connection', (_: any) => {
    Logger.log('Database connection successful', LogType.SUCCESS);
  });

  function keepAlive(): void {
    connection.getConnection((error: any, conn: any) => {
      if (error) {
        Logger.log(`Database error: ${error}`, LogType.ERROR);
        return;
      }

      conn.ping();
      conn.release();
    });
  }

  intervalID = setInterval(keepAlive, 5000);
}

connect();

export default connection;
