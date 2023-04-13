import express, { Request, Response } from 'express';
import { format, MysqlError } from 'mysql';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import connection from '../connection/db';
import { User } from '../data/user';

const users = express();

users.post('/users/register', (request: Request, response: Response) => {

  const { username, email, name, password } = request.body;

  if (username && email && name && password) {
    const hashedPassword = bcrypt.hashSync(password, 10);

    const query = format(`INSERT INTO users VALUES (NULL, ?, ?, ?, ?, 1, 0);`, [username.toLowerCase(), hashedPassword, email, name]);

    connection.query(query, (error: MysqlError, result: any[]) => {
      if (error) {
        return response.status(500).json({
          requestStatus: 'ERROR',
          registerStatusCode: 1,
          error: {
            message: 'Internal server error'
          }
        });
      }
    });

    return response.status(200).json({
      requestStatus: 'SUCCESS',
      registerStatusCode: 0
    });
  } else {
    return response.status(400).json({
      requestStatus: 'ERROR',
      registerStatusCode: 1,
      error: {
        message: 'Bad request body'
      }
    });
  }

});

users.post('/users/validate_token', (request: Request, response: Response) => {
  const { token } = request.body;

  jwt.verify(token, process.env.SEED!!, (error: jwt.VerifyErrors | null, _ : string | jwt.JwtPayload | undefined) => {
    if (error) {
      return response.status(200).json({
        requestStatus: 'SUCCESS',
        isTokenValid: false,
        error: {
          message: 'Invalid token'
        }
      });
    } else {
      return response.status(200).json({
        requestStatus: 'SUCCESS',
        isTokenValid: true
      });
    }
  })
});

export default users;
