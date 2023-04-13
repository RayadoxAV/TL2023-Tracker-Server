import express, { Request, Response } from 'express';
import { format, MysqlError } from 'mysql';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import connection from '../connection/db';
import { User } from '../data/user';

const login = express();

login.post('/login', (request: Request, response: Response) => {
  const { identifier, password } = request.body;
  if (!identifier || !password) {
    return response.status(400).json({
      requestStatus: 'ERROR',
      loginStatusCode: 1,
      error: {
        message: 'Invalid request body'
      }
    });
  }

  const table = 'users';

  const query = format(`SELECT * FROM \`${table}\` WHERE email = ?`, [identifier]);

  connection.query(query, async (error: MysqlError, result: any[]) => {
    if (error) {
      return response.status(500).json({
        requestStatus: 'ERROR',
        loginStatusCode: 1,
        error: {
          message: 'Internal server error'
        }
      });
    }

    if (result.length < 1) {
      return response.status(200).json({
        requestStatus: 'SUCCESS',
        loginStatusCode: 1
      });
    }

    if (result[0].status === 1) {
      return response.status(200).json({
        requestStatus: 'SUCCESS',
        loginStatusCode: 1
      });
    }

    const passwordComparison = await bcrypt.compare(password, result[0].password);

    if (!passwordComparison) {
      return response.status(200).json({
        requestStatus: 'SUCCESS',
        loginStatusCode: 1
      });
    }

    const user: User = {
      idUser: result[0].idUser,
      username: result[0].username,
      email: result[0].email,
      name: result[0].name,
      role: result[0].role,
      state: result[0].state
    };

    const token = jwt.sign({ user }, process.env.SEED!!, { expiresIn: process.env.TOKEN_EXPIRATION!! });

    return response.status(200).json({
      requestStatus: 'SUCCESS',
      loginStatusCode: 0,
      user,
      token
    });
  });
});

export default login;
