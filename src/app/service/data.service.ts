import { Output, Injectable, EventEmitter } from "@angular/core";
import {
	EcgAnnotation, EcgAnnotationCode, EcgLeadCode,
	EcgParser, EcgRecord, EcgSignal, EcgWavePoint,
	EcgWavePointType
} from "../model/ecgdata";

import { BehaviorSubject } from "rxjs";


// -------------------------------------------------------------------------------------------------
// Data service
// -------------------------------------------------------------------------------------------------
@Injectable()
export class DataService {
	private _ecgleadsDescriptionMap: Map<EcgLeadCode, string>;

	public isEasiLeads: boolean = true;
	public isStandard12Leads: boolean = false;

	public onLoadDataBs: BehaviorSubject<EcgRecord[]>;

	//-------------------------------------------------------------------------------------
	public get leads(): EcgLeadCode[] {
		if (this.isEasiLeads) return [
			EcgLeadCode.MDC_ECG_LEAD_ES,
			EcgLeadCode.MDC_ECG_LEAD_AS,
			EcgLeadCode.MDC_ECG_LEAD_AI];
		else if (this.isStandard12Leads) return [
			EcgLeadCode.MDC_ECG_LEAD_I,
			EcgLeadCode.MDC_ECG_LEAD_II,
			EcgLeadCode.MDC_ECG_LEAD_III,
			EcgLeadCode.MDC_ECG_LEAD_V1,
			EcgLeadCode.MDC_ECG_LEAD_V2,
			EcgLeadCode.MDC_ECG_LEAD_V3,
			EcgLeadCode.MDC_ECG_LEAD_V4,
			EcgLeadCode.MDC_ECG_LEAD_V5,
			EcgLeadCode.MDC_ECG_LEAD_V6,
			EcgLeadCode.MDC_ECG_LEAD_AVR,
			EcgLeadCode.MDC_ECG_LEAD_AVL,
			EcgLeadCode.MDC_ECG_LEAD_AVF
		]
		else return [];
	}


	//-------------------------------------------------------------------------------------
	constructor() {
		this._ecgleadsDescriptionMap = new Map<EcgLeadCode, string>();
		this.onLoadDataBs = new BehaviorSubject<EcgRecord[]>([]);
		//console.info("DataService constructor");
	}

	//-------------------------------------------------------------------------------------
	public initEcgLeadMap() {
		this._ecgleadsDescriptionMap.set(EcgLeadCode.UNKNOWN_LEAD_CODE, "unknown");
		this._ecgleadsDescriptionMap.set(EcgLeadCode.MDC_ECG_LEAD_ES, "ES");
		this._ecgleadsDescriptionMap.set(EcgLeadCode.MDC_ECG_LEAD_AS, "AS");
		this._ecgleadsDescriptionMap.set(EcgLeadCode.MDC_ECG_LEAD_AI, "AI");
		this._ecgleadsDescriptionMap.set(EcgLeadCode.MDC_ECG_LEAD_I, "I");
		this._ecgleadsDescriptionMap.set(EcgLeadCode.MDC_ECG_LEAD_II, "II");
		this._ecgleadsDescriptionMap.set(EcgLeadCode.MDC_ECG_LEAD_III, "III");
		this._ecgleadsDescriptionMap.set(EcgLeadCode.MDC_ECG_LEAD_AVR, "aVR");
		this._ecgleadsDescriptionMap.set(EcgLeadCode.MDC_ECG_LEAD_AVL, "aVL");
		this._ecgleadsDescriptionMap.set(EcgLeadCode.MDC_ECG_LEAD_AVF, "aVF");
		this._ecgleadsDescriptionMap.set(EcgLeadCode.MDC_ECG_LEAD_V1, "V1");
		this._ecgleadsDescriptionMap.set(EcgLeadCode.MDC_ECG_LEAD_V2, "V2");
		this._ecgleadsDescriptionMap.set(EcgLeadCode.MDC_ECG_LEAD_V3, "V3");
		this._ecgleadsDescriptionMap.set(EcgLeadCode.MDC_ECG_LEAD_V4, "V4");
		this._ecgleadsDescriptionMap.set(EcgLeadCode.MDC_ECG_LEAD_V5, "V5");
		this._ecgleadsDescriptionMap.set(EcgLeadCode.MDC_ECG_LEAD_V6, "V6");
	}

	//-------------------------------------------------------------------------------------
	public getLeadCodesLabels(leads: EcgLeadCode[]): string[] {
		if (!leads || leads.length === 0) return [];
		if (!this._ecgleadsDescriptionMap || this._ecgleadsDescriptionMap.size === 0) this.initEcgLeadMap();
		let result: string[] = new Array(leads.length);
		for (let z: number = 0; z < result.length; z++) {
			result[z] = this._ecgleadsDescriptionMap.get(leads[z]);
		}
		return result;
	}

	//-------------------------------------------------------------------------------------
	public getEcgleadCode(caption: string): EcgLeadCode {
		if (!this._ecgleadsDescriptionMap || this._ecgleadsDescriptionMap.size === 0) this.initEcgLeadMap();
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
	public getEcgleadCaption(code: EcgLeadCode): string {
		if (!this._ecgleadsDescriptionMap || this._ecgleadsDescriptionMap.size === 0) {
			this.initEcgLeadMap();
		}
		if (this._ecgleadsDescriptionMap.has(code))
			return this._ecgleadsDescriptionMap.get(code);
		return "lead_code";
	}

	//-------------------------------------------------------------------------------------
	/**
	 * Parse file & prepare storage
	 * @param input json as text
	 * @param skipMs skip milliseconds between records
	 * @param limitItems ecg record copies count
	 */
	public parseJsonFile(input: any, skipMs: number = 10000, limitItems: number = 3) {
		//console.info(input);
		let parser: EcgParser = new EcgParser(this._ecgleadsDescriptionMap);
		let ecgrecord: EcgRecord = parser.parseEcgRecord(input);
		let records: EcgRecord[] = new Array(limitItems);
		for (let z: number = 0; z < limitItems; z++) {
			records[z] = new EcgRecord();
			records[z].id = `record_${z + 1}`;
			records[z].signal = ecgrecord.signal;
			records[z].sampleRateForCls = ecgrecord.sampleRateForCls
			records[z].time = ecgrecord.time + z * (skipMs + ecgrecord.signal.length);
			records[z].beats = ecgrecord.beats;
			records[z].annotations = ecgrecord.annotations;
			records[z].wavePoints = ecgrecord.wavePoints;
		}
		this.onLoadDataBs.next(records);
	}

	//-------------------------------------------------------------------------------------
	public get ecgrecords(): EcgRecord[] {
		if (this.onLoadDataBs && Array.isArray(this.onLoadDataBs.value))
			return this.onLoadDataBs.value;
		return [];
	}
  
}
