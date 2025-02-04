import { connect } from 'mongoose';
import { config } from '../config/config.ts';

export async function connectDatabase() {
    await connect(config.mongo_uri);
    console.log('Database connected');
}
