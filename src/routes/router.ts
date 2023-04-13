import express, { Request, Response } from 'express';

import login from './login';
import services from './services';
import record from './record';
import users from './users';

const router = express();

router.get('/', (_: Request, response: Response) => {
  response.status(200).json({
    requestStatus: 'SUCCESS',
  });
});

router.use(login);
router.use(services);
router.use(record);
router.use(users);

export default router;
