import express, { Request, Response } from 'express';
import { verifyLoggedIn } from '../middlewares/authorization';

import fetch from 'node-fetch';

const services = express();

services.get('/services', verifyLoggedIn, (request: Request, response: Response) => {

  const requestOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  fetch(`${process.env.MOCK_SERVER_IP}/services`, requestOptions).then((res: any) => res.json()).then((result: any) => {
    if (result.queryStatusCode === 1) {
      return response.status(500).json({
        requestStatus: 'ERROR',
        queryStatusCode: 1,
        error: {
          message: 'Internal server error'
        }
      });

    }

    return response.status(200).json({
      result: result.result
    });
  });
  
});

export default services;
