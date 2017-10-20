// -------------------------------------------------------------------------------------------------
// Ecg lead code
// -------------------------------------------------------------------------------------------------
export enum EcgLeadCode {
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
		public sessionId: string;
		public time: number;
		public signal: EcgSignal;
		public sampleRateForCls: number;
		public totalBeatsCount: number;
		public beats: number;
		public wavePoints: EcgWavePoint[];
		public annotations: EcgAnnotation[];


}

// -------------------------------------------------------------------------------------------------
// Ecg signal
// -------------------------------------------------------------------------------------------------
export class EcgSignal {
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
}