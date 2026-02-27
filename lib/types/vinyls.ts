export interface Vinyl {
  id:number;
  title:string;
  artist:string;
  description?:string;
  userId:string;
  fileUrl?:string;
  EAN?:number;
  available:boolean;
}