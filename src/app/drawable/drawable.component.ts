import {
	Component, OnInit, ElementRef, HostListener,
	ViewChild, Input
} from '@angular/core';
import { XDProxy } from "../model/drawingproxy"
import { DataService } from "../service/data.service"
import {
	XWCell, XDChangeSender, XDGridMode,
	XDPSEvent, XDProxyState, XCanvasTool,
	XMatrixTool, XAnimation, XAnimationType,
	XDChangeType, XDCoordinates, CursorType,
	XWDensity, XWDensityUnit, XWLayout
} from "../model/misc";
import {
	XDrawingPrimitive, XDPrimitiveState, XLabel,
	XLine, XPeak, XPoint, XPolyline, XRectangle
} from "../model/geometry";
import {
	ClickablePointDrawingClient, CursorDrawingClient,
	XDrawingClient, XDrawingMode, IDrawingClient,
	SignalDrawingClient, CellDrawingClient,
	GridClient, WavepointClient,
	AnsDrawingClient, BeatsDrawingClient,
	DemoRectangleClient
} from "../model/drawingclient";
import {
	BeatsRangeDrawingObject, IDObject, ClPointDrawingObject,
	GridCellDrawingObject, CursorDrawingObject, PeakDrawingObject,
	WavepointDrawingObject, DemoRectDrawingObject, XDOChangeType,
	CellDrawingObject, SignalDrawingObject, XDrawingObject,
	XDOType, AnsDrawingObject, WaveDrawingObject
} from "../model/drawingobject";
import {
	EcgRecord, EcgSignal, EcgWavePoint, EcgWavePointType, EcgParser,
	EcgAnnotation, EcgAnnotationCode, EcgLeadCode
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

	private _dp: XDProxy;
	private _signalClient: SignalDrawingClient;
	private _gridClient: GridClient;
	private _beatsClient: BeatsDrawingClient;
	private _cursorClient: CursorDrawingClient;
	private _demoRectClient: DemoRectangleClient;
	private _zoomIntensity: number;
	private _fileReader: FileReader;
	private _hideFileDrop: boolean;
	/** Canvas tool. */
	private _ct: XCanvasTool;
	private _mt: XMatrixTool;
	private _loadDataSubs: Subscription;
	private _changeStateSubs: Subscription;
	private _prepareDrawingSubs: Subscription;
	private _pinBeatsToSignal: boolean;
	private _clipCanvas: boolean;
	private _threshold: number;
	private _drawingScrollSubs: Subscription;

	private _zoomAnimation: XAnimation;

	private _mousemoveTime: number;
	private _clickThreshold: number;
	private _inDrag: boolean;
	private _skipClick: boolean;


	//----------------------------------------------------------------------------------------------
	@Input("clip-canvas")
	set clipCanvas(value: boolean) {
		this._clipCanvas = value;
	}
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
		this._skipClick = this._skipClick || event.movementX != 0 && event.movementY != 0;
		event.preventDefault();
		event.stopPropagation();
		this.onDragMove(event);
	}
	//-------------------------------------------------------------------------------------
	@HostListener("window:mousedown", ["$event"])
	private onWindowMousedown(event: MouseEvent) {
		this._skipClick = false;
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
		//this.onDragEnd(event);
	}
	//-------------------------------------------------------------------------------------
	@HostListener("window:mouseout", ["$event"])
	private onWindowMouse(event: MouseEvent) {
		//console.info("window:mouseout", event);
		event.preventDefault();
		event.stopPropagation();
		//this.onDragEnd(event);
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
		// right/center mouse click
		event.preventDefault();
		event.stopPropagation();
		console.info("window:auxclick", event);
	}
	//-------------------------------------------------------------------------------------
	@HostListener("window:click", ["$event"])
	private onWindowClick(event: MouseEvent) {
		if (this._skipClick) return;
		//console.info("window:click", event);
		event.preventDefault();
		event.stopPropagation();
		//this.onMouseClick(event);
		this._dp.performMouseClick(event);
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
	@HostListener("window:wheel", ["$event"]) onMouseWheel(event: WheelEvent) {
		event.preventDefault();
		//this.onWheelScroll(event);
	}

	//-------------------------------------------------------------------------------------
	constructor(private _el: ElementRef, private _ds: DataService) {
		this._hideFileDrop = false;
		this._skipClick = true;

		this._clipCanvas = false;
		this._pinBeatsToSignal = true;
		this._loadDataSubs = null;
		this._drawingScrollSubs = null;
		this._threshold = 100;
		this._clickThreshold = 300;
		this._zoomIntensity = 0.2;
		this._dp = new XDProxy();
		this._mt = new XMatrixTool();
		this._fileReader = new FileReader();
		this.prepareClients();
	}

	//-------------------------------------------------------------------------------------
	public ngOnInit() {
		//console.info("DrawableComponent: init");
		this._loadDataSubs = this._ds.onLoadDataBs.subscribe(v => this.onReceiveData(v as EcgRecord[]));
		//this._drawingScrollSubs = this._dp.state.onScrollBs.subscribe(v => this.onScrollDrawings(v as number));
		this._changeStateSubs = this._dp.onChangeState.subscribe((v: XDPSEvent) => this.onStateChanges(v));
		//this._prepareDrawingSubs = this._dp.onPrepareDrawings.subscribe((v: IDObject[][]) => this.onReceiveDObjects(v));

		this._fileReader.addEventListener("load", this.onLoadFile.bind(this));
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
		if (this._changeStateSubs) this._dp.onChangeState.unsubscribe();
		if (this._drawingScrollSubs) this._drawingScrollSubs.unsubscribe();
		if (this._prepareDrawingSubs) this._prepareDrawingSubs.unsubscribe();
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
		this._dp.performDragStart(event);
		//this._dp.state.dragPosition = this.getEventPosition(event);
	}

	//-------------------------------------------------------------------------------------
	private onDragMove(event: any) {
		if (this._dp.state.canDrag) {
			this._dp.performDragMove(event);
		} else {
			this._dp.performCursorMove(event);
		}
	}

	//-------------------------------------------------------------------------------------
	//private onMouseClick(event: any) {
	//	this._dp.preformClick(event);
	//}

	//-------------------------------------------------------------------------------------
	private canvasPerformanceTest() {
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
		if (this._dp.canDragWaveform) {
			this._dp.performDragStop();
		} else {
			this._dp.performMouseClick(event);
		}
	}

	//-------------------------------------------------------------------------------------
	private onReceiveData(v: EcgRecord[]) {
		if (!v || !Array.isArray(v) || v.length === 0) return;
		let osr: number = this._ds.ecgrecords[0].sampleRateForCls;
		// save sample rate in state
		this._dp.state.sampleRate = osr;
		this._dp.layout.prepareStepList(5000, osr, 32767);
		// save original sample rate
		this._dp.drawingData.originalSampleRate = osr;
		this._dp.drawingData.recordHeaders = this._ds.ecgrecords;
		// on real project we receive data in other place
		this._dp.drawingData.projection = this._ds.ecgrecords;
		this._dp.reset();
		this._dp.rebuildDrawObjGroupsF3();
		this._dp.scrollDrawObjGroupsF3();
		this._dp.forceDrRefresh();
	}

	//-------------------------------------------------------------------------------------
	private onLoadFile(event: ProgressEvent) {
		this._ds.parseJsonFile(JSON.parse(this._fileReader.result));
	}

	//-------------------------------------------------------------------------------------
	private onStateChanges(v: XDPSEvent) {
		switch (v.cursor) {
			case CursorType.Default:
				this._el.nativeElement.style.cursor = "default";
				break;
			case CursorType.AllScroll:
				this._el.nativeElement.style.cursor = "all-scroll";
				break;
			case CursorType.NeResize:
				this._el.nativeElement.style.cursor = "ne-resize";
				break;
			case CursorType.NwResize:
				this._el.nativeElement.style.cursor = "nw-resize";
				break;
			case CursorType.EResize:
				this._el.nativeElement.style.cursor = "e-resize";
				break;
			case CursorType.NResize:
				this._el.nativeElement.style.cursor = "n-resize";
				break;
			case CursorType.Move:
				this._el.nativeElement.style.cursor = "move";
				break;
			case CursorType.Pointer:
				this._el.nativeElement.style.cursor = "pointer";
				break;
			case CursorType.Grab:
				this._el.nativeElement.style.cursor = "grab";
				break;
			case CursorType.Grabing:
				this._el.nativeElement.style.cursor = "grabbing";
				break;
			default:
				this._el.nativeElement.style.cursor = "default";
		}
		this._ct.clear();
		this.renderVisibleGroups();
		this.drawCursotPosition();
	}

	//-------------------------------------------------------------------------------------
	private onWheelScroll(event: WheelEvent) {
		// Skip animation
		if (this._zoomAnimation != null) return;
		// Normalize wheel to +1 or -1
		let wheel: number = event.wheelDelta / 120;


		this._dp.layout.resetMicrVoltCoef(1, wheel > 0);

		//let prewZoom: number = this._cursorClient.zoomStep;
		//this._cursorClient.zoomIndex += wheel;
		//if (this._cursorClient.zoomIndex < 0 || this._cursorClient.zoomIndex >= this._cursorClient.zoomSteps.length)
		//	this._cursorClient.zoomIndex = this._cursorClient.zoomSteps.indexOf(1);

		//let localDelta: number = this._cursorClient.zoomStep - prewZoom;
		//let localZoom: number = prewZoom;

		//this._zoomAnimation = new XAnimation();
		//this._zoomAnimation.length = 400;

		//this._zoomAnimation.animation = (progress: number) => {
		//	this._cursorClient.zoom = prewZoom + progress * localDelta;
		//	this._mt.scale(this._cursorClient.zoom, this._cursorClient.zoom);
		//	this._ct.clear();
		//	this.renderVisibleGroups();
		//	this.drawCursotPosition();
		//	this.drawTargeRectangle("red"); //control
		//	this.drawTargeRectangle("blue");
		//};

		//this._zoomAnimation.animationEnd = () => {
		//	this._cursorClient.zoom = this._cursorClient.zoomStep;
		//	this._mt.scale(this._cursorClient.zoom, this._cursorClient.zoom);
		//	this._zoomAnimation = null;
		//	this._ct.clear();
		//	this.renderVisibleGroups();
		//	this.drawCursotPosition();
		//	//this.drawTargeRectangle("red"); //control
		//	this.drawTargeRectangle("blue");
		//};
		//this._zoomAnimation.start();
	}


	//-------------------------------------------------------------------------------------
	//private onScrollDrawings(val: number) {
	//	if (!Number.isInteger(val)) return;
	//	this._dp.scrollDrawObjGroupsF3();
	//	this._dp.refreshDrawings();
	//}

	//-------------------------------------------------------------------------------------
	private renderVisibleGroups() {
		let z: number, y: number;
		for (z = 0; z < this._dp.drawingClients.length; z++) {
			if (!this._dp.drawingClients[z].drawObjects ||
				!Array.isArray(this._dp.doCGroups[z]) ||
				this._dp.doCGroups[z].length === 0) continue;
			//console.log(`drawObjectsF3 for  ${this._dp.drawingClients[z].constructor.name}`);
			this._dp.drawingClients[z].drawObjects(this._dp.doCGroups[z]);
		}
		for (z = 0; z < this._dp.doHud.length; z++) {
			console.log("draw hud:", z);
		}
		this.printState();
	}

	//-------------------------------------------------------------------------------------
	private onReceiveDObjects(p: IDObject[][]) {
		this._ct.clear();
		this.renderVisibleGroups();
		this.drawCursotPosition();
		//this.drawTargeRectangle(this._cursorClient.zoomStep, "red");
	}

	//-------------------------------------------------------------------------------------
	private prepareClients() {
		// prepare clients
		this._signalClient = new SignalDrawingClient();
		this._gridClient = new GridClient();
		this._beatsClient = new BeatsDrawingClient();
		this._cursorClient = new CursorDrawingClient();
		this._demoRectClient = new DemoRectangleClient();

		this._signalClient.drawObjects = this.drawSignalObjects.bind(this);
		this._gridClient.drawObjects = this.drawGridObjects.bind(this);
		this._beatsClient.drawObjects = this.drawBeatsRangesObjects.bind(this);
		this._cursorClient.drawObjects = this.drawCursorObjects.bind(this);
		this._demoRectClient.drawObjects = this.drawDemoRect.bind(this);

		this._dp.pushClients(this._gridClient, this._signalClient, this._beatsClient, this._cursorClient, this._demoRectClient);
	}

	//-------------------------------------------------------------------------------------
	private prepareGrid() {
		let leads: EcgLeadCode[] = this._ds.leads;
		let leadsLabels: string[] = this._ds.getLeadCodesLabels(leads);
		this._dp.layout.rebuild(this._dp.state.container);
		this._dp.state.leadsCodes = leads;
		this._dp.state.leadsCaptions = leadsLabels;
		//this._dp.state.prepareGridCells(leads, leadsLabels);
		this._dp.state.limitPx = this._dp.layout.cellWidth;
	}

	//-------------------------------------------------------------------------------------
	private prepareCanvasSize() {
		this._ct.resize(this._el.nativeElement.offsetWidth as number,
			this._el.nativeElement.offsetHeight as number);
		let space: number = 33;
		let proxyContainer: XRectangle = new XRectangle(space, space, this._ct.width - space * 2, this._ct.height - space * 2);
		this._dp.state.container = proxyContainer;

		this._dp.state.screen = new XRectangle(
			space + this._drawingElement.nativeElement.offsetLeft,
			space + this._drawingElement.nativeElement.offsetTop,
			proxyContainer.width,
			proxyContainer.height);

		this._dp.state.canvas = new XRectangle(
			this._drawingElement.nativeElement.offsetLeft,
			this._drawingElement.nativeElement.offsetTop,
			this._drawingElement.nativeElement.offsetWidth,
			this._drawingElement.nativeElement.offsetHeight);
	}

	//-------------------------------------------------------------------------------------
	private drawSignalObjects(objs: SignalDrawingObject[]) {
		let shift: number = 0; // #DEBUG_ONLY
		let state: XDProxyState = this._dp.state;
		// z - drawing object index
		// y - grid cell index = lead code index
		// x - polyline index
		let z: number,
			y: number,
			polInd: number,
			w: number,
			c: number,
			dx: number,
			dy: number,
			top: number,
			left: number,
			cell: XWCell,
			lead: EcgLeadCode,
			points: XPoint[];

		this._ct.saveState();
		// lead code index = grid cell index
		this._ct.ctx.beginPath();
		for (z = 0; z < objs.length; z++) {

			for (y = 0; y < this._dp.state.leadsCodes.length; y++) {
				lead = this._dp.state.leadsCodes[y];

				polInd = objs[z].leadCodes.indexOf(this._dp.state.leadsCodes[y]);

				if (polInd < 0) continue;
				if (y >= this._dp.layout.cells.length) break;

				cell = this._dp.layout.cells[y];
				points = objs[z].polylines[polInd].points;
				//console.info(points.length);
				// calc start position
				// TODO: check {start+length < points.length}
				w = state.minPx - objs[z].container.left;
				dx = objs[z].container.left + points[w].left - state.minPx;
				dy = Math.floor(points[w].top * cell.microvoltsToPixel + shift);
				left = dx + cell.container.left + 0.5;
				top = dy + cell.container.midOy + 0.5;
				this._ct.ctx.moveTo(left, top);
				w++;
				for (c = 1; w < points.length, c < state.limitPx; w++ , c++) {
					dx = objs[z].container.left + points[w].left - state.minPx;
					dy = Math.floor(points[w].top * cell.microvoltsToPixel) + shift;
					left = dx + cell.container.left + 0.5;
					top = dy + cell.container.midOy + 0.5;
					this._ct.ctx.lineTo(left, top);
				}
			}
		}
		this._ct.ctx.lineWidth = 1;
		this._ct.ctx.strokeStyle = this._signalClient.color;
		this._ct.ctx.globalAlpha = this._signalClient.opacity;
		this._ct.ctx.lineJoin = this._signalClient.lineJoin;
		this._ct.ctx.stroke();
		//this._ct.ctx.closePath();
		this._ct.restoreState();
	}

	//-------------------------------------------------------------------------------------
	private drawCursorObjects(objs: CursorDrawingObject[]) {
		//console.log("draw cursor", objs);
		this._ct.saveState();
		let state: XDProxyState = this._dp.state;
		let z: number = 0, y: number = 0, left: number = 0, top: number = 0, dy: number;
		let obj: CursorDrawingObject = objs[0];
		this._ct.ctx.globalAlpha = this._cursorClient.opacity;
		// pointer line
		this._ct.ctx.beginPath();
		left = state.container.left + obj.lines[0].ax + 0.5;
		top = state.container.top + obj.lines[0].ay + 0.5;
		this._ct.ctx.moveTo(left, top);
		top = state.container.top + obj.lines[0].by + 0.5;
		this._ct.ctx.lineTo(left, top);
		this._ct.ctx.strokeStyle = this._cursorClient.lineColor;
		//this._ct.ctx.closePath();
		this._ct.ctx.stroke();

		let testShift: number = 0;
		this._ct.ctx.beginPath();
		this._ct.ctx.fillStyle = this._cursorClient.pointColor;
		for (let z: number = 0; z < this._dp.layout.cells.length; z++) {
			// cell index = point index
			left = state.container.left + obj.points[z].left + 0.5;
			dy = Math.floor(obj.points[z].top * this._dp.layout.cells[z].microvoltsToPixel);
			top = dy + this._dp.layout.cells[z].container.midOy + testShift + 0.5;
			this._ct.makeCircle(left, top, this._cursorClient.pointRadius);
		}
		this._ct.ctx.closePath();
		this._ct.ctx.fill();
		this._ct.restoreState();
	}

	//-------------------------------------------------------------------------------------
	private drawCursotPosition(baseRadius: number = 3) {
		let left: number,
			top: number,
			text: string,
			radius: number;
		radius = this._cursorClient.zoom * baseRadius * 2;
		let textSize: number = 12;
		this._ct.saveState();
		this._ct.ctx.beginPath();
		this._ct.ctx.fillStyle = "pink";
		left = this._dp.state.container.left + this._dp.state.pointerX + 0.5;
		top = this._dp.state.container.left + this._dp.state.pointerY + 0.5;
		this._ct.makeCircle(left, top, radius);
		this._ct.ctx.closePath();
		this._ct.ctx.fill();

		this._ct.ctx.fillStyle = "#111";
		this._ct.ctx.font = `${textSize}px Roboto`;
		this._ct.ctx.textBaseline = "bottom";
		this._ct.ctx.textAlign = "left";

		text = `${this._dp.state.pointerX},${this._dp.state.pointerY}`;
		this._ct.ctx.fillText(text, left, top);

		this._ct.restoreState();
	}

	//-------------------------------------------------------------------------------------
	private drawBeatsRangesObjects(objs: BeatsRangeDrawingObject[]) {

		this._ct.saveState();
		//this._ct.clipRect(this._dp.state.container);// TODO remove
		// draw beat ranges: drawObj.container for all channels
		// draw beat peaks: drawObj.points for each channel
		let z: number,
			y: number,
			x: number,
			w: number,
			dx: number,
			dy: number,
			top: number,
			left: number,
			point: XPoint,
			cell: XWCell,
			beatRange: BeatsRangeDrawingObject;

		let shift: number = 0;
		let textSize: number = 10;
		let state: XDProxyState = this._dp.state;
		let printText: boolean;

		// fill beat background
		this._ct.ctx.font = `${textSize}px Roboto`;
		this._ct.ctx.textBaseline = "middle";
		this._ct.ctx.textAlign = "center";
		//this._ct.ctx.globalAlpha = 0.05;
		for (y = 0; y < objs.length; y++) {
			beatRange = objs[y];

			if (beatRange.container.minOx - state.minPx < 0 ||
				beatRange.container.maxOx - state.maxPx > 0) {
				continue;
			}
			for (x = 0; x < beatRange.leadCodes.length; x++) {
				w = state.leadsCodes.indexOf(beatRange.leadCodes[x]);
				if (w < 0) continue;
				cell = this._dp.layout.cells[w];
				this._ct.ctx.fillStyle = beatRange.index % 2 == 0 ?
					this._beatsClient.backgroundColor1 :
					this._beatsClient.backgroundColor2;
				// TODO: combine different states with bitwise operations
				if (beatRange.state === XDPrimitiveState.AS) {
					this._ct.ctx.globalAlpha = 0.05 * 3;
				} else if (beatRange.state === XDPrimitiveState.Active) {
					this._ct.ctx.globalAlpha = 0.05 * 1.5;
				} else if (beatRange.state === XDPrimitiveState.Selected) {
					this._ct.ctx.globalAlpha = 0.05 * 2;
				} else {
					this._ct.ctx.globalAlpha = 0.05;
				}

				dx = beatRange.container.minOx - state.minPx;
				left = cell.container.left + dx;
				this._ct.ctx.fillRect(
					left,
					cell.container.top,
					beatRange.container.width,
					cell.container.height
				);
			}
		}

		// draw beats
		this._ct.ctx.beginPath();
		this._ct.ctx.globalAlpha = 1;
		this._ct.ctx.fillStyle = "#111";
		for (y = 0; y < objs.length; y++) {
			beatRange = objs[y];

			printText = !(beatRange.container.minOx - state.minPx < 0 ||
				beatRange.container.maxOx - state.maxPx > 0);

			for (x = 0; x < beatRange.leadCodes.length; x++) {
				w = state.leadsCodes.indexOf(beatRange.leadCodes[x]);
				if (w < 0) continue;
				cell = this._dp.layout.cells[w];

				point = beatRange.points[x];
				dx = point.left - state.minPx;
				if (dx < 0 || point.left > state.maxPx) continue;
				dy = Math.floor(point.top * cell.microvoltsToPixel);
				left = cell.container.left + dx + 0.5;
				top = dy + cell.container.midOy + 0.5 + shift;
				this._ct.makeCircle(left, top, this._beatsClient.radius);
				if (printText) {
					this._ct.ctx.fillText(`${point.left}`, left, top + textSize);
				}
			}

			if (point && printText) {
				// print beat range info
				top = state.container.maxOy - textSize;
				this._ct.ctx.fillText(`${beatRange.container.minOx}-${beatRange.container.maxOx}`, left, top);
			}

		}
		this._ct.ctx.fillStyle = this._beatsClient.color;
		this._ct.ctx.globalAlpha = this._beatsClient.opacity;
		this._ct.ctx.closePath();
		this._ct.ctx.fill();
		this._ct.restoreState();
	}

	//-------------------------------------------------------------------------------------
	private drawGridObjects(objs: GridCellDrawingObject[]) {

		let z: number,
			y: number,
			x: number,
			w: number,
			ax: number,
			ay: number,
			bx: number,
			by: number,
			line: XLine,
			cellIndex: number,
			renderCell: boolean,
			leadCode: EcgLeadCode,
			state: XDProxyState;

		state = this._dp.state;

		this._ct.saveState();
		if (this._clipCanvas) {
			this._ct.clipRect(state.container);
		}

		this._ct.ctx.lineJoin = this._gridClient.lineJoin;
		this._ct.ctx.textBaseline = "top";
		this._ct.ctx.textAlign = "left";

		// draw borders

		this._ct.ctx.beginPath();
		this._ct.ctx.globalAlpha = this._gridClient.borderOpacity;
		this._ct.ctx.strokeStyle = this._gridClient.borderColor;

		for (z = 0; z < objs.length; z++) {
			for (y = 0; y < objs[z].leadCodes.length; y++) {
				leadCode = objs[z].leadCodes[y];
				cellIndex = state.leadsCodes.indexOf(leadCode);
				if (cellIndex < 0) continue;
				renderCell = this._dp.layout.cells[cellIndex].container.state != XDPrimitiveState.Hidden;
				if (!renderCell) continue;

				for (x = 0; x < objs[z].horizontal.length; x++) {
					for (w = 0; w < objs[z].horizontal[x].length; w++) {
						line = objs[z].horizontal[x][w];
						ax = line.ax + objs[z].container.left - state.minPx;
						ay = line.ay + objs[z].container.top;
						bx = line.bx + objs[z].container.left - state.minPx;
						by = line.by + objs[z].container.top;
						this._ct.makeLine(ax, ay, bx, by);
					}
				}

				for (x = 0; x < objs[z].vertical.length; x++) {
					for (w = 0; w < objs[z].vertical[x].length; w++) {
						line = objs[z].vertical[x][w];
						ax = line.ax + objs[z].container.left - state.minPx;
						ay = line.ay + objs[z].container.top;
						bx = line.bx + objs[z].container.left - state.minPx;
						by = line.by + objs[z].container.top;
						if (ax < 0 || bx < 0) continue;
						if (ax > state.container.maxOx || bx > state.container.maxOx) break;
						this._ct.makeLine(ax, ay, bx, by);
						this._ct.ctx.fillText(line.ax.toString(), ax, ay);
					}
				}
			}
		}
		this._ct.ctx.stroke();

		// draw axis
		this._ct.ctx.beginPath();
		this._ct.ctx.globalAlpha = this._gridClient.axisOpacity;
		this._ct.ctx.strokeStyle = this._gridClient.axisColor;

		for (z = 0; z < objs.length; z++) {
			for (y = 0; y < objs[z].leadCodes.length; y++) {
				leadCode = objs[z].leadCodes[y];
				cellIndex = state.leadsCodes.indexOf(leadCode);
				if (cellIndex < 0) continue;
				renderCell = this._dp.layout.cells[cellIndex].container.state != XDPrimitiveState.Hidden;
				if (!renderCell) continue;

				for (x = 0; x < objs[z].ox.length; x++) {
					line = objs[z].ox[x];
					ax = line.ax + objs[z].container.left - state.minPx;
					ay = line.ay + objs[z].container.top;
					bx = line.bx + objs[z].container.left - state.minPx;
					by = line.by + objs[z].container.top;
					this._ct.makeLine(ax, ay, bx, by);
				}
			}
		}
		this._ct.ctx.stroke();
		this._ct.restoreState();
	}

	//-------------------------------------------------------------------------------------
	private drawDemoRect(objs: DemoRectDrawingObject[]) {
		let f: XRectangle = objs[0].figure;
		let p: XRectangle = objs[0].container;
		let l: number = this._dp.state.minPx;
		let t: number = this._dp.state.container.top;

		this._ct.saveState();
		this._ct.clipRect(this._dp.state.container);
		this._ct.ctx.translate(this._dp.state.container.left, this._dp.state.container.top);

		//this._ct.ctx.beginPath();
		//this._ct.makeLine(0, 0, this._demoRectClient.left, this._demoRectClient.top);
		//this._ct.ctx.stroke();

		//this._targRectClient
		let fa: XPoint = new XPoint(p.minOx + f.minOx - l, p.minOy + f.minOy),
			fb: XPoint = new XPoint(p.minOx + f.maxOx - l, p.minOy + f.minOy),
			fc: XPoint = new XPoint(p.minOx + f.maxOx - l, p.minOy + f.maxOy),
			fd: XPoint = new XPoint(p.minOx + f.minOx - l, p.minOy + f.maxOy);
		//this._mt.applyForPoints(fa, fb, fc, fd); // zoom not connected
		//console.log(a, b, c, d);
		this._ct.ctx.strokeStyle = this._demoRectClient.strokeStyle;
		this._ct.strokePointsPath(fa, fb, fc, fd);

		let pa: XPoint = new XPoint(p.minOx - l, p.minOy),
			pb: XPoint = new XPoint(p.maxOx - l, p.minOy),
			pc: XPoint = new XPoint(p.maxOx - l, p.maxOy),
			pd: XPoint = new XPoint(p.minOx - l, p.maxOy);
		//this._ct.ctx.strokeStyle = "blue";
		//this._ct.strokePointsPath(pa, pb, pc, pd);
		this._ct.restoreState();

	}

	//-------------------------------------------------------------------------------------
	private printState() {
		let textSize: number = 15;
		let text: string,
			left: number,
			top: number,
			textWidth: number;
		this._ct.saveState();
		this._ct.ctx.fillStyle = "#111";
		this._ct.ctx.font = `${textSize}px Roboto`;
		this._ct.ctx.textBaseline = "middle";
		this._ct.ctx.textAlign = "center";

		// min pixels
		text = `${this._dp.state.minPx}`;
		textWidth = this._ct.ctx.measureText(text).width;
		left = this._dp.layout.cells[0].container.left + textWidth / 2;
		top = this._dp.layout.cells[0].container.top - textSize;
		this._ct.ctx.fillText(text, left, top);
		// max pixels
		text = `${this._dp.state.maxPx}`;
		textWidth = this._ct.ctx.measureText(text).width;
		left = this._dp.layout.cells[0].container.maxOx - textWidth / 2;
		top = this._dp.layout.cells[0].container.top - textSize;
		this._ct.ctx.fillText(text, left, top);

		// size
		text = `${Math.floor(this._ct.width)}X${Math.floor(this._ct.height)}  W=${this._dp.state.limitPx}  H=${this._dp.layout.signalScale}`;
		textWidth = this._ct.ctx.measureText(text).width;
		left = this._ct.width / 2;
		top = this._ct.height - textSize;
		this._ct.ctx.fillText(text, left, top);

		this._ct.restoreState();
	}


	//-------------------------------------------------------------------------------------
	// TODO: add affine transform tests for rectangle
	private drawTargeRectangle(cl: string) {
		this._ct.saveState();
		//this._targRectClient
		let a: XPoint = new XPoint(this._demoRectClient.figure.minOx, this._demoRectClient.figure.minOy),
			b: XPoint = new XPoint(this._demoRectClient.figure.maxOx, this._demoRectClient.figure.minOy),
			c: XPoint = new XPoint(this._demoRectClient.figure.maxOx, this._demoRectClient.figure.maxOy),
			d: XPoint = new XPoint(this._demoRectClient.figure.minOx, this._demoRectClient.figure.maxOy);

		this._mt.applyForPoints(a, b, c, d);
		//console.log(a, b, c, d);
		this._ct.ctx.strokeStyle = cl;
		this._ct.strokePointsPath(a, b, c, d);
		this._ct.restoreState();
	}






}
