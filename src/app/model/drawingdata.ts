
import {
	XDrawingPrimitive, XDPrimitiveState,
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

	public data: { [sampleate: string]: { [recordId: string]: RecordDrawingData } };
	public headers: { [sampleate: string]: { [recordId: string]: RecordProjection } };
	public leadsForBeats: EcgLeadCode[];

	//-------------------------------------------------------------------------------------
	constructor() {
		this._osr = 0;
		this._osrKey = "";
		this.leadsForBeats = [];
		this.headers = {};
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
	/**
	 * Check data for sample rate.
	 * @param v sample rate
	 */
	public haveData(v: number): boolean {
		return this.headers.hasOwnProperty(v) &&
			this.data.hasOwnProperty(v) &&
			this.data[v] != null;
	}


	//-------------------------------------------------------------------------------------
	public getHeaders(minPx: number, maxPx: number, sampleRate: number): RecordProjection[] {
		if (!this.headers.hasOwnProperty(sampleRate)) return [];

		let result: RecordProjection[] = new Array();
		let projections: { [recordId: string]: RecordProjection } = this.headers[sampleRate];
		for (let recordId in projections) {
			if (projections[recordId].endPx < minPx || projections[recordId].startPx > maxPx) continue;
			result.push(projections[recordId]);
		}
		return result;
	}

	//-------------------------------------------------------------------------------------
	public getHeader(px: number, sampleRate: number): RecordProjection {
		// px: absolute pixels positions
		if (!this.headers.hasOwnProperty(sampleRate)) return null;
		let projections: { [recordId: string]: RecordProjection } = this.headers[sampleRate];

		for (let recordId in projections) {
			if (projections[recordId].endPx < px || projections[recordId].startPx > px) continue;
			return projections[recordId];
		}
		return null;
	}

	//-------------------------------------------------------------------------------------
	public set recordHeaders(er: EcgRecord[]) {
		if (!Array.isArray(er) || er.length === 0) return;

		let recProj: RecordProjection;
		let skipPx: number = 0;
		let srKey: string = er[0].sampleRateForCls.toString();

		if (!this.headers[srKey]) this.headers[srKey] = {};

		for (let z: number = 0; z < er.length; z++) {
			recProj = new RecordProjection();
			recProj.skipPixels = skipPx;
			recProj.record = er[z];
			skipPx += recProj.limitPixels;
			this.headers[srKey][recProj.id] = recProj;
		}
	}

	//-------------------------------------------------------------------------------------
	public set projection(er: EcgRecord[]) {
		if (!Array.isArray(er) || er.length === 0) return;

		let srKey: string;
		let rdData: RecordDrawingData;
		for (let z: number = 0; z < er.length; z++) {
			srKey = er[z].signal.sampleRate.toString();
			if (!this.data[srKey]) this.data[srKey] = {};
			if (!this.data[srKey][er[z].id]) this.data[srKey][er[z].id] = new RecordDrawingData();
			rdData = this.data[srKey][er[z].id];
			rdData.leads = er[z].signal.leads;
			rdData.trySaveSignalPoints(er[z].signal);
			rdData.trySaveBeatsPoints(er[z].beats, this.leadsForBeats);
			// TODO: save annotations, wave points, other
		}
	}

}


// -------------------------------------------------------------------------------------------------
// SAMPLE_RATE: RECORD_ID: data
// -------------------------------------------------------------------------------------------------
export class RecordDrawingData {

	//public header: RecordProjection;
	public leads: EcgLeadCode[];
	public beats: { [lead: number]: XPoint[] };
	public signal: { [lead: number]: XPoint[] };

	//-------------------------------------------------------------------------------------
	public trySaveSignalPoints(v: EcgSignal) {
		if (!v || !Array.isArray(v.channels) || !Array.isArray(v.leads) || v.leads.length === 0 || this.signal) return;

		let points: XPoint[];
		this.signal = {};
		for (let z: number = 0; z < v.leads.length; z++) {
			if (!Array.isArray(v.channels[z])) continue;
			// prepare points
			points = new Array(v.channels[z].length);
			for (let y: number = 0; y < v.channels[z].length; y++) {
				// save microvolts as relative OY position
				points[y] = new XPoint(y, v.channels[z][y]);
			}
			this.signal[v.leads[z]] = points;
		}
	}

	//-------------------------------------------------------------------------------------
	public trySaveBeatsPoints(beats: number[], leads: EcgLeadCode[] = []) {
		if (!Array.isArray(beats) || !this.signal || this.beats) return;  // require signal

		let leadCode: EcgLeadCode, points: XPoint[];
		this.beats = {};
		for (let lead in this.signal) {
			if (!this.signal.hasOwnProperty(lead)) continue;
			leadCode = Number.parseInt(lead) as EcgLeadCode;
			if (leads.length != 0 && leads.indexOf(leadCode) < 0) continue;
			points = new Array(beats.length);
			for (let z: number = 0; z < beats.length; z++) {
				// top - position in microvolts
				points[z] = new XPoint(beats[z], this.signal[lead][beats[z]].top);
			}
			this.beats[lead] = points;
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
	public startMs: number;
	public lengthMs: number;

	//-------------------------------------------------------------------------------------
	public set record(v: EcgRecord) {
		this.id = v.id;
		this.limitPixels = v.signal.sampleCount;
		this.startMs = v.startTime;
		this.lengthMs = v.signal.length;
	}

	//-------------------------------------------------------------------------------------
	public get startPx(): number {
		return this.skipPixels;
	}

	//-------------------------------------------------------------------------------------
	public get endPx(): number {
		return this.skipPixels + this.limitPixels;
	}

	//-------------------------------------------------------------------------------------
	public get endMs(): number {
		return this.startMs + this.lengthMs;
	}

}


