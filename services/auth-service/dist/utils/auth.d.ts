export declare const hashPassword: (password: string) => Promise<string>;
export declare const comparePassword: (password: string, hash: string) => Promise<boolean>;
export declare const signJwt: (payload: object) => string;
export declare const verifyJwt: (token: string) => any;
//# sourceMappingURL=auth.d.ts.map