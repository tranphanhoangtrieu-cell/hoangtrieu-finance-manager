export type ApiError = {
  message: string;
};

export function jsonError(res: { status: (code: number) => any; json: (body: any) => any }, code: number, message: string) {
  return res.status(code).json({ message } satisfies ApiError);
}

