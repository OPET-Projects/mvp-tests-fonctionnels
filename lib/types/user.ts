export interface User {
  id: number;
  name: string;
  code: string;
}

export interface UserLoginDto {
  code: string;
}