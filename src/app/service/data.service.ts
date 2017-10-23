import { Output, Injectable, EventEmitter } from "@angular/core";
import {
		EcgAnnotation, EcgAnnotationCode, EcgLeadCode,
		EcgRecord, EcgSignal, EcgWavePoint, EcgWavePointType
} from "../model/ecgdata"


// -------------------------------------------------------------------------------------------------
// Data service
// -------------------------------------------------------------------------------------------------
@Injectable()
export class DataService {
		private _ecgleadsDescriptionMap: Map<EcgLeadCode, string>;

		public isEasiLeads: boolean = true;
		public isStandard12Leads: boolean = false;
		public ecgrecord: EcgRecord;


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
				console.info("DataService constructor");
				this.prepareFakeData();
		}

		//-------------------------------------------------------------------------------------
		public prepareFakeData() {
				let record: EcgRecord = new EcgRecord();
				let recordDate: Date = new Date(2016, 10, 3, 12, 35, 0, 0);
				record.id = "record_id";
				record.time = recordDate.getTime();
				record.sampleRateForCls = 175;
				record.totalBeatsCount = 52500 / 10;
				record.beats = new Array(record.totalBeatsCount);
				record.wavePoints = new Array(52500 / 100);
				record.annotations = new Array(52500 / 100);
				record.signal = this.prepareSignal();
				this.ecgrecord = record;
		}

		//-------------------------------------------------------------------------------------
		private prepareSignal(): EcgSignal {
				let result: EcgSignal = new EcgSignal();
				result.leads = this.leads;
				result.sampleRate = 175;
				result.sampleCount = result.sampleRate * 300; // 300 seconds 
				result.channels = new Array(result.leads.length);
				for (let z: number = 0; z < result.leads.length; z++) {
						result.channels[z] = new Array(result.sampleCount).fill(0);
				}

				return result;
		}



		//-------------------------------------------------------------------------------------
		public initEcgLeadMap() {
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
}
