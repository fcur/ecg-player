import {
	Component, OnInit, ElementRef, HostListener,
	ViewChild
} from '@angular/core';
import { XDrawingProxy } from "../model/drawingproxy"
import { DataService } from "../service/data.service"
import {
	XDrawingCell, XDrawingChangeSender, XDrawingGridMode,
	XDrawingChange, XDrawingProxyState, XCanvasTool
} from "../model/misc";
import {
	XDrawingPrimitive, XDrawingPrimitiveState, XLabel,
	XLine, XPeak, XPoint, XPolyline, XRectangle
} from "../model/geometry";
import {
	ClickablePointDrawingClient, FPointDrawingClient,
	XDrawingClient, XDrawingMode, IDrawingClient,
	SignalDrawingClient, CellDrawingClient,
	AnsDrawingClient, BeatsDrawingClient,
	GridCellDrawingClient
} from "../model/drawingclient";
import {
	CellDrawingObject, SignalDrawingObject, FPointDrawingObject,
	BeatsRangeDrawingObject, IDrawingObject, ClPointDrawingObject,
	XDrawingObject, XDrawingObjectType, AnsDrawingObject,
	GridCellDrawingObject
} from "../model/drawingobject";
import {
	EcgRecord, EcgSignal, EcgWavePoint, EcgWavePointType,
	EcgAnnotation, EcgAnnotationCode, EcgLeadCode,
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
	//private _ansClient: XDrawingClient;
	//private _pqrstClient: XDrawingClient;
	//private _signalClient: XDrawingClient;
	//private _beatsClient: XDrawingClient;
	//private _floatingObjectsClient: XDrawingClient;
	//private _floatingPeaksClient: XDrawingClient;
	//private _gridClient: XDrawingClient;
	// feature 2 clients
	private _signalClient: SignalDrawingClient;
	private _gridClient: GridCellDrawingClient;
	private _beatsClient: BeatsDrawingClient;
	private _fpointClient: FPointDrawingClient;

	private _fileReader: FileReader;
	private _hideFileDrop: boolean;
	/**Canvas tool. */
	private _ct: XCanvasTool;
	private _loadDataSubs: Subscription;
	private _waveformDragStartPosition: XPoint;
	private _pinBeatsToSignal: boolean;

	private _threshold: number;
	private _lastEmitTime: number;
	private _drawingScrollSubs: Subscription;

	//-------------------------------------------------------------------------------------
	@ViewChild("waveformCanvas")
	private _drawingElement: ElementRef;
	@ViewChild("canvasCont")
	private _canvasContainer: ElementRef;

	//-------------------------------------------------------------------------------------
	@HostListener("window:mouseenter", ["$event"])
	private onWindowMouseenter(event: MouseEvent) {
		//console.info("window:mouseenter", event);
		event.preventDefault();
		event.stopPropagation();
	}
	//-------------------------------------------------------------------------------------
	@HostListener("window:mouseover", ["$event"])
	private onWindowMouseover(event: MouseEvent) {
		//console.info("window:mouseover", event);
		event.preventDefault();
		event.stopPropagation();
	}
	//-------------------------------------------------------------------------------------
	@HostListener("window:mousemove", ["$event"])
	private onWindowMousemove(event: MouseEvent) {
		//console.info("window:mousemove", event);
		//console.info(event);
		event.preventDefault();
		event.stopPropagation();
		this.onDragMove(event);
	}
	//-------------------------------------------------------------------------------------
	@HostListener("window:mousedown", ["$event"])
	private onWindowMousedown(event: MouseEvent) {
		//console.info("window:mousedown", event);
		event.preventDefault();
		event.stopPropagation();
		this.onDragStart(event);
	}
	//-------------------------------------------------------------------------------------
	@HostListener("window:mouseleave", ["$event"])
	private onWindowMouseleave(event: MouseEvent) {
		//console.info("window:mouseleave", event);
		event.preventDefault();
		event.stopPropagation();
		this.onDragEnd(event);
	}
	//-------------------------------------------------------------------------------------
	@HostListener("window:mouseout", ["$event"])
	private onWindowMouse(event: MouseEvent) {
		//console.info("window:mouseout", event);
		event.preventDefault();
		event.stopPropagation();
		this.onDragEnd(event);
	}
	//-------------------------------------------------------------------------------------
	@HostListener("window:mouseup", ["$event"])
	private onWindowMouseup(event: MouseEvent) {
		//console.info("window:mouseup", event);
		event.preventDefault();
		event.stopPropagation();
		this.onDragEnd(event);
	}
	//-------------------------------------------------------------------------------------
	@HostListener("window:auxclick", ["$event"])
	private onWindowAuxclick(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		//console.info("window:auxclick", event);
	}
	//-------------------------------------------------------------------------------------
	@HostListener("window:click", ["$event"])
	private onWindowClick(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		//console.info("window:click", event);
	}
	//-------------------------------------------------------------------------------------
	@HostListener("window:dblclick", ["$event"])
	private onWindowDblclick(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		//console.info("window:dblclick", event);
	}
	//-------------------------------------------------------------------------------------
	@HostListener("window:touchcancel", ["$event"])
	private onWindowTouchcancel(event: TouchEvent) {
		//console.info("window:touchcancel", event);
		event.preventDefault();
		event.stopPropagation();
		this.onDragEnd(event);
	}
	//-------------------------------------------------------------------------------------
	@HostListener("window:touchend", ["$event"])
	private onWindowTouchend(event: TouchEvent) {
		//console.info("window:touchend", event);
		event.preventDefault();
		event.stopPropagation();
		this.onDragEnd(event);
	}
	//-------------------------------------------------------------------------------------
	@HostListener("window:touchmove", ["$event"])
	private onWindowTouchmove(event: TouchEvent) {
		//console.info("window:touchmove", event);
		event.preventDefault();
		event.stopPropagation();
		this.onDragMove(event);
	}
	//-------------------------------------------------------------------------------------
	@HostListener("window:touchstart", ["$event"])
	private onWindowTouchstart(event: TouchEvent) {
		//console.info("window:touchstart", event);
		event.preventDefault();
		event.stopPropagation();
		this.onDragStart(event);
	}
	//-------------------------------------------------------------------------------------
	@HostListener("window:resize", ["$event"]) onWindowResize(event: Event) {
		// TODO: fix resize bug
		//console.log("dpr:", window.devicePixelRatio);
		this.prepareCanvasSize();
		this._ct.drawInfo();
	}

	//-------------------------------------------------------------------------------------
	constructor(private _el: ElementRef, private _ds: DataService) {
		//console.info("DrawableComponent constructor");
		this._hideFileDrop = false;
		this._pinBeatsToSignal = true;
		this._loadDataSubs = null;
		this._drawingScrollSubs = null;
		this._waveformDragStartPosition = null;
		this._threshold = 100;
		this._lastEmitTime = 0;
		this._dp = new XDrawingProxy();
		//this._dp.onChangeState.subscribe((v: XDrawingChange) => this.onProxyStateChanges(v));
		this._dp.onPrepareDrawings.subscribe((v: IDrawingObject[][]) => this.onReceiveDrawingObjects(v));
		this._fileReader = new FileReader();
		this.prepareClients();
	}

	//-------------------------------------------------------------------------------------
	public ngOnInit() {
		//console.info("DrawableComponent: init");
		this._fileReader.addEventListener("load", this.onLoadFile.bind(this));
		this._loadDataSubs = this._ds.onLoadDataBs.subscribe(v => this.onReceiveData(v as EcgRecord[]));
		this._drawingScrollSubs = this._dp.state.onScrollBs.subscribe(v => this.onScrollDrawings(v as number));
		this._canvasContainer.nativeElement.addEventListener("dragover", this.onDragOver.bind(this), false);
		this._canvasContainer.nativeElement.addEventListener("drop", this.onDragDrop.bind(this), false);
	}

	//-------------------------------------------------------------------------------------
	public ngAfterContentInit() {
		this._ct = new XCanvasTool(this._drawingElement);
		this.prepareCanvasSize();
		this._dp.state.limitPx = this._ct.width;
		this.prepareGrid();
		this._ct.drawInfo();
	}

	//-------------------------------------------------------------------------------------
	public ngOnDestroy() {
		//console.info("DrawableComponent: destroy");
		if (this._loadDataSubs) this._loadDataSubs.unsubscribe();
		if (this._drawingScrollSubs) this._drawingScrollSubs.unsubscribe();
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
	private onDragStart(event: any) {
		this._waveformDragStartPosition = this.getEventPosition(event);
	}

	//-------------------------------------------------------------------------------------
	private onDragMove(event: any) {
		if (!this._waveformDragStartPosition) {
			this.pointerMove(event);
			return;
		}
		this.scroll(event);
	}

	//-------------------------------------------------------------------------------------
	private performanceCounter() {
		let t0: number, t1: number, l0: number, l1: number;
		t0 = performance.now();
		let imageData: ImageData = this._ct.ctx.getImageData(0, 0, this._ct.ctx.canvas.width, this._ct.ctx.canvas.height);
		t1 = performance.now();
		l0 = t1 - t0;
		let pixelsData: Uint8ClampedArray = imageData.data;
		let used: number[] = new Array();
		let skip: number = 0;
		let count: number = 0;
		t0 = performance.now();
		for (let i = 0; i < pixelsData.length; i++) {
			if (pixelsData[i] === 0) {
				skip++;
				continue;
			}
			count++;
		}
		t1 = performance.now();
		l1 = t1 - t0;
		console.log(`save img(${imageData.width}x${imageData.height}) took ${Math.round(l0)}[ms] ${"\n"}handle ${imageData.width * imageData.height} px took ${Math.round(l1)}[ms]`);
		console.log(`data (${pixelsData.length}): count=${count}, skip=${skip}`);
	}

	//-------------------------------------------------------------------------------------
	private onDragEnd(event: any) {
		if (!this._waveformDragStartPosition) return;
		this._waveformDragStartPosition = null;
	}

	//----------------------------------------------------------------------------------------------
	private getEventPosition(event: any): XPoint {
		// TODO: handle device pixel ratio
		let left: number = 0, top: number = 0;
		if (event.clientX) {
			left = event.clientX;
			top = event.clientY;
		} else if (event.touches && event.touches[0]) {
			left = event.touches[0].clientX;
			top = event.touches[0].clientY;
		}
		return new XPoint(left, top);
	}

	//-------------------------------------------------------------------------------------
	private onReceiveData(v: EcgRecord[]) {
		if (!v || !Array.isArray(v) || v.length === 0) return;
		// save sample rate in state
		this._dp.state.sampleRate = this._ds.ecgrecords[0].sampleRateForCls;
		// save original sample rate
		this._dp.drawingData.originalSampleRate = this._ds.ecgrecords[0].sampleRateForCls;
		this._dp.drawingData.recordHeaders = this._ds.ecgrecords;
		// on real project we receive data in other place
		this._dp.drawingData.projection = this._ds.ecgrecords;
		this._dp.reset();
		this._dp.rebuildDrawObjGroupsF3();
		this._dp.scrollDrawObjGroupsF3();
		this._dp.refreshDrawings();
	}

	//-------------------------------------------------------------------------------------
	public onLoadFile(event: ProgressEvent) {
		this._ds.parseJsonFile(JSON.parse(this._fileReader.result));
	}

	//-------------------------------------------------------------------------------------
	//private onProxyStateChanges(change: XDrawingChange) {
	//  //console.info("onProxyStateChanges:", change);
	//  // refresh drawings
	//  this._ct.clear();
	//  //this._ct.ctx.save();
	//  //let state: XDrawingProxyState = this._dp.state;
	//  //this._ct.ctx.rect(state.container.left, state.container.top, state.container.width, state.container.height);
	//  //this._ct.ctx.stroke();
	//  //this._ct.ctx.restore();
	//  for (let z: number = 0; z < change.objects.length; z++) {
	//    if (!change.objects[z].owner.draw) continue;
	//    change.objects[z].owner.draw(change.objects[z]);
	//  }
	//}

	//-------------------------------------------------------------------------------------
	private onScrollDrawings(val: number) {
		if (!Number.isInteger(val)) return;
		this._dp.scrollDrawObjGroupsF3();
		this._dp.refreshDrawings();
	}

	//-------------------------------------------------------------------------------------
	private renderVisibleGroupF3() {
		let z: number, y: number;
		for (z = 0; z < this._dp.drawingClients.length; z++) {
			if (!this._dp.drawingClients[z].drawObjectsF3 ||
				!Array.isArray(this._dp.doF3CGroups[z]) ||
				this._dp.doF3CGroups[z].length === 0) continue;
			//console.log(`drawObjectsF3 for  ${this._dp.drawingClients[z].constructor.name}`);
			this._dp.drawingClients[z].drawObjectsF3(this._dp.doF3CGroups[z]);
		}
		this.printState();
	}


	//-------------------------------------------------------------------------------------
	private onReceiveDrawingObjects(p: IDrawingObject[][]) {
		this._ct.clear();
		this.renderVisibleGroupF3();
		// z: client index
		for (let z: number = 0; z < this._dp.drawingClients.length; z++) {
			if (this._dp.drawingClients[z].drawObjects && Array.isArray(p[z])) {
				if (p[z].length === 0) continue;
				this._dp.drawingClients[z].drawObjects(p[z]);
			}
			else if (this._dp.drawingClients[z].draw) {
				// TODO remove single object drawing method
				this._dp.drawingClients[z].draw(p[z][0]);
			}
		}
		p = null; // release refferences
		this._dp.objectsF2 = null;
		this.drawCursotPosition();
	}

	//-------------------------------------------------------------------------------------
	private prepareClients() {
		// prepare clients
		this._signalClient = new SignalDrawingClient();
		//this._signalClient.drawObjects = this.drawSignalObjectsF2.bind(this);
		this._signalClient.drawObjectsF3 = this.drawSignalObjectsF3.bind(this);
		this._gridClient = new GridCellDrawingClient();
		this._gridClient.drawObjects = this.drawGridObjectsF2.bind(this);
		this._gridClient.drawObjectsF3 = this.drawGridObjectsF3.bind(this);

		this._beatsClient = new BeatsDrawingClient();
		this._beatsClient.drawObjects = this.drawBeatsObjectsF2.bind(this);
		this._beatsClient.drawObjectsF3 = this.drawBeatsRangesObjectsF3.bind(this);
		this._fpointClient = new FPointDrawingClient();
		this._fpointClient.drawObjects = this.drawFPointObjectsF2.bind(this);
		this._dp.pushClients(this._gridClient, this._signalClient, this._beatsClient, this._fpointClient);
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
		let clientContainer: XRectangle = new XRectangle(
			space + this._drawingElement.nativeElement.offsetLeft,
			space + this._drawingElement.nativeElement.offsetTop,
			proxyContainer.width,
			proxyContainer.height);
		this._dp.state.screen = clientContainer;
	}

	//-------------------------------------------------------------------------------------
	private scroll(event: any) {
		this._dp.preparePointer(event);
		let endpoint: XPoint = this.getEventPosition(event);
		let actionPoint: XPoint = this._waveformDragStartPosition.subtract(endpoint);
		this._waveformDragStartPosition = endpoint;
		if (actionPoint.left === 0) return; // skip scrolling
		this._dp.scroll(actionPoint.left);
		//this._dp.scrollDrawObjGroupsF3();
		//this._dp.refreshDrawings();
	}

	//-------------------------------------------------------------------------------------
	private pointerMove(event: any) {
		//let timeNow: number = Date.now();
		//if (timeNow - this._lastEmitTime > this._threshold) {
		// this._lastEmitTime = timeNow;
		// this._dp.performMouseMove(event);
		//}
		this._dp.performMouseMove(event);
	}


	//-------------------------------------------------------------------------------------
	private drawGridObjectsF2(objs: GridCellDrawingObject[]) {
		//console.log("drawGridObjectsF2");
		let state: XDrawingProxyState = this._dp.state;
		let textSize: number = 15;
		let z: number,
			y: number,
			x: number,
			top: number,
			left: number,
			point: XPoint;
		this._ct.ctx.save();
		this._ct.ctx.fillStyle = this._gridClient.color;
		this._ct.ctx.textBaseline = "middle";
		this._ct.ctx.textAlign = "center";
		this._ct.ctx.font = `${textSize}px Roboto`;

		// print borders
		this._ct.ctx.beginPath();
		for (z = 0; z < objs.length; z++) {
			// print lead
			left = objs[z].container.midOx;
			top = objs[z].container.top + textSize / 2 + 1;
			this._ct.ctx.fillText(objs[z].leadLabel, left, top);

			for (y = 0; y < objs[z].polylines.length; y++) {
				x = 0;
				point = objs[z].polylines[y].points[x++];
				left = point.left + objs[z].container.left + this._dp.state.skipPx - objs[z].left + 0.5;
				top = point.top + objs[z].container.top + 0.5;
				this._ct.ctx.moveTo(left, top);
				for (; x < objs[z].polylines[y].points.length; x++) {
					point = objs[z].polylines[y].points[x];
					left = point.left + objs[z].container.left + this._dp.state.skipPx - objs[z].left + 0.5;
					top = point.top + objs[z].container.top + 0.5;
					this._ct.ctx.lineTo(left, top);
				}
			}
		}
		this._ct.ctx.strokeStyle = this._gridClient.color;
		this._ct.ctx.globalAlpha = this._gridClient.opacity;
		this._ct.ctx.lineJoin = this._gridClient.lineJoin;
		this._ct.ctx.stroke();
		this._ct.ctx.closePath();
		this._ct.ctx.restore();
	}

	//-------------------------------------------------------------------------------------
	private drawSignalObjectsF2(objs: SignalDrawingObject[]) {
		let state: XDrawingProxyState = this._dp.state;
		// cell index = drawing object index
		let z: number = 0, y: number = 0, left: number = 0, top: number = 0, dy: number;
		this._ct.ctx.beginPath();
		let points: XPoint[];
		let shift: number = 0;
		for (z = 0; z < state.gridCells.length; z++) {
			// TODO: handle multy polylines
			points = objs[z].polylines[0].points;
			y = 0;
			left = points[y].left + 0.5 - objs[z].container.left + state.gridCells[z].container.left;
			dy = Math.round(points[y].top * state.gridCells[z].microvoltsToPixel); // microvolts to pixels
			top = dy + 0.5 + objs[z].container.top + state.gridCells[z].container.midOy + shift;
			this._ct.ctx.moveTo(left, top);
			for (y++; y < points.length; y++) {
				left = points[y].left + 0.5 - objs[z].container.left + state.gridCells[z].container.left;
				dy = Math.round(points[y].top * state.gridCells[z].microvoltsToPixel);
				top = dy + 0.5 + objs[z].container.top + state.gridCells[z].container.midOy + shift;
				this._ct.ctx.lineTo(left, top);
			}
		}
		this._ct.ctx.lineWidth = 1;
		this._ct.ctx.strokeStyle = this._signalClient.color;
		this._ct.ctx.globalAlpha = this._signalClient.opacity;
		this._ct.ctx.lineJoin = this._signalClient.lineJoin;
		this._ct.ctx.stroke();
		this._ct.ctx.closePath();
		this._ct.ctx.restore();
	}

	//-------------------------------------------------------------------------------------
	private drawSignalObjectsF3(objs: SignalDrawingObject[]) {
		let shift: number = 0; // #DEBUG_ONLY
		let state: XDrawingProxyState = this._dp.state;
		// z - drawing object index
		// y - grid cell index = lead code index
		// x - polyline index
		let z: number,
			y: number,
			x: number,
			w: number,
			c: number,
			dx: number,
			dy: number,
			top: number,
			left: number,
			points: XPoint[];

		this._ct.ctx.save();
		// lead code index = grid cell index
		this._ct.ctx.beginPath();
		for (z = 0; z < objs.length; z++) {

			for (y = 0; y < state.leadsCodes.length; y++) {
				x = objs[z].leadCodes.indexOf(state.leadsCodes[y]);
				if (x < 0) continue;
				points = objs[z].polylines[x].points;
				//console.info(points.length);
				// calc start position
				// TODO: check {start+length < points.length}
				w = state.minPx - objs[z].container.left;
				dx = objs[z].container.left + points[w].left - state.minPx;
				dy = Math.floor(points[w].top * state.gridCells[y].microvoltsToPixel + shift);
				left = dx + state.gridCells[y].container.left + 0.5;
				top = dy + state.gridCells[y].container.midOy + 0.5;
				this._ct.ctx.moveTo(left, top);
				w++;
				for (c = 1; w < points.length, c < state.limitPx; w++ , c++) {
					dx = objs[z].container.left + points[w].left - state.minPx;
					dy = Math.floor(points[w].top * state.gridCells[y].microvoltsToPixel) + shift;
					left = dx + state.gridCells[y].container.left + 0.5;
					top = dy + state.gridCells[y].container.midOy + 0.5;
					this._ct.ctx.lineTo(left, top);
				}
			}
		}
		this._ct.ctx.lineWidth = 1;
		this._ct.ctx.strokeStyle = this._signalClient.color;
		this._ct.ctx.globalAlpha = this._signalClient.opacity;
		this._ct.ctx.lineJoin = this._signalClient.lineJoin;
		this._ct.ctx.stroke();
		this._ct.ctx.closePath();
		this._ct.ctx.restore();
	}

	//-------------------------------------------------------------------------------------
	private drawBeatsObjectsF2(objs: BeatsRangeDrawingObject[]) {
		//let z: number = 0, y: number = 0, left: number = 0, top: number = 0, dy: number;
		//let state: XDrawingProxyState = this._dp.state;
		//let textSize: number = 10;
		//// cell index = drawing object index
		//this._ct.ctx.save();
		//this._ct.ctx.font = `${textSize}px Roboto`;
		//this._ct.ctx.textBaseline = "middle";
		//this._ct.ctx.textAlign = "center";
		//this._ct.ctx.beginPath();
		//let points: XPoint[];
		//let shift: number = 0;
		//for (z = 0; z < state.gridCells.length; z++) {
		//	points = objs[z].points;
		//	for (y = 0; y < points.length; y++) {
		//		left = points[y].left + 0.5 - objs[z].container.left + state.gridCells[z].container.left;
		//		dy = Math.round(points[y].top * state.gridCells[z].microvoltsToPixel); // microvolts to pixels
		//		top = dy + 0.5 + objs[z].container.top + state.gridCells[z].container.midOy + shift;
		//		this._ct.ctx.moveTo(left + 0.5, top + 0.5);
		//		this._ct.ctx.arc(left + 0.5, top + 0.5, this._beatsClient.radius, 0, 2 * Math.PI, false);
		//		this._ct.ctx.fillText(points[y].left.toString(), left, top + textSize);
		//	}
		//}
		//this._ct.ctx.fillStyle = this._beatsClient.color;
		//this._ct.ctx.globalAlpha = this._beatsClient.opacity;
		//this._ct.ctx.fill();
		//this._ct.ctx.closePath();
		//this._ct.ctx.restore();
	}

	//-------------------------------------------------------------------------------------
	private drawFPointObjectsF2(objs: FPointDrawingObject[]) {
		this._ct.ctx.save();
		let state: XDrawingProxyState = this._dp.state;
		let z: number = 0, y: number = 0, left: number = 0, top: number = 0, dy: number;
		let obj: FPointDrawingObject = objs[0];
		this._ct.ctx.globalAlpha = this._fpointClient.opacity;
		// pointer line
		this._ct.ctx.beginPath();
		left = state.container.left + obj.lines[0].ax + 0.5;
		top = state.container.top + obj.lines[0].ay + 0.5;
		this._ct.ctx.moveTo(left, top);
		top = state.container.top + obj.lines[0].by + 0.5;
		this._ct.ctx.lineTo(left, top);
		this._ct.ctx.strokeStyle = this._fpointClient.lineColor;
		this._ct.ctx.stroke();
		this._ct.ctx.closePath();

		let testShift: number = 0;
		this._ct.ctx.beginPath();
		this._ct.ctx.fillStyle = this._fpointClient.pointColor;
		for (let z: number = 0; z < state.gridCells.length; z++) {
			// cell index = point index
			left = state.container.left + obj.points[z].left + 0.5;
			dy = Math.floor(obj.points[z].top * state.gridCells[z].microvoltsToPixel);
			top = dy + state.gridCells[z].container.midOy + testShift + 0.5;
			this._ct.ctx.moveTo(left, top);
			this._ct.ctx.arc(left, top, this._fpointClient.pointRadius, 0, 2 * Math.PI, false);
		}
		this._ct.ctx.fill();
		this._ct.ctx.closePath();
		this._ct.ctx.restore();
	}

	//-------------------------------------------------------------------------------------
	private drawCursotPosition() {
		let left: number,
			top: number,
			text: string;
		let textSize: number = 12;
		this._ct.ctx.save();
		this._ct.ctx.beginPath();
		this._ct.ctx.fillStyle = "pink";
		left = this._dp.state.container.left + this._dp.state.pointerX + 0.5;
		top = this._dp.state.container.left + this._dp.state.pointerY + 0.5;
		this._ct.ctx.moveTo(left, top);
		this._ct.ctx.arc(left, top, 3, 0, 2 * Math.PI, false);
		this._ct.ctx.fill();
		this._ct.ctx.closePath();

		this._ct.ctx.fillStyle = "#111";
		this._ct.ctx.font = `${textSize}px Roboto`;
		this._ct.ctx.textBaseline = "bottom";
		this._ct.ctx.textAlign = "left";

		text = `${this._dp.state.pointerX},${this._dp.state.pointerY}`;
		this._ct.ctx.fillText(text, left, top);

		this._ct.ctx.restore();
	}




	//-------------------------------------------------------------------------------------
	private drawBeatsRangesObjectsF3(objs: BeatsRangeDrawingObject[]) {
		this._ct.ctx.save();
		// draw beat ranges: drawObj.container for all channels
		// draw beat peaks: drawObj.points for each channel
		let z: number,
			y: number,
			x: number,
			w: number,
			left: number,
			top: number,
			dx: number,
			dy: number;
		let state: XDrawingProxyState = this._dp.state;
		let beatRange: BeatsRangeDrawingObject;
		let textSize: number = 10;

		this._ct.ctx.font = `${textSize}px Roboto`;
		this._ct.ctx.textBaseline = "middle";
		this._ct.ctx.textAlign = "center";

		// draw beats
		this._ct.ctx.beginPath();
		let points: XPoint[];
		let point: XPoint;
		let shift: number = 0;
		let cell: XDrawingCell;


		this._ct.ctx.globalAlpha = 0.05;
		for (y = 0; y < objs.length; y++) {
			beatRange = objs[y];

			for (x = 0; x < beatRange.leadCodes.length; x++) {
				w = state.leadsCodes.indexOf(beatRange.leadCodes[x]);
				if (w < 0) continue;
				cell = state.gridCells[w];
				this._ct.ctx.fillStyle = beatRange.index % 2 == 0 ?
					this._beatsClient.backgroundColor1 :
					this._beatsClient.backgroundColor2;
				this._ct.ctx.fillRect(
					cell.container.left + beatRange.container.minOx - state.minPx,
					cell.container.top,
					beatRange.container.width,
					cell.container.height
				);
			}
		}


		this._ct.ctx.globalAlpha = 1;
		this._ct.ctx.fillStyle = "#111";
		for (y = 0; y < objs.length; y++) {
			beatRange = objs[y];
			// fill beat background


			for (x = 0; x < beatRange.leadCodes.length; x++) {
				w = state.leadsCodes.indexOf(beatRange.leadCodes[x]);
				if (w < 0) continue;
				cell = state.gridCells[w];



				point = beatRange.points[x];
				dx = point.left - state.minPx;
				dy = Math.floor(point.top * cell.microvoltsToPixel);
				left = cell.container.left + dx + 0.5;
				top = dy + cell.container.midOy + 0.5 + shift;
				this._ct.ctx.moveTo(left, top);
				this._ct.ctx.arc(left, top, this._beatsClient.radius, 0, 2 * Math.PI, false);
				this._ct.ctx.fillText(`${point.left}`, left, top + textSize);


			}

			if (point) {
				// print beat range info
				top = state.container.maxOy - textSize;
				this._ct.ctx.fillText(`${beatRange.container.minOx}-${beatRange.container.maxOx}`, left, top);
			}



		}
		this._ct.ctx.fillStyle = this._beatsClient.color;
		this._ct.ctx.globalAlpha = this._beatsClient.opacity;
		this._ct.ctx.fill();
		this._ct.ctx.closePath();
		//
		this._ct.ctx.restore();
	}

	//-------------------------------------------------------------------------------------
	private drawGridObjectsF3(objs: GridCellDrawingObject[]) {
		//console.log("drawGridObjectsF3", objs.length);
		//let state: XDrawingProxyState = this._dp.state;
		//let z: number = 0, y: number = 0, x: number = 0, point: XPoint, l: number, t: number;
		//this._ct.ctx.save();
		//this._ct.ctx.beginPath();
		//for (z = 0; z < objs.length; z++) {
		//	for (y = 0; y < objs[z].polylines.length; y++) {
		//		x = 0;
		//		point = objs[z].polylines[y].points[x++];
		//		l = point.left + objs[z].container.left + this._dp.state.skipPx - objs[z].left;
		//		t = point.top;
		//		this._ct.ctx.moveTo(l + 0.5, t + 0.5);
		//		for (; x < objs[z].polylines[y].points.length; x++) {
		//			point = objs[z].polylines[y].points[x];
		//			l = point.left + objs[z].container.left + this._dp.state.skipPx - objs[z].left;
		//			t = point.top;
		//			this._ct.ctx.lineTo(l + 0.5, t + 0.5);
		//		}
		//	}
		//}
		//this._ct.ctx.strokeStyle = this._gridF2Client.color;
		//this._ct.ctx.globalAlpha = this._gridF2Client.opacity;
		//this._ct.ctx.lineJoin = this._gridF2Client.lineJoin;
		//this._ct.ctx.stroke();
		//this._ct.ctx.closePath();
		//this._ct.ctx.restore();
	}

	//-------------------------------------------------------------------------------------
	private printState() {
		let textSize: number = 15;
		let text: string,
			left: number,
			top: number,
			textWidth: number;
		this._ct.ctx.save();
		this._ct.ctx.fillStyle = "#111";
		this._ct.ctx.font = `${textSize}px Roboto`;
		this._ct.ctx.textBaseline = "middle";
		this._ct.ctx.textAlign = "center";

		// min pixels
		text = `${this._dp.state.minPx}`;
		textWidth = this._ct.ctx.measureText(text).width;
		left = this._dp.state.gridCells[0].container.left + textWidth / 2;
		top = this._dp.state.gridCells[0].container.top - textSize;
		this._ct.ctx.fillText(text, left, top);
		// max pixels
		text = `${this._dp.state.maxPx}`;
		textWidth = this._ct.ctx.measureText(text).width;
		left = this._dp.state.gridCells[0].container.maxOx - textWidth / 2;
		top = this._dp.state.gridCells[0].container.top - textSize;
		this._ct.ctx.fillText(text, left, top);

		// size
		text = `${Math.floor(this._ct.width)}X${Math.floor(this._ct.height)}  W=${this._dp.state.limitPx}  H=${this._dp.state.signalScale}`;
		textWidth = this._ct.ctx.measureText(text).width;
		left = this._ct.width / 2;
		top = this._ct.height - textSize;
		this._ct.ctx.fillText(text, left, top);

		this._ct.ctx.restore();
	}








}
