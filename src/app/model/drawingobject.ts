// src/app/model/drawingobject.ts

import { XDrawingClient, XDrawingMode } from "./drawingclient";
import {
	XDrawingPrimitive, XDrawingPrimitiveState, XLabel,
	XLine, XPeak, XPoint, XPolyline, XRectangle
} from "./geometry";
import {
	EcgAnnotation, EcgAnnotationCode, EcgLeadCode, EcgRecord,
	EcgSignal, EcgWavePoint, EcgWavePointType
} from "./ecgdata";

import {
	XCanvasTool, XDrawingCell, XDrawingChange,
	XDrawingChangeSender, XDrawingGridMode,
	XDrawingProxyState
} from "./misc";

// -------------------------------------------------------------------------------------------------
// Drawing object type
// -------------------------------------------------------------------------------------------------
export enum XDrawingObjectType {
	Signal,
	Beats,
	Annotations,
	PQRST,
	Measure,
	Object,
	Grid
}



// -------------------------------------------------------------------------------------------------
// Drawing object interface
// -------------------------------------------------------------------------------------------------
export interface IDrawingObject {
	/** Object index. */
	index: number;
	/** Object owner. */
	owner: XDrawingClient;
	/** Object type. */
	type: XDrawingObjectType;
	/** Container of drawing object (required). */
	container: XRectangle;
	/** Drawing object assigned cell index. -1: fill cells container */
	cellIndex: number;
	/** Draw object on canvas. */
	render(ctx: CanvasRenderingContext2D)
}


// -------------------------------------------------------------------------------------------------
// Default drawing object
// -------------------------------------------------------------------------------------------------

// Add special coordinates (getter)
// Absolute, relative from canvas start, relative from cell start (via cell index)

export class XDrawingObject implements IDrawingObject {
	/** REDUNDANT Object index. */
	public index: number;
	/** Object owner. */
	public owner: XDrawingClient;
	/** Object type. */
	public type: XDrawingObjectType;
	/** Container of drawing object (required). */
	public container: XRectangle;
	/** REDUNDANT Drawing object assigned cell index. */
	public cellIndex: number;

	//-------------------------------------------------------------------------------------
	//public get isFloating(): boolean {
	//	return this.container.floating;
	//}

	//-------------------------------------------------------------------------------------
	constructor() {
		this.container = new XRectangle(0, 0, 0, 0);
		this.index = -1; // do not use index
		this.cellIndex = -1; // do not use cell index fill full container
	}

	//-------------------------------------------------------------------------------------
	public render(ctx: CanvasRenderingContext2D) {

	}

	//-------------------------------------------------------------------------------------
	// TODO remove
	//public floatTo(left: number, top: number, signal: XDrawingObject[]) {
	//	if (this.container.floatingX) {
	//		this.container.left = left;
	//	}

	//	if (this.container.floatingY) {
	//		this.container.top = top;
	//	}


	//	let z: number;
	//	if (Array.isArray(this.lines)) {
	//		for (z = 0; z < this.lines.length; z++) {
	//			if (this.lines[z].floatingX) {
	//				this.lines[z].ax = left;
	//				this.lines[z].bx = left;
	//			}
	//			if (this.lines[z].floatingY) {
	//				this.lines[z].ay = top;
	//				this.lines[z].by = top;
	//			}
	//		}
	//	}

	//	if (Array.isArray(this.peaks)) {
	//		for (z = 0; z < this.peaks.length; z++) {
	//			if (this.peaks[z].floatingX) {
	//				this.peaks[z].container.left = left;
	//			}
	//			if (this.peaks[z].floatingY) {
	//				this.peaks[z].container.top = signal[0].polylines[z].points[left].top; // top in microvolts
	//			}
	//		}
	//	}

	//	//for (let z: number = 0; z < state.gridCells.length; z++) {
	//	//  result.peaks[z] = new XPeak();
	//	//  result.peaks[z].cellIndex = z;
	//	//  result.peaks[z].floatingX = true;
	//	//  result.peaks[z].floatingY = true;
	//	//  result.peaks[z].container = new XRectangle(-1, -1, 1, 1);
	//	//  result.peaks[z].label = new XLabel();
	//	//  result.peaks[z].label.label = state.gridCells[z].leadLabel;
	//	//  result.peaks[z].label.position = new XPoint(-1, -1);
	//	//}

	//}

	//-------------------------------------------------------------------------------------
	// TODO remove
	//static PreparePqrstComplex(i: number, ewp: EcgWavePoint[], ewpinx: number[], state: XDrawingProxyState, owner: XDrawingClient, skipPixels: number = 0): XDrawingObject {
	//	let result: XDrawingObject = new XDrawingObject();
	//	result.index = i; // drawing object index
	//	result.indexes = ewpinx; // wavepoint index
	//	result.owner = owner;
	//	// TODO: switch wavepoint type, add different elements for different types
	//	result.type = XDrawingObjectType.PQRST;
	//	result.container = new XRectangle(0, 0, 0, 0);
	//	result.lines = new Array();
	//	// TODO: Prepare lines
	//	result.labels = new Array();
	//	// TODO: Prepare labels (wavepoint type, length)
	//	result.peaks = new Array();
	//	// TODO: Prepare peaks (peak title + line)
	//	if (Array.isArray(ewp && ewp.length > 1)) {
	//		result.container.left = skipPixels + ewp[0].start;
	//		result.container.width = ewp[1].start - ewp[0].start;
	//	}
	//	return result;
	//}

	//-------------------------------------------------------------------------------------
	// TODO remove
	//static PrepareAnnotation(i: number, an: EcgAnnotation, state: XDrawingProxyState, owner: XDrawingClient): XDrawingObject {
	//	let result: XDrawingObject = new XDrawingObject();
	//	result.index = i;
	//	result.owner = owner;
	//	//console.warn("NOT IMPLEMENTED");
	//	return result;
	//}

	//-------------------------------------------------------------------------------------
	//static PreparePeak(i: number): XDrawingObject {
	//	let result: XDrawingObject = new XDrawingObject();

	//	return result;
	//}

	//-------------------------------------------------------------------------------------
	// TODO remove
	//static PrepareBeats(i: number, signal: XDrawingObject[], beats: number[], state: XDrawingProxyState, owner: XDrawingClient, skipPixels: number = 0, limitPixels: number = 0, pin: boolean = true): XDrawingObject {
	//	let result: XDrawingObject = new XDrawingObject();
	//	result.index = i;
	//	result.owner = owner;
	//	result.points = new Array(beats.length);
	//	let left: number;

	//	if (!pin) {
	//		let staticTop: number = state.container.top + 10; // top position
	//		for (let z: number = 0; z < beats.length; z++) {
	//			left = beats[z] + state.container.left;
	//			// add beat on top of container
	//			result.points[z] = new XPoint(left, staticTop);
	//		}
	//	} else {

	//		let signalPoints: XPoint[] = signal[0].polylines[0].points;
	//		let y: number = 0;
	//		for (let z: number = 0; z < beats.length; z++) {
	//			left = beats[z] + state.container.left;
	//			let microvolts: number = signalPoints[beats[z]].top;
	//			result.points[z] = new XPoint(left, microvolts);
	//		}
	//		//for (let z: number = 0; z < signalPoints.length; z++) {
	//		//		let beatIndex: number = beats.indexOf(signalPoints[z].left - state.container.left);
	//		//		if (beatIndex < 0) continue;
	//		//		let microvolts: number = signalPoints[z].top;

	//		//		result.points[y] = new XPoint(beats[beatIndex] + state.container.left, microvolts);
	//		//}
	//	}


	//	result.container.left = skipPixels;
	//	result.container.width = limitPixels;
	//	result.container.height = state.container.height;
	//	return result;
	//}

	//-------------------------------------------------------------------------------------
	// TODO remove
	//static PrepareFloatingDrawings(owner: XDrawingClient, state: XDrawingProxyState): XDrawingObject {
	//	let result: XDrawingObject = new XDrawingObject();
	//	result.index = 0;
	//	result.owner = owner;
	//	result.type = XDrawingObjectType.Object;
	//	result.container = new XRectangle(-1, state.container.top, 1, state.container.height);
	//	result.container.floatingX = true;
	//	result.lines = new Array(1);

	//	result.lines[0] = new XLine(
	//		new XPoint(-1, state.container.minOy),
	//		new XPoint(-1, state.container.maxOy)
	//	);
	//	result.lines[0].floatingX = true;

	//	result.peaks = new Array(state.gridCells.length);
	//	for (let z: number = 0; z < state.gridCells.length; z++) {
	//		result.peaks[z] = new XPeak();
	//		result.peaks[z].container = new XRectangle(-1, -1, 1, 1);
	//		result.peaks[z].cellIndex = z;
	//		result.peaks[z].floatingX = true;
	//		result.peaks[z].floatingY = true;
	//		result.peaks[z].label = new XLabel();
	//		result.peaks[z].label.label = state.gridCells[z].leadLabel;
	//		result.peaks[z].label.position = new XPoint(-1, -1);
	//	}
	//	return result;
	//}

	//-------------------------------------------------------------------------------------
	// TODO remove
	//static PrepareFloatingPeak(owner: XDrawingClient, state: XDrawingProxyState, index: number): XDrawingObject {
	//	let result: XDrawingObject = new XDrawingObject();

	//	result.index = 0;
	//	result.owner = owner;
	//	result.type = XDrawingObjectType.Object;

	//	result.peaks = new Array(state.gridCells.length);

	//	return result;
	//}


	//-------------------------------------------------------------------------------------
	// TODO remove
	/**
	* Create XDrawingObject for each EcgSignal.
	* XPoints[count][], count = EcgSignal.leads.count.
	* @param i index
	* @param s signal
	* @param state proxy state
	* @param owner object owner
	*/
	//static PrepareSignal(i: number, s: EcgSignal, state: XDrawingProxyState, owner: XDrawingClient, skipPixels: number = 0): XDrawingObject {
	//	let result: XDrawingObject = new XDrawingObject();
	//	result.index = i;
	//	result.owner = owner;
	//	result.polylines = new Array(state.gridCells.length);
	//	result.type = XDrawingObjectType.Signal;
	//	/** channel index */
	//	let chIndex: number;
	//	let points: XPoint[];
	//	let cell: XDrawingCell;
	//	/** transform coefficient */
	//	//let coef: number;
	//	let data: number[];
	//	let y: number = 0, z: number = 0, dy: number = 0, top: number = 0, left: number = 0;
	//	for (z = 0; z < state.gridCells.length; z++) {
	//		cell = state.gridCells[z];
	//		//coef = s.asSamples ? cell.sampleValueToPixel : cell.microvoltsToPixel;
	//		result.polylines[z] = new XPolyline([]);
	//		chIndex = s.leads.indexOf(cell.lead);
	//		if (chIndex < 0) continue;
	//		data = s.channels[chIndex];
	//		points = new Array(data.length);
	//		for (y = 0; y < data.length; y++) {
	//			//dy = Math.round(data[y] * coef);
	//			left = cell.container.left + skipPixels + y;
	//			//top = cell.invert ? (cell.container.midOy + dy) : (cell.container.midOy - dy);
	//			//top = cell.invert ? dy : -dy;
	//			top = data[y];// save microvolts as responsive top position
	//			points[y] = new XPoint(left, top);
	//		}
	//		result.polylines[z].rebuild(points);
	//	}
	//	result.container.left = skipPixels;
	//	result.container.width = y - 1;
	//	result.container.height = state.container.height;

	//	return result;
	//}
}



// -------------------------------------------------------------------------------------------------
// Annotations drawing object
// -------------------------------------------------------------------------------------------------
export class AnsDrawingObject extends XDrawingObject {
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
}


// -------------------------------------------------------------------------------------------------
// Beats range drawing object
// -------------------------------------------------------------------------------------------------
export class BeatsRangeDrawingObject extends XDrawingObject {
	//container - body of drawing object & clickable area
	// points.length = leadCodes.length
	// use [leadCodes map] in grid cell projection

	/** Drawing object points. */
	public points: XPoint[];
	/** Lead codes for points groups. */
	public leadCodes: EcgLeadCode[];
	/** Object beats for each grid lead. */
	//public polylines: XPolyline[];

	//-------------------------------------------------------------------------------------
	public prepareLeads(leads: EcgLeadCode[]) {
		if (!Array.isArray(leads)) return;
		this.leadCodes = leads;
		//this.polylines = new Array(leads.length);
		this.points = new Array(leads.length);
	}
}


// -------------------------------------------------------------------------------------------------
// Signal drawing object
// -------------------------------------------------------------------------------------------------
export class SignalDrawingObject extends XDrawingObject {
	/** Drawing object polylines. */
	public polylines: XPolyline[];
	/** Lead codes for polylines. */
	public leadCodes: EcgLeadCode[];
	// leadCodes.length = polylines.length

	//-------------------------------------------------------------------------------------
	public prepareLeads(leads: EcgLeadCode[]) {
		if (!Array.isArray(leads)) return;
		this.leadCodes = leads;
		this.polylines = new Array(leads.length);
	}

}


// -------------------------------------------------------------------------------------------------
// Clickable point drawing object
// -------------------------------------------------------------------------------------------------
export class ClPointDrawingObject extends XDrawingObject {
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
}


// -------------------------------------------------------------------------------------------------
// Clickable point drawing object
// -------------------------------------------------------------------------------------------------
export class CellDrawingObject extends XDrawingObject {
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
}


// -------------------------------------------------------------------------------------------------
// Floating point drawing object
// -------------------------------------------------------------------------------------------------
export class FPointDrawingObject extends XDrawingObject {
	/** Drawing object lines. */
	public lines: XLine[];
	/**Drawing object points. */
	public points: XPoint[];
}

// -------------------------------------------------------------------------------------------------
// Floating point drawing object
// -------------------------------------------------------------------------------------------------
export class GridCellDrawingObject extends XDrawingObject {
	/** Drawing object polylines.*/
	public polylines: XPolyline[];
	/** Drawing object left scroll position. */
	public left: number;

}


