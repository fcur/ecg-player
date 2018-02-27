// src/app/model/drawingobject.ts

import { XDrawingClient, XDrawingMode } from "./drawingclient";
import {
	XDrawingPrimitive, XDPrimitiveState, XLabel,
	XLine, XPeak, XPoint, XPolyline, XRectangle
} from "./geometry";
import {
	EcgAnnotation, EcgAnnotationCode, EcgLeadCode, EcgRecord,
	EcgSignal, EcgWavePoint, EcgWavePointType, EcgParser
} from "./ecgdata";
import {
	DrawingData, RecordDrawingData,
	RecordProjection
} from "./drawingdata";
import {
	XCanvasTool, XWCell, XDPSEvent,
	XDChangeSender, XDGridMode,
	XDProxyState, XDCoordinates
} from "./misc";
import { LiteResampler } from "./literesampler";

// -------------------------------------------------------------------------------------------------
// Drawing object type
// -------------------------------------------------------------------------------------------------
export enum XDOType {
	Signal,
	Beats,
	Annotations,
	PQRST,
	Measure,
	Object,
	Grid
}

// -------------------------------------------------------------------------------------------------
// Drawing change type
// -------------------------------------------------------------------------------------------------
export enum XDOChangeType {
	Default = 0,
	Top = 2,
	Left = 4,
	Move = 16,
	Width = 32,
	Height = 64
}


// -------------------------------------------------------------------------------------------------
// Drawing object interface
// -------------------------------------------------------------------------------------------------
export interface IDObject {
	/** Object index. */
	index: number;
	/** Object owner. */
	owner: XDrawingClient;
	/** Object type. */
	type: XDOType;

	/** Container of drawing object (required). */
	container: XRectangle;
	/** Drawing object assigned cell index. -1: fill cells container */
	cellIndex: number;
	/** Draw object on canvas. */
	render(ctx: CanvasRenderingContext2D);
	/** Visiblity of drawing object. */
	hidden: boolean;
	/** Animation progress state (0..100).*/
	progress: number;
	/** Head-up display / part of user innterface. */
	hud: boolean;
	/** Always update state. */
	alwaysUpdate: boolean;
	/** Update drawing object proxy state. */
	updateState(dd: DrawingData, pd: XDProxyState);
	/** Drawing object change type. */
	changeType: number;
	/** Check point in drawing object. */
	checkPosition(left: number, top: number): boolean;
	/** Drawing object state. */
	state: XDPrimitiveState;
	/** Enable drag (move).*/
	draggable: boolean;
	/** Enable container changes (left, top, width, height). */
	changeable: boolean;
	timestamp: number;
}


// -------------------------------------------------------------------------------------------------
// Default drawing object
// -------------------------------------------------------------------------------------------------

// Add special coordinates (getter)
// Absolute, relative from canvas start, relative from cell start (via cell index)

export class XDrawingObject implements IDObject {
	/** REDUNDANT Object index. */
	public index: number;
	/** REDUNDANT Drawing object assigned cell index. */
	public cellIndex: number;
	/** Object owner. */
	public owner: XDrawingClient;
	/** Object type. */
	public type: XDOType;
	/** Container of drawing object (required). */
	public container: XRectangle;
	/** Visiblity of drawing object. */
	public hidden: boolean;
	/** Animation progress state (0..100).*/
	public progress: number;
	/** Head-up display / part of user innterface. */
	public hud: boolean;
	/** Always update state. */
	public alwaysUpdate: boolean;
	/** Drawing object change type. */
	public changeType: number;
	/** Creation time. */
	public timestamp: number;
	/** Enable drag (move).*/
	draggable: boolean;
	/** Enable container changes (left, top, width, height). */
	changeable: boolean;

	public set state(v: XDPrimitiveState) {
		this.container.state = v;
	}
	public get state(): XDPrimitiveState {
		return this.container.state;
	}

	//-------------------------------------------------------------------------------------
	//public get isFloating(): boolean {
	//	return this.container.floating;
	//}

	//-------------------------------------------------------------------------------------
	constructor() {
		this.container = new XRectangle(0, 0, 0, 0);
		this.timestamp = Date.now();
		this.index = -1; // do not use index
		this.cellIndex = -1; // do not use cell index fill full container
		this.hidden = true;
		this.progress = 100;
		this.hud = false;
		this.alwaysUpdate = false;
		this.draggable = false;
		this.changeable = false;
		this.changeType = XDOChangeType.Default;
	}

	//-------------------------------------------------------------------------------------
	public checkPosition(left: number, top: number): boolean {
		return this.container.containsPoint(left, top);
	}

	//-------------------------------------------------------------------------------------
	public render(ctx: CanvasRenderingContext2D) {

	}

	//-------------------------------------------------------------------------------------
	public updateState(dd: DrawingData, pd: XDProxyState) { }


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

	//-------------------------------------------------------------------------------------
	public checkPosition(left: number, top: number): boolean {
		return !this.container.checkHorizontalOverflow(left);
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
// Floating point drawing object
// -------------------------------------------------------------------------------------------------
export class CursorDrawingObject extends XDrawingObject {
	/** Drawing object lines. */
	public lines: XLine[];
	/**Drawing object points. */
	public points: XPoint[];


	//-------------------------------------------------------------------------------------
	constructor() {
		super();
		this.hud = true; // important!
	}

	//-------------------------------------------------------------------------------------
	public updateState(dd: DrawingData, ps: XDProxyState) {
		this.container.rebuild(ps.minPx, 0, ps.limitPx, ps.container.height);
		let lineHeight: number = ps.container.maxOy - ps.container.minOy;

		this.lines = [new XLine(new XPoint(ps.pointerX, 0), new XPoint(ps.pointerX, lineHeight))];
		this.points = new Array(ps.leadsCodes.length);

		// TODO move to state getter
		let header: RecordProjection = dd.getHeader(ps.skipPx + ps.pointerX, ps.sampleRate);
		let signalPoints: XPoint[];
		for (let z: number = 0; z < ps.leadsCodes.length; z++) {
			signalPoints = dd.data[ps.sampleRate][header.id].signal[ps.leadsCodes[z]];
			this.points[z] = new XPoint(ps.pointerX, signalPoints[ps.skipPx + ps.pointerX].top);
		}
	}

}

// -------------------------------------------------------------------------------------------------
// Floating point drawing object
// -------------------------------------------------------------------------------------------------
export class GridCellDrawingObject extends XDrawingObject {
	/** Drawing object polylines.*/
	public polylines: XPolyline[];
	/** Drawing object left scroll position. */
	public left: number;
	/** Cell assigned lead code. */
	public lead: EcgLeadCode;
	/** Cell assigned lead text. */
	public leadLabel: string;


	/** Drawing object polylines.*/
	public polylinesF3: XPolyline[];
	/** Cell assigned lead text. */
	//public leadsLabelsF3: string[];

	/** Cell assigned lead code. */
	public leadCodes: EcgLeadCode[];
	/** Cells axis. */
	public ox: XLine[];
	/** Cells horizontal lines. */
	public horizontal: XLine[][];
	/** Cells vertical lines. */
	public vertical: XLine[][];

	//-------------------------------------------------------------------------------------
	public prepareLeads(leads: EcgLeadCode[]) {
		if (!Array.isArray(leads)) return;
		this.polylinesF3 = new Array(leads.length);
		this.leadCodes = leads;
	}
}


// -------------------------------------------------------------------------------------------------
// Wavepoint base drawing object
// -------------------------------------------------------------------------------------------------
export class WavepointDrawingObject extends XDrawingObject {


}

// -------------------------------------------------------------------------------------------------
// Wavepoint wave drawing object
// -------------------------------------------------------------------------------------------------
export class WaveDrawingObject extends WavepointDrawingObject {

}


// -------------------------------------------------------------------------------------------------
// Wavepoint peak drawing object
// -------------------------------------------------------------------------------------------------
export class PeakDrawingObject extends WavepointDrawingObject {

}

// -------------------------------------------------------------------------------------------------
// Demo rectangle drawing object
// -------------------------------------------------------------------------------------------------
export class DemoRectDrawingObject extends XDrawingObject {

	public figure: XRectangle;

	//-------------------------------------------------------------------------------------
	public checkPosition(left: number, top: number): boolean {
		return super.checkPosition(left, top);
	}
}
