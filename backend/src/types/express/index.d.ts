import * as express from 'express';

// Extendemos la interfaz Request de Express
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                name: string;
                role: string;
            };
        }
    }
}
