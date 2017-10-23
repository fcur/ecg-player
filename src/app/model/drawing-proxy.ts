import * as Long from "@types/long";
import { EventEmitter } from "@angular/core";
import {
		XDrawingChange, XDrawingMode, XDrawingProxyState,
		XDrawingClient, XDrawingObject, XDrawingObjectType,
		XDrawingChangeSender
} from "./misc";
import { EcgWavePoint, EcgWavePointType, EcgAnnotation } from "./ecgdata"

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
		public buildWavepoints(list: EcgWavePoint[], client: XDrawingClient) {
				//console.info("prepare wavepoints for client", "create XDrawingObject for eacg  EcgWavePoint element.");
				let o: XDrawingObject;
				for (let z: number = 0; z < list.length; z++) {
						o = XDrawingObject.prepareWavePoint(z, list[z], client);
						this.drawingObjects.push(o)
				}
		}

		//-------------------------------------------------------------------------------------
		public buildAnnotations(list: EcgAnnotation[], client: XDrawingClient) {
				let o: XDrawingObject;
				for (let z: number = 0; z < list.length; z++) {
						o = XDrawingObject.prepareAnnotation(z, list[z], client);
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
				this.state = new XDrawingProxyState();
		}

		//-------------------------------------------------------------------------------------
		private collectChanges(): XDrawingChange {
				console.info("collect changes not implemented");
				let result: XDrawingChange = new XDrawingChange();
				return result;
		}


		//-------------------------------------------------------------------------------------
		public gc() {
			// handle proxy limits
			// remove unused objects
		}





		//-------------------------------------------------------------------------------------
		// Action emmiters
		//-------------------------------------------------------------------------------------
		public preformClick(event: MouseEvent | TouchEvent) {
				let changes: XDrawingChange = this.collectChanges();
				changes.sender = XDrawingChangeSender.MouseClick;
				this.onChangeState.emit(changes);
		}

		//-------------------------------------------------------------------------------------
		public preformDbClick(event: MouseEvent) {
				let changes: XDrawingChange = this.collectChanges();
				changes.sender = XDrawingChangeSender.MouseDbClick;
				this.onChangeState.emit(changes);
		}


		//-------------------------------------------------------------------------------------
		public performDrag(event: any) {
				let changes: XDrawingChange = this.collectChanges();
				changes.sender = XDrawingChangeSender.Drag;
				this.onChangeState.emit(changes);
		}

		//-------------------------------------------------------------------------------------
		public performMouseMove(event: any) {
				let changes: XDrawingChange = this.collectChanges();
				changes.sender = XDrawingChangeSender.MouseMove;
				this.onChangeState.emit(changes);
		}
}
