export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function wrap<T>(fn: (...args: any[]) => Promise<T>) {
  return async (req: any, res: any, next: any) => {
    try { await fn(req, res, next); } catch (e) { next(e); }
  };
}
