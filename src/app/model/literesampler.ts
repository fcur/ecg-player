import {
	EcgLeadCode, EcgWavePoint, EcgAnnotation, EcgAnnotationCode,
	EcgRecord, EcgSignal, EcgWavePointType, EcgParser
} from "./ecgdata";

// -------------------------------------------------------------------------------------------------
// Ecg signal lite resampler
// do not use on production
// -------------------------------------------------------------------------------------------------
export class LiteResampler{

	static Resample(input: EcgRecord, sampleRate: number): EcgRecord {
		if (sampleRate === input.sampleRateForCls) return input;
		let output: EcgRecord = new EcgRecord();
		output.id = input.id;
		output.startTime = input.startTime;
		output.signal = new EcgSignal();
		output.sampleRateForCls = sampleRate;
		output.totalBeatsCount = input.totalBeatsCount;
		output.beats = [];
		output.wavePoints = [];
		output.annotations = [];

		return output;
	}
}
