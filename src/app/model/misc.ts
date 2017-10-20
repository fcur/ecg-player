// -------------------------------------------------------------------------------------------------
// Drawing mode
// -------------------------------------------------------------------------------------------------
export enum XDrMode {
		Canvas = 0,
		SVG,
		Mix
}

// -------------------------------------------------------------------------------------------------
// Drawing client
// -------------------------------------------------------------------------------------------------
export class XDrClient {
		public mode: XDrMode;

		public draw() {

		}

}





// -------------------------------------------------------------------------------------------------
// Drawing change
// -------------------------------------------------------------------------------------------------
export class XDrChange {
		public prevState: XDrProxyState;
		public curState: XDrProxyState;

		constructor() {

		}

}

// -------------------------------------------------------------------------------------------------
// Drawing proxy state
// -------------------------------------------------------------------------------------------------
export class XDrProxyState {
		//devicePixelRatio = window.devicePixelRatio


		public timestamp: number;

		/** Samples to pixel convertion MUL coeficient. */
		public sampleToPixelRatio: number
		/** Samples to time convertion MUL coeficient. */
		public sampleToTimeRatio: number;
		/** Scale coeficient 1X1. */
		public scale: number = 1;
		/** Absolute surfce left offset in pixels. */
		public skipPx: number;
		/** Absolute surfce width in pixels. */
		public limitPx: number;

		/** Surface relative position.*/
		public container: XRectangle;
		/** Pixels in millimeter MUL coeficient . */
		public apxmm: number;
		/** Maximum declared sample value. */
		public maxSample: number;

		/** Maximum/minimum visible (calculated) sample value. */
		public signalSamplesClip: number;
		/** Maximum/minimum visible (calculated) sample value in microvolts. */
		public signalMicrovoltsClip: number; // signalClip

		/** Signal sample rate.*/
		public sampleRate: number;
		/** Enable development mode.*/
		public devMode: boolean;
		/** Maximum sample value in microvolts from input signal. */
		public signalScale: number;


		//-------------------------------------------------------------------------------------------------
		constructor() {
				this.timestamp = Date.now();            // drawing proxy state creation time
				this.signalScale = 5000;                // from input signal
				this.signalMicrovoltsClip = 5000;       // from settings
				this.maxSample = 32767;                 // from input signal



				this.signalSamplesClip = Math.floor(this.maxSample * this.signalMicrovoltsClip / this.signalScale);


				this.apxmm = 3;




		}



}


// -------------------------------------------------------------------------------------------------
// Drawing object
// -------------------------------------------------------------------------------------------------
export class XDrObject {
		public owner: XDrClient;
		public contsainer: XRectangle;
}




//-------------------------------------------------------------------------------------------------
// Rectangle
//-------------------------------------------------------------------------------------------------
export class XRectangle {
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
export class XPoint {
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
export class XLine {
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
