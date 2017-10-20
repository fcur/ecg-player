import { Component, OnInit } from '@angular/core';
import { XDrawingProxy } from "../model/drawing-proxy"
import { DataService } from "../service/data.service"
import {
		XDrawingClient, XDrawingMode, XDrawingChange,
		XDrawingProxyState
}
		from "../model/misc";
import {
		EcgAnnotation, EcgAnnotationCode, EcgLeadCode,
		EcgRecord, EcgSignal, EcgWavePoint, EcgWavePointType
} from "../model/ecgdata";

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
		private _ansClient: XDrawingClient;
		private _pqrstClient: XDrawingClient;


		//private _drawingClients: XDrawingClient[];

		//-------------------------------------------------------------------------------------
		constructor(private _ds: DataService) {
				console.info("DrawableComponent constructor");
				this._dp = new XDrawingProxy();
				this.prepareClients();
				this.prepareDrawingObjects();
				//this._drawingClients = new Array();
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
				this._ansClient = new XDrawingClient();
				this._ansClient.mode = XDrawingMode.Mix;
				this._pqrstClient = new XDrawingClient();
				this._pqrstClient.mode = XDrawingMode.SVG;
				//this._drawingClients.push(ansClient, pqrstClient);

		}

		//-------------------------------------------------------------------------------------
		private prepareDrawingObjects() {
				let fakeWavepoints: EcgWavePoint[] = new Array(20); // wavepoints from solid record
				this._dp.pushWavepoints(fakeWavepoints, this._pqrstClient);


		}

}
