import { Request, Response } from 'express';
import morgan from 'morgan';
import config from '../config';
import { errorLogger, logger } from './logger';

const getIpFormat = () =>
  config.node_env === 'development' ? ':remote-addr - ' : '';
const userAgentFormat = '":user-agent"';

// Add more performance data: response length, request length, timestamp
const performanceFormat =
  `:date[iso] ${getIpFormat()}:method :url :status - :response-time ms :res[content-length] bytes :req[content-length] bytes ${userAgentFormat}`;

const successHandler = morgan(performanceFormat, {
  skip: (req: Request, res: Response) => res.statusCode >= 400,
  stream: { write: (message: string) => logger.info(message.trim()) },
});

const errorHandler = morgan(performanceFormat, {
  skip: (req: Request, res: Response) => res.statusCode < 400,
  stream: { write: (message: string) => errorLogger.error(message.trim()) },
});

export const Morgan: any = { errorHandler, successHandler };