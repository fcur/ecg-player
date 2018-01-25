import {
	EcgLeadCode, EcgWavePoint, EcgAnnotation, EcgAnnotationCode,
	EcgRecord, EcgSignal, EcgWavePointType, EcgParser
} from "./ecgdata";
import {
	SignalDrawingObject, WaveDrawingObject, WavepointDrawingObject,
	CursorDrawingObject, GridCellDrawingObject, PeakDrawingObject,
	XDOType, AnsDrawingObject, BeatsRangeDrawingObject,
	CellDrawingObject, ClPointDrawingObject, XDrawingObject,
	IDObject, DemoRectDrawingObject, XDOChangeType
} from "./drawingobject";
import {
	BeatsDrawingClient, IDrawingClient, ClickablePointDrawingClient,
	CursorDrawingClient, GridClient, XDrawingClient,
	XDrawingMode, AnsDrawingClient, SignalDrawingClient,
	WavepointClient, CellDrawingClient
} from "./drawingclient";
import {
	XDrawingPrimitive, XDPrimitiveState,
	XLabel, XLine, XPeak, XPoint, XPolyline,
	XRectangle
} from "./geometry";
import { LiteResampler } from "./literesampler";
import { ElementRef } from "@angular/core";


// -------------------------------------------------------------------------------------------------
// Drawing grid cells mode
// -------------------------------------------------------------------------------------------------
export enum XDGridMode {
	EMPTY = 0,			// 
	// 3 CH
	LEADS3CH111,		// 3 channels, 1H + 1H + 1H
	LEADS3CH211,		// 3 channels, 2H + 0.5H + 0.5H
	LEADS3CH121,		// 3 channels, 0.5H + 2H + 0.5H
	LEADS3CH112,		// 3 channels, 0.5H + 0.5H + 2H 
	// 2 CH
	LEADS2CH11,			// 2 channels, 1H + 1H
	LEADS2CH21,			// 2 channels, 1.5H + 0.5H 
	LEADS2CH12,			// 2 channels, 0.5H  + 1.5H 
	// 1 CH
	LEADS1CH1,			// 1 channel, 1H
	// 12 CH
	Leads12R3C4,		// 12 channels grid 3X4
	// 15 CH
	Leads15R3C5,		// 15 channels grid 4X3

}

// -------------------------------------------------------------------------------------------------
// Drawing change sender
// -------------------------------------------------------------------------------------------------
export enum XDCoordinates {
	ABSOLUTE,
	SCREEN,
	COMPONENT,
	CANVAS,
	GRID_CONTAINER,
	GRID_CELL
}

// -------------------------------------------------------------------------------------------------
// Drawing change sender
// -------------------------------------------------------------------------------------------------
export enum XDChangeSender {
	None,
	MouseClick,
	MouseHover,
	MouseDbClick,
	Tap,
	Drag,
	MouseMove
}

// -------------------------------------------------------------------------------------------------
// Drawing change type
// -------------------------------------------------------------------------------------------------
export enum XDChangeType {
	Default,
	ZoomX,
	ZoomY,
	ZoomXY,
	Scroll,
	ForceRefresh,
	Change
}

// -------------------------------------------------------------------------------------------------
// Drawing change type
// -------------------------------------------------------------------------------------------------
export enum CursorType {
	Default,
	AllScroll,
	EResize,
	NResize,
	Move,
	Pointer,
	Grab,
	Grabing,
	NeResize,
	NwResize
}



// -------------------------------------------------------------------------------------------------
// Drawing change event object
// -------------------------------------------------------------------------------------------------
export class XDPSEvent {
	private _threshold: number;

	private _currentState: XDProxyState;
	private _previousState: XDProxyState;



	public count: number;

	//-------------------------------------------------------------------------------------------------
	public get currentState(): XDProxyState {
		return this._currentState;
	}
	//-------------------------------------------------------------------------------------------------
	public set currentState(v: XDProxyState) {
		this._currentState = v;;
	}
	//-------------------------------------------------------------------------------------------------
	public get previousState(): XDProxyState {
		return this._previousState;
	}
	//-------------------------------------------------------------------------------------------------
	public get sender(): XDChangeSender {
		return this._currentState.sender;
	}
	//-------------------------------------------------------------------------------------------------
	public set sender(v: XDChangeSender) {
		this._currentState.sender = v;
	}
	//-------------------------------------------------------------------------------------------------
	public get type(): XDChangeType {
		return this._currentState.type;
	}
	//-------------------------------------------------------------------------------------------------
	public set type(v: XDChangeType) {
		this._currentState.type = v;
	}
	//-------------------------------------------------------------------------------------------------
	public get cursor(): CursorType {
		return this._currentState.cursor;
	}
	//-------------------------------------------------------------------------------------------------
	public set cursor(v: CursorType) {
		this._currentState.cursor = v;
	}
	//-------------------------------------------------------------------------------------------------
	public get timeStamp(): number {
		return this._currentState.timeStamp;
	}
	//-------------------------------------------------------------------------------------------------
	public set timeStamp(v: number) {
		this._currentState.timeStamp = v;
	}

	//-------------------------------------------------------------------------------------------------
	constructor() {
		this.reset();
	}

	//-------------------------------------------------------------------------------------------------
	public reset() {
		this._threshold = 25;
		this._currentState = new XDProxyState();
		this._previousState = new XDProxyState();
		this.count = 0;
		this.cursor = CursorType.Default;
		this.timeStamp = Date.now();
	}

	//-------------------------------------------------------------------------------------------------
	//public updateTimestamp(): XDPSEvent {
	//	this.timeStamp = Date.now();
	//	return this;
	//}

	//-------------------------------------------------------------------------------------------------
	public get notify(): boolean {
		let t: number = Date.now();
		let r: boolean = t - this.timeStamp > this._threshold;
		if (r) this.timeStamp = t;
		return r;
	}

	//-------------------------------------------------------------------------------------------------
	public get info(): string {
		let r = "t=";
		switch (this.type) {
			case XDChangeType.Default:
				r += "default";
				break;
			case XDChangeType.ForceRefresh:
				r += "force refresh";
				break;
			case XDChangeType.Scroll:
				r += "scroll";
				break;
			case XDChangeType.ZoomX:
				r += "zoom-x";
				break;
			case XDChangeType.ZoomY:
				r += "zoom-y";
				break;
		}
		r += " s=";
		switch (this.sender) {
			case XDChangeSender.None:
				r += "none";
				break;
			case XDChangeSender.Drag:
				r += "drag";
				break;
			case XDChangeSender.MouseClick:
				r += "mouse single click";
				break;
			case XDChangeSender.MouseDbClick:
				r += "mouse double click";
				break;
			case XDChangeSender.MouseHover:
				r += "mouse hover";
				break;
			case XDChangeSender.MouseMove:
				r += "mouse move";
				break;
			case XDChangeSender.Tap:
				r += "tap";
				break;
		}
		return r;
	}

}


// -------------------------------------------------------------------------------------------------
// Drawing proxy grid cell
// -------------------------------------------------------------------------------------------------
export class XWCell {

	static FM: number = 100000;
	private _smpValToPixList: number[];
	private _mcrvToPixList: number[];
	private _pxToMsList: number[];
	private _pxPerSmpList: number[];
	private _dxStepLabelsList: string[];
	private _dyStepLabelsList: string[];
	private _mcrvToPixZ: number;

	/** Cell relative size & position.*/
	public container: XRectangle;
	/** Cell index. */
	public index: number;
	/** Cell ROW index. */
	public rowIndex: number;
	/** Cell COLUMN index. */
	public colIndex: number;
	/** Cell visiblity(hidden). */
	public hidden: boolean;
	/** Cell density object. */
	public density: XWDensity;
	/** Cell signal inversion. */
	public invert: boolean;
	/** Cell signal height to pixels.  */
	public vhp: number;

	/** Sample value to pixel convertion MUL coefficient. pixels = sample_value * coef */
	public get sampleValueToPixel(): number { return this._smpValToPixList[this.density.dyStepIndex]; }
	/** Microvolts value to pixel convertion MUL coefficient. pixels = millivolts * coef */
	public get microvoltsToPixel(): number { return this._mcrvToPixList[this.density.dyStepIndex]; }
	public get mcrvToPixList(): number[] { return this._mcrvToPixList; }
	public get microvoltsToPixelZ(): number { return this._mcrvToPixZ; }
	public set microvoltsToPixelZ(v: number) { this._mcrvToPixZ = v; }

	/** Millivolts value to pixel convertion MUL coefficient. pixels = microvolts * coef */
	public get millivoltsToPixel(): number { return this._mcrvToPixList[this.density.dyStepIndex] * 1000; }
	/** Count of pixels into microvolts value. */
	public get pixelsToMicrovolts(): number { return 1 / this._mcrvToPixList[this.density.dyStepIndex]; }
	/** Count of pixels into millivilts value. */
	public get pixelsToMillivolts(): number { return 1 / (this._mcrvToPixList[this.density.dyStepIndex] * 1000); }

	/** Pixels count to milliseconds length. */
	public get pixelsToMilliseconds(): number { return this._pxToMsList[this.density.dxStepIndex]; }
	/** Milliseconds length to count of pixels. */
	public get millisecondsToPixels(): number { return 1 / this._pxToMsList[this.density.dxStepIndex]; }
	/** Count of pixels per each sample. */
	public get pixesPerSample(): number { return this._pxPerSmpList[this.density.dxStepIndex]; }

	public get dxStepLabelsList(): string[] { return this._dxStepLabelsList; }
	public get dyStepLabelsList(): string[] { return this._dyStepLabelsList; }
	public get curDxStepLabel(): string { return this._dxStepLabelsList[this.density.dxStepIndex]; }
	public get curDyStepLabel(): string { return this._dyStepLabelsList[this.density.dyStepIndex]; }
	public get dxStepIndex(): number { return this.density.dxStepIndex; }
	public set dxStepIndex(v: number) { this.density.dxStepIndex = v; }
	public set dyStepIndex(v: number) { this.density.dyStepIndex = v; }
	public get dyStepIndex(): number { return this.density.dyStepIndex; }

	//-------------------------------------------------------------------------------------
	constructor() {
		// TODO: add init method
		this.reset();
	}

	//-------------------------------------------------------------------------------------
	public reset() {
		this.density = new XWDensity();
	}

	//-------------------------------------------------------------------------------------
	/**
	 * Prepare dx step lists.
	 * @param sampleRate original sample rate
	 */
	public prepareDxStepList(sampleRate: number) {
		if (sampleRate <= 0) return;
		let z: number,
			fsr: number;
		this._pxToMsList = new Array(this.density.dxStepList.length);
		this._pxPerSmpList = new Array(this.density.dxStepList.length);
		for (z = 0; z < this._pxToMsList.length; z++) {
			fsr = this.floatingSampleRate(this.density.dxStepList[z], sampleRate);
			this._pxPerSmpList[z] = fsr / sampleRate;
			this._pxToMsList[z] = Math.floor(1000 * XWCell.FM / fsr) / XWCell.FM;
		}
	}

	//-------------------------------------------------------------------------------------
	/**
	 * Prepare dy step lists.
	 * @param ssc static signal clip
	 * @param maxSample maximum sample value (from settings)
	 * @param sss session signal scale
	 */
	public prepareDyStepList(ssc: number = 0, maxSample: number = 0, sss: number = 0) {
		if (ssc <= 0 || sss <= 0 || maxSample <= 0) return; // skip
		let z: number,
			smpMaxValue: number,
			mcrvMaxValue: number,
			// cell signal hei1ght max in pixels (from OY axis to TOP)
			shpx: number = this.container.hHeight;

		this._mcrvToPixList = new Array(this.density.dyStepList.length);
		this._smpValToPixList = new Array(this.density.dyStepList.length);
		for (z = 0; z < this._mcrvToPixList.length; z++) {
			mcrvMaxValue = this.microvoltsMaxValue(this.density.dyStepList[z], ssc);
			smpMaxValue = this.sampleMaxValue(mcrvMaxValue, sss, maxSample);
			this._smpValToPixList[z] = Math.floor((shpx / smpMaxValue) * XWCell.FM) / XWCell.FM;
			this._mcrvToPixList[z] = Math.floor((shpx / mcrvMaxValue) * XWCell.FM) / XWCell.FM;
		}
	}

	//----------------------------------------------------------------------------------------------
	public prepareStepLabels() {
		let z: number;
		this._dxStepLabelsList = new Array(this.density.dxStepList.length);
		for (z = 0; z < this.density.dxStepList.length; z++) {
			this._dxStepLabelsList[z] = `${this.density.getStepLabel(true, z)}  ${this.getUnitLabel(XWDensity.LOWX_LABEL)}`;
		}
		this._dyStepLabelsList = new Array(this.density.dyStepList.length);
		for (z = 0; z < this.density.dyStepList.length; z++) {
			this._dyStepLabelsList[z] = `${this.density.getStepLabel(false, z)}  ${this.getUnitLabel(XWDensity.LOWY_LABEL)}`;
		}
	}

	//-------------------------------------------------------------------------------------
	private microvoltsMaxValue(dy: number, ssc: number): number {
		let result: number = 0;
		if (this.density.units === XWDensityUnit.Percents && ssc > 0) {
			result = ssc / dy;
		}
		return result;
	}

	//-------------------------------------------------------------------------------------
	private sampleMaxValue(mcrMaxVal: number, sss: number, smpMaxVal: number): number {
		if (mcrMaxVal > 0 && sss > 0 && smpMaxVal > 0)
			return mcrMaxVal * smpMaxVal / sss;
		return 0;
	}

	//----------------------------------------------------------------------------------------------
	private floatingSampleRate(dx: number, sr: number): number {
		let result: number = 0;
		if (this.density.units === XWDensityUnit.Percents) {
			result = sr * dx;
		}
		return result;
	}

	//----------------------------------------------------------------------------------------------
	public getUnitLabel(lowPart: string): string {
		if (this.density.units === XWDensityUnit.Percents) {
			return this.density.unitLabel;

		} else return `unit/${lowPart}`;
	}

}




import { Subscription, BehaviorSubject } from "rxjs";
// -------------------------------------------------------------------------------------------------
// Drawing proxy state
// -------------------------------------------------------------------------------------------------
export class XDProxyState {
	/** Drag position. */
	private _dragPosition: XPoint;
	/** Time at which state was created/changed. */
	public timestamp: number;
	/** Samples count to pixel convertion MUL coefficient. */
	public sampleToPixelRatio: number;
	/** Samples count to time convertion MUL coefficient. */
	public sampleToTimeRatio: number;
	/** Scale coefficient 1X1. */
	public scale: number = 1;
	/** Absolute surfce left offset in pixels. */
	private _skipPx: number;
	/** Absolute surfce width in pixels. */
	public limitPx: number;
	/** Surface relative size & position.*/
	public container: XRectangle;

	public screen: XRectangle;
	public canvas: XRectangle;
	/** Target drawing object under cursor. */
	public target: IDObject;
	/** Pixels in millimeter MUL coefficient. */
	//public apxmm: number;
	/** Maximum declared sample value. */
	public maxSample: number;
	/** Maximum/minimum visible (calculated) sample value in microvolts. */
	//public signalMicrovoltsClip: number; // signalClip
	/** Maximum/minimum visible (calculated) sample value. */
	//public signalSamplesClip: number;
	/** Signal sample rate.*/
	public sampleRate: number;
	/** Enable development mode.*/
	public devMode: boolean;
	/** Maximum sample value in microvolts from input signal. */
	//public signalScale: number;
	/** Surface grid cells array. Position on canvas. */
	//public gridCells: XWCell[];
	/**  Surface grid cells mode.*/
	//public gridMode: XDGridMode;
	/** Cursor pointer X. */
	public pointerX: number;
	/** Cursor pointer Y. */
	public pointerY: number;
	public clientX: number;
	public clientY: number;
	public mouseX: number;
	public mouseY: number;
	//public onScrollBs: BehaviorSubject<number>;
	/** Last scroll movement delta. */
	public movDelta: number;

	public sender: XDChangeSender;
	public type: XDChangeType;
	public cursor: CursorType;
	public timeStamp: number;
	/** Waveform cells lead codes.*/
	public leadsCodes: EcgLeadCode[];
	/** Waveform cells lead captions.*/
	public leadsCaptions: string[];

	// TODO: add surface dimentions getter

	//-------------------------------------------------------------------------------------------------
	public get onLeftEdge(): boolean {
		return this._skipPx === 0;
	}
	//-------------------------------------------------------------------------------------------------
	public get onRightEdge(): boolean {
		return false;
	}
	//-------------------------------------------------------------------------------------------------
	public get minPx(): number {
		return this._skipPx;
	}
	//-------------------------------------------------------------------------------------------------
	public get maxPx(): number {
		return this._skipPx + this.limitPx;
	}
	//-------------------------------------------------------------------------------------------------
	public get skipPx(): number {
		return this._skipPx;
	}
	//-------------------------------------------------------------------------------------------------
	public set skipPx(v: number) {
		this._skipPx = v;
	}
	//-------------------------------------------------------------------------------------------------
	public get canDrag(): boolean {
		return this._dragPosition.left != -1
			&& this._dragPosition.top != -1;
	}
	//-------------------------------------------------------------------------------------------------
	public set dragPosition(v: XPoint) {
		this._dragPosition.rebuild(v.left, v.top);
	}
	//-------------------------------------------------------------------------------------------------
	public get dragPosition(): XPoint {
		return this._dragPosition;
	}
	//-------------------------------------------------------------------------------------------------
	public get activeZoom(): boolean {
		return this.activeXzoom || this.activeYzoom || this.activeXYzoom;
	}
	//-------------------------------------------------------------------------------------------------
	public get activeXYzoom(): boolean {
		return this.type === XDChangeType.ZoomXY;
	}
	//-------------------------------------------------------------------------------------------------
	public get activeXzoom(): boolean {
		return this.type === XDChangeType.ZoomX;
	}
	//-------------------------------------------------------------------------------------------------
	public get activeYzoom(): boolean {
		return this.type === XDChangeType.ZoomY;
	}

	//-------------------------------------------------------------------------------------------------
	constructor() {
		this._dragPosition = new XPoint(-1, -1);
		this.devMode = true;
		this.target = null;
		this.leadsCodes = [];
		//this.onScrollBs = new BehaviorSubject(NaN);
		this.timestamp = Date.now();            // drawing proxy state creation time
		this.scale = 1;                         // default scale = 1   
		//this.apxmm = 3;                         // for default dpi
		//this.signalScale = 5000;                // from input signal
		//this.signalMicrovoltsClip = 5000;       // from settings
		this.maxSample = 32767;                 // from input signal
		//this.gridCells = [];
		this._skipPx = 0;
		this.limitPx = 0;
		//this.signalSamplesClip = Math.floor(this.maxSample * this.signalMicrovoltsClip / this.signalScale);
		//this.gridMode = XDGridMode.EMPTY;
		this.resetPointer();
	}

	//-------------------------------------------------------------------------------------------------
	public resetPointer() {
		this.resetDrag();
		this.clientX = 0; this.clientY = 0;
		this.mouseX = 0; this.mouseY = 0;
		this.pointerX = 0; this.pointerY = 0;
	}

	//-------------------------------------------------------------------------------------------------
	public resetDrag() {
		this._dragPosition.rebuild(-1, -1);
		if (this.target) {
			this.target.changeType = XDOChangeType.Default;
		}
		this.target = null;
	}

	//-------------------------------------------------------------------------------------------------
	public updateDragStart(v: XPoint) {
		this._dragPosition.rebuild(v.left, v.top);
	}

	//-------------------------------------------------------------------------------------------------
	public saveClientPosition(x: number, y: number) {
		this.clientX = x;
		this.clientY = y;
		this.mouseX = x - this.canvas.left;
		this.mouseY = y - this.canvas.top;
	}

	//-------------------------------------------------------------------------------------------------
	public savePointerPosition(x: number, y: number) {
		//console.log(x, y);
		this.pointerX = x;
		this.pointerY = y;
	}

	//-------------------------------------------------------------------------------------------------
	public scroll(delta: number) {
		if (!Number.isInteger(delta)) return;

		this.movDelta = delta;
		this._skipPx = Math.max(Math.floor(this._skipPx - delta), 0);
		//if (!Number.isInteger(this.onScrollBs.value) || this._skipPx != this.onScrollBs.value)
		//	this.onScrollBs.next(this._skipPx);
	}

	//-------------------------------------------------------------------------------------------------
	/** Returns signal cells by row index. */
	public getGridRowCells(ri: number): XWCell[] {
		console.info("getGridRowCells not implemented.")
		return [];
	}

	//-------------------------------------------------------------------------------------------------
	//public prepareGridCells(leads: EcgLeadCode[], leadLabels: string[]) {
	//	if (!Array.isArray(leads) || !Array.isArray(leadLabels)) return;
	//	if (leads.length === 3) this.gridMode = XDGridMode.LEADS3CH111;
	//	else if (leads.length === 12) this.gridMode = XDGridMode.Leads12R3C4;

	//	// prepare grid
	//	let rwCount: number = 3;
	//	let clCount: number = leads.length / rwCount;
	//	let space: number = 10;
	//	let aviableHeight: number = this.container.height - (rwCount - 1) * space;
	//	let aviableWidth: number = this.container.width - (clCount - 1) * space;
	//	let cellHeight: number = Math.floor(aviableHeight / rwCount);
	//	let cellWidth: number = Math.floor(aviableWidth / clCount);
	//	let signalHeight: number = Math.floor(cellHeight / 2);
	//	let cellLeft: number, cellTop: number, z: number, y: number;
	//	let cellContainer: XRectangle;
	//	cellLeft = this.container.left;
	//	let ci: number; // column indx
	//	this.leadsCodes = leads; // show all leads
	//	// TODO: merge leads & grid schema
	//	this.gridCells = new Array(leads.length);
	//	for (z = 0, cellTop = this.container.top, ci = 0; z < leads.length; z++ , ci++) {
	//		for (y = 0; y < rwCount; y++ , z++) {
	//			this.gridCells[z] = new XWCell();
	//			this.gridCells[z].index = z;
	//			this.gridCells[z].cellRowIndex = y;
	//			this.gridCells[z].cellColumnIndex = ci;
	//			this.gridCells[z].container = new XRectangle(cellLeft, cellTop, cellWidth, cellHeight);
	//			this.gridCells[z].lead = leads[z];
	//			this.gridCells[z].leadLabel = leadLabels[z];
	//			// prepare mul coefficients
	//			this.gridCells[z].sampleValueToPixel = Math.floor((signalHeight / this.signalSamplesClip) * XWCell.FLOATING_MUL) / XWCell.FLOATING_MUL;
	//			this.gridCells[z].microvoltsToPixel = Math.floor((signalHeight / this.signalMicrovoltsClip) * XWCell.FLOATING_MUL) / XWCell.FLOATING_MUL;
	//			//console.info(this.gridCells[z].sampleValueToPixel, this.gridCells[z].microvoltsToPixel, signalHeight);
	//			cellTop = this.gridCells[z].container.maxOy + space;
	//			//console.info("z:", this.gridCells[z].index, "row:", this.gridCells[z].cellRowIndex, "column:", this.gridCells[z].cellColumnIndex);
	//		}
	//		cellLeft += cellWidth + space;
	//	}
	//	this.limitPx = this.gridCells[0].container.width;
	//}




}




//-------------------------------------------------------------------------------------------------
// Canvas tool
//-------------------------------------------------------------------------------------------------
export class XCanvasTool {
	// TODO: group&draw primitives on canvas
	// group by: z-index, color, type

	public width: number;
	public height: number;

	public ctx: CanvasRenderingContext2D;
	public drawingElement: ElementRef;

	//-------------------------------------------------------------------------------------------------
	constructor(de: ElementRef) {
		this.drawingElement = de;
		this.ctx = this.drawingElement.nativeElement.getContext("2d");
		this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
	}

	//-------------------------------------------------------------------------------------------------
	public get devicePixelRatio(): number {
		return window.devicePixelRatio || 1;
	}

	//-------------------------------------------------------------------------------------------------
	public clear() {
		this.ctx.clearRect(0, 0, this.width, this.height);
	}

	//-------------------------------------------------------------------------------------------------
	public resize(width: number, height: number): boolean {
		if (Number.isNaN(width) || Number.isNaN(height)) return false;
		width = Math.floor(width);
		height = Math.floor(height);
		this.drawingElement.nativeElement.style.width = `${width}px`;
		this.drawingElement.nativeElement.style.height = `${height}px`;
		this.width = width * this.devicePixelRatio;
		this.height = height * this.devicePixelRatio;
		this.drawingElement.nativeElement.width = this.width;
		this.drawingElement.nativeElement.height = this.height;
		return true;
	}

	//-------------------------------------------------------------------------------------------------
	public drawInfo() {
		this.ctx.save();
		this.clear();
		this.ctx.fillStyle = "#ccc";
		this.ctx.font = "10mm Roboto";
		this.ctx.textBaseline = "middle";
		this.ctx.textAlign = "center";
		let text: string = `${Math.floor(this.width)}X${Math.floor(this.height)}`
		this.ctx.fillText(text, this.width / 2, this.height / 2);
		this.ctx.restore();
	}

	//-------------------------------------------------------------------------------------------------
	public clip(l: number, t: number, w: number, h: number) {
		this.ctx.rect(l, t, w, h);
		this.ctx.clip();
	}

	//-------------------------------------------------------------------------------------------------
	public clipRect(rect: XRectangle) {
		this.clip(rect.left, rect.top, rect.width, rect.height);
	}

	//-------------------------------------------------------------------------------------------------
	public saveState() {
		this.ctx.save();
	}

	//-------------------------------------------------------------------------------------------------
	public restoreState() {
		this.ctx.restore();
	}

	//-------------------------------------------------------------------------------------------------
	public makeLine(ax: number, ay: number, bx: number, by: number) {
		this.ctx.moveTo(ax + 0.5, ay + 0.5);
		this.ctx.lineTo(bx + 0.5, by + 0.5);
	}

	//-------------------------------------------------------------------------------------------------
	public makeLine2Points(a: XPoint, b: XPoint) {
		this.ctx.moveTo(a.left + 0.5, a.top + 0.5);
		this.ctx.lineTo(b.left + 0.5, b.top + 0.5);
	}

	//-------------------------------------------------------------------------------------------------
	public strokePointsPath(...points: XPoint[]) {
		this.ctx.beginPath();
		let z: number = 0;
		this.ctx.moveTo(points[z].left + 0.5, points[z].top + 0.5);
		z++;
		for (; z < points.length; z++) {
			this.ctx.lineTo(points[z].left + 0.5, points[z].top + 0.5);
		}
		this.ctx.closePath(); // important
		this.ctx.stroke();
	}



	//-------------------------------------------------------------------------------------------------
	public makeCircle(left: number, top: number, radius: number) {
		this.ctx.moveTo(left, top);
		this.ctx.arc(left, top, radius, 0, 2 * Math.PI, false);
	}
}

//-------------------------------------------------------------------------------------------------
// Matrix tool
//-------------------------------------------------------------------------------------------------
export class XMatrixTool {
	/** Rotation angle. */
	public angle: number;
	/** Rotate about this point. */
	public rotationPoint: XPoint;
	/** Translate OX. */
	public tx: number;
	/** Translate OY. */
	public ty: number;
	/** Scale OX. */
	public sx: number;
	/** Scale OY. */
	public sy: number;

	private _refreshMatrix: boolean;
	private _rotationMatrix2D: number[][];
	private _scaleMatrix2D: number[][];
	private _translationMatrix2D: number[][];
	private _transformMatrix2D: number[][];


	public get matrix(): number[][] {

		if (this._refreshMatrix) this.refresh();

		this._transformMatrix2D = [
			[1, 0, 0],
			[0, 1, 0],
			[0, 0, 1]
		];
		if (this.tx != 0 || this.ty != 0)
			this._transformMatrix2D = XMatrixTool.MatrixMultiply(this._transformMatrix2D, this._translationMatrix2D);

		if (this.sx != 0 || this.sy != 0)
			this._transformMatrix2D = XMatrixTool.MatrixMultiply(this._transformMatrix2D, this._scaleMatrix2D);

		if (this.rotationPoint && this.angle != 0) {
			// translate to rotationPoint{left, top}
			// rotate on a DEG angle
			// translate to  rotationPoint{-left, -top}
		} else if (this.angle != 0) {
			this._transformMatrix2D = XMatrixTool.MatrixMultiply(this._transformMatrix2D, this._scaleMatrix2D);
		}

		return this._transformMatrix2D;
	}

	//-------------------------------------------------------------------------------------------------
	constructor() {
		this.reset();
	}

	//-------------------------------------------------------------------------------------------------
	public applyForPoints(...points: XPoint[]): number[][] {
		let a: number[][] = this.matrix;
		let b: number[][] = this.prepareMatrixForPoints(points);
		let result: number[][] = XMatrixTool.MatrixMultiply(a, b);
		let z1: number, z2: number;
		for (z2 = 0; z2 < points.length; z2++) {
			z1 = 0;
			points[z2].rebuild(Math.floor(result[z1++][z2]), Math.floor(result[z1++][z2]));
		}
		return result;
	}

	//-------------------------------------------------------------------------------------------------
	private prepareMatrixForPoints(points: XPoint[]): number[][] {
		if (!Array.isArray(points)) return [];
		let z1: number = 0,
			z2: number = 0,
			result: number[][],
			rowsCount: number = 3,
			colCount: number = points.length;
		result = new Array(rowsCount);

		result[z1++] = new Array(colCount); // left coordinate
		result[z1++] = new Array(colCount); // top coordinate
		result[z1++] = new Array(colCount);
		for (; z2 < colCount; z2++) {
			z1 = 0;
			result[z1++][z2] = points[z2].left;
			result[z1++][z2] = points[z2].top;
			result[z1++][z2] = 1;
		}
		return result;
	}

	//-------------------------------------------------------------------------------------------------
	public reset() {
		this.tx = 0;
		this.ty = 0;
		this.sx = 1;
		this.sy = 1;
		this.angle = 0;

		this.translate(0, 0);
		this.scale(1, 1);
		this.rotate(0);
		this.refresh();
	}

	//-------------------------------------------------------------------------------------------------
	public refresh() {
		this._refreshMatrix = true;
		this._translationMatrix2D = [
			[1, 0, this.tx],
			[0, 1, this.ty],
			[0, 0, 1]
		];

		this._scaleMatrix2D = [
			[this.sx, 0, 0],
			[0, this.sy, 0],
			[0, 0, 1]
		];

		let a: number = this.angle * Math.PI / 180;
		let cos: number = Math.cos(a),
			sin = Math.sin(a);

		this._rotationMatrix2D = [
			[cos, -sin, 0],
			[sin, cos, 0],
			[0, 0, 1]
		];
	}

	//-------------------------------------------------------------------------------------------------
	public translate(left: number, top: number): XMatrixTool {
		//this._refreshMatrix = this._refreshMatrix || (this.tx != left || this.ty != top);
		this._refreshMatrix = true;
		this.tx += left;
		this.ty += top;
		return this;
	}

	//-------------------------------------------------------------------------------------------------
	public scale(x: number, y: number): XMatrixTool {
		//this._refreshMatrix = this._refreshMatrix || (this.sx != x || this.sy != y);
		this._refreshMatrix = true;
		this.sx = x;
		this.sy = y;
		return this;
	}

	//-------------------------------------------------------------------------------------------------
	public rotate(angle: number): XMatrixTool {
		//this._refreshMatrix = this._refreshMatrix || (this.angle != angle);
		this._refreshMatrix = true;
		this.angle += angle;
		return this;
	}

	//-------------------------------------------------------------------------------------------------
	static MatrixMultiply(a: number[][], b: number[][]): number[][] {
		if (!Array.isArray(a) ||
			!Array.isArray(b) ||
			a.length === 0 ||
			b.length === 0 ||
			b.length != a[0].length)
			return [];

		let aRowsCnt: number = a.length,
			aColsCnt: number = a[0].length,
			bRowsCnt: number = b.length,
			bColsCnt: number = b[0].length,
			c: number[][] = new Array(aRowsCnt),
			z1: number,
			z2: number,
			z3: number;

		for (z1 = 0; z1 < aRowsCnt; ++z1) {
			c[z1] = new Array(bColsCnt);
			for (z2 = 0; z2 < bColsCnt; ++z2) {
				c[z1][z2] = 0;
				for (z3 = 0; z3 < aColsCnt; ++z3) {
					c[z1][z2] += a[z1][z3] * b[z3][z2];
				}
			}
		}
		return c;
	}

	//-------------------------------------------------------------------------------------------------
	static PointMultiply(left: number, top: number, matrix: number[][]): number[][] {
		return XMatrixTool.MatrixMultiply([[left], [top], [0]], matrix);
	}

	//-------------------------------------------------------------------------------------------------
	static XPointMultiply(point: XPoint, matrix: number[][]): number[][] {
		return XMatrixTool.PointMultiply(point.left, point.top, matrix);
	}

}




//-------------------------------------------------------------------------------------------------
// XAnimation
//-------------------------------------------------------------------------------------------------
export class XAnimation {
	private _length: number = 2000;
	private _frameId: number;
	private _start: number;
	private _now: number;
	private _debug: boolean;
	private _tc: number;
	private _type: XAnimationType = XAnimationType.LinearEaseNone;
	private _animation: Function;
	private _animationEnd: Function;
	private _animate: boolean = false;
	private _runing: boolean = false;

	public get maxTime(): number { return this._start === 0 ? 0 : this._start + this._length; }
	public get animate(): boolean { return this._now < this.maxTime; }
	public set animation(v: Function) { this._animation = v; }
	public set animationEnd(v: Function) { this._animationEnd = v; }
	public set length(v: number) { this._length = v; }
	public set easing(t: XAnimationType) { this._type = t; }
	public get runing(): boolean { return this.runing; }

	//----------------------------------------------------------------------------------------------
	constructor(db: boolean = false) { this._debug = db; }

	//----------------------------------------------------------------------------------------------
	public get tc(): number { return this._tc; }

	//----------------------------------------------------------------------------------------------
	private get transform(): number {
		let tc: number = (this._now - this._start) / this._length;
		let next: number;
		switch (this._type) {
			case XAnimationType.LinearEaseNone:
				next = tc;
				break;
			case XAnimationType.CubicEaseIn:
				next = tc * tc * tc;
				break;
			case XAnimationType.CubicEaseOut:
				next = --tc * tc * tc + 1;
				break;
			case XAnimationType.CubicEaseInOut:
				if ((tc *= 2) < 1) next = 0.5 * tc * tc * tc;
				next = 0.5 * ((tc -= 2) * tc * tc + 2);
				break;
			case XAnimationType.QuintEaseOut:
				next = --tc * tc * tc * tc * tc + 1;
				break;
			default:
				next = tc;
		}
		return next;
	}

	//----------------------------------------------------------------------------------------------
	public nextFrame() {
		if (!this._animate) return;
		this._now = Date.now();
		if (this._now >= this.maxTime) {
			this._tc = 1;
			this._animation(this.tc);
			this.end();
			return;
		};
		this._tc = this.transform;
		if (this._debug) console.info(`A: draw ${Date.now() - this._start}ms`);
		if (this._animation) this._animation(this.tc);
		this._frameId = requestAnimationFrame(this.nextFrame.bind(this));
	}

	//----------------------------------------------------------------------------------------------
	public start() {
		if (this._runing) return; // cancel animation
		this._start = Date.now();
		this._animate = true;
		this._runing = true;
		this.nextFrame();
	}

	//----------------------------------------------------------------------------------------------
	public end() {
		if (this._debug) console.info(`A: end ${Date.now() - this._start}ms`);
		if (this._animationEnd) this._animationEnd();
		this._start = 0;
		this._now = 0;
		this._tc = 0;
		this._runing = false;
		this._animate = false;
		cancelAnimationFrame(this._frameId);
	}

	//----------------------------------------------------------------------------------------------
	public cancel() {
		this._runing = false;
		this._animate = false;
	}
}


//-------------------------------------------------------------------------------------------------
// XAnimationType
//-------------------------------------------------------------------------------------------------
export enum XAnimationType {
	LinearEaseNone,
	CubicEaseIn,
	CubicEaseOut,
	CubicEaseInOut,
	QuintEaseOut
}

//-------------------------------------------------------------------------------------------------
// Waveform density type enumeration
//-------------------------------------------------------------------------------------------------
export enum XWDensityUnit {
	Default,
	Millimeters,
	Percents
}


//-------------------------------------------------------------------------------------------------
// Waveform density
//-------------------------------------------------------------------------------------------------
export class XWDensity {
	// prefix step index - data value index
	// other - step list formula indexes

	static LOWX_LABEL = "s";
	static LOWY_LABEL = "mV";
	// data value indexes
	public _dxStepIndex: number;
	public _dyStepIndex: number;
	public _dxStepMaxIndex: number;
	public _dyStepMaxIndex: number;

	// lists of zoom steps
	public dxStepList: number[];
	public dyStepList: number[];
	// step list formula indexes
	public dxMinIndex: number;
	public dyMinIndex: number;
	public dxMaxIndex: number;
	public dyMaxIndex: number;
	public dxDefIndex: number;
	public dyDefIndex: number;
	// settings
	public scrollLock: boolean;
	public units: XWDensityUnit;
	//-------------------------------------------------------------------------------------
	public get dxStepMaxIndex(): number { return this._dxStepMaxIndex; }
	//-------------------------------------------------------------------------------------
	public get dyStepMaxIndex(): number { return this._dyStepMaxIndex; }
	//-------------------------------------------------------------------------------------
	public get unitLabel(): string {
		let label: string = "";
		switch (this.units) {
			case XWDensityUnit.Millimeters:
				label = "mm";
				break;
			case XWDensityUnit.Percents:
				label = "%";
				break;
			default:
				label = "px";
		}
		return label;
	}
	//-------------------------------------------------------------------------------------
	public get dxStepIndex(): number { return this._dxStepIndex; }
	//-------------------------------------------------------------------------------------
	public set dxStepIndex(v: number) {
		if (!Number.isInteger(v) || v < 0 || v > this.dxStepList.length) {
			this.resetDxStepIndex();
			return;
		}
		this._dxStepIndex = v;
	}
	//-------------------------------------------------------------------------------------
	public get dyStepIndex(): number { return this._dyStepIndex; }
	//-------------------------------------------------------------------------------------
	public set dyStepIndex(v: number) {
		if (!Number.isInteger(v) || v < 0 || v > this.dyStepList.length) {
			this.resetDyStepIndex();
			return;
		}
		this._dyStepIndex = v;
	}

	//-------------------------------------------------------------------------------------
	constructor() {
		this.reset();
		this.prepareStepList();
		this.resetDxStepIndex();
		this.resetDyStepIndex();
	}

	//-------------------------------------------------------------------------------------
	/**
	 * Formula for OX axis.
	 * @param i some number.
	 */
	public getDxStep(i: number): number {
		return (2 ** i);
	}

	//-------------------------------------------------------------------------------------
	/**
	 * Formula for OY axis.
	 * @param i some number.
	 */
	public getDyStep(i: number): number {
		return (2 ** i);
	}

	//-------------------------------------------------------------------------------------
	public reset() {
		this.units = XWDensityUnit.Percents;
		this.scrollLock = false;
		this.dxMinIndex = -2 // step value = 25%
		this.dxMaxIndex = 2; // step value = 400%
		this.dyMinIndex = -2; // step value = 25%
		this.dyMaxIndex = 2; // step value = 400%
		this.dxDefIndex = 0; // step value = 100%
		this.dyDefIndex = 0; // step value = 100%
	}

	//-------------------------------------------------------------------------------------
	public getStepLabel(dx: boolean = true, i: number): string {
		let v: number = dx ? this.dxStepList[i] : this.dyStepList[i];
		if (this.units === XWDensityUnit.Percents) {
			v *= 100;
		}
		return v.toString();
	}

	//-------------------------------------------------------------------------------------
	public resetDxStepIndex() {
		this._dxStepIndex = this.dxStepList.indexOf(this.getDxStep(this.dxDefIndex));
	}

	//-------------------------------------------------------------------------------------
	public resetDyStepIndex() {
		this._dyStepIndex = this.dyStepList.indexOf(this.getDyStep(this.dyDefIndex));
	}

	//-------------------------------------------------------------------------------------
	public prepareStepList() {
		this.resetDxStepList();
		this.resetDyStepList();
	}

	//-------------------------------------------------------------------------------------
	public resetDxStepList() {
		let z: number;
		this.dxStepList = new Array();
		for (z = this.dxMinIndex; z <= this.dxMaxIndex; z++) {
			this.dxStepList.push(this.getDxStep(z));
		}
		this._dxStepMaxIndex = this.dxStepList.length - 1;
	}

	//-------------------------------------------------------------------------------------
	public resetDyStepList() {
		let z: number;
		this.dyStepList = new Array();
		for (z = this.dyMinIndex; z <= this.dyMaxIndex; z++) {
			this.dyStepList.push(this.getDyStep(z));
		}
		this._dyStepMaxIndex = this.dyStepList.length - 1;
	}

}


//-------------------------------------------------------------------------------------------------
// Waveform layout
//-------------------------------------------------------------------------------------------------
export class XWLayout {
	// TODO: add cells from row/golumn getter methods

	private _dxStepIndex: number;
	private _dyStepIndex: number;
	private _gridMode: XDGridMode;
	private _rowsCells: XWCell[][];
	private _columsCells: XWCell[][];

	/** Pixels in millimeter MUL coefficient. */
	public apxmm: number;
	/** Waveform cells. */
	public cells: XWCell[];

	/** Rows count. */
	public rwc: number;
	/** Columns count. */
	public clc: number;
	/** Rows margin. */
	public rm: number;
	/** Columns margin. */
	public cm: number;
	/** Layout margin. */
	public lm: number;

	/** Grid cells containers. */
	//public cells: XRectangle[];

	//-------------------------------------------------------------------------------------
	public get cellWidth(): number {
		if (Array.isArray(this.cells) && this.cells.length > 0)
			return this.cells[0].container.width;
		return 0;
	}

	//-------------------------------------------------------------------------------------
	public resetMicrVoltCoef(p: number, up: boolean) {
		//console.log(up ? "up / zoom in" : "down / zoom out");
		let pv: number = this.cells[0].microvoltsToPixel;
		let pi: number = this.cells[0].density.dyStepIndex;
		let ni: number = up ?
			Math.min(this.cells[0].density.dyStepMaxIndex, pi + 1) :
			Math.max(0, pi - 1);
		let nv: number = this.cells[0].mcrvToPixList[ni];
		let v: number = pv + (nv - pv) * p;

		for (let z: number = 0; z < this.cells.length; z++) {
			this.cells[z].microvoltsToPixelZ = v;
		}
	}

	//-------------------------------------------------------------------------------------
	public updateMicrVoltCoef(up: boolean) {
		let pv: number = this.cells[0].microvoltsToPixel;
		let pi: number = this.cells[0].density.dyStepIndex;
		let ni: number = up ?
			Math.min(this.cells[0].density.dyStepMaxIndex, pi + 1) :
			Math.max(0, pi - 1);
		for (let z: number = 0; z < this.cells.length; z++) {
			this.cells[z].dyStepIndex = ni;
		}
		//console.log(this.cells[0].curDxStepLabel, this.cells[0].curDyStepLabel);
	}

	//-------------------------------------------------------------------------------------
	get gridMode(): XDGridMode {
		return this._gridMode;
	}

	/** Surface relative size & position.*/
	public container: XRectangle;
	/** Maximum sample value in microvolts from input signal. */
	public signalScale: number;
	/** Maximum/minimum visible (calculated) sample value in microvolts. */
	public microVoltsClip: number;
	/** Maximum declared sample value. */
	public maxSampleVal: number;
	/** Original signal sample rate. */
	public sampleRate: number;

	//-------------------------------------------------------------------------------------
	set gridMode(layout: XDGridMode) {
		this._gridMode = layout;
		this.rwc = 0;
		this.clc = 0;
		if (layout === XDGridMode.LEADS3CH111 ||
			layout === XDGridMode.LEADS3CH211 ||
			layout === XDGridMode.LEADS3CH121 ||
			layout === XDGridMode.LEADS3CH112) {
			this.clc = 1;
			this.rwc = 3;
		} else if (layout === XDGridMode.LEADS2CH11 ||
			layout === XDGridMode.LEADS2CH21 ||
			layout === XDGridMode.LEADS2CH12) {
			this.clc = 1;
			this.rwc = 2;
		} else if (layout === XDGridMode.LEADS1CH1) {
			this.clc = 1;
			this.rwc = 1;
		} else if (layout === XDGridMode.Leads12R3C4) {
			this.rwc = 3;
			this.clc = 4;
		} else if (layout === XDGridMode.Leads15R3C5) {
			this.rwc = 3;
			this.clc = 5;
		}
	}
	//-------------------------------------------------------------------------------------------------
	constructor() {
		this._dxStepIndex = 0;
		this._dyStepIndex = 0;
		this.gridMode = XDGridMode.LEADS3CH111;
		this.rm = 10;
		this.lm = 20;
		this.cm = 10;
		this.microVoltsClip = 5000; // from settings
		this.maxSampleVal = 32767; // from input signal
		this.sampleRate = 175;// from input signal
		this.cells = [];
	}

	//-------------------------------------------------------------------------------------------------
	public rebuild(c: XRectangle) {
		let cellIndex: number,
			colIndex: number,
			rowIndex: number,
			cellLeft: number,
			cellTop: number,
			cell: XWCell,
			cellHeight: number = Math.floor((c.height - (this.rwc - 1) * this.rm) / this.rwc),
			cellWidth: number = Math.floor((c.width - (this.clc - 1) * this.cm) / this.clc),
			signalHeight: number = Math.floor(cellHeight / 2);

		this.cells = new Array(this.rwc * this.clc);
		this._rowsCells = new Array(this.rwc);
		this._columsCells = new Array(this.clc);

		for (cellIndex = 0, colIndex = 0, cellLeft = c.left, cellTop = c.top; cellIndex < this.cells.length; cellIndex++ , colIndex++) {
			this._columsCells[colIndex] = new Array(this.rwc);

			for (rowIndex = 0; rowIndex < this.rwc; rowIndex++ , cellIndex++) {
				if (!Array.isArray(this._rowsCells[rowIndex]))
					this._rowsCells[rowIndex] = new Array(this.clc);

				cell = new XWCell();
				cell.index = cellIndex;
				cell.rowIndex = rowIndex;
				cell.colIndex = colIndex;
				cell.container = new XRectangle(cellLeft, cellTop, cellWidth, cellHeight);
				//cell.density.dxStepIndex = this._dxStepIndex;
				//cell.density.dyStepIndex = this._dyStepIndex;
				this.cells[cellIndex] = cell;
				this._rowsCells[rowIndex][colIndex] = cell;
				this._columsCells[colIndex][rowIndex] = cell;
				cellTop += cellHeight + this.rm;
			}
			cellLeft += cellWidth + this.cm;
		}
	}

	//-------------------------------------------------------------------------------------------------
	public prepareStepList(sss: number, osr: number, msv: number) {
		this.maxSampleVal = msv;
		this.signalScale = sss;
		this.sampleRate = osr;
		for (let z: number = 0; z < this.cells.length; z++) {
			this.cells[z].prepareDxStepList(osr);
			this.cells[z].prepareDyStepList(this.microVoltsClip, this.maxSampleVal, sss);
			this.cells[z].prepareStepLabels();
		}
	}


}
