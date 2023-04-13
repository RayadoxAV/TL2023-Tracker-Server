import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const verifyLoggedIn = (request: Request, response: Response, nextFunction: NextFunction) => {
  const bearerHeader = request.headers['authorization'];

  if (bearerHeader) {
    const bearerToken = bearerHeader.split(' ')[1];
    
    jwt.verify(bearerToken, process.env.SEED!!, (error: any, _) => {
      if (error) {
        return response.status(401).json({
          requestStatus: 'ERROR',
          error: {
            message: 'Invalid authorization token'
          }
        });
      }

      nextFunction();
    });
  } else {
    return response.status(403).json({
      requestStatus: 'ERROR',
      error: {
        message: 'Invalid authorization header'
      }
    });
  }
};