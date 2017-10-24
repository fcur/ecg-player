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
		EcgRecord, EcgSignal, EcgWavePoint, EcgWavePointType,
		EcgInput
} from "../model/ecgdata";
import { Subscription, BehaviorSubject } from "rxjs";

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
		private _fileReader: FileReader;
		private _hideFileDrop: boolean;
		/**Canvas tool. */
		private _ct: XCanvasTool;

		private _loadDataSubs: Subscription = null;

		//-------------------------------------------------------------------------------------
		@ViewChild("waveformCanvas")
		private _drawingElement: ElementRef;
		@ViewChild("canvasCont")
		private _canvasContainer: ElementRef;
		//-------------------------------------------------------------------------------------
		@HostListener("window:resize", ["$event"]) onWindowResize(event: Event) {
				// TODO: fix resize bug
				//console.log("dpr:", window.devicePixelRatio);
				this.prepareCanvasSize();
				this._ct.drawInfo();
		}

		//-------------------------------------------------------------------------------------
		constructor(private _el: ElementRef,
				private _ds: DataService) {
				//console.info("DrawableComponent constructor");
				this._hideFileDrop = false;
				this._dp = new XDrawingProxy();
				this._fileReader = new FileReader();
				this.prepareClients();
				//this._drawingClients = new Array();
		}

		//-------------------------------------------------------------------------------------
		ngOnInit() {
				//console.info("DrawableComponent: init");
				this._fileReader.addEventListener("load", this.onLoadFile.bind(this));
				this._loadDataSubs = this._ds.onLoadData.subscribe(v => this.onReceiveData(v as EcgRecord));
				this._canvasContainer.nativeElement.addEventListener("dragover", this.onDragOver.bind(this), false);
				this._canvasContainer.nativeElement.addEventListener("drop", this.onDragDrop.bind(this), false);
		}

		//-------------------------------------------------------------------------------------
		ngAfterContentInit() {
				this._ct = new XCanvasTool(this._drawingElement);
				this.prepareCanvasSize();
				this._dp.state.limitPx = this._ct.width;
				this.prepareGrid();
				this._ct.drawInfo();
		}

		//-------------------------------------------------------------------------------------
		ngOnDestroy() {
				//console.info("DrawableComponent: destroy");
				if (this._loadDataSubs) this._loadDataSubs.unsubscribe();
		}

		//-------------------------------------------------------------------------------------
		private onDragOver(event: DragEvent) {
				event.stopPropagation();
				event.preventDefault();
				event.dataTransfer.dropEffect = 'copy';
		}

		//-------------------------------------------------------------------------------------
		private onDragDrop(event: DragEvent) {
				event.stopPropagation();
				event.preventDefault();
				let files: FileList = event.dataTransfer.files;
				this._fileReader.readAsText(files[0]);
		}

		//-------------------------------------------------------------------------------------
		private onReceiveData(v: EcgRecord) {
				if (!v || v === null) return;
				console.info("receive", v, "prepare drawings");
				//this.prepareDrawingObjects();
		}

		//-------------------------------------------------------------------------------------
		public onLoadFile(event: ProgressEvent) {
				this._ds.parseJsonFile(JSON.parse(this._fileReader.result));
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
