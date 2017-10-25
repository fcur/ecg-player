import {
		Component, OnInit, ElementRef, HostListener,
		ViewChild
} from '@angular/core';
import { XDrawingProxy } from "../model/drawing-proxy"
import { DataService } from "../service/data.service"
import {
		XDrawingClient, XDrawingMode, XDrawingChange,
		XDrawingProxyState, XCanvasTool, XRectangle,
		XDrawingCell, XDrawingChangeSender, XLabel,
		XDrawingGridMode, XDrawingObject, XLine,
		XDrawingPrimitiveState, XPolyline, XPeak,
		XDrawingObjectType, XDrawingPrimitive,
		XPoint
} from "../model/misc";
import {
		EcgAnnotation, EcgAnnotationCode, EcgLeadCode,
		EcgRecord, EcgSignal, EcgWavePoint, EcgWavePointType
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
		private _signalClient: XDrawingClient;
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
				this._dp.onChangeState.subscribe((v: XDrawingChange) => this.onProxyStateChanges(v));
				this._fileReader = new FileReader();
				this.prepareClients();
				//this._drawingClients = new Array();
		}

		//-------------------------------------------------------------------------------------
		ngOnInit() {
				//console.info("DrawableComponent: init");
				this._fileReader.addEventListener("load", this.onLoadFile.bind(this));
				this._loadDataSubs = this._ds.onLoadDataBs.subscribe(v => this.onReceiveData(v as EcgRecord));
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
				//console.info("receive", v, "prepare drawings");
				this.prepareDrawingObjects();
				this._dp.refreshDrawings();
		}

		//-------------------------------------------------------------------------------------
		public onLoadFile(event: ProgressEvent) {
				this._ds.parseJsonFile(JSON.parse(this._fileReader.result));
		}

		//-------------------------------------------------------------------------------------
		private onProxyStateChanges(change: XDrawingChange) {
				//console.info("onProxyStateChanges:", change);
				for (let z: number = 0; z < change.objects.length; z++) {
						change.objects[z].owner.draw(change.objects[z]);//
				}
		}

		//-------------------------------------------------------------------------------------
		private prepareClients() {
				this._ansClient = new XDrawingClient();
				this._ansClient.mode = XDrawingMode.Mix;
				this._pqrstClient = new XDrawingClient();
				this._pqrstClient.mode = XDrawingMode.SVG;
				this._signalClient = new XDrawingClient();
				this._signalClient.mode = XDrawingMode.Canvas;
				this._signalClient.draw = this.drawSignal.bind(this);
				//this._drawingClients.push(ansClient, pqrstClient);
		}

		//-------------------------------------------------------------------------------------
		private prepareDrawingObjects() {
				this._dp.buildSignal([this._ds.ecgrecord.signal/*, this._ds.ecgrecord.signal*/], this._signalClient);
				//this._dp.buildWavepoints(this._ds.ecgrecord.wavePoints, this._pqrstClient);
				//this._dp.buildAnnotations(this._ds.ecgrecord.annotations, this._ansClient);
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

		//-------------------------------------------------------------------------------------
		private drawSignal(obj: XDrawingObject) {
				console.info("draw singal object", obj);

		}
}
