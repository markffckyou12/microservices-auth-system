import redisMock from 'redis-mock';

export const createMockRedis = () => {
  return redisMock.createClient();
}; 