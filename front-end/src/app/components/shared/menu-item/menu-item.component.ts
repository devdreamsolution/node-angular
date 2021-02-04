import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-menu-item',
  templateUrl: './menu-item.component.html',
  styleUrls: ['./menu-item.component.scss']
})
export class MenuItemComponent implements OnInit {

  @Input() item: any;
  @Output() minus = new EventEmitter();
  @Output() plus = new EventEmitter();
  constructor() { 

  }

  ngOnInit(): void {
    //console.log(this.item);

  }

}
