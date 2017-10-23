import {
		Component, OnInit, ElementRef, HostListener,
		ViewChild
} from '@angular/core';
import { XDrawingProxy } from "../model/drawing-proxy"
import { DataService } from "../service/data.service"
import {
		XDrawingClient, XDrawingMode, XDrawingChange,
		XDrawingProxyState, XCanvasTool
} from "../model/misc";
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

		//-------------------------------------------------------------------------------------
		@ViewChild("waveformCanvas")
		private _drawingElement: ElementRef;
		
		//-------------------------------------------------------------------------------------
		@HostListener("window:resize", ["$event"]) onWindowResize(event: Event) {
			// TODO: fix resize bug
			console.log("dpr:", window.devicePixelRatio);
			this.prepareCanvasSize();
			this._ct.drawInfo();
		}
		//private _drawingClients: XDrawingClient[];

		/**Canvas tool. */
		private _ct: XCanvasTool;


		//-------------------------------------------------------------------------------------
		constructor(private _el: ElementRef,
				private _ds: DataService) {
				console.info("DrawableComponent constructor");
				this._dp = new XDrawingProxy();
				//this._drawingClients = new Array();
		}

		//-------------------------------------------------------------------------------------
		ngOnInit() {
				console.info("DrawableComponent: init");
				this._ct = new XCanvasTool(this._drawingElement);
				this.prepareGrid();
				this.prepareClients();
				this.prepareDrawingObjects();
		}

		//-------------------------------------------------------------------------------------
		ngAfterContentInit(){
			this.prepareCanvasSize();
			this._ct.drawInfo();
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
				let fakeWavepoints: EcgWavePoint[] = new Array(30); // wavepoints from solid record
				this._dp.buildWavepoints(fakeWavepoints, this._pqrstClient);

				let fakeAns: EcgAnnotation[] = new Array(120);
				this._dp.buildAnnotations(fakeAns, this._ansClient);

		}

		//-------------------------------------------------------------------------------------
		private prepareGrid() {
				let leads: EcgLeadCode[] = [EcgLeadCode.MDC_ECG_LEAD_ES, EcgLeadCode.MDC_ECG_LEAD_AS, EcgLeadCode.MDC_ECG_LEAD_AI];
				let leadsLabels: string[] = ["ES", "AS", "AI"];
				this._dp.state.prepareGridCells(leads, leadsLabels);
		}

		//-------------------------------------------------------------------------------------
		private prepareCanvasSize(){
			this._ct.resize(this._el.nativeElement.offsetWidth as number, 
				this._el.nativeElement.offsetHeight as number);
		}

}
