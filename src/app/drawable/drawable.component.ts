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
		@HostListener("window:mouseenter", ["$event"]) onWindowMouseenter(event: MouseEvent) {
				//console.info("window:mouseenter", event);
		}
		//-------------------------------------------------------------------------------------
		@HostListener("window:mouseover", ["$event"]) onWindowMouseover(event: MouseEvent) {
				//console.info("window:mouseover", event);
		}
		//-------------------------------------------------------------------------------------
		@HostListener("window:mousemove", ["$event"]) onWindowMousemove(event: MouseEvent) {
				//console.info("window:mousemove", event);
		}
		//-------------------------------------------------------------------------------------
		@HostListener("window:mousedown", ["$event"]) onWindowMousedown(event: MouseEvent) {
				//console.info("window:mousedown", event);
		}
		//-------------------------------------------------------------------------------------
		@HostListener("window:mouseleave", ["$event"]) onWindowMouseleave(event: MouseEvent) {
				//console.info("window:mouseleave", event);
		}
		//-------------------------------------------------------------------------------------
		@HostListener("window:mouseout", ["$event"]) onWindowMouse(event: MouseEvent) {
				//console.info("window:mouseout", event);
		}
		//-------------------------------------------------------------------------------------
		@HostListener("window:mouseup", ["$event"]) onWindowMouseup(event: MouseEvent) {
				//console.info("window:mouseup", event);
		}
		//-------------------------------------------------------------------------------------
		@HostListener("window:auxclick", ["$event"]) onWindowAuxclick(event: MouseEvent) {
				//console.info("window:auxclick", event);
		}
		//-------------------------------------------------------------------------------------
		@HostListener("window:click", ["$event"]) onWindowClick(event: MouseEvent) {
				//console.info("window:click", event);
		}
		//-------------------------------------------------------------------------------------
		@HostListener("window:dblclick", ["$event"]) onWindowDblclick(event: MouseEvent) {
				//console.info("window:dblclick", event);
		}
		//-------------------------------------------------------------------------------------
		@HostListener("window:touchcancel", ["$event"]) onWindowTouchcancel(event: TouchEvent) {
				//console.info("window:touchcancel", event);
		}
		//-------------------------------------------------------------------------------------
		@HostListener("window:touchend", ["$event"]) onWindowTouchend(event: TouchEvent) {
				//console.info("window:touchend", event);
		}
		//-------------------------------------------------------------------------------------
		@HostListener("window:touchmove", ["$event"]) onWindowTouchmove(event: TouchEvent) {
				//console.info("window:touchmove", event);
		}
		//-------------------------------------------------------------------------------------
		@HostListener("window:touchstart", ["$event"]) onWindowTouchstart(event: TouchEvent) {
				//console.info("window:touchstart", event);
		}



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
				this._dp.reset();
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
				let space: number = 33;
				let proxyContainer: XRectangle = new XRectangle(space, space, this._ct.width - space * 2, this._ct.height - space * 2);
				this._dp.state.container = proxyContainer;
		}

		//-------------------------------------------------------------------------------------
		private drawSignal(obj: XDrawingObject) {
				//console.info("draw singal object", obj);
				let state: XDrawingProxyState = this._dp.state;
				this._ct.clear();
				this._ct.ctx.save();
				this._ct.ctx.beginPath();
				let skipPoints: number = 0;
				let points: XPoint[];
				let z: number = 0, y: number = 0;
				for (z = 0; z < state.gridCells.length; z++) { // z - cell index, polyline index
						points = obj.polylines[z].points
						y = state.skipPx;
						this._ct.ctx.moveTo(points[y].left + 0.5, points[y].top + 0.5); // y - point index
						for (y++; y < state.maxPx; y++) {
								this._ct.ctx.lineTo(points[y].left + 0.5, points[y].top + 0.5);
						}
				}
				this._ct.ctx.stroke();
				this._ct.ctx.closePath();
				this._ct.ctx.restore();
		}
}
