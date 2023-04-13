import express, { Request, Response } from 'express';
import { verifyLoggedIn } from '../middlewares/authorization';
import { MysqlError, format } from 'mysql';
import connection from '../connection/db';

const record = express();

record.get('/record', verifyLoggedIn, (request: Request, response: Response) => {
  const query = 'SELECT * FROM record ORDER BY idRecord DESC';

  connection.query(query, (error: MysqlError, result: any[]) => {
    if (error) {
      return response.status(500).json({
        requestStatus: 'ERROR',
        queryStatusCode: 1,
        error: {
          message: 'Internal server error'
        }
      });
    }

    return response.status(200).json({
      requestStatus: 'SUCCESS',
      queryStatusCode: 0,
      result
    });
  });

});

export default record;