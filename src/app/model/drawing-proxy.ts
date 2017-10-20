import * as Long from "@types/long";
import { EventEmitter } from "@angular/core";
import { XDrawingChange, XDrawingMode, XDrawingProxyState, XDrawingClient, XDrawingObject, XDrawingObjectType } from "./misc";
import { EcgWavePoint, EcgWavePointType } from "./ecgdata"

// -------------------------------------------------------------------------------------------------
// DrawingProxy
// -------------------------------------------------------------------------------------------------
export class XDrawingProxy {
		public state: XDrawingProxyState;
		public onChangeState: EventEmitter<XDrawingChange>;
		public drawingObjects: XDrawingObject[];

		//-------------------------------------------------------------------------------------
		constructor() {
				console.info("DrawingProxy constructor");
				this.init();
		}

		//-------------------------------------------------------------------------------------
		public pushWavepoints(list: EcgWavePoint[], client: XDrawingClient) {
				console.info("prepare wavepoints for client",
						"create XDrawingObject for eacg  EcgWavePoint element.");
				let o: XDrawingObject;
				for (let z: number = 0; z < list.length; z++) {
						o = XDrawingObject.prepareWavePoint(z, list[z], client);
						this.drawingObjects.push(o)
				}
		}

		//-------------------------------------------------------------------------------------
		public addDrawingObject(o: XDrawingObject) {
				this.drawingObjects.push(o);
		}

		//-------------------------------------------------------------------------------------
		private init() {
				this.onChangeState = new EventEmitter<XDrawingChange>();
				this.drawingObjects = [];
		}

		//-------------------------------------------------------------------------------------
		private collectChanges(): XDrawingChange {
				console.info("collect changes not implemented");
				let result: XDrawingChange = new XDrawingChange();
				return result;
		}


		//-------------------------------------------------------------------------------------
		public gc() {
				// remove unused objects
		}






		//-------------------------------------------------------------------------------------
		public preformClick(event: MouseEvent | TouchEvent) {
				let changes: XDrawingChange = this.collectChanges();
				this.onChangeState.emit(changes);
		}

		//-------------------------------------------------------------------------------------
		public preformDbClick(event: MouseEvent) {
				console.info("not implemented");
		}


		//-------------------------------------------------------------------------------------
		public performDrag() {

		}

		//-------------------------------------------------------------------------------------
		public performMouseMove() {

		}
}
