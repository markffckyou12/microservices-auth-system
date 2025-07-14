export declare const mockRequest: (overrides?: {}) => {
    body: {};
    params: {};
    query: {};
    headers: {};
    ip: string;
    userAgent: string;
};
export declare const mockResponse: () => any;
export declare const mockNext: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
export declare const createTestDatabase: () => Promise<{
    query: import("jest-mock").Mock<() => Promise<{
        rows: never[];
        rowCount: number;
    }>>;
    connect: import("jest-mock").Mock<() => Promise<void>>;
    end: import("jest-mock").Mock<() => Promise<void>>;
}>;
export declare const createTestRedis: () => Promise<{
    get: import("jest-mock").Mock<() => Promise<null>>;
    set: import("jest-mock").Mock<() => Promise<string>>;
    setEx: import("jest-mock").Mock<() => Promise<string>>;
    del: import("jest-mock").Mock<() => Promise<number>>;
    connect: import("jest-mock").Mock<() => Promise<void>>;
    disconnect: import("jest-mock").Mock<() => Promise<void>>;
}>;
//# sourceMappingURL=setup.d.ts.map