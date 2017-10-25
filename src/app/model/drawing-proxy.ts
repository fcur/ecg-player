import { EventEmitter } from "@angular/core";
import {
		XDrawingChange, XDrawingMode, XDrawingProxyState,
		XDrawingClient, XDrawingObject, XDrawingObjectType,
		XDrawingChangeSender
} from "./misc";
import {
		EcgWavePoint, EcgWavePointType, EcgAnnotation,
		EcgSignal, EcgAnnotationCode, EcgLeadCode, EcgRecord
} from "./ecgdata"
import { BehaviorSubject } from "rxjs";

// -------------------------------------------------------------------------------------------------
// DrawingProxy
// -------------------------------------------------------------------------------------------------
export class XDrawingProxy {
		public state: XDrawingProxyState;
		public onChangeState: EventEmitter<XDrawingChange>;
		public drawingObjects: XDrawingObject[];

		//-------------------------------------------------------------------------------------
		constructor() {
				//console.info("DrawingProxy constructor");
				this.init();
		}

    	//-------------------------------------------------------------------------------------
		public reset() {
				console.info("drawing proxy not implemented");
		}

		//-------------------------------------------------------------------------------------
		public buildWavepoints(list: EcgWavePoint[], client: XDrawingClient) {
				//console.info("prepare wavepoints for client", "create XDrawingObject for eacg  EcgWavePoint element.");
				let o: XDrawingObject;
				for (let z: number = 0; z < list.length; z++) {
						o = XDrawingObject.PrepareWavePoint(z, list[z], this.state, client);
						this.drawingObjects.push(o);
				}
		}

		//-------------------------------------------------------------------------------------
		public buildSignal(list: EcgSignal[], client: XDrawingClient) {
				let o: XDrawingObject;
				let s: EcgSignal;
				let skipPx: number = 0;
				for (let z: number = 0; z < list.length; z++) {
						o = XDrawingObject.PrepareSignal(z, list[z], this.state, client, skipPx);
						skipPx = o.container.maxOx;
						this.drawingObjects.push(o);
				}
		}

		//-------------------------------------------------------------------------------------
		public buildAnnotations(list: EcgAnnotation[], client: XDrawingClient) {
				let o: XDrawingObject;
				for (let z: number = 0; z < list.length; z++) {
						o = XDrawingObject.PrepareAnnotation(z, list[z], this.state, client);
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
		private collectChanges(sender: XDrawingChangeSender, event: any = null): XDrawingChange {
				//console.info("collect changes not implemented");
				let result: XDrawingChange = new XDrawingChange();
				result.sender = sender;
				result.curState = this.state;
				result.objects = new Array();
				result.clients = new Array();
				for (let z: number = 0; z < this.drawingObjects.length; z++) {
						if (this.drawingObjects[z].container.maxOx < this.state.minPx || this.drawingObjects[z].container.minOx > this.state.maxPx) continue;
						result.objects.push(this.drawingObjects[z]);
						//if (this.drawingObjects[z].container.left < this.state.skipPx)
				}
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

		//-------------------------------------------------------------------------------------
		public refreshDrawings() {
				let changes: XDrawingChange = this.collectChanges(XDrawingChangeSender.UpdateDrawings);
				this.onChangeState.emit(changes);
		}

		//-------------------------------------------------------------------------------------
		public preformClick(event: MouseEvent | TouchEvent) {
				let changes: XDrawingChange = this.collectChanges(XDrawingChangeSender.MouseClick, event);
				this.onChangeState.emit(changes);
		}

		//-------------------------------------------------------------------------------------
		public preformDbClick(event: MouseEvent) {
				let changes: XDrawingChange = this.collectChanges(XDrawingChangeSender.MouseDbClick, event);
				this.onChangeState.emit(changes);
		}


		//-------------------------------------------------------------------------------------
		public performDrag(event: any) {
				let changes: XDrawingChange = this.collectChanges(XDrawingChangeSender.Drag, event);
				this.onChangeState.emit(changes);
		}

		//-------------------------------------------------------------------------------------
		public performMouseMove(event: any) {
				let changes: XDrawingChange = this.collectChanges(XDrawingChangeSender.MouseMove, event);
				this.onChangeState.emit(changes);
		}
}
