// -------------------------------------------------------------------------------------------------
// Ecg lead code
// -------------------------------------------------------------------------------------------------
export enum EcgLeadCode {
	UNKNOWN_LEAD_CODE,
	// Standard 12 Leads
	MDC_ECG_LEAD_I,
	MDC_ECG_LEAD_II,
	MDC_ECG_LEAD_III,
	MDC_ECG_LEAD_V1,
	MDC_ECG_LEAD_V2,
	MDC_ECG_LEAD_V3,
	MDC_ECG_LEAD_V4,
	MDC_ECG_LEAD_V5,
	MDC_ECG_LEAD_V6,
	MDC_ECG_LEAD_AVR,
	MDC_ECG_LEAD_AVL,
	MDC_ECG_LEAD_AVF,
	// EASI Leads
	MDC_ECG_LEAD_ES,
	MDC_ECG_LEAD_AS,
	MDC_ECG_LEAD_AI
}

// -------------------------------------------------------------------------------------------------
// Ecg annotation code
// -------------------------------------------------------------------------------------------------
export enum EcgAnnotationCode {
	UNKNOWN_ANNOTATION_CODE,
	NORMAL_ANNOTATION_CODE
}

// -------------------------------------------------------------------------------------------------
// Ecg wavepoint type
// -------------------------------------------------------------------------------------------------
export enum EcgWavePointType {
	Unknown,
	P_Start,
	P_Peak,
	P_End,
	QRS_Start,
	Q_Peak,
	R_Peak,
	S_Peak,
	QRS_End,
	T_Start,
	T_Peak,
	T_End
}


// -------------------------------------------------------------------------------------------------
// Ecg record
// -------------------------------------------------------------------------------------------------
export class EcgRecord {
	public id: string;
	public startTime: number;
	public signal: EcgSignal;
	public sampleRateForCls: number;
	public totalBeatsCount: number;
	public beats: number[];
	public wavePoints: EcgWavePoint[];
	public annotations: EcgAnnotation[];

	public get endTime(): number {
		if (!this.signal || !Array.isArray(this.signal.channels) || this.signal.channels.length === 0)
			return this.startTime;
		return this.startTime + this.signal.length;
	}

}

// -------------------------------------------------------------------------------------------------
// Ecg signal
// -------------------------------------------------------------------------------------------------
export class EcgSignal {
	public sampleCount: number;
	public channels: number[][]; // [channel_index], [microvolts_value]
	public sampleRate: number;
	public leads: EcgLeadCode[];
	/** Channel contains sample value(TRUE) or microvolts (FALSE). */
	public asSamples: boolean;

	//-------------------------------------------------------------------------------------
	public get sampleRateMs(): number {
		return this.sampleRate / 1000;
	}

	//-------------------------------------------------------------------------------------
	public get length(): number {
		// sample rate for seconds, return milliseconds
		if (Number.isInteger(this.sampleCount) && Number.isInteger(this.sampleRate))
			return Math.floor(this.sampleCount / this.sampleRateMs);
		return 0;
	}


}

// -------------------------------------------------------------------------------------------------
// Ecg wave point (PQRST)
// -------------------------------------------------------------------------------------------------
export class EcgWavePoint {

	public type: EcgWavePointType;
	public start: number;	// sample index
}

// -------------------------------------------------------------------------------------------------
// Ecg annotation
// -------------------------------------------------------------------------------------------------
export class EcgAnnotation {
	public start: number; // sample index
	public end: number; // sample index
	public code: EcgAnnotationCode;
	public beatsCount: number;
	public clusterIndex: number;
	public codesMap: Map<string, number>;
}


// -------------------------------------------------------------------------------------------------
// Ecg data parser
// -------------------------------------------------------------------------------------------------
export class EcgParser {

	private _ecgleadsDescriptionMap: Map<EcgLeadCode, string>;

	static ANNOTATIONS_KEY: string = "annotations";
	static ANNOTATIONS_START_KEY: string = "start";
	static ANNOTATIONS_END_KEY: string = "end";
	static ANNOTATIONS_BEATS_COUNT_KEY: string = "affected_beats_count";
	static ANNOTATIONS_CLUSTER_INDEX_KEY: string = "cluster_index";
	static ANNOTATIONS_CODES_MAP_KEY: string = "codes_with_values";
	static BEATS_KEY: string = "beats";
	static LEADS_DATA_KEY: string = "leads_data";
	static RECORDING_TIME_KEY: string = "recording_time";
	static SAMPLE_MUL_KEY: string = "sample_multiplier";
	static SAMPLE_RATE_KEY: string = "sample_rate";
	static WAVEPOINTS_KEY: string = "wavepoints";

	//-------------------------------------------------------------------------------------
	constructor(leadsMap: Map<EcgLeadCode, string>) {
		this._ecgleadsDescriptionMap = leadsMap;
	}

	//-------------------------------------------------------------------------------------
	private parseWavepoints(input: any): EcgWavePoint[] {
		if (!Array.isArray(input)) return [];
		let output: EcgWavePoint[] = new Array(input.length);
		for (let z: number = 0; z < input.length; z++) {
			output[z] = new EcgWavePoint();
		}
		return output;
	}

	//-------------------------------------------------------------------------------------
	private parseLeadsData(input: any): EcgSignal {
		let output: EcgSignal = new EcgSignal();
		output.leads = new Array();
		output.channels = new Array();
		let leadLabel: string;
		for (let key in input) {
			if (!input.hasOwnProperty(key)) continue;
			leadLabel = key.slice(key.lastIndexOf("_") + 1);
			output.leads.push(this.getEcgleadCode(leadLabel));
			output.channels.push(input[key]);
		}
		if (output.channels.length > 0) {
			output.sampleCount = output.channels[0].length;
		}
		return output;
	}

	//-------------------------------------------------------------------------------------
	private parseAnnotations(input: any): EcgAnnotation[] {
		if (!Array.isArray(input)) return [];
		let output: EcgAnnotation[] = new Array(input.length);
		for (let z: number = 0; z < input.length; z++) {
			output[z] = new EcgAnnotation();
			if (input[z].hasOwnProperty(EcgParser.ANNOTATIONS_START_KEY))
				output[z].start = Number.parseInt(input[z][EcgParser.ANNOTATIONS_START_KEY]);
			if (input[z].hasOwnProperty(EcgParser.ANNOTATIONS_END_KEY))
				output[z].end = Number.parseInt(input[z][EcgParser.ANNOTATIONS_END_KEY]);
			if (input[z].hasOwnProperty(EcgParser.ANNOTATIONS_BEATS_COUNT_KEY))
				output[z].beatsCount = Number.parseInt(input[z][EcgParser.ANNOTATIONS_BEATS_COUNT_KEY]);
			if (input[z].hasOwnProperty(EcgParser.ANNOTATIONS_CLUSTER_INDEX_KEY))
				output[z].clusterIndex = Number.parseInt(input[z][EcgParser.ANNOTATIONS_CLUSTER_INDEX_KEY]);
			if (input[z].hasOwnProperty(EcgParser.ANNOTATIONS_CODES_MAP_KEY)) {
				output[z].codesMap = new Map<string, number>();
				for (let codeKey in input[z][EcgParser.ANNOTATIONS_CODES_MAP_KEY]) {
					output[z].codesMap.set(codeKey, input[z][EcgParser.ANNOTATIONS_CODES_MAP_KEY][codeKey] as number);
				}
			}
		}
		return output;
	}

	//-------------------------------------------------------------------------------------
	private getEcgleadCode(caption: string): EcgLeadCode {
		let it: IterableIterator<EcgLeadCode> = this._ecgleadsDescriptionMap.keys();
		let itr: IteratorResult<EcgLeadCode> = it.next();
		while (!itr.done) {
			if (this._ecgleadsDescriptionMap.get(itr.value) === caption)
				return itr.value;
			itr = it.next();
		}
		return EcgLeadCode.UNKNOWN_LEAD_CODE;
	}

	//-------------------------------------------------------------------------------------
	public parseEcgRecord(input: any): EcgRecord {
		let ecgrecord: EcgRecord = new EcgRecord();
		ecgrecord.id = "record_id";
		ecgrecord.signal = new EcgSignal();
		ecgrecord.signal.asSamples = false;
		let signalLengthMs: number = 0;
		if (input.hasOwnProperty(EcgParser.RECORDING_TIME_KEY)) {
			ecgrecord.startTime = new Date(input[EcgParser.RECORDING_TIME_KEY] as string).getTime();
		} else {
			ecgrecord.startTime = Date.now();
		}
		if (input.hasOwnProperty(EcgParser.BEATS_KEY)) {
			ecgrecord.beats = input[EcgParser.BEATS_KEY] as number[];
			//console.info("beats:", ecgrecord.beats);
		} else {
			ecgrecord.beats = [];
		}
		if (input.hasOwnProperty(EcgParser.SAMPLE_RATE_KEY)) {
			ecgrecord.sampleRateForCls = input[EcgParser.SAMPLE_RATE_KEY] as number;
			ecgrecord.signal.sampleRate = ecgrecord.sampleRateForCls;
		} else {
			ecgrecord.sampleRateForCls = 0;
		}
		if (input.hasOwnProperty(EcgParser.LEADS_DATA_KEY)) {
			let signal: EcgSignal = this.parseLeadsData(input[EcgParser.LEADS_DATA_KEY]);
			ecgrecord.signal.channels = signal.channels;
			ecgrecord.signal.sampleCount = signal.sampleCount;
			ecgrecord.signal.leads = signal.leads;
			let length = ecgrecord.signal.length;
		}
		if (input.hasOwnProperty(EcgParser.ANNOTATIONS_KEY)) {
			ecgrecord.annotations = this.parseAnnotations(input[EcgParser.ANNOTATIONS_KEY]);
		} else {
			ecgrecord.annotations = [];
		}
		if (input.hasOwnProperty(EcgParser.WAVEPOINTS_KEY)) {
			ecgrecord.wavePoints = this.parseWavepoints(input[EcgParser.ANNOTATIONS_KEY]);
		} else {
			ecgrecord.wavePoints = [];
		}
		return ecgrecord;
	}
}
