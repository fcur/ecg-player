
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
	public dataV2: { [sampleate: string]: { [recordId: string]: RecordDrawingData } };
	public headers: { [sampleate: string]: { [recordId: string]: RecordProjection } };
	public leadsForBeats: EcgLeadCode[];

	//-------------------------------------------------------------------------------------
	constructor() {
		this._osr = 0;
		this._osrKey = "";
		this.leadsForBeats = [];
		this.data = {};

		this.headers = {};
		this.dataV2 = {};
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

		if (!this.data[srKey]) this.data[srKey] = {};
		//if (!this.dataV2[srKey]) this.dataV2[srKey] = {};
		if (!this.headers[srKey]) this.headers[srKey] = {};
		if (!this.data[srKey][DrawingData.RECORD_HEADERS]) this.data[srKey][DrawingData.RECORD_HEADERS] = {};

		for (let z: number = 0; z < p.length; z++) {
			//rdd = this.dataV2[srKey][proj.id] ? this.dataV2[srKey][proj.id] : new RecordDrawingData();
			proj = new RecordProjection();
			proj.skipPixels = skipPx;
			proj.record = p[z];
			skipPx += proj.limitPixels;
			// data[sample_rate][headers][record_id]
			this.data[srKey][DrawingData.RECORD_HEADERS][proj.id] = proj;
			this.headers[srKey][proj.id] = proj;
		}
	}

	//-------------------------------------------------------------------------------------
	public set projection(p: EcgRecord[]) {
		if (!Array.isArray(p) || p.length === 0) return;
		let srKey: string;
		let rdd: RecordDrawingData;
		for (let z: number = 0; z < p.length; z++) {
			srKey = p[z].signal.sampleRate.toString();
			if (!this.data[srKey]) this.data[srKey] = {};
			if (!this.dataV2[srKey]) this.dataV2[srKey] = {};
			if (!this.dataV2[srKey][p[z].id]) this.dataV2[srKey][p[z].id] = new RecordDrawingData();

			rdd = this.dataV2[srKey][p[z].id];
			this.trySaveSignalPolylines(p[z].id, p[z].signal, srKey);
			this.trySaveBeatsPoints(p[z].id, p[z].beats, srKey);
			rdd.trySaveSignalPolylines(p[z].signal);
			rdd.trySaveBeatsPoints(p[z].beats);
		}
	}

	//-------------------------------------------------------------------------------------
	private trySaveSignalPolylines(id: string, v: EcgSignal, srKey: string) {
		// data[sample_rate] created in previous stage
		// data[sample_rate][signal-polyline][record_id][lead]
		if (!this.data[srKey][DrawingData.SIGNAL_POLYLINES]) this.data[srKey][DrawingData.SIGNAL_POLYLINES] = {};
		if (!this.data[srKey][DrawingData.SIGNAL_POLYLINES][id]) this.data[srKey][DrawingData.SIGNAL_POLYLINES][id] = {};

		if (!v || !Array.isArray(v.channels) || !Array.isArray(v.leads) || v.leads.length === 0) return;
		let leadCode: EcgLeadCode;
		let polyline: XPolyline;
		let points: XPoint[];
		for (let z: number = 0; z < v.leads.length; z++) {
			leadCode = v.leads[z];
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

	//-------------------------------------------------------------------------------------
	private trySaveBeatsPoints(id: string, beats: number[], srKey: string) {
		// require signal
		if (!this.data[srKey][DrawingData.SIGNAL_POLYLINES][id]) return;
		if (!this.data[srKey][DrawingData.BEATS_POINTS]) this.data[srKey][DrawingData.BEATS_POINTS] = {};
		if (!this.data[srKey][DrawingData.BEATS_POINTS][id]) this.data[srKey][DrawingData.BEATS_POINTS][id] = {};

		let signal: { [lead: number]: XPolyline } = this.data[srKey][DrawingData.SIGNAL_POLYLINES][id];
		if (!signal) return;
		let leadCode: EcgLeadCode, points: XPoint[];
		for (let lead in signal) {
			if (!signal.hasOwnProperty(lead)) continue;
			leadCode = Number.parseInt(lead) as EcgLeadCode;
			if (this.leadsForBeats.length != 0 && this.leadsForBeats.indexOf(leadCode) < 0) continue;

			points = new Array(beats.length);
			for (let z: number = 0; z < beats.length; z++) {
				points[z] = new XPoint(beats[z], signal[lead].points[beats[z]].top);
			}
			this.data[srKey][DrawingData.BEATS_POINTS][id][lead] = points;
		}
	}




}


// -------------------------------------------------------------------------------------------------
// SAMPLE_RATE: RECORD_ID: data
// -------------------------------------------------------------------------------------------------
export class RecordDrawingData {

	//public header: RecordProjection;
	public leads: EcgLeadCode[];
	public signal: { [lead: number]: XPoint[] };
	public beats: { [lead: number]: XPoint[] };

	//-------------------------------------------------------------------------------------
	public trySaveSignalPolylines(v: EcgSignal) {
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
	public trySaveBeatsPoints(beats: number[]) {
		// require signal
		//if (!this.data[srKey][DrawingData.SIGNAL_POLYLINES][id]) return;

		//if (!this.data[srKey][DrawingData.BEATS_POINTS])
		//  this.data[srKey][DrawingData.BEATS_POINTS] = {};

		//if (!this.data[srKey][DrawingData.BEATS_POINTS][id])
		//  this.data[srKey][DrawingData.BEATS_POINTS][id] = {};
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

}


