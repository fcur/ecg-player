
import { XDrawingObjectType } from "./drawingobject";

// -------------------------------------------------------------------------------------------------
// Drawing mode
// -------------------------------------------------------------------------------------------------
export enum XDrawingMode {
	Canvas = 0,
	SVG,
	Mix
}


// -------------------------------------------------------------------------------------------------
// Drawing client interface
// -------------------------------------------------------------------------------------------------
export interface IDrawingClient {
	/** Drawing mode (required). */
	mode: XDrawingMode;
	/** Object type (required). */
	type: XDrawingObjectType;
	/** Client drawing method (required). */
	draw: Function;
	/** Init drawing client (required). */
	init: Function;
	/** After view init drawing method (optional). */
	afterDraw?: Function;
}


// -------------------------------------------------------------------------------------------------
// Default drawing client (without drawing methods).
// -------------------------------------------------------------------------------------------------
export class XDrawingClient implements IDrawingClient {
	/** Drawing mode */
	mode: XDrawingMode;
	/** Object type. */
	type: XDrawingObjectType;
	 /** Client drawing method (required). */
	draw: Function;
	/** Init drawing client (required). */
	 init: Function;
	 /** After view init drawing method (optional). */
	afterDraw: Function;


}

// -------------------------------------------------------------------------------------------------
// Annotations drawing client
// -------------------------------------------------------------------------------------------------
export class AnsDrawingClient extends XDrawingClient {

		//-------------------------------------------------------------------------------------
		constructor() {
			super();
			this.mode = XDrawingMode.Canvas;
			this.type = XDrawingObjectType.Annotations;
			this.draw = this.drawAnnotations.bind(this);
			this.afterDraw = this.afterdrawAnnotations.bind(this);
		}

		//-------------------------------------------------------------------------------------
		public drawAnnotations(p1: number, p2: number, p3: string) {
			console.info("drawAnnotations", "not implemented");
		}

		//-------------------------------------------------------------------------------------
		public afterdrawAnnotations(){
			console.info("afterdrawAnnotations", "not implemented");
		}


}


// -------------------------------------------------------------------------------------------------
// Beats drawing client
// -------------------------------------------------------------------------------------------------
export class BeatsDrawingClient extends XDrawingClient {

	//-------------------------------------------------------------------------------------
	constructor() {
		super();
		this.mode = XDrawingMode.Canvas;
		this.type = XDrawingObjectType.Beats;
		this.draw = this.drawBeats.bind(this);
		this.afterDraw = this.afterDrawBeats.bind(this);
	}

		//-------------------------------------------------------------------------------------
		public drawBeats(p1: number[], p2: number, p3: string[]) {
			console.info("drawBeats", "not implemented");
		}

		//-------------------------------------------------------------------------------------
		public afterDrawBeats(){
			console.info("afterDrawBeats", "not implemented");
		}
}
