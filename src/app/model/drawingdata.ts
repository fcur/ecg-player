
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
	static SIGNAL_POLYLINE: string = "signal-polyline";
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
		this.data[srKey] = {};
		this.data[srKey][DrawingData.RECORD_HEADERS] = {};
		for (let z: number = 0; z < p.length; z++) {
			proj = new RecordProjection();
			proj.skipPixels = skipPx;
			proj.record = p[z];
			skipPx += proj.limitPixels;
			this.data[srKey][DrawingData.RECORD_HEADERS][proj.id] = proj;
		}
	}

	//-------------------------------------------------------------------------------------
	public set projection(p: EcgRecord[]) {

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
