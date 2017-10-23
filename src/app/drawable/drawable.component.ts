import {
		Component, OnInit, ElementRef, HostListener,
		ViewChild
} from '@angular/core';
import { XDrawingProxy } from "../model/drawing-proxy"
import { DataService } from "../service/data.service"
import {
		XDrawingClient, XDrawingMode, XDrawingChange,
		XDrawingProxyState, XCanvasTool, XRectangle
} from "../model/misc";
import {
		EcgAnnotation, EcgAnnotationCode, EcgLeadCode,
		EcgRecord, EcgSignal, EcgWavePoint, EcgWavePointType
} from "../model/ecgdata";
import {
		FileDropModule, UploadFile, UploadEvent
} from "ngx-file-drop/lib/ngx-drop";

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
		private _hideFileDrop: boolean = false;



		//-------------------------------------------------------------------------------------
		@ViewChild("waveformCanvas")
		private _drawingElement: ElementRef;
		@ViewChild("canvasCont")
		private _canvasContainer: ElementRef;
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
				this.prepareClients();
				//this._drawingClients = new Array();
		}

		//-------------------------------------------------------------------------------------
		ngOnInit() {
				console.info("DrawableComponent: init");

		}

		//-------------------------------------------------------------------------------------
		ngAfterContentInit() {
				this._ct = new XCanvasTool(this._drawingElement);
				this.prepareCanvasSize();
				this._dp.state.limitPx = this._ct.width;
				this.prepareGrid();
				this.prepareDrawingObjects();
				this._ct.drawInfo();
		}

		//-------------------------------------------------------------------------------------
		ngOnDestroy() {
				console.info("DrawableComponent: destroy");
		}




		//-------------------------------------------------------------------------------------
		public dropped(event: UploadEvent) {
				let files: UploadFile[] = event.files;


				//for (var file of event.files) {
				//		file.fileEntry.file(info => {
				//				console.log(info);
				//		});
				//}
				
				let reader: FileReader = new FileReader();
				reader.onload = (function (file) {
						console.log(file);

				});

				//reader.readAsDataURL(files[0].);

				this._hideFileDrop = true;
				this.prepareCanvasSize();
				this._ct.drawInfo();
		}

		//-------------------------------------------------------------------------------------
		public fileOver(event) {
				//console.log(event);
		}

		//-------------------------------------------------------------------------------------
		public fileLeave(event) {
				//console.log(event);
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

				let fakeAns: EcgAnnotation[] = new Array(30);
				this._dp.buildAnnotations(fakeAns, this._ansClient);


				let fakeSignal: number[][] = new Array();



		}

		//-------------------------------------------------------------------------------------
		private prepareGrid() {
				let leads: EcgLeadCode[] = this._ds.leads;
				let leadsLabels: string[] = this._ds.getLeadCodesLabels(leads);
				this._dp.state.prepareGridCells(leads, leadsLabels);
		}

		//-------------------------------------------------------------------------------------
		private prepareCanvasSize() {
				this._ct.resize(this._el.nativeElement.offsetWidth as number,
						this._el.nativeElement.offsetHeight as number);

				let padding: number = 10;
				let proxyContainer: XRectangle = new XRectangle(padding, padding, this._ct.width - padding, this._ct.height - padding);
				this._dp.state.container = proxyContainer;
		}

}
