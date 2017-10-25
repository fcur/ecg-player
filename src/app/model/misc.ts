import {
		EcgLeadCode, EcgWavePoint, EcgAnnotation,
		EcgAnnotationCode, EcgRecord, EcgSignal,
		EcgWavePointType
} from "./ecgdata";

// -------------------------------------------------------------------------------------------------
// Drawing mode
// -------------------------------------------------------------------------------------------------
export enum XDrawingMode {
		Canvas = 0,
		SVG,
		Mix
}

// -------------------------------------------------------------------------------------------------
// Drawing client
// -------------------------------------------------------------------------------------------------
export class XDrawingClient {
		public mode: XDrawingMode;

		public draw() {

		}

}



// -------------------------------------------------------------------------------------------------
// Drawing object type
// -------------------------------------------------------------------------------------------------
export enum XDrawingObjectType {
		Signal,
		Beats,
		Annotations,
		PQRST
}



// -------------------------------------------------------------------------------------------------
// Drawing grid cells mode
// -------------------------------------------------------------------------------------------------
export enum XDrawingGridMode {
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
export enum XDrawingChangeSender {
		MouseClick,
		MouseHover,
		MouseDbClick,
		Tap,
		Drag,
		MouseMove
}


// -------------------------------------------------------------------------------------------------
// Drawing change
// -------------------------------------------------------------------------------------------------
export class XDrawingChange {
		public sender: XDrawingChangeSender;
		public curState: XDrawingProxyState;

		constructor() {

		}

}



// -------------------------------------------------------------------------------------------------
// Drawing proxy grid cell
// -------------------------------------------------------------------------------------------------
export class XDrawingCell {
		/** Cell relative size & position.*/
		public container: XRectangle;
		/** Cell index. */
		public index: number;
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

		static FLOATING_MUL: number = 100000;

}


// -------------------------------------------------------------------------------------------------
// Drawing proxy state
// -------------------------------------------------------------------------------------------------
export class XDrawingProxyState {
		//devicePixelRatio = window.devicePixelRatio


		/** Creation time. */
		public timestamp: number;

		/** Samples count to pixel convertion MUL coefficient. */
		public sampleToPixelRatio: number;
		/** Samples count to time convertion MUL coefficient. */
		public sampleToTimeRatio: number;

		/** Scale coefficient 1X1. */
		public scale: number = 1;
		/** Absolute surfce left offset in pixels. */
		public skipPx: number;
		/** Absolute surfce width in pixels. */
		public limitPx: number;

		/** Surface relative size & position.*/
		public container: XRectangle;
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
		/** Surface grid cells array.*/
		public gridCells: XDrawingCell[];
		/**  Surface grid cells mode.*/
		public gridMode: XDrawingGridMode;


		//-------------------------------------------------------------------------------------------------
		constructor() {
				this.devMode = true;
				this.timestamp = Date.now();            // drawing proxy state creation time
				this.scale = 1;                         // default scale = 1   
				this.apxmm = 3;                         // for default dpi
				this.signalScale = 5000;                // from input signal
				this.signalMicrovoltsClip = 5000;       // from settings
				this.maxSample = 32767;                 // from input signal
				this.gridCells = [];
				this.skipPx = 0;
				this.limitPx = 0;
				this.signalSamplesClip = Math.floor(this.maxSample * this.signalMicrovoltsClip / this.signalScale);
				this.gridMode = XDrawingGridMode.EMPTY;
		}

		//-------------------------------------------------------------------------------------------------
		/** Returns signal cells by row index. */
		public getGridRowCells(ri: number): XDrawingCell[] {
				console.info("getGridRowCells not implemented.")
				return [];
		}

		//-------------------------------------------------------------------------------------------------
		public prepareGridCells(leads: EcgLeadCode[], leadLabels: string[]) {
				if (leads.length === 3) this.gridMode = XDrawingGridMode.LEADS3CH111;
				else if (leads.length === 12) this.gridMode = XDrawingGridMode.Leads12R3C4;

				let cellContainer: XRectangle;
				this.gridCells = new Array(leads.length);
				let signalHeight: number;
				for (let z: number = 0; z < leads.length; z++) {
						this.gridCells[z] = new XDrawingCell();
						this.gridCells[z].index = z;
						// TODO calc container for each cell | use parent on default
						this.gridCells[z].container = this.container;
						this.gridCells[z].lead = leads[z];
						this.gridCells[z].leadLabel = leadLabels[z];
						// prepare mul coefficients
						signalHeight = this.gridCells[z].container.height / 2;
						this.gridCells[z].sampleValueToPixel = Math.floor((signalHeight / this.signalSamplesClip) * XDrawingCell.FLOATING_MUL) / XDrawingCell.FLOATING_MUL;
						this.gridCells[z].microvoltsToPixel = Math.floor((signalHeight / this.signalMicrovoltsClip) * XDrawingCell.FLOATING_MUL) / XDrawingCell.FLOATING_MUL;
				}
				this.limitPx = this.gridCells[0].container.width;
		}


}


// -------------------------------------------------------------------------------------------------
// Drawing object
// -------------------------------------------------------------------------------------------------
export class XDrawingObject {
		/** Object index. */
		public index: number;
		/** Object owner. */
		public owner: XDrawingClient;
		/** Object type. */
		public type: XDrawingObjectType;
		/** Container of drawing object (required). */
		public container: XRectangle;
		/**Drawing object points (relative coordinates, optional). Beats */
		public points: XPoint[];
		/** Drawing object polylines. Signal*/
		public polylines: XPolyline[];
		/** Drawing object rectangels (relative coordinates, optional).
    * Annotations background*/
		public rectangles: XRectangle[];
    /** Drawing object lines  (relative coordinates, optional).
     * PQRST, measure tool */
		public lines: XLine[];

		public labels: XLabel[];
		public peaks: XPeak[];

		//-------------------------------------------------------------------------------------
		constructor() {
				this.container = new XRectangle(0, 0, 0, 0);
		}

		//-------------------------------------------------------------------------------------
		static PrepareWavePoint(i: number, ewp: EcgWavePoint, state: XDrawingProxyState, owner: XDrawingClient): XDrawingObject {
				let result: XDrawingObject = new XDrawingObject();
				result.index = i;
				result.owner = owner;
				// TODO: switch wavepoint type, add different elements for different types
				result.type = XDrawingObjectType.PQRST;
				result.container = new XRectangle(0, 0, 0, 0);
				result.lines = new Array();
				// TODO: Prepare lines
				result.labels = new Array();
				// TODO: Prepare labels (wavepoint type, length)
				result.peaks = new Array();
				// TODO: Prepare peaks (peak title + line)
				return result;
		}

		//-------------------------------------------------------------------------------------
		static PrepareAnnotation(i: number, an: EcgAnnotation, state: XDrawingProxyState, owner: XDrawingClient): XDrawingObject {
				let result: XDrawingObject = new XDrawingObject();
				result.index = i;
				result.owner = owner;
				//console.warn("NOT IMPLEMENTED");
				return result;
		}

		//-------------------------------------------------------------------------------------
    /**
     * Create XDrawingObject for each EcgSignal.
     * XPoints[count][], count = EcgSignal.leads.count.
     * @param i index
     * @param s signal
     * @param state proxy state
     * @param owner object owner
     */
		static PrepareSignal(i: number, s: EcgSignal, state: XDrawingProxyState, owner: XDrawingClient): XDrawingObject {
				let result: XDrawingObject = new XDrawingObject();
				result.polylines = new Array(state.gridCells.length);
				/** channel index */
				let chIndex: number;
				let points: XPoint[];
				let cell: XDrawingCell;
				/** transform coefficient */
				let coef: number;
				let samples: number[];
				let y: number, z: number, dy: number, top: number, left: number;
				for (z = 0; z < state.gridCells.length; z++) {
						cell = state.gridCells[z];
						coef = s.asSamples ? cell.sampleValueToPixel : cell.microvoltsToPixel;
						result.polylines[z] = new XPolyline([]);
						chIndex = s.leads.indexOf(cell.lead);
						if (chIndex < 0) continue;
						samples = s.channels[chIndex];
						points = new Array(samples.length);
						for (y = 0; y < samples.length; y++) {
								dy = Math.round(samples[y] * coef);
								left = cell.container.left + y;
								top = cell.invert ? (cell.container.midOy + dy) : (cell.container.midOy - dy);
								points[y] = new XPoint(left, top);
						}
						result.polylines[z].rebuild(points);
				}
				return result;
		}
}







//-------------------------------------------------------------------------------------------------
// Drawing primitives
//-------------------------------------------------------------------------------------------------
export class XDrawingPrimitive {
		zindex: number;
		state: XDrawingPrimitiveState;

		//-------------------------------------------------------------------------------------
		constructor() {
				this.zindex = 0;
				this.state = XDrawingPrimitiveState.Default;
		}

}

//-------------------------------------------------------------------------------------------------
// Drawing primitive state
//-------------------------------------------------------------------------------------------------
export enum XDrawingPrimitiveState {
		Default = 0,
		Activated,
		Selected,
		Hidden
}

//-------------------------------------------------------------------------------------------------
// Rectangle
//-------------------------------------------------------------------------------------------------
export class XRectangle extends XDrawingPrimitive {
		private _l: number = 0;
		private _t: number = 0;
		private _w: number = 0;
		private _h: number = 0;

		/** Rectangle start position on X axis in pixels. */
		public get left(): number { return this._l; }
		/** Rectangle start position on Y axis in pixels. */
		public get top(): number { return this._t; }
		/** Rectangle width in pixels. */
		public get width(): number { return this._w; }
		/** Rectangle height in pixels.  */
		public get height(): number { return this._h; }
		/** Returns copy of object. */
		public get clone(): XRectangle { return new XRectangle(this._l, this._t, this._w, this._h); }

		public get minOx(): number { return Math.min(this._l, this._l + this._w); }
		public get maxOx(): number { return Math.max(this._l, this._l + this._w); }
		public get minOy(): number { return Math.min(this._t, this._t + this._h); }
		public get maxOy(): number { return Math.max(this._t, this._t + this._h); }
		public get midOx(): number { return Math.floor(this._l + this._w / 2); }
		public get midOy(): number { return Math.floor(this._t + this._h / 2); }
		public set left(value: number) { this._l = value; }
		public set top(value: number) { this._t = value; }
		public set width(value: number) { this._w = value; }
		public set height(value: number) { this._h = value; }
		public get right(): number { return this._l + this._w; }
		public get bottom(): number { return this._t + this._h; }

		//-------------------------------------------------------------------------------------------------
		/**
		 * Rectangle constructor.
		 * @param t start position on Y axis in pixels
		 * @param l start position on X axis in pixels
		 * @param w width in pixels
		 * @param h height in pixels
		 */
		constructor(l: number, t: number, w: number, h: number) {
				super();
				this.init(l, t, w, h);
		}

		//-------------------------------------------------------------------------------------------------
		/**
		 * Check point in rectangle content.
		 * @param x point position on OX axis.
		 * @param y point position on OY axis.
		 */
		public containsPoint(x: number, y: number): boolean {
				return !this.checkHorizontalOverflow(x) && !this.checkVerticalOverflow(y);
		}

		//-------------------------------------------------------------------------------------------------
		public containsXPoint(point: XPoint): boolean {
				return this.containsPoint(point.left, point.top);
		}

		//-------------------------------------------------------------------------------------------------
		public checkHorizontalOverflow(x: number): boolean {
				return x < this.left || x > this.left + this.width;
		}

		//-------------------------------------------------------------------------------------------------
		public checkVerticalOverflow(y: number): boolean {
				return y < this.top || y > this.top + this.height;
		}

		//-------------------------------------------------------------------------------------------------
		/**
		 * Check point in rectangle content.
		 * @param x point position on OX axis.
		 * @param y point position on OY axis.
		 * returns:
		 * -1: point out of rectangle ranges
		 * 1: X>0, Y>0
		 * 2: X>0, Y<0
		 * 3: X<0, Y<0
		 * 4: X<0, Y>0
		 * 5: X>0, Y>0|Y<0
		 * 6: X<0, Y>0|Y<0
		 * 7: Y>0, X>0|X<0
		 * 8: Y<0, X>0|X<0
		 */
		public checkPoint(x: number, y: number, detailed: boolean = false, ox: boolean = false): number {
				if (!this.containsPoint(x, y)) return -1;
				let right: boolean = x > this.midOx;
				let top: boolean = y < this.midOy;
				if (detailed) {
						// check axis groups
						if (right && top) return 1;
						if (right && !top) return 2;
						if (!right && !top) return 3;
						if (!right && top) return 4;
				} else if (ox) {
						// check horizontal axis
						if (right) return 5;
						else return 6;
				} else {
						// check vertical axis
						if (top) return 7;
						else return 8;
				}
				return -1;
		}

		//-------------------------------------------------------------------------------------------------
		/**
		 * Rebuild rectangle
		 * @param t start position on Y axis in pixels
		 * @param l start position on X axis in pixels
		 * @param w width in pixels
		 * @param h height in pixels
		 */
		public rebuild(l: number, t: number, w: number, h: number) {
				this.init(l, t, w, h);
		}

		//-------------------------------------------------------------------------------------------------
		/**
		 * Init rectangle
		 * @param t start position on Y axis in pixels
		 * @param l start position on X axis in pixels
		 * @param w width in pixels
		 * @param h height in pixels
		 */
		private init(l: number, t: number, w: number, h: number) {
				this._l = l;
				this._t = t;
				this._w = w;
				this._h = h;
		}

		//-------------------------------------------------------------------------------------------------
		/**
		 * Convert time to pixel for rectangle.
		 * @param time position in milliseconds.
		 * @param rectangle max time in milliseconds.
		 */
		public timeToPixel(time: number, length: number): number {
				return time * this._w / length;
		}

		//-------------------------------------------------------------------------------------------------
		/**
		 * Convert pixel to time for rectangle.
		 * @param posX input OX position in pixels.
		 * @param rectangle max time in milliseconds.
		 */
		public pixelToTime(posX: number, length: number): number {
				return posX * length / this._w;
		}

		//-------------------------------------------------------------------------------------------------
		public insideLimit(outer: XRectangle, limit: number = 0): boolean {
				//limit = Math.abs(limit);
				let leftSide: boolean = this.minOx + limit >= outer.minOx; // limit < 0
				let rightSide: boolean = this.maxOx + limit <= outer.maxOx - 1; // limit > 0
				return leftSide && rightSide;
		}

		//-------------------------------------------------------------------------------------------------
		public limitActionPoint(action: XPoint, outer: XRectangle): XPoint {
				let l: number = action.left;
				let t: number = action.top;
				// horizontal limit
				// check min OX for action.left < 0
				// check max OX for action.left > 0
				// check max & min for action.left = 0
				if (action.left < 0) {
						l = Math.max(l, outer.minOx - this.minOx);
				} else if (action.left > 0) {
						l = Math.min(l, outer.maxOx - this.maxOx);
				}
				// vertical limit (not implemented)
				return new XPoint(l, t);
		}
}


//-------------------------------------------------------------------------------------------------
// Point
//-------------------------------------------------------------------------------------------------
export class XPoint extends XDrawingPrimitive {
		private _l: number = 0;
		private _t: number = 0;

		/** Point position on X axis in pixels. */
		public get left(): number { return this._l; }
		/** Point position on Y axis in pixels. */
		public get top(): number { return this._t; }
		/** Returns copy of object. */
		public get clone(): XPoint { return new XPoint(this._l, this._t); }
		/** Returns length. */
		public get length() { return Math.sqrt((this._l * this._l) + (this._t * this._t)); }

		//-------------------------------------------------------------------------------------------------
		/**
		 * Rectangle constructor.
		 * @param t position on Y axis in pixels
		 * @param l position on X axis in pixels
		 */
		constructor(l: number, t: number) {
				super();
				this.init(l, t);
		}

		//-------------------------------------------------------------------------------------------------
		/**
		 * Rebuild rectangle
		 * @param t position on Y axis in pixels
		 * @param l position on X axis in pixels
		 */
		public rebuild(l: number, t: number) {
				this.init(l, t);
		}

		//-------------------------------------------------------------------------------------------------
		/**
		 * Init rectangle
		 * @param t position on Y axis in pixels
		 * @param l position on X axis in pixels
		 */
		private init(l: number, t: number) {
				this._l = l;
				this._t = t;
		}

		//-------------------------------------------------------------------------------------------------
		/**
		 * Subsctraction result.
		 * @param point initial point.
		 */
		public subtract(point: XPoint): XPoint {
				return new XPoint(point.left - this._l, point.top - this._t);
		}

		//-------------------------------------------------------------------------------------------------
		public get horizontal(): boolean {
				return Math.abs(this._l) > Math.abs(this._t);
		}

		//-------------------------------------------------------------------------------------------------
		public get info(): string {
				return `xy (${this._l},${this._t})`;
		}
}

//-------------------------------------------------------------------------------------------------
// Line
//-------------------------------------------------------------------------------------------------
export class XLine extends XDrawingPrimitive {
		private _a: XPoint = null;
		private _b: XPoint = null;

		//--------------------------------------------------------------------------------------
		public get clone(): XLine {
				return new XLine(this._a, this._b);
		}

		//--------------------------------------------------------------------------------------
		public get start(): XPoint {
				return this._a;
		}

		//--------------------------------------------------------------------------------------
		public get center(): XPoint {
				return new XPoint(
						Math.floor((this._a.left + this._b.left) / 2),
						Math.floor((this._a.top + this._b.top) / 2)
				);
		}

		//--------------------------------------------------------------------------------------
		public get end(): XPoint { return this._b; }

		//--------------------------------------------------------------------------------------
		public get length(): number {
				return Math.round(
						Math.sqrt(
								(this._b.left - this._a.left) * (this._b.left - this._a.left) +
								(this._b.top - this._a.top) * (this._b.top - this._a.top)
						)
				);
		}

		//-------------------------------------------------------------------------------------------------
		constructor(a: XPoint, b: XPoint) {
				super();
				this.init(a, b);
		}

		//-------------------------------------------------------------------------------------------------
		public rebuild(a: XPoint, b: XPoint) {
				this.init(a, b);
		}

		//-------------------------------------------------------------------------------------------------
		public init(a: XPoint, b: XPoint) {
				this._a = a;
				this._b = b;
		}

}

//-------------------------------------------------------------------------------------------------
// Polyline 
//-------------------------------------------------------------------------------------------------
export class XPolyline extends XDrawingPrimitive {
		private _points: XPoint[];

		//-------------------------------------------------------------------------------------------------
		constructor(p: XPoint[]) {
				super();
				this.init(p);
		}

		//-------------------------------------------------------------------------------------------------
		public rebuild(p: XPoint[]) {
				this.init(p);
		}

		//-------------------------------------------------------------------------------------------------
		public init(p: XPoint[]) {
				this._points = [];
				this._points = p;
		}

}

//-------------------------------------------------------------------------------------------------
// Label in position
//-------------------------------------------------------------------------------------------------
export class XLabel {
		public position: XPoint;
		public container: XRectangle;
		public label: string;
}


//-------------------------------------------------------------------------------------------------
// Peak with line and label in position
//-------------------------------------------------------------------------------------------------
export class XPeak extends XDrawingPrimitive {
		public container: XRectangle;
		public label: XLabel;
		public line: XLine;
}





//-------------------------------------------------------------------------------------------------
// Drawing data
//-------------------------------------------------------------------------------------------------
//export class XDrawingData {

//}


import { ElementRef } from "@angular/core";
//-------------------------------------------------------------------------------------------------
// Canvas tool
//-------------------------------------------------------------------------------------------------
export class XCanvasTool {

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
}
