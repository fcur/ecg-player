import { Component, OnInit } from '@angular/core';

@Component({
	selector: 'app-drawable',
	templateUrl: './drawable.component.html',
	styleUrls: ['./drawable.component.css']
})


// -------------------------------------------------------------------------------------------------
// DrawableComponent
// -------------------------------------------------------------------------------------------------
export class DrawableComponent implements OnInit {

	//-------------------------------------------------------------------------------------
	constructor() { }

	//-------------------------------------------------------------------------------------
	ngOnInit() {
		console.info("DrawableComponent: init");
	}

	//-------------------------------------------------------------------------------------
	ngOnDestroy() {
		console.info("DrawableComponent: destroy");
	}


}
