import {
	EcgLeadCode, EcgWavePoint, EcgAnnotation, EcgAnnotationCode,
	EcgRecord, EcgSignal, EcgWavePointType, EcgParser
} from "./ecgdata";
import {
	SignalDrawingObject, WaveDrawingObject, WavepointDrawingObject,
	FPointDrawingObject, GridCellDrawingObject, PeakDrawingObject,
	CellDrawingObject, ClPointDrawingObject, CursorDrawingObject,
	XDrawingObject, XDrawingObjectType, AnsDrawingObject,
	BeatsRangeDrawingObject, IDrawingObject
} from "./drawingobject";
import {
	BeatsDrawingClient, IDrawingClient, ClickablePointDrawingClient,
	CursorClient, FPointDrawingClient, GridCellDrawingClient,
	XDrawingClient, XDrawingMode, AnsDrawingClient,
	SignalDrawingClient, WavepointClient,
	CellDrawingClient
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
export enum XDrawingCoordinates {
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
export enum XDrawingChangeSender {
	UpdateDrawings,
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
	public objects: IDrawingObject[];
	public clients: IDrawingClient[];


	//-------------------------------------------------------------------------------------------------
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
export class XDrawingProxyState {

	/** Creation time. */
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
	public gridCells: XDrawingCell[];
	/**  Surface grid cells mode.*/
	public gridMode: XDrawingGridMode;
	/** Cursor pointer X. */
	public pointerX: number;
	public pointerY: number;


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
	public scroll(delta: number) {
		if (!Number.isInteger(delta)) return;
		this.movDelta = delta;
		this._skipPx = Math.max(Math.floor(this._skipPx - delta), 0);
		if (!Number.isInteger(this.onScrollBs.value) || this._skipPx != this.onScrollBs.value)
			this.onScrollBs.next(this._skipPx);
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

	//public set skipPx(v: number) {

	//}

	//-------------------------------------------------------------------------------------------------
	constructor() {
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
		if (!Array.isArray(leads) || !Array.isArray(leadLabels)) return;
		if (leads.length === 3) this.gridMode = XDrawingGridMode.LEADS3CH111;
		else if (leads.length === 12) this.gridMode = XDrawingGridMode.Leads12R3C4;

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
				this.gridCells[z] = new XDrawingCell();
				this.gridCells[z].index = z;
				this.gridCells[z].cellRowIndex = y;
				this.gridCells[z].cellColumnIndex = ci;
				this.gridCells[z].container = new XRectangle(cellLeft, cellTop, cellWidth, cellHeight);
				this.gridCells[z].lead = leads[z];
				this.gridCells[z].leadLabel = leadLabels[z];
				// prepare mul coefficients
				this.gridCells[z].sampleValueToPixel = Math.floor((signalHeight / this.signalSamplesClip) * XDrawingCell.FLOATING_MUL) / XDrawingCell.FLOATING_MUL;
				this.gridCells[z].microvoltsToPixel = Math.floor((signalHeight / this.signalMicrovoltsClip) * XDrawingCell.FLOATING_MUL) / XDrawingCell.FLOATING_MUL;
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


}


