
import {
	XDrawingPrimitive, XDrawingPrimitiveState,
	XLabel, XLine, XPeak, XPoint, XPolyline,
	XRectangle
} from "./geometry";

import {
	EcgRecord, EcgAnnotation, EcgSignal,
	EcgAnnotationCode, EcgLeadCode, EcgWavePoint,
	EcgWavePointType
} from "./ecgdata";


// -------------------------------------------------------------------------------------------------
// Drawing data
// -------------------------------------------------------------------------------------------------
export class DrawingData {


	static RECORD_HEADERS: string = "headers";
	static SIGNAL_POLYLINES: string = "signal-polyline";
	static BEATS_POINTS: string = "beats-points";

	private _osr: number;
	private _osrKey: string;

	public data: any;

	//-------------------------------------------------------------------------------------
	constructor() {
		this._osr = 0;
		this._osrKey = "";
		this.data = {};
	}

	//-------------------------------------------------------------------------------------
	public set originalSampleRate(v: number) {
		this._osr = v;
		this._osrKey = v.toString();
	}

	//-------------------------------------------------------------------------------------
	public build(v: EcgRecord) {

	}

	//-------------------------------------------------------------------------------------
	public set recordHeaders(p: EcgRecord[]) {
		if (!Array.isArray(p) || p.length === 0) return;

		let proj: RecordProjection;
		let skipPx: number = 0;
		let srKey: string = p[0].sampleRateForCls.toString();
		if (!this.data[srKey])
			this.data[srKey] = {};
		if (!this.data[srKey][DrawingData.RECORD_HEADERS])
			this.data[srKey][DrawingData.RECORD_HEADERS] = {};
		for (let z: number = 0; z < p.length; z++) {
			proj = new RecordProjection();
			proj.skipPixels = skipPx;
			proj.record = p[z];
			skipPx += proj.limitPixels;
			// data[sample_rate][headers][record_id]
			this.data[srKey][DrawingData.RECORD_HEADERS][proj.id] = proj;
		}
	}

	//-------------------------------------------------------------------------------------
	public set projection(p: EcgRecord[]) {
		if (!Array.isArray(p) || p.length === 0) return;
		for (let z: number = 0; z < p.length; z++) {
			this.trySaveSignalPolylines(p[z].id, p[z].signal);
		}
	}

	//-------------------------------------------------------------------------------------
	private trySaveSignalPolylines(id: string, v: EcgSignal) {
		// data[sample_rate] created in previous stage
		// data[sample_rate][signal-polyline][record_id][lead]
		let srKey: string = v.sampleRate.toString();
		if (!this.data[srKey])
			this.data[srKey] = {};
		if (!this.data[srKey][DrawingData.SIGNAL_POLYLINES])
			this.data[srKey][DrawingData.SIGNAL_POLYLINES] = {};
		if (!this.data[srKey][DrawingData.SIGNAL_POLYLINES][id])
			this.data[srKey][DrawingData.SIGNAL_POLYLINES][id] = { };

		if (!v || !Array.isArray(v.channels) || !Array.isArray(v.leads) || v.leads.length === 0) return;
		let lead: EcgLeadCode;
		let polyline: XPolyline;
		let points: XPoint[];
		for (let z: number = 0; z < v.leads.length; z++) {
			lead = v.leads[z];
			polyline = new XPolyline([]);
			
			if (!Array.isArray(v.channels[z])) continue;
			// prepare points
			points = new Array(v.channels[z].length);
			for (let y: number = 0; y < v.channels[z].length; y++) {
				// save microvolts as relative OY position
				points[y] = new XPoint(y, v.channels[z][y]);
			}
			polyline.rebuild(points);
			//PATH: data["175"]["signal-polyline"]["record_1"]["13"]
			this.data[srKey][DrawingData.SIGNAL_POLYLINES][id][v.leads[z]] = polyline;
		}
	}

}


// -------------------------------------------------------------------------------------------------
// Lighweight ecg record projection
// -------------------------------------------------------------------------------------------------
export class RecordProjection {

	public id: string;
	public skipPixels: number;
	public limitPixels: number;

	//-------------------------------------------------------------------------------------
	public set record(v: EcgRecord) {
		this.id = v.id;
		this.limitPixels = v.signal.sampleCount;
	}

	//-------------------------------------------------------------------------------------
	public get startPx(): number {
		return this.skipPixels;
	}

	//-------------------------------------------------------------------------------------
	public get endPx(): number {
		return this.skipPixels + this.limitPixels;
	}

}
