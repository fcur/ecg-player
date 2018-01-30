import {
	EcgLeadCode, EcgWavePoint, EcgAnnotation, EcgAnnotationCode,
	EcgRecord, EcgSignal, EcgWavePointType, EcgParser
} from "./ecgdata";

// -------------------------------------------------------------------------------------------------
// Ecg signal lite resampler
// do not use on production
// -------------------------------------------------------------------------------------------------
export class LiteResampler {

	//-------------------------------------------------------------------------------------
	static Resample(input: EcgRecord, sampleRate: number): EcgRecord {
		if (sampleRate === input.sampleRateForCls) return null;
		let output: EcgRecord = new EcgRecord();
		output.id = input.id;
		output.startTime = input.startTime;
		output.totalBeatsCount = input.totalBeatsCount;
		output.sampleRateForCls = sampleRate;
		output.signal = LiteResampler.ResampleSignal(input.signal, sampleRate);
		output.beats = LiteResampler.ResampleBeats(input.beats, sampleRate / input.sampleRateForCls);
		output.wavePoints = LiteResampler.ResampleWavepoints(input.wavePoints, input.sampleRateForCls, sampleRate);
		output.annotations = LiteResampler.ResampleAnnotations(input.annotations, input.sampleRateForCls, sampleRate);
		//console.log(output);
		return output;
	}

	//-------------------------------------------------------------------------------------
	static PrepareDownsample(inc: number, outc: number): number[] {
		let z: number = 0,
			batch: number[] = [];
		// IMPORTANT: add the first point
		batch.push(1);
		let inputCount: number = inc - 2;
		let outputCount: number = outc - 2;
		let batchSize: number = 0;
		let batchSizeF: number = Math.floor(inputCount / outputCount);
		let batchSizeC: number = Math.ceil(inputCount / outputCount);
		let batchSizeD: number = inputCount / outputCount;
		let batchSizeDiff: number = batchSizeD - batchSizeF; // batch diff
		let diff = 0; // calculated diff
		let batchSizeOverflow: number = 0; // batch overflow

		for (z = 0; z < outputCount; z++) {
			batchSizeOverflow = diff + batchSizeDiff;
			batchSize = batchSizeOverflow >= 1 ? batchSizeC : batchSizeF;
			diff += (batchSizeD - batchSize);
			batch.push(batchSize);
		}
		// IMPORTANT: add last point
		batch.push(1);
		return batch;
	}

	//-------------------------------------------------------------------------------------
	static PrepareUpsample(inc: number, outc: number): number[] {
		let batch: number[] = [];
		let z: number = 0;
		// IMPORTANT: add the first point
		batch.push(1);
		let inputCount: number = inc - 2;
		let outputCount: number = outc - 2;
		let batchSize: number = 0;
		let batchSizeF: number = Math.floor(inputCount / outputCount); // 0
		let batchSizeC: number = Math.ceil(inputCount / outputCount); // 1
		let batchSizeD: number = inputCount / outputCount;
		let batchSizeDiff: number = batchSizeD - batchSizeF; // batch diff

		let diff = 0; // calculated diff
		let batchSizeOverflow: number = 0; // batch overflow

		for (z = 0; z < outputCount; z++) {
			batchSizeOverflow = diff + batchSizeDiff;
			batchSize = batchSizeOverflow >= 1 ? batchSizeC : batchSizeF;
			diff += (batchSizeD - batchSize);
			batch.push(batchSize);
		}

		// IMPORTANT: add last point
		batch.push(1);

		return batch;
	}

	//-------------------------------------------------------------------------------------
	static ResampleSignal(input: EcgSignal, sampleRate: number): EcgSignal {

		let dwnsmpl: boolean = input.sampleRate > sampleRate;

		let inCount: number = input.sampleCount;
		let outCount: number = Math.floor(inCount * sampleRate / input.sampleRate);

		let map: number[] = dwnsmpl ?
			LiteResampler.PrepareDownsample(inCount, outCount) :
			LiteResampler.PrepareUpsample(inCount, outCount);

		let result: EcgSignal = new EcgSignal();
		result.sampleCount = map.length;
		result.channels = new Array(input.length);
		result.sampleRate = sampleRate;
		result.leads = input.leads;
		result.asSamples = input.asSamples;

		let ci: number, // channel index
			vi: number, // input value index
			bi: number, // batch value index
			ss: number, // samples sum
			rv: number, // output current value
			ri: number, // result value index
			si: number, // sample index
			bs: number; // current batch size

		for (ci = 0; ci < input.channels.length; ci++) {
			result.channels[ci] = new Array(map.length);
			if (dwnsmpl) {
				// downsample
				ss = 0;
				for (vi = 0, ri = 0, si = 0; ri < map.length; vi++ , ri++) {
					bs = map[ri];
					for (bi = 0, ss = 0; bi < bs; bi++ , si++) {
						ss += input.channels[ci][si];
					}
					rv = ss / bs;
					result.channels[ci][ri] = rv;
				}
			} else {
				// upsample
				for (ri = 0, vi = 0; ri < map.length; ri++) {
					if (map[ri] === 1) {
						rv = input.channels[ci][vi++];
					}
					result.channels[ci][ri] = rv;
				}
			}
			// IMPORTANT: save first
			result.channels[ci][0] = input.channels[ci][0];
			// IMPORTANT: save last
			result.channels[ci][result.channels[ci].length - 1] = input.channels[ci][input.channels[ci].length - 1];
		}
		return result;
	}

	//-------------------------------------------------------------------------------------
	static ResampleBeats(inp: number[], coef: number): number[] {
		if (!Array.isArray(inp) || inp.length === 0) return [];
		let out: number[] = new Array(inp.length);
		for (let z: number = 0; z < inp.length; z++) {
			out[z] = Math.floor(inp[z] * coef);
		}
		return out;
	}

	//-------------------------------------------------------------------------------------
	static ResampleAnnotations(input: EcgAnnotation[], srIn: number, srOut: number): EcgAnnotation[] {
		if (!Array.isArray(input) || input.length === 0) return [];

		return [];
	}

	//-------------------------------------------------------------------------------------
	static ResampleWavepoints(input: EcgWavePoint[], srIn: number, srOut: number): EcgWavePoint[] {
		if (!Array.isArray(input) || input.length === 0) return [];


		return [];
	}
}
