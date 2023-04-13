/** @enum {number} */
export enum LogType {
  INFO = 0,
  SUCCESS = 1,
  WARNING = 2,
  ERROR = 3
};

class Logger {
  /** Print a log message to the standar output
   * @param {string} message - The log message
   * @param {LogType} type - the type (severity) of the message 
  */
  public static log(message: string, type: LogType): void {
    const colors = [
      {
        value: '',
        name: 'INFO'
      },
      {
        value: '\x1b[34m',
        name: 'SUCCESS'
      },
      {
        value: '\x1b[33m',
        name: 'WARNING'
      },
      {
        value: '\x1b[31m',
        name: 'ERROR'
      }
    ];

    const reset = '\x1b[0m';

    console.log(`${colors[type].value}%s${reset}`, `${colors[type].name}: ${message}`);
  }
}

export default Logger;
