import {
	EcgLeadCode, EcgWavePoint, EcgAnnotation, EcgAnnotationCode,
	EcgRecord, EcgSignal, EcgWavePointType, EcgParser
} from "./ecgdata";
import {
	SignalDrawingObject, WaveDrawingObject, WavepointDrawingObject,
	CursorDrawingObject, GridCellDrawingObject, PeakDrawingObject,
	XDOType, AnsDrawingObject, BeatsRangeDrawingObject,
	CellDrawingObject, ClPointDrawingObject, XDrawingObject,
	IDObject
} from "./drawingobject";
import {
	BeatsDrawingClient, IDrawingClient, ClickablePointDrawingClient,
	CursorDrawingClient, GridCellDrawingClient, XDrawingClient,
	XDrawingMode, AnsDrawingClient, SignalDrawingClient,
	WavepointClient, CellDrawingClient
} from "./drawingclient";
import {
	XDrawingPrimitive, XDrawingPrimitiveState,
	XLabel, XLine, XPeak, XPoint, XPolyline,
	XRectangle
} from "./geometry";
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
	Scroll,
	ForceRefresh,
	Change
}


// -------------------------------------------------------------------------------------------------
// Drawing change event object
// -------------------------------------------------------------------------------------------------
export class XDPSEvent {
	private _threshold: number = 3000;

	private _currentState: XDProxyState;
	private _previousState: XDProxyState;

	public sender: XDChangeSender;
	public type: XDChangeType;
	public timeStamp: number;
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
	constructor() {
		this.reset();
	}

	//-------------------------------------------------------------------------------------------------
	public reset() {
		this.count = 0;
		this._currentState = new XDProxyState();
		this._previousState = new XDProxyState();
		this.timeStamp = Date.now();
	}

	//-------------------------------------------------------------------------------------------------
	//public updateTimestamp(): XDPSEvent {
	//	this.timeStamp = Date.now();
	//	return this;
	//}

	//-------------------------------------------------------------------------------------------------
	public notify(): boolean {
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
export class XDCell {
	/** Cell relative size & position.*/
	public container: XRectangle;
	/** Cell index. */
	public index: number;
	/** Cell ROW index. */
	public cellRowIndex: number;
	/** Cell COLUMN index. */
	public cellColumnIndex: number;

	/** Cell assigned lead code. */
	public lead: EcgLeadCode;
	/** Cell assigned lead text. */
	public leadLabel: string;
	/** Cell signal inversion. */
	public invert: boolean;

	/** Sample value to pixel convertion MUL coefficient. pixels = sample_value * coef */
	public sampleValueToPixel: number;
	/** Microvolts value to pixel convertion MUL coefficient. pixels = microvolts * coef */
	public microvoltsToPixel: number;
	/** Cell signal height to pixels.  */
	public vhp: number;

	static FLOATING_MUL: number = 100000;

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

	/** Pixels in millimeter MUL coefficient. */
	public apxmm: number;
	/** Maximum declared sample value. */
	public maxSample: number;

	/** Maximum/minimum visible (calculated) sample value in microvolts. */
	public signalMicrovoltsClip: number; // signalClip
	/** Maximum/minimum visible (calculated) sample value. */
	public signalSamplesClip: number;

	/** Signal sample rate.*/
	public sampleRate: number;
	/** Enable development mode.*/
	public devMode: boolean;
	/** Maximum sample value in microvolts from input signal. */
	public signalScale: number;
	/** Surface grid cells array. Position on canvas. */
	public gridCells: XDCell[];
	/**  Surface grid cells mode.*/
	public gridMode: XDGridMode;
	/** Cursor pointer X. */
	public pointerX: number;
	/** Cursor pointer Y. */
	public pointerY: number;
	public clientX: number;
	public clientY: number;
	public mouseX: number;
	public mouseY: number;
	public leadsCodes: EcgLeadCode[];
	public onScrollBs: BehaviorSubject<number>;
	/** Last scroll movement delta. */
	public movDelta: number;

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
	constructor() {
		this._dragPosition = new XPoint(-1, -1);
		this.devMode = true;
		this.leadsCodes = [];
		this.onScrollBs = new BehaviorSubject(NaN);
		this.timestamp = Date.now();            // drawing proxy state creation time
		this.scale = 1;                         // default scale = 1   
		this.apxmm = 3;                         // for default dpi
		this.signalScale = 5000;                // from input signal
		this.signalMicrovoltsClip = 5000;       // from settings
		this.maxSample = 32767;                 // from input signal
		this.gridCells = [];
		this._skipPx = 0;
		this.limitPx = 0;
		this.signalSamplesClip = Math.floor(this.maxSample * this.signalMicrovoltsClip / this.signalScale);
		this.gridMode = XDGridMode.EMPTY;
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
		this.pointerX = x;
		this.pointerY = y;
	}

	//-------------------------------------------------------------------------------------------------
	public scroll(delta: number) {
		if (!Number.isInteger(delta)) return;

		this.movDelta = delta;
		this._skipPx = Math.max(Math.floor(this._skipPx - delta), 0);
		if (!Number.isInteger(this.onScrollBs.value) || this._skipPx != this.onScrollBs.value)
			this.onScrollBs.next(this._skipPx);
	}

	//-------------------------------------------------------------------------------------------------
	/** Returns signal cells by row index. */
	public getGridRowCells(ri: number): XDCell[] {
		console.info("getGridRowCells not implemented.")
		return [];
	}

	//-------------------------------------------------------------------------------------------------
	public prepareGridCells(leads: EcgLeadCode[], leadLabels: string[]) {
		if (!Array.isArray(leads) || !Array.isArray(leadLabels)) return;
		if (leads.length === 3) this.gridMode = XDGridMode.LEADS3CH111;
		else if (leads.length === 12) this.gridMode = XDGridMode.Leads12R3C4;

		// prepare grid
		let rwCount: number = 3;
		let clCount: number = leads.length / rwCount;
		let space: number = 10;
		let aviableHeight: number = this.container.height - (rwCount - 1) * space;
		let aviableWidth: number = this.container.width - (clCount - 1) * space;
		let cellHeight: number = Math.floor(aviableHeight / rwCount);
		let cellWidth: number = Math.floor(aviableWidth / clCount);
		let signalHeight: number = Math.floor(cellHeight / 2);
		let cellLeft: number, cellTop: number, z: number, y: number;
		let cellContainer: XRectangle;
		cellLeft = this.container.left;
		let ci: number; // column indx
		this.leadsCodes = leads; // show all leads
		// TODO: merge leads & grid schema
		this.gridCells = new Array(leads.length);
		for (z = 0, cellTop = this.container.top, ci = 0; z < leads.length; z++ , ci++) {
			for (y = 0; y < rwCount; y++ , z++) {
				this.gridCells[z] = new XDCell();
				this.gridCells[z].index = z;
				this.gridCells[z].cellRowIndex = y;
				this.gridCells[z].cellColumnIndex = ci;
				this.gridCells[z].container = new XRectangle(cellLeft, cellTop, cellWidth, cellHeight);
				this.gridCells[z].lead = leads[z];
				this.gridCells[z].leadLabel = leadLabels[z];
				// prepare mul coefficients
				this.gridCells[z].sampleValueToPixel = Math.floor((signalHeight / this.signalSamplesClip) * XDCell.FLOATING_MUL) / XDCell.FLOATING_MUL;
				this.gridCells[z].microvoltsToPixel = Math.floor((signalHeight / this.signalMicrovoltsClip) * XDCell.FLOATING_MUL) / XDCell.FLOATING_MUL;
				//console.info(this.gridCells[z].sampleValueToPixel, this.gridCells[z].microvoltsToPixel, signalHeight);
				cellTop = this.gridCells[z].container.maxOy + space;
				//console.info("z:", this.gridCells[z].index, "row:", this.gridCells[z].cellRowIndex, "column:", this.gridCells[z].cellColumnIndex);
			}
			cellLeft += cellWidth + space;
		}
		this.limitPx = this.gridCells[0].container.width;
	}


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

