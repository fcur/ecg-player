import { Component, OnInit } from '@angular/core';
import { XDrawingProxy } from "../model/drawing-proxy"
import { DataService } from "../service/data.service"
import { XDrawingClient, XDrawingMode, XDrawingChange, XDrawingProxyState }
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

	private _dp: XDrawingProxy;
	private _drawingClients: XDrawingClient[];

	//-------------------------------------------------------------------------------------
	constructor(private _ds: DataService) {
		console.info("DrawableComponent constructor");
		this._dp = new XDrawingProxy();
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
		let ansClient: XDrawingClient = new XDrawingClient();
		ansClient.mode = XDrawingMode.Mix;

		let pqrstClient: XDrawingClient = new XDrawingClient();
		pqrstClient.mode = XDrawingMode.SVG;

		this._drawingClients.push(ansClient, pqrstClient);

	}
}
