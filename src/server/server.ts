import express from 'express';
import http, { createServer } from 'http';
import Logger, { LogType } from '../util/logger';
import socketio, { Socket } from 'socket.io';
import { Worker } from 'worker_threads';

import fetch from 'node-fetch';
import { format } from 'mysql';
import connection from '../connection/db';
import { generateISODate } from '../util/date';

class Server {
  private static _instance: Server;

  public app: express.Application;
  public port: number;

  private httpServer: http.Server;

  public ioServer: socketio.Server;

  private constructor() {
    this.app = express();
    this.port = Number(process.env.PORT) || 3001;

    this.httpServer = createServer(this.app);
    this.ioServer = new socketio.Server(this.httpServer, { cors: { origin: '*' } });
    this.listenSockets();
  }

  public static get instance(): Server {
    return this._instance || (this._instance = new this());
  }

  public startServer(callback: any): void {
    Logger.log(`Inicializando servidor en el puerto ${this.port}...`, LogType.INFO);
    this.httpServer.listen(this.port, callback);
  }

  private listenSockets() {
    Logger.log('Listening for socket connection', LogType.INFO);

    this.ioServer.on('connection', (socket: Socket) => {
      this.ioServer.to(socket.id).emit('confirm-connection', socket.id);
    });

    const pollHr = new Worker('./src/polling/pollHr.js',);
    pollHr.postMessage({ command: 'start' });

    pollHr.on('message', async (data) => {
      this.ioServer.emit('service-update', {
        id: data.idService,
        name: 'HR',
        status: this.determineServiceStatus(data.data),
        data: await this.generateData(data.data, data.idService)
      })
    });

    const pollFinance = new Worker('./src/polling/pollFinance.js',);
    pollFinance.postMessage({ command: 'start' });

    pollFinance.on('message', async (data) => {
      this.ioServer.emit('service-update', {
        id: data.idService,
        name: 'Finance',
        status: this.determineServiceStatus(data.data),
        data: await this.generateData(data.data, data.idService)
      })
    });

    const pollDev = new Worker('./src/polling/pollDev.js',);
    pollDev.postMessage({ command: 'start' });

    pollDev.on('message', async (data) => {
      this.ioServer.emit('service-update', {
        id: data.idService,
        name: 'Dev',
        status: this.determineServiceStatus(data.data),
        data: await this.generateData(data.data, data.idService)
      })
    });

    const pollResearch = new Worker('./src/polling/pollResearch.js',);
    pollResearch.postMessage({ command: 'start' });

    pollResearch.on('message', async (data) => {
      this.ioServer.emit('service-update', {
        id: data.idService,
        name: 'Research',
        status: this.determineServiceStatus(data.data),
        data: await this.generateData(data.data, data.idService)
      })
    });

    const pollOperation = new Worker('./src/polling/pollOperation.js',);
    pollOperation.postMessage({ command: 'start' });

    pollOperation.on('message', async (data) => {
      this.ioServer.emit('service-update', {
        id: data.idService,
        name: 'Operation',
        status: this.determineServiceStatus(data.data),
        data: await this.generateData(data.data, data.idService)
      })
    });



    // TODO: Poll other services

  }

  determineServiceStatus(components: any): number {
    const data = [];
    for (let i = 0; i < components.length; i++) {
      const component = components[i];
      data.push({
        id: component.id,
        name: component.name,
        status: this.determineStatus(component)
      });
    }
    let interrupts = 0;
    let downs = 0;

    for (let i = 0; i < data.length; i++) {
      const component = data[i];
      if (component.status === 1) {
        interrupts += 1;
      }

      if (component.status === 2) {
        downs += 1;
      }
    }

    if (interrupts === 0 && downs === 0) {
      return 0;
    }

    if (interrupts >= components.length / 2 || downs >= 3) {
      return 2;
    }

    if (interrupts >= 1 || downs >= 3) {
      return 1;
    }

    // if (interrupts > 1 ||)

    return 2;
  }


  private async generateData(components: any, idService: any) {
    const data = [];

    for (let i = 0; i < components.length; i++) {
      const component = components[i];
      data.push({
        id: component.id,
        name: component.name,
        status: this.determineStatus(component)
      });

      if (this.determineStatus(component) != 0) {
        // Consultar base de datos con fecha del ultimo evento
        const query = format(`SELECT MAX(idRecord) as idRecord, timestamp FROM record WHERE idService = ? GROUP BY idRecord DESC`, [`${idService}-${component.id}`]);
        // SELECT idRecord, timestamp FROM `record` WHERE idRecord = (SELECT MAX(idRecord) FROM `record`) AND idService = '1-2';
        try {
          const result = await connection.query(query);

          if (result[0]) {
            // Si hay evento, ver la fecha
            const timestamp = result[0].timestamp;
            // Convertir la fecha a utilizable
            const recordDate = new Date(timestamp);
            const now = new Date();

            // Si la fecha del incidente y la fecha actual difieren mas de diez minutos
            if ((now.getTime() - recordDate.getTime()) > 1000 * 60 * 10) {
              // Insertar el evento
              const isoDate = generateISODate();
              const status = this.determineStatus(component);
              const insertQuery = format(`INSERT INTO record VALUES (0, ?, ?, ?, ?);`, [`${idService}-${component.id}`, '', isoDate, status]);
              const result = await connection.query(insertQuery);
              this.ioServer.emit('record-update', {
                idRecord: result.insertId,
                idService: `${idService}-${component.id}`,
                message: '',
                timestamp: isoDate,
                state: status
              });
            }
            // Si no, descartarlo
          } else {
            // Si no hay evento, insertarlo
            const isoDate = generateISODate();
            const status = this.determineStatus(component);
            const insertQuery = format(`INSERT INTO record VALUES (0, ?, ?, ?, ?);`, [`${idService}-${component.id}`, '', isoDate, status]);
            const result = await connection.query(insertQuery);

            this.ioServer.emit('record-update', {
              idRecord: result.insertId,
              idService: `${idService}-${component.id}`,
              message: '',
              timestamp: isoDate,
              state: status
            });
          }
        } catch (error) {
          console.log(error);
        }
      }
    }

    return data;
  }

  private determineStatus(component: any): number {
    if (component.data !== undefined) {
      if (component.requestTime <= 5000) {
        return 0;
      }
      if (component.requestTime > 5000 && component.requestTime <= 10000) {
        return 1;
      } else if (component.requestTime > 100000) {
        return 2;
      }
    } else {
      return 2;
    }

    return 2;
  }
}

export default Server;
