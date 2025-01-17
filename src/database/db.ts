import { Pool } from 'pg';

const pool = new Pool({
    user: 'planejamento_usr',
    host: '10.98.14.42',
    database: 'planejamento',
    password: '4VG1x52U',
    port: 5432,
    max: 20, 
    idleTimeoutMillis: 30000, 
    connectionTimeoutMillis: 2000, 
});
export default pool;