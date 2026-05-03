import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export const hashPass = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

export const verifyPass = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};