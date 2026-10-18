export interface Coffee {
  id: string;
  name: string;
  type: 'Teh' | 'Kopi';
  price: number;
  description: string;
  image: string;
  options: {
    sugar: boolean;
    milk: boolean;
  };
}
