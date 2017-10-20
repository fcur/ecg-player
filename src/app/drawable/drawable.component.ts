import { Component, OnInit } from '@angular/core';
import { DrawingProxy } from "../model/drawing-proxy"
import { DataService } from "../service/data.service"
import { XDrClient, XDrMode, XDrChange, XDrProxyState }
	from "../model/misc";


@Component({
	selector: 'app-drawable',
	templateUrl: './drawable.component.html',
	styleUrls: ['./drawable.component.css']
})


// -------------------------------------------------------------------------------------------------
// DrawableComponent
// -------------------------------------------------------------------------------------------------
export class DrawableComponent implements OnInit {

	private _dp: DrawingProxy;
	private _drawingClients: XDrClient[];

	//-------------------------------------------------------------------------------------
	constructor(private _ds: DataService) {
		console.info("DrawableComponent constructor");
		this._dp = new DrawingProxy();
		this._drawingClients = new Array();
	}

	//-------------------------------------------------------------------------------------
	ngOnInit() {
		console.info("DrawableComponent: init");
	}

	//-------------------------------------------------------------------------------------
	ngOnDestroy() {
		console.info("DrawableComponent: destroy");
	}

	//-------------------------------------------------------------------------------------
	private prepareClients() {
		let ansClient: XDrClient = new XDrClient();
		ansClient.mode = XDrMode.Mix;

		let pqrstClient: XDrClient = new XDrClient();
		pqrstClient.mode = XDrMode.SVG;

		this._drawingClients.push(ansClient, pqrstClient);

	}
}
