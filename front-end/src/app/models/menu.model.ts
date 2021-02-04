export class Menu {
  constructor() {
    this.items = [];
    this.categories = [];
  }

  name: string;
  total: number;
  categories: MenuCategory[];
  items: MenuItem[];
}


export class MenuItem {
  menu_id: number;
  sub_id:number;
  item_id:number;
  name: string;
  des: string;
  item_link: string;  
  count: number;
  unit_price: number;
  vegetarian:boolean;
  glutten_free:boolean;
  allergies:boolean;
  vegan:boolean;

}

export class MenuCategory {
  constructor() {
    this.items = [];
  }

  name: string;
  items: MenuItem[];
}
