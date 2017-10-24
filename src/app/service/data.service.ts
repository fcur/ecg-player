import { Output, Injectable, EventEmitter } from "@angular/core";
import {
		EcgAnnotation, EcgAnnotationCode, EcgLeadCode,
		EcgRecord, EcgSignal, EcgWavePoint, EcgWavePointType
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

		public onLoadDataBs: BehaviorSubject<EcgRecord>;

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
				this.onLoadDataBs = new BehaviorSubject<EcgRecord>(null);
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
		public parseJsonFile(input: any) {
				console.info(input);

				let ecgrecord: EcgRecord = new EcgRecord();
				ecgrecord.id = "record_id";
				ecgrecord.signal = new EcgSignal();

				if (input.hasOwnProperty(DataService.RECORDING_TIME_KEY)) {
						ecgrecord.time = new Date(input[DataService.RECORDING_TIME_KEY] as string).getTime();
				}
				if (input.hasOwnProperty(DataService.BEATS_KEY)) {
						ecgrecord.beats = input[DataService.BEATS_KEY] as number[];
				}
				if (input.hasOwnProperty(DataService.SAMPLE_RATE_KEY)) {
						ecgrecord.sampleRateForCls = input[DataService.SAMPLE_RATE_KEY] as number;
						ecgrecord.signal.sampleRate = ecgrecord.sampleRateForCls;
				}
				if (input.hasOwnProperty(DataService.LEADS_DATA_KEY)) {
						let signal: EcgSignal = this.parseLeadsData(input[DataService.LEADS_DATA_KEY]);
						ecgrecord.signal.channels = signal.channels;
						ecgrecord.signal.leads = signal.leads;
				}
				if (input.hasOwnProperty(DataService.ANNOTATIONS_KEY)) {
						ecgrecord.annotations = this.parseAnnotations(input[DataService.ANNOTATIONS_KEY]);
				}
				if (input.hasOwnProperty(DataService.WAVEPOINTS_KEY)) {
						ecgrecord.wavePoints = this.parseWavepoints(input[DataService.ANNOTATIONS_KEY]);
				}

				this.onLoadDataBs.next(ecgrecord);
		}

    //-------------------------------------------------------------------------------------
		public get ecgrecord(): EcgRecord {
				return this.onLoadDataBs.value;
		}


		//-------------------------------------------------------------------------------------
		public parseLeadsData(input: any): EcgSignal {
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
						output.sampleCount = output.channels.length;
				}
				return output;
		}

		//-------------------------------------------------------------------------------------
		public parseAnnotations(input: any): EcgAnnotation[] {
				if (!Array.isArray(input)) return [];
				let output: EcgAnnotation[] = new Array(input.length);
				for (let z: number = 0; z < input.length; z++) {
						output[z] = new EcgAnnotation();
						if (input[z].hasOwnProperty(DataService.ANNOTATIONS_START_KEY))
								output[z].start = Number.parseInt(input[z][DataService.ANNOTATIONS_START_KEY]);
						if (input[z].hasOwnProperty(DataService.ANNOTATIONS_END_KEY))
								output[z].end = Number.parseInt(input[z][DataService.ANNOTATIONS_END_KEY]);
						if (input[z].hasOwnProperty(DataService.ANNOTATIONS_BEATS_COUNT_KEY))
								output[z].beatsCount = Number.parseInt(input[z][DataService.ANNOTATIONS_BEATS_COUNT_KEY]);
						if (input[z].hasOwnProperty(DataService.ANNOTATIONS_CLUSTER_INDEX_KEY))
								output[z].clusterIndex = Number.parseInt(input[z][DataService.ANNOTATIONS_CLUSTER_INDEX_KEY]);
						if (input[z].hasOwnProperty(DataService.ANNOTATIONS_CODES_MAP_KEY)) {
								output[z].codesMap = new Map<string, number>();
								for (let codeKey in input[z][DataService.ANNOTATIONS_CODES_MAP_KEY]) {
										output[z].codesMap.set(codeKey, input[z][DataService.ANNOTATIONS_CODES_MAP_KEY][codeKey] as number);
								}
						}
				}
				return output;
		}

		//-------------------------------------------------------------------------------------
		public parseWavepoints(input: any): EcgWavePoint[] {
				if (!Array.isArray(input)) return [];
				let output: EcgWavePoint[] = new Array(input.length);
				for (let z: number = 0; z < input.length; z++) {
						output[z] = new EcgWavePoint();
				}
				return output;
		}







}
