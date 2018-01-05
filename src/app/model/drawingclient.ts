
import {
	WavepointDrawingObject, CursorDrawingObject, GridCellDrawingObject,
	ClPointDrawingObject, CellDrawingObject, BeatsRangeDrawingObject,
	IDrawingObject, XDrawingObjectType, AnsDrawingObject,
	XDrawingObject, SignalDrawingObject,
	PeakDrawingObject, WaveDrawingObject
} from "./drawingobject";
import {
	EcgWavePoint, EcgWavePointType, EcgAnnotation, EcgSignal,
	EcgAnnotationCode, EcgLeadCode, EcgRecord
} from "./ecgdata"
import {
	DrawingData, RecordDrawingData, RecordProjection
} from "./drawingdata";
import {
	XDrawingChange, XDrawingChangeSender, XDrawingCoordinates,
	XDrawingProxyState, XCanvasTool, XDrawingCell,
	XDrawingGridMode
} from "./misc";
import {
	XDrawingPrimitive, XDrawingPrimitiveState, XLabel, XPeak,
	XPoint, XLine, XRectangle, XPolyline
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
	/** Minimum milliseconds count between two records */
	recordsThreshold: number;
	/** Count of pixels between two records with. */
	recordSpace: number;
	/** Count of pixels between two grid layouts. */
	layoutSpace: number;
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
	/** Client groups drawing method (required). */
	drawObjects: Function;
	/** Client groups drawing method F3(required). */
	drawObjectsF3: Function;
	/** Prepare drawing objects. */
	prepareAllDrawings(data: DrawingData, state: XDrawingProxyState): IDrawingObject[];
	/** Draw client drawing objects. */
	render(obj: IDrawingObject[], st: XDrawingProxyState, ct: XCanvasTool);

	// add mouse/touch events handlers

}


// -------------------------------------------------------------------------------------------------
// Default drawing client (without drawing methods).
// -------------------------------------------------------------------------------------------------
export class XDrawingClient implements IDrawingClient {

	/** Minimum milliseconds count between two records */
	public recordsThreshold: number;
	/** Count of pixels between two records with. */
	public recordSpace: number;
	/** Count of pixels between two grid layouts. */
	public layoutSpace: number;
	/** Drawing mode */
	public mode: XDrawingMode;
	/** Object type. */
	public type: XDrawingObjectType;
	/** Client drawing method (required). */
	public draw: Function;
	/** Init drawing client (required). */
	public init: Function;
	/** After view init drawing method (optional). */
	public afterDraw: Function;
	/** Create drawing object factory method. */
	public createDrawingObject: Function;
	/** Client groups drawing method (required). */
	public drawObjects: Function;
	/** Client groups drawing method F3(required). */
	public drawObjectsF3: Function;


	//-------------------------------------------------------------------------------------
	constructor() {
		this.recordsThreshold = 0;
		this.recordSpace = 10;
		this.layoutSpace = 30;
	}



	//-------------------------------------------------------------------------------------
	public prepareDrawings(data: DrawingData, state: XDrawingProxyState): IDrawingObject[] {
		return [];
	}

	//-------------------------------------------------------------------------------------
	public prepareAllDrawings(data: DrawingData, state: XDrawingProxyState): IDrawingObject[] {
		return [];
	}

	/** Draw client drawing objects. */
	public render(obj: IDrawingObject[], st: XDrawingProxyState, ct: XCanvasTool) {

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
		console.info("AnsDrawingClient.drawAnnotations", "not implemented");
	}

	//-------------------------------------------------------------------------------------
	public afterdrawAnnotations() {
		console.info("AnsDrawingClient.afterdrawAnnotations", "not implemented");
	}

	//-------------------------------------------------------------------------------------
	public createAnsDrawingObject(): AnsDrawingObject {
		console.info("AnsDrawingClient.createAnsDrawingObject", "not implemented");
		let result: AnsDrawingObject = new AnsDrawingObject();

		return result;
	}

	//-------------------------------------------------------------------------------------
	public prepareDrawings(data: DrawingData, state: XDrawingProxyState): AnsDrawingObject[] {
		console.info("AnsDrawingClient.prepareDrawings", "not implemented");
		let ansDrawObj: AnsDrawingObject[] = new Array();
		ansDrawObj.push(new AnsDrawingObject());
		ansDrawObj[0].owner = this;
		return ansDrawObj;
	}

	//-------------------------------------------------------------------------------------
	public prepareAllDrawings(data: DrawingData, state: XDrawingProxyState): AnsDrawingObject[] {
		console.info("AnsDrawingClient.prepareAllDrawings", "not implemented");
		return [];
	}
}


// -------------------------------------------------------------------------------------------------
// Beats drawing client
// -------------------------------------------------------------------------------------------------
export class BeatsDrawingClient extends XDrawingClient {

	radius: number;
	color: string;
	colorF3: string;
	opacity: number;

	backgroundColor1: string;
	backgroundColor2: string;
	backgroundOpacity: number;

	/** Minimum milliseconds count between two records */
	recordsThreshold: number;
	recordSpace: number; // count of pixels between two records with  
	layoutSpace: number; // count of pixels between two grid layouts

	//-------------------------------------------------------------------------------------
	constructor() {
		super();
		this.radius = 2;
		this.color = "orange";
		this.colorF3 = "#00f8cd";
		this.backgroundOpacity = 0.15;
		this.backgroundColor1 = "#00355d";
		this.backgroundColor2 = "#485400";
		this.recordsThreshold = 0;
		this.recordSpace = 10;
		this.layoutSpace = 30;
		this.opacity = 1;
		this.mode = XDrawingMode.Canvas;
		this.type = XDrawingObjectType.Beats;
		this.draw = this.drawBeats.bind(this);
		this.afterDraw = this.afterDrawBeats.bind(this);
		this.createDrawingObject = this.createBeatsDrawingObject.bind(this);
	}

	//-------------------------------------------------------------------------------------
	public drawBeats(p1: number[], p2: number, p3: string[]) {
		//console.info("BeatsDrawingClient.drawBeats", "not implemented");
	}

	//-------------------------------------------------------------------------------------
	public afterDrawBeats() {
		console.info("BeatsDrawingClient.afterDrawBeats", "not implemented");
	}


	//-------------------------------------------------------------------------------------
	public createBeatsDrawingObject(): BeatsRangeDrawingObject {
		console.info("BeatsDrawingClient.createBeatsDrawingObject", "not implemented");
		let result: BeatsRangeDrawingObject = new BeatsRangeDrawingObject();

		return result;
	}

	//-------------------------------------------------------------------------------------
	public prepareDrawings(data: DrawingData, state: XDrawingProxyState): BeatsRangeDrawingObject[] {
		// TODO: handle space between records
		if (!data.headers.hasOwnProperty(state.sampleRate) || !data.data.hasOwnProperty(state.sampleRate) || !data.data[state.sampleRate]) return [];

		let z: number, y: number, x: number;
		let start: number, limit: number, end: number, cellRecordStart: number;
		let results: BeatsRangeDrawingObject[] = new Array();
		let headers: RecordProjection[] = data.getHeaders(state.skipPx, state.limitPx, state.sampleRate);
		let beats: { [lead: number]: XPoint[] }, beatsPoints: XPoint[], curPoint: XPoint;
		for (z = 0; z < state.gridCells.length; z++) {
			// DrawingObject for each XDrawingCell
			results[z] = new BeatsRangeDrawingObject();
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
	public prepareAllDrawings(dd: DrawingData, ps: XDrawingProxyState): BeatsRangeDrawingObject[] {
		// TODO: add drawings merge method (example: signal for other leads)
		if (!dd.headers.hasOwnProperty(ps.sampleRate) || !dd.data.hasOwnProperty(ps.sampleRate) || !dd.data[ps.sampleRate]) return [];

		let recData: RecordDrawingData,
			recProj: RecordProjection,
			leadCode: EcgLeadCode,
			prewBeatLeft: number,
			nextBeatLeft: number,
			curBeatLeft: number,
			beatsCount: number,
			left: number,
			width: number,
			y: number,
			z: number;

		let results: BeatsRangeDrawingObject[] = new Array();
		let headObjs: { [recordId: string]: RecordProjection } = dd.headers[ps.sampleRate];
		// record >> beats drawing object
		// drawing object >> XPolyline[] >> polylines[channels.length] (channel=lead)
		let drawObj: BeatsRangeDrawingObject;
		/**  record data left position in pixels. */
		let recLeftPos: number = 0;
		/** Last record milliseconds end value. */
		let lastRecMs: number = 0;

		for (let recId in headObjs) {
			if (!headObjs.hasOwnProperty(recId)) continue;
			recProj = headObjs[recId];
			recData = dd.data[ps.sampleRate][recId];

			beatsCount = recData.beats[recData.leads[0]].length;
			if (beatsCount < 2) continue; // we need 2+ (sample indexes) for drawing object

			// merge recordSpace&layoutSpace
			if (lastRecMs != 0) {
				if (recProj.endMs - lastRecMs > this.recordsThreshold)
					recLeftPos += this.layoutSpace;
				else
					recLeftPos += this.recordSpace;
			}

			// z - beat index
			// (beatsCount-1) - count of drawing objects
			for (z = 0; z < beatsCount; z++) {
				drawObj = new BeatsRangeDrawingObject();
				drawObj.owner = this;
				drawObj.prepareLeads(recData.leads);
				// prepare beats points
				for (y = 0; y < drawObj.leadCodes.length; y++) {
					leadCode = drawObj.leadCodes[y];
					drawObj.points[y] = recData.beats[leadCode][z];
				}

				curBeatLeft = recData.beats[leadCode][z].left;
				if (z > 0 && z < beatsCount - 1) {
					prewBeatLeft = recData.beats[leadCode][z - 1].left;
					nextBeatLeft = recData.beats[leadCode][z + 1].left;
				} else if (z === 0) {
					prewBeatLeft = curBeatLeft;
					nextBeatLeft = recData.beats[leadCode][z + 1].left;
				} else if (z === beatsCount - 1) {
					prewBeatLeft = recData.beats[leadCode][z - 1].left;
					nextBeatLeft = curBeatLeft;
				}
				// do not use container [height] and [top position]
				left = recLeftPos + Math.floor(curBeatLeft - (curBeatLeft - prewBeatLeft) / 2);
				width = Math.floor((nextBeatLeft - prewBeatLeft) / 2);
				drawObj.container = new XRectangle(left, 0, width, 0);
				drawObj.index = results.length;
				results.push(drawObj);
			}
			lastRecMs = recProj.endMs;
			recLeftPos += recProj.limitPixels;
		}
		return results;
	}

}

// -------------------------------------------------------------------------------------------------
// Grid cell drawing glient
// -------------------------------------------------------------------------------------------------
export class GridCellDrawingClient extends XDrawingClient {

	color: string;
	opacity: number;
	lineJoin: string;
	borderColor: string;
	borderOpacity: number;
	axisColor: string;
	axisOpacity: number;

	//-------------------------------------------------------------------------------------
	constructor() {
		super();
		this.color = "#00c12e";
		this.opacity = 0.5;
		this.borderColor = "#ddd";
		this.borderOpacity = 0.1;
		this.axisColor = "#ff58ff";
		this.axisOpacity = 1;
		this.lineJoin = "miter";// round|miter|bevel
		this.mode = XDrawingMode.Canvas;
		this.type = XDrawingObjectType.Grid;
		this.draw = this.drawGrid.bind(this);
		this.afterDraw = this.afterDrawGrid.bind(this);
		this.createDrawingObject = this.createGridDrawingObject.bind(this);
	}

	//-------------------------------------------------------------------------------------
	public drawGrid() {
		//console.info("GridCellDrawingClient.drawGrid", "not implemented");
	}

	//-------------------------------------------------------------------------------------
	public afterDrawGrid() {
		console.info("GridCellDrawingClient.afterDrawGrid", "not implemented");
	}

	//-------------------------------------------------------------------------------------
	public createGridDrawingObject(): GridCellDrawingObject {
		console.info("GridCellDrawingClient.createGridDrawingObject", "not implemented");
		let result: GridCellDrawingObject = new GridCellDrawingObject();

		return result;
	}


	//-------------------------------------------------------------------------------------
	public prepareDrawings(data: DrawingData, state: XDrawingProxyState): GridCellDrawingObject[] {
		let z: number,
			y: number,
			x: number,
			container: XRectangle;
		// TODO: prepare drawings for all headers
		// cell length = header.length
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
			results[z].lead = state.gridCells[z].lead;
			results[z].leadLabel = state.gridCells[z].leadLabel;
			container = state.gridCells[z].container;
			// TODO: return container borders as lines
			// border
			borderPoints = [
				new XPoint(0, 0),
				new XPoint(container.width, 0),
				new XPoint(container.width, container.height),
				new XPoint(0, container.height),
				new XPoint(0, 0)
			];
			// OX axis
			axisPoints = [
				new XPoint(0, container.midOy - container.minOy),
				new XPoint(container.width, container.midOy - container.minOy)
			];
			results[z].polylines = [new XPolyline(borderPoints), new XPolyline(axisPoints)];
			//results[z].container.resetStart();
		}
		return results;
	}

	//-------------------------------------------------------------------------------------
	/**
	 * Prepare drawing object for each lead X header.
	 * 1st polyline - border
	 * 2nd polyline - OX axis
	 * container = cell ranges
	 * @param dd drawing data
	 * @param ps proxy state
	 */
	public prepareAllDrawings(dd: DrawingData, ps: XDrawingProxyState): GridCellDrawingObject[] {
		if (!dd.headers.hasOwnProperty(ps.sampleRate) || !dd.data.hasOwnProperty(ps.sampleRate) || !dd.data[ps.sampleRate]) return [];
		// TODO: merge record leads count & proxy state grid layout
		// Add grid layouts presets to client
		let leftList: number[] = [];

		let staticWidth: number = 300;

		let z: number,
			y: number,
			x: number,
			top: number,
			left: number,
			width: number,
			vStep: number,
			height: number,
			axisTop: number,
			axisPoints: XPoint[],
			leadCode: EcgLeadCode,
			container: XRectangle,
			borderPoints: XPoint[],
			recProj: RecordProjection,
			recData: RecordDrawingData;



		// TODO: prepare drawings for all headers
		// cell length = header.length
		let results: GridCellDrawingObject[] = new Array();
		let headObjs: { [recordId: string]: RecordProjection } = dd.headers[ps.sampleRate];
		let drawObj: GridCellDrawingObject;
		/**  record data left position in pixels. */
		let recLeftPos: number = 0;
		/** Last record milliseconds end value. */
		let lastRecMs: number = 0;
		vStep = 100; // vertical line per 100 pixels
		for (let recId in headObjs) {
			if (!headObjs.hasOwnProperty(recId)) continue;
			recProj = headObjs[recId];
			recData = dd.data[ps.sampleRate][recId];

			drawObj = new GridCellDrawingObject();
			drawObj.owner = this;
			drawObj.prepareLeads(recData.leads);

			// merge recordSpace&layoutSpace
			if (lastRecMs != 0) {
				if (recProj.endMs - lastRecMs > this.recordsThreshold)
					recLeftPos += this.layoutSpace;
				else
					recLeftPos += this.recordSpace;
			}

			// do not use container [height] and [top position]

			width = recProj.limitPixels;
			drawObj.container = new XRectangle(recLeftPos, 0, width, ps.container.height);
			leftList.push(recLeftPos);
			for (z = 0; z < drawObj.leadCodes.length; z++) {
				leadCode = drawObj.leadCodes[z];
				if (!recData.signal.hasOwnProperty(leadCode)) continue;
				//drawObj.polylines[z] = new XPolyline(recData.signal[leadCode]);
			}

			drawObj.ox = new Array(ps.gridCells.length);
			drawObj.horizontal = new Array(ps.gridCells.length);
			drawObj.vertical = new Array(ps.gridCells.length);

			// TODO: grab borders & axis lisnes from client getter(width, height, layout)
			for (z = 0; z < ps.gridCells.length; z++) {
				container = ps.gridCells[z].container;

				left = ps.gridCells[z].container.left - ps.container.left;
				top = ps.gridCells[z].container.top;
				height = ps.gridCells[z].container.height;
				axisTop = ps.gridCells[z].container.top + ps.gridCells[z].container.hHeight;
				axisTop = ps.gridCells[z].container.midOy;

				drawObj.horizontal[z] = [
					// top
					new XLine(
						new XPoint(left, top),
						new XPoint(left + width, top)
					),
					// bottom
					new XLine(
						new XPoint(left, top + height),
						new XPoint(left + width, top + height)
					)
				];

				drawObj.ox[z] = new XLine(new XPoint(left, axisTop), new XPoint(left + width, axisTop));

				drawObj.vertical[z] = [];
				for (x = 0; x < width; x += vStep) {
					drawObj.vertical[z].push(new XLine(
						new XPoint(x, top),
						new XPoint(x, top + height)
					));
				}
			}
			results.push(drawObj);
			lastRecMs = recProj.endMs;
			recLeftPos += recProj.limitPixels;
		}
		return results;
	}

}


// -------------------------------------------------------------------------------------------------
// Signal drawing glient
// -------------------------------------------------------------------------------------------------
export class SignalDrawingClient extends XDrawingClient {

	color: string;
	opacity: number;
	lineJoin: string;



	//-------------------------------------------------------------------------------------
	constructor() {
		super();
		this.color = "#0e9aff";
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
		//console.info("SignalDrawingClient.drawSignal", "not implemented");
	}

	//-------------------------------------------------------------------------------------
	public afterDrawSignal() {
		console.info("SignalDrawingClient.afterDrawSignal", "not implemented");
	}

	//-------------------------------------------------------------------------------------
	public createSignalDrawingObject(): SignalDrawingObject {
		console.info("SignalDrawingClient.createSignalDrawingObject", "not implemented");
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
		/** Last record milliseconds end value. */
		let lastRecMs: number = 0;

		for (let recId in headObjs) {
			if (!headObjs.hasOwnProperty(recId)) continue;
			recProj = headObjs[recId];
			recData = dd.data[ps.sampleRate][recId];

			drawObj = new SignalDrawingObject();
			drawObj.owner = this;
			drawObj.prepareLeads(recData.leads);

			// merge recordSpace&layoutSpace
			if (lastRecMs != 0) {
				if (recProj.endMs - lastRecMs > this.recordsThreshold)
					recLeftPos += this.layoutSpace;
				else
					recLeftPos += this.recordSpace;
			}

			// do not use container [height] and [top position]
			drawObj.container = new XRectangle(recLeftPos, 0, recProj.limitPixels, 0);
			for (z = 0; z < drawObj.leadCodes.length; z++) {
				leadCode = drawObj.leadCodes[z];
				if (!recData.signal.hasOwnProperty(leadCode)) continue;
				drawObj.polylines[z] = new XPolyline(recData.signal[leadCode]);
			}
			results.push(drawObj);

			lastRecMs = recProj.endMs;
			recLeftPos += recProj.limitPixels;
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
		console.info("ClickablePointDrawingClient.drawPonint", "not implemented");
	}

	//-------------------------------------------------------------------------------------
	public afterDrawPoint() {
		console.info("ClickablePointDrawingClient.afterDrawPoint", "not implemented");
	}

	//-------------------------------------------------------------------------------------
	public createPointDrawingObject(): ClPointDrawingObject {
		console.info("ClickablePointDrawingClient.createPointDrawingObject", "not implemented");
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
		console.info("CellDrawingClient.drawCell", "not implemented");
	}

	//-------------------------------------------------------------------------------------
	public afterDrawCell() {
		console.info("CellDrawingClient.afterDrawCell", "not implemented");
	}

	//-------------------------------------------------------------------------------------
	public createCellDrawingObject(): CellDrawingObject {
		console.info("CellDrawingClient.createCellDrawingObject", "not implemented");
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
// Cursor point drawing client
// -------------------------------------------------------------------------------------------------
export class CursorDrawingClient extends XDrawingClient {
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
		this.draw = this.drawCursor.bind(this);
		this.afterDraw = this.afterDrawFCursor.bind(this);
		this.createDrawingObject = this.createCursorDrawingObject.bind(this);
	}

	//-------------------------------------------------------------------------------------
	public drawCursor() {
		console.info("CursorDrawingObject.drawCursor", "not implemented");
	}

	//-------------------------------------------------------------------------------------
	public afterDrawFCursor() {
		console.info("CursorDrawingObject.afterDrawFCursor", "not implemented");
	}

	//-------------------------------------------------------------------------------------
	public createCursorDrawingObject(): CursorDrawingObject {
		console.info("CursorDrawingObject.createCursorDrawingObject", "not implemented");
		let result: CursorDrawingObject = new CursorDrawingObject();
		return result;
	}

	//-------------------------------------------------------------------------------------
	public prepareDrawings(dd: DrawingData, ps: XDrawingProxyState): CursorDrawingObject[] {
		if (!dd.headers.hasOwnProperty(ps.sampleRate) || !dd.data.hasOwnProperty(ps.sampleRate) || !dd.data[ps.sampleRate]) return [];

		let obj: CursorDrawingObject = new CursorDrawingObject();
		//obj.container = new XRectangle(ps.pointerX - this.clientHalfWidth, 0, this.clientHalfWidth * 2, ps.container.height);
		obj.container = new XRectangle(ps.minPx, 0, ps.limitPx, ps.container.height);

		let lineHeight: number = ps.gridCells[ps.gridCells.length - 1].container.maxOy -
			ps.gridCells[0].container.minOy;

		obj.lines = [new XLine(new XPoint(ps.pointerX, 0), new XPoint(ps.pointerX, lineHeight))];
		obj.points = new Array(ps.gridCells.length);
		// TODO move to state getter
		let header: RecordProjection = dd.getHeader(ps.skipPx + ps.pointerX, ps.sampleRate);
		let signalPoints: XPoint[];
		for (let z: number = 0; z < ps.gridCells.length; z++) {
			signalPoints = dd.data[ps.sampleRate][header.id].signal[ps.gridCells[z].lead];
			obj.points[z] = new XPoint(ps.pointerX, signalPoints[ps.skipPx + ps.pointerX].top);
		}
		//results.push(obj);
		return [obj];
	}


	//-------------------------------------------------------------------------------------
	public prepareAllDrawings(dd: DrawingData, ps: XDrawingProxyState): CursorDrawingObject[] {
		return this.prepareDrawings(dd, ps);
		//console.info("FPointDrawingClient.prepareAllDrawings", "not implemented");
	}
}





// -------------------------------------------------------------------------------------------------
// Wavepoint drawing client
// -------------------------------------------------------------------------------------------------
export class WavepointClient extends XDrawingClient {


	//-------------------------------------------------------------------------------------
	constructor() {
		super();
	}


	//-------------------------------------------------------------------------------------
	public prepareDrawings(data: DrawingData, state: XDrawingProxyState): WavepointDrawingObject[] {
		return [];
	}


	//-------------------------------------------------------------------------------------
	public prepareAllDrawings(dd: DrawingData, ps: XDrawingProxyState): WavepointDrawingObject[] {
		return [];
	}
}
