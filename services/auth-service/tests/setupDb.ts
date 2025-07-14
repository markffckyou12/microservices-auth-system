import { newDb } from 'pg-mem';

export const createMockDb = () => {
  const db = newDb();
  db.public.none(`
    CREATE TABLE users (
      id UUID PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      username VARCHAR(30) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP,
      updated_at TIMESTAMP,
      last_login_at TIMESTAMP
    );
  `);
  return db.adapters.createPg();
}; 