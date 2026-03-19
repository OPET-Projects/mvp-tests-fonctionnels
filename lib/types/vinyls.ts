export interface Vinyl {
  id:number;
  title:string;
  artist:string;
  description?:string;
  user_id:number;
  file_url?:string;
  EAN?:number;
  available:boolean;
}