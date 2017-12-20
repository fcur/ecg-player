
import {
	FPointDrawingObject, GridCellDrawingObject,
	ClPointDrawingObject, CellDrawingObject,
	XDrawingObjectType, AnsDrawingObject,
	BeatsDrawingObject, IDrawingObject,
	XDrawingObject, SignalDrawingObject
} from "./drawingobject";
import {
	EcgWavePoint, EcgWavePointType, EcgAnnotation, EcgSignal,
	EcgAnnotationCode, EcgLeadCode, EcgRecord
} from "./ecgdata"
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

	/** Prepare drawing objects. */
	prepareAllDrawings(data: DrawingData, state: XDrawingProxyState): IDrawingObject[];
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

	//-------------------------------------------------------------------------------------
	public prepareAllDrawings(data: DrawingData, state: XDrawingProxyState): IDrawingObject[] {
		return [];
	}

}

// -------------------------------------------------------------------------------------------------
// Annotations drawing client
// -------------------------------------------------------------------------------------------------
export class AnsDrawingClient extends XDrawingClient {

	// TODO: prepare static annotation containers, do not create drawing object for each browser input event

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

	//-------------------------------------------------------------------------------------
	public prepareAllDrawings(data: DrawingData, state: XDrawingProxyState): AnsDrawingObject[] {
		console.info("prepareDrawings2", "not implemented");
		return [];
	}
}


// -------------------------------------------------------------------------------------------------
// Beats drawing client
// -------------------------------------------------------------------------------------------------
export class BeatsDrawingClient extends XDrawingClient {
	radius: number;
	color: string;
	opacity: number;
	//-------------------------------------------------------------------------------------
	constructor() {
		super();
		this.radius = 2;
		this.color = "orange";
		this.opacity = 1;
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
		// TODO: handle space between records
		if (!data.headers.hasOwnProperty(state.sampleRate) || !data.data.hasOwnProperty(state.sampleRate) || !data.data[state.sampleRate]) return [];

		let z: number, y: number, x: number;
		let start: number, limit: number, end: number, cellRecordStart: number;
		let results: BeatsDrawingObject[] = new Array();
		let headers: RecordProjection[] = data.getHeaders(state.skipPx, state.limitPx, state.sampleRate);
		let beats: { [lead: number]: XPoint[] }, beatsPoints: XPoint[], curPoint: XPoint;
		for (z = 0; z < state.gridCells.length; z++) {
			// DrawingObject for each XDrawingCell
			results[z] = new BeatsDrawingObject();
			results[z].owner = this;
			results[z].cellIndex = z;
			results[z].index = z;
			results[z].container = state.gridCells[z].container.clone;
			results[z].container.resetStart();
			results[z].points = new Array();
			for (y = 0, cellRecordStart = 0; y < headers.length; y++) {
				beats = data.data[state.sampleRate][headers[y].id].beats;
				start = state.minPx - headers[y].startPx; // from this position (pixels)
				end = Math.min(headers[y].endPx, state.maxPx); // until this position (pixels)
				limit = end - start;
				beatsPoints = beats[state.gridCells[z].lead];
				for (x = 0; x < beatsPoints.length; x++) {
					if (beatsPoints[x].left < start) continue;
					if (beatsPoints[x].left > end) break;
					// calc projection on state range in pixels
					curPoint = beatsPoints[x].clone;
					curPoint.left = curPoint.left - start;
					results[z].points.push(curPoint);
					//results[z].points
				}
				cellRecordStart += limit;
			}
		}
		return results;
	}

	//-------------------------------------------------------------------------------------
	public prepareAllDrawings(data: DrawingData, state: XDrawingProxyState): BeatsDrawingObject[] {
		console.info("prepareDrawings2", "not implemented");
		return [];
	}

}

// -------------------------------------------------------------------------------------------------
// Grid cell drawing glient
// -------------------------------------------------------------------------------------------------
export class GridCellDrawingClient extends XDrawingClient {

	color: string;
	opacity: number;
	lineJoin: string;


	//-------------------------------------------------------------------------------------
	constructor() {
		super();
		this.color = "#00c12e";
		this.opacity = 0.5;
		this.lineJoin = "miter";// round|miter|bevel
		this.mode = XDrawingMode.Canvas;
		this.type = XDrawingObjectType.Grid;
		this.draw = this.drawGrid.bind(this);
		this.afterDraw = this.afterDrawGrid.bind(this);
		this.createDrawingObject = this.createGridDrawingObject.bind(this);
	}

	//-------------------------------------------------------------------------------------
	public drawGrid() {
		console.info("drawGrid", "not implemented");
	}

	//-------------------------------------------------------------------------------------
	public afterDrawGrid() {
		console.info("afterDrawGrid", "not implemented");
	}

	//-------------------------------------------------------------------------------------
	public createGridDrawingObject(): GridCellDrawingObject {
		console.info("createGridDrawingObject", "not implemented");
		let result: GridCellDrawingObject = new GridCellDrawingObject();

		return result;
	}


	//-------------------------------------------------------------------------------------
	public prepareDrawings(data: DrawingData, state: XDrawingProxyState): GridCellDrawingObject[] {
		let z: number, y: number, x: number;
		let results: GridCellDrawingObject[] = new Array(state.gridCells.length);

		let borderPoints: XPoint[];
		let axisPoints: XPoint[];
		for (z = 0; z < state.gridCells.length; z++) {
			results[z] = new GridCellDrawingObject();
			results[z].owner = this;
			results[z].cellIndex = z;
			results[z].index = z;
			results[z].container = state.gridCells[z].container.clone;
			results[z].left = state.skipPx;
			// TODO: return container borders as lines
			// border
			borderPoints = [
				new XPoint(state.gridCells[z].container.minOx, state.gridCells[z].container.minOy),
				new XPoint(state.gridCells[z].container.maxOx, state.gridCells[z].container.minOy),
				new XPoint(state.gridCells[z].container.maxOx, state.gridCells[z].container.maxOy),
				new XPoint(state.gridCells[z].container.minOx, state.gridCells[z].container.maxOy),
				new XPoint(state.gridCells[z].container.minOx, state.gridCells[z].container.minOy)
			];
			// OX axis
			axisPoints = [
				new XPoint(state.gridCells[z].container.minOx, state.gridCells[z].container.midOy),
				new XPoint(state.gridCells[z].container.maxOx, state.gridCells[z].container.midOy)
			];
			results[z].polylines = [new XPolyline(borderPoints), new XPolyline(axisPoints)];
			results[z].container.resetStart();
		}
		return results;
	}


	//-------------------------------------------------------------------------------------
	public prepareAllDrawings(data: DrawingData, state: XDrawingProxyState): GridCellDrawingObject[] {
		return this.prepareDrawings(data, state);
	}

}


// -------------------------------------------------------------------------------------------------
// Signal drawing glient
// -------------------------------------------------------------------------------------------------
export class SignalDrawingClient extends XDrawingClient {

	color: string;
	opacity: number;
	lineJoin: string;

	/** Minimum milliseconds count between two records */
	recordsThreshold: number;
	recordSpace: number; // count of pixels between two records with  
	layoutSpace: number; // count of pixels between two grid layouts

	//-------------------------------------------------------------------------------------
	constructor() {
		super();
		this.color = "#0e9aff";
		this.recordsThreshold = 0;
		this.recordSpace = 10;
		this.layoutSpace = 30;
		this.opacity = 1;
		this.lineJoin = "miter";// round|miter|bevel
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
	public createSignalDrawingObject(): SignalDrawingObject {
		console.info("createSignalDrawingObject", "not implemented");
		let result: SignalDrawingObject = new SignalDrawingObject();

		return result;
	}


	//-------------------------------------------------------------------------------------
	public prepareDrawings(data: DrawingData, state: XDrawingProxyState): SignalDrawingObject[] {
		// TODO: handle space between records
		if (!data.headers.hasOwnProperty(state.sampleRate) || !data.data.hasOwnProperty(state.sampleRate) || !data.data[state.sampleRate]) return [];

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

				signal = data.data[state.sampleRate][headers[y].id].signal;
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

	//-------------------------------------------------------------------------------------
	public prepareAllDrawings(dd: DrawingData, ps: XDrawingProxyState): SignalDrawingObject[] {
		// TODO: add drawings merge method (example: signal for other leads)
		if (!dd.headers.hasOwnProperty(ps.sampleRate) || !dd.data.hasOwnProperty(ps.sampleRate) || !dd.data[ps.sampleRate]) return [];

		let recData: RecordDrawingData,
			recProj: RecordProjection,
			leadCode: EcgLeadCode,
			z: number;
		let results: SignalDrawingObject[] = new Array();
		let headObjs: { [recordId: string]: RecordProjection } = dd.headers[ps.sampleRate];
		// record >> signal drawing object
		// drawing object >> XPolyline[] >> polylines[channels.length] (channel=lead)
		let drawObj: SignalDrawingObject;
		/**  record data left position in pixels. */
		let recLeftPos: number = 0;

		for (let recId in headObjs) {
			if (!headObjs.hasOwnProperty(recId)) continue;
			recProj = headObjs[recId];
			recData = dd.data[ps.sampleRate][recId];

			drawObj = new SignalDrawingObject();
			drawObj.owner = this;
			drawObj.prepareLeads(recData.leads);
			drawObj.index = -1; // do not index
			drawObj.cellIndex = -1; // do not cell index
			// do not use container [height] and [top position]
			drawObj.container = new XRectangle(recLeftPos, 0, recProj.limitPixels, 0);
			for (z = 0; z < drawObj.leadCodes.length; z++) {
				leadCode = drawObj.leadCodes[z];
				if (!recData.signal.hasOwnProperty(leadCode)) continue;
				drawObj.polylines[z] = new XPolyline(recData.signal[leadCode]);
			}
			results.push(drawObj);

			// TODO: merge recordSpace&layoutSpace
			recLeftPos += this.layoutSpace + recProj.limitPixels;
		}
		return results;
	}

}



// -------------------------------------------------------------------------------------------------
// Clickable point drawing client
// -------------------------------------------------------------------------------------------------
export class ClickablePointDrawingClient extends XDrawingClient {

	//-------------------------------------------------------------------------------------
	constructor() {
		super();
		this.mode = XDrawingMode.Canvas;
		this.type = XDrawingObjectType.Signal;
		this.draw = this.drawPonint.bind(this);
		this.afterDraw = this.afterDrawPoint.bind(this);
		this.createDrawingObject = this.createPointDrawingObject.bind(this);
	}

	//-------------------------------------------------------------------------------------
	public drawPonint() {
		console.info("drawPonint", "not implemented");
	}

	//-------------------------------------------------------------------------------------
	public afterDrawPoint() {
		console.info("afterDrawPoint", "not implemented");
	}

	//-------------------------------------------------------------------------------------
	public createPointDrawingObject(): ClPointDrawingObject {
		console.info("createPointDrawingObject", "not implemented");
		let result: ClPointDrawingObject = new ClPointDrawingObject();
		return result;
	}

	//-------------------------------------------------------------------------------------
	public prepareDrawings(data: DrawingData, state: XDrawingProxyState): ClPointDrawingObject[] {
		// TODO: handle space between records
		let results: ClPointDrawingObject[] = new Array();
		let headers: RecordProjection[] = data.getHeaders(state.skipPx, state.limitPx, state.sampleRate);
		return results;
	}
}


// -------------------------------------------------------------------------------------------------
// Cell grid drawing client
// -------------------------------------------------------------------------------------------------
export class CellDrawingClient extends XDrawingClient {

	color: string;
	opacity: number;

	//-------------------------------------------------------------------------------------
	constructor() {
		super();
		this.mode = XDrawingMode.Canvas;
		this.type = XDrawingObjectType.Signal;
		this.draw = this.drawCell.bind(this);
		this.afterDraw = this.afterDrawCell.bind(this);
		this.createDrawingObject = this.createCellDrawingObject.bind(this);
	}

	//-------------------------------------------------------------------------------------
	public drawCell() {
		console.info("drawCell", "not implemented");
	}

	//-------------------------------------------------------------------------------------
	public afterDrawCell() {
		console.info("afterDrawCell", "not implemented");
	}

	//-------------------------------------------------------------------------------------
	public createCellDrawingObject(): CellDrawingObject {
		console.info("createCellDrawingObject", "not implemented");
		let result: CellDrawingObject = new CellDrawingObject();
		return result;
	}



	//-------------------------------------------------------------------------------------
	public prepareDrawings(data: DrawingData, state: XDrawingProxyState): CellDrawingObject[] {
		let results: CellDrawingObject[] = new Array();

		return results;
	}

}


// -------------------------------------------------------------------------------------------------
// Floating point drawing client
// -------------------------------------------------------------------------------------------------
export class FPointDrawingClient extends XDrawingClient {
	// floating point for each cell and vertical line
	lineColor: string;
	opacity: number;
	pointColor: string;
	pointRadius: number;
	clientHalfWidth: number;



	//-------------------------------------------------------------------------------------
	constructor() {
		super();
		this.clientHalfWidth = 4;
		this.pointColor = "red";
		this.lineColor = "#ccc";
		this.opacity = 1;
		this.clientHalfWidth = 3;
		this.pointRadius = 3;
		this.mode = XDrawingMode.Canvas;
		this.type = XDrawingObjectType.Object;
		this.draw = this.drawFPoint.bind(this);
		this.afterDraw = this.afterDrawFPoint.bind(this);
		this.createDrawingObject = this.createFPointDrawingObject.bind(this);
	}

	//-------------------------------------------------------------------------------------
	public drawFPoint() {
		console.info("drawFPoint", "not implemented");
	}

	//-------------------------------------------------------------------------------------
	public afterDrawFPoint() {
		console.info("afterDrawFPoint", "not implemented");
	}

	//-------------------------------------------------------------------------------------
	public createFPointDrawingObject(): FPointDrawingObject {
		console.info("createFPointDrawingObject", "not implemented");
		let result: FPointDrawingObject = new FPointDrawingObject();
		return result;
	}



	//-------------------------------------------------------------------------------------
	public prepareDrawings(data: DrawingData, state: XDrawingProxyState): FPointDrawingObject[] {
		if (!data.headers.hasOwnProperty(state.sampleRate) || !data.data.hasOwnProperty(state.sampleRate) || !data.data[state.sampleRate]) return [];

		let obj = new FPointDrawingObject();
		obj.container = new XRectangle(state.pointerX - this.clientHalfWidth, 0, this.clientHalfWidth * 2, state.container.height);

		let lineHeight: number = state.gridCells[state.gridCells.length - 1].container.maxOy -
			state.gridCells[0].container.minOy;

		let vertLine: XLine = new XLine(
			new XPoint(state.pointerX, 0),
			new XPoint(state.pointerX, lineHeight)
		);
		obj.lines = [vertLine];
		obj.points = new Array(state.gridCells.length);
		// TODO move to state getter
		let header: RecordProjection = data.getHeader(state.skipPx + state.pointerX, state.sampleRate);
		let signalPoints: XPoint[];
		for (let z: number = 0; z < state.gridCells.length; z++) {
			signalPoints = data.data[state.sampleRate][header.id].signal[state.gridCells[z].lead];
			obj.points[z] = new XPoint(state.pointerX, signalPoints[state.skipPx + state.pointerX].top);
		}
		//results.push(obj);
		return [obj];
	}


	//-------------------------------------------------------------------------------------
	public prepareAllDrawings(data: DrawingData, state: XDrawingProxyState): FPointDrawingObject[] {
		console.info("prepareDrawings2", "not implemented");
		return [];
	}
}
