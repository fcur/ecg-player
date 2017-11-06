
import {
	XDrawingObjectType, AnsDrawingObject,
	BeatsDrawingObject, IDrawingObject,
	XDrawingObject, SignalDrawingObject
} from "./drawingobject";

import {
	DrawingData, RecordDrawingData,
	RecordProjection
} from "./drawingdata";
import { XDrawingProxyState } from "./misc";
import {
	XDrawingPrimitive, XDrawingPrimitiveState,
	XLabel, XPeak, XPoint, XLine, XRectangle,
	XPolyline
} from "./geometry";

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
	/** Create drawing object factory method. */
	createDrawingObject: Function;
	/** Prepare drawing objects. */
	prepareDrawings(data: DrawingData, state: XDrawingProxyState): IDrawingObject[];

	drawObjects: Function;

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
	/** Create drawing object factory method. */
	createDrawingObject: Function;
	/** Client groups drawing method (required). */
	drawObjects: Function;
	//-------------------------------------------------------------------------------------
	public prepareDrawings(data: DrawingData, state: XDrawingProxyState): IDrawingObject[] {
		return [];
	}

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
		this.createDrawingObject = this.createAnsDrawingObject.bind(this);
	}

	//-------------------------------------------------------------------------------------
	public drawAnnotations(p1: number, p2: number, p3: string) {
		console.info("drawAnnotations", "not implemented");
	}

	//-------------------------------------------------------------------------------------
	public afterdrawAnnotations() {
		console.info("afterdrawAnnotations", "not implemented");
	}

	//-------------------------------------------------------------------------------------
	public createAnsDrawingObject(): AnsDrawingObject {
		console.info("createAnsDrawingObject", "not implemented");
		let result: AnsDrawingObject = new AnsDrawingObject();

		return result;
	}

	//-------------------------------------------------------------------------------------
	public prepareDrawings(data: DrawingData, state: XDrawingProxyState): AnsDrawingObject[] {
		console.info("prepareDrawings", "not implemented");
		let ansDrawObj: AnsDrawingObject[] = new Array();
		ansDrawObj.push(new AnsDrawingObject());
		ansDrawObj[0].owner = this;
		return ansDrawObj;
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
		this.createDrawingObject = this.createBeatsDrawingObject.bind(this);
	}

	//-------------------------------------------------------------------------------------
	public drawBeats(p1: number[], p2: number, p3: string[]) {
		console.info("drawBeats", "not implemented");
	}

	//-------------------------------------------------------------------------------------
	public afterDrawBeats() {
		console.info("afterDrawBeats", "not implemented");
	}


	//-------------------------------------------------------------------------------------
	public createBeatsDrawingObject(): BeatsDrawingObject {
		console.info("createBeatsDrawingObject", "not implemented");
		let result: BeatsDrawingObject = new BeatsDrawingObject();

		return result;
	}

	//-------------------------------------------------------------------------------------
	public prepareDrawings(data: DrawingData, state: XDrawingProxyState): BeatsDrawingObject[] {
		console.info("prepareDrawings", "not implemented");
		let beatsDrawObj: BeatsDrawingObject[] = new Array();
		beatsDrawObj.push(new BeatsDrawingObject());
		beatsDrawObj[0].owner = this;
		return beatsDrawObj;
	}

}


// -------------------------------------------------------------------------------------------------
// Signal drawing glient
// -------------------------------------------------------------------------------------------------
export class SignalDrawingClient extends XDrawingClient {

	//-------------------------------------------------------------------------------------
	constructor() {
		super();
		this.mode = XDrawingMode.Canvas;
		this.type = XDrawingObjectType.Signal;
		this.draw = this.drawSignal.bind(this);
		this.afterDraw = this.afterDrawSignal.bind(this);
		this.createDrawingObject = this.createSignalDrawingObject.bind(this);
	}

	//-------------------------------------------------------------------------------------
	public drawSignal() {
		console.info("drawSignal", "not implemented");
	}

	//-------------------------------------------------------------------------------------
	public afterDrawSignal() {
		console.info("afterDrawSignal", "not implemented");
	}

	//-------------------------------------------------------------------------------------
	public createSignalDrawingObject(): XDrawingObject {
		console.info("createSignalDrawingObject", "not implemented");
		let result: XDrawingObject = new XDrawingObject();

		return result;
	}


	//-------------------------------------------------------------------------------------
	public prepareDrawings(data: DrawingData, state: XDrawingProxyState): SignalDrawingObject[] {
		// TODO: handle space between records
		if (!data.headers.hasOwnProperty(state.sampleRate) || !data.dataV2.hasOwnProperty(state.sampleRate) || !data.dataV2[state.sampleRate]) return [];

		let signal: { [lead: number]: XPoint[] }, signalPoints: XPoint[], points: XPoint[];
		let start: number, limit: number, end: number, cellRecordStart: number;
		let z: number, y: number, x: number;

		let results: SignalDrawingObject[] = new Array(state.gridCells.length);
		let headers: RecordProjection[] = data.getHeaders(state.skipPx, state.limitPx, state.sampleRate);

		for (z = 0; z < state.gridCells.length; z++) {
			// DrawingObject for each XDrawingCell
			results[z] = new SignalDrawingObject();
			results[z].owner = this;
			results[z].cellIndex = z;
			results[z].index = z;
			results[z].polylines = new Array();
			results[z].container = state.gridCells[z].container.clone;
			results[z].container.resetStart();

			for (y = 0, cellRecordStart = 0; y < headers.length; y++) {

				signal = data.dataV2[state.sampleRate][headers[y].id].signal;
				start = state.minPx - headers[y].startPx; // from this position
				end = Math.min(headers[y].endPx, state.maxPx); // until this position
				limit = end - start;
				signalPoints = signal[state.gridCells[z].lead];
				points = new Array(limit);
				for (x = 0; x < limit; x++) {
					points[x] = signalPoints[x + start].clone;
					points[x].left = x;
				}
				results[z].polylines.push(new XPolyline(points));
				cellRecordStart += limit;
			}
		}
		return results;
	}

}

