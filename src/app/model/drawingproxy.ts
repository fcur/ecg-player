import { EventEmitter } from "@angular/core";
import { XDPSEvent, XDProxyState, XDChangeSender } from "./misc";
import {
	BeatsDrawingClient, IDrawingClient, SignalDrawingClient,
	XDrawingClient, XDrawingMode, AnsDrawingClient,
	CellDrawingClient, ClickablePointDrawingClient,
	CursorDrawingClient, GridCellDrawingClient,
	WavepointClient
} from "./drawingclient";
import {
	CursorDrawingObject, GridCellDrawingObject,
	WavepointDrawingObject, PeakDrawingObject,
	ClPointDrawingObject, CellDrawingObject,
	BeatsRangeDrawingObject, IDObject,
	XDrawingObjectType, AnsDrawingObject,
	XDrawingObject, SignalDrawingObject,
	WaveDrawingObject
} from "./drawingobject";
import { DrawingData } from "./drawingdata";
import {
	EcgWavePoint, EcgWavePointType, EcgAnnotation, EcgSignal,
	EcgAnnotationCode, EcgLeadCode, EcgRecord
} from "./ecgdata"
import { BehaviorSubject } from "rxjs";
import {
	XDrawingPrimitive, XDrawingPrimitiveState, XLabel,
	XLine, XPeak, XPoint, XPolyline, XRectangle
} from "./geometry";

// -------------------------------------------------------------------------------------------------
// DrawingProxy
// -------------------------------------------------------------------------------------------------
export class XDProxy {

	public lastEvent: XDPSEvent;

	public drawingData: DrawingData;
	//public onChangeState: EventEmitter<XDrawingChange>;
	public onPrepareDrawings: EventEmitter<IDObject[][]>;
	//public drawingObjects: IDrawingObject[];
	private _clients: IDrawingClient[]; // F2, F3
	//public objectsF2: IDrawingObject[][];
	// feature3
	/** All prepared drawing objects. */
	public doAll: IDObject[];
	/** HUD drawing objects, always visible on surface. */
	public doHud: IDObject[]; // grid
	/** Visible drawing objects. */
	public doVisible: IDObject[];
	/** Hidden from the left drawing objects. */
	public doHidLeft: IDObject[];
	/** Hidden from the right drawing objects. */
	public doHidRight: IDObject[];
	/** Groupped visible drawing objects [i][j].
		[i] - index of DO client, max(i)= clients.length-1
		[j] - index of DO
	*/
	public doCGroups: IDObject[][];

	//-------------------------------------------------------------------------------------
	public get state(): XDProxyState {
		return this.lastEvent.state;
	}
	//-------------------------------------------------------------------------------------
	public set state(v: XDProxyState) {
		this.lastEvent.state = v;
	}
	//-------------------------------------------------------------------------------------
	public get previousState(): XDProxyState {
		return this.lastEvent.previous;
	}
	//-------------------------------------------------------------------------------------
	constructor() {
		//console.info("DrawingProxy constructor");
		this.init();
	}

	//-------------------------------------------------------------------------------------
	public get drawingClients(): IDrawingClient[] {
		if (!this._clients) return [];
		return this._clients;
	}

	//-------------------------------------------------------------------------------------
	public pushClients(...items: IDrawingClient[]) {
		for (let z: number = 0; z < items.length; z++) {
			this._clients.push(items[z]);
		}
		this.doCGroups = new Array(this._clients.length);
	}

	//-------------------------------------------------------------------------------------
	public reset() {
		//console.info("drawing proxy not implemented");
	}

	//-------------------------------------------------------------------------------------
	public scroll(delta: number) {
		this.state.scroll(delta);
	}

	//-------------------------------------------------------------------------------------
	public get canDraw(): boolean {
		return this.doCGroups.length > 0 || this.doHud.length > 0;
	}

	//-------------------------------------------------------------------------------------
	private init() {
		//this.drawingObjects = [];
		this.lastEvent = new XDPSEvent();
		this._clients = [];
		this.doCGroups = [];
		this.doHud = [];
		this.doVisible = [];
		this.doHidLeft = [];
		this.doHidRight = [];
		this.drawingData = new DrawingData();
		this.state = new XDProxyState();
		//this.onChangeState = new EventEmitter<XDrawingChange>();
		this.onPrepareDrawings = new EventEmitter<IDObject[][]>();
	}

	//-------------------------------------------------------------------------------------
	public scrollDrawObjGroupsF3() {
		// TODO
		// movement < 0 >> scrolling forward, sort left, visible 
		// movement > 0 >> scrolling back, sort right, visible
		if (!Array.isArray(this.doAll) ||
			!Array.isArray(this.doVisible) ||
			!Array.isArray(this.doHidLeft) ||
			!Array.isArray(this.doHidRight)) return;

		this.resetDOF3Groups();
		// handle mouse actions (move, drag, click)
		//let log: string = "";
		//log += `\nV: ${this._doF3Viaible.length} L: ${this._doF3HidLeft.length} R: ${this._doF3HidRight.length} A: ${this._doF3All.length}`;
		let z: number,
			y: number,
			minOx: number,
			maxOx: number;

		this.doVisible.length = 0;
		this.doHidLeft.length = 0;
		this.doHidRight.length = 0;

		for (z = 0; z < this.doAll.length; z++) {
			minOx = this.doAll[z].container.minOx;
			maxOx = this.doAll[z].container.maxOx;
			if (maxOx < this.state.minPx) {
				this.doAll[z].hidden = true;
				this.doHidLeft.push(this.doAll[z]);
			} else if (minOx > this.state.maxPx) {
				this.doAll[z].hidden = true;
				this.doHidRight.push(this.doAll[z]);
			} else {
				this.doAll[z].hidden = false;
				this.doVisible.push(this.doAll[z]);
			}
		}

		//log += `\nV: ${this.doF3Visible.length} L: ${this.doF3HidLeft.length} R: ${this.doF3HidRight.length} A: ${this.doF3All.length}`;
		//console.log(`scrolling ${this.state.movDelta > 0 ? "back" : "forward"}`, this.state.skipPx, this.state.movDelta, log);
		this.sortDrawObjGroups();

		let ownerIndex: number, doAllIndex: number;

		for (z = 0; z < this.doVisible.length; z++) {
			doAllIndex = this.doAll.indexOf(this.doVisible[z]);
			if (doAllIndex < 0 || this.doAll[doAllIndex].hidden != this.doVisible[z].hidden) {
				console.warn("scrollDrawObjGroupsF3");
			}
			ownerIndex = this._clients.indexOf(this.doVisible[z].owner);
			if (ownerIndex < 0) continue;
			this.doCGroups[ownerIndex].push(this.doVisible[z]);
		}
	}

	//-------------------------------------------------------------------------------------
	public resetDOF3Groups() {
		for (let z: number = 0; z < this.doCGroups.length; z++) {
			if (Array.isArray(this.doCGroups[z])) {
				this.doCGroups[z].length = 0; // clear
				continue;
			}
			this.doCGroups[z] = [];
		}
	}

	//-------------------------------------------------------------------------------------
	public rebuildDrawObjGroupsF3() {
		// prepare groups of objects
		this.projectDrawObjF3();
		this.doVisible = [];
		this.doHidLeft = [];
		this.doHidRight = [];
		this.resetDOF3Groups();
		let z: number,
			minOx: number,
			maxOx: number;
		for (let z: number = 0; z < this.doAll.length; z++) {
			minOx = this.doAll[z].container.minOx;
			maxOx = this.doAll[z].container.maxOx;
			this.doAll[z].hidden = true;
			if (maxOx < this.state.minPx) {
				this.doHidLeft.push(this.doAll[z]);
			} else if (minOx > this.state.maxPx) {
				this.doHidRight.push(this.doAll[z]);
			} else {
				this.doVisible.push(this.doAll[z]);
			}
		}
		//console.log(`F3 visible: ${this.visibleObjectsF3.length} left: ${this.leftObjectsF3.length} right: ${this.rightObjectsF3.length}`)
	}

	//-------------------------------------------------------------------------------------
	public projectDrawObjF3() {
		let data: IDObject[] = new Array();
		// prepare list of drawing objects
		this.doAll = [];
		this.doHud = [];
		let z: number,
			y: number;
		for (z = 0; z < this._clients.length; z++) {
			data = this._clients[z].prepareAllDrawings(this.drawingData, this.state);
			for (y = 0; y < data.length; y++) {
				this.doAll.push(data[y]);
			}
		}
	}

	//-------------------------------------------------------------------------------------
	public sortDrawObjGroups() {
		// TODO: sort drawing objects vis start (left) position
		// compare sort methods
	}

	//-------------------------------------------------------------------------------------
	/** Start grabbage collection */
	public gc() {
		// handle proxy limits
		// remove unused objects
	}

	//-------------------------------------------------------------------------------------
	//private prepareFloatingObjects(left: number, top: number) {
	//  for (let z: number = 0; z < this.drawingObjects.length; z++) {
	//    if (!(this.drawingObjects[z] as XDrawingObject).isFloating) continue;

	//    let signalObjects: XDrawingObject[] = this.findSignal(this.state.skipPx + left, this.state);
	//    (this.drawingObjects[z] as XDrawingObject).floatTo(
	//      this.state.skipPx + left,
	//      this.state.container.top + top,
	//      signalObjects);
	//  }
	//}

	//-------------------------------------------------------------------------------------
	// Action emmiters
	//-------------------------------------------------------------------------------------

	//-------------------------------------------------------------------------------------
	public refreshDrawings() {
		//let changes: XDrawingChange = this.collectChanges(XDrawingChangeSender.UpdateDrawings);
		//let objects: IDrawingObject[][] = this.prepareDrawingObjectsF2();
		//console.info("proxy refresh drawings: ", this.objectsF2);
		//this.objectsF2 = this.prepareDrawingObjectsF2();
		//this.onChangeState.emit(changes);
		//this.onPrepareDrawings.emit(objects);

		this.onPrepareDrawings.emit([]/*this.objectsF2*/);
	}

	//-------------------------------------------------------------------------------------
	public preformClick(event: MouseEvent | TouchEvent) {
		//let changes: XDrawingChange = this.collectChanges(XDrawingChangeSender.MouseClick, event);
		//this.onChangeState.emit(changes);
	}

	//-------------------------------------------------------------------------------------
	public preformDbClick(event: MouseEvent) {
		//let changes: XDrawingChange = this.collectChanges(XDrawingChangeSender.MouseDbClick, event);
		//this.onChangeState.emit(changes);
	}


	//-------------------------------------------------------------------------------------
	public performDrag(event: any) {
		//let changes: XDrawingChange = this.collectChanges(XDrawingChangeSender.Drag, event);
		//this.onChangeState.emit(changes);
	}

	//-------------------------------------------------------------------------------------
	public performMouseMove(event: any) {
		if (!this.state.container) return;
		// TODO handle floating pointer
		//console.info("proxy: mouse move", this.state.pointerX, this.state.pointerY);
		this.prepareCursor(event);
		//this.prepareFloatingObjects(this.state.pointerX, this.state.pointerY);
		//let objects: IDrawingObject[][] = this.prepareDrawingObjectsF2();
		//console.info("proxy mouse move: ", this.objectsF2);
		//this.objectsF2 = this.prepareDrawingObjectsF2();
		//let changes: XDrawingChange = this.collectChanges(XDrawingChangeSender.MouseMove, event);
		//this.onChangeState.emit(changes);
		//this.onPrepareDrawings.emit(objects);
		let z1: number;

		for (z1 = 0; z1 < this.doVisible.length; z1++) {
			if (!this.doVisible[z1].hud) continue;
			this.doVisible[z1].updateState(this.drawingData, this.state);
		}

		//this.resetDOF3Groups();
		//let ownerIndex: number, doAllIndex: number;
		//for (z1 = 0; z1 < this.doF3Visible.length; z1++) {
		//	doAllIndex = this.doF3All.indexOf(this.doF3Visible[z1]);
		//	if (doAllIndex < 0 || this.doF3All[doAllIndex].hidden != this.doF3Visible[z1].hidden) {
		//		console.warn("scrollDrawObjGroupsF3");
		//	}
		//	ownerIndex = this._clients.indexOf(this.doF3Visible[z1].owner);
		//	if (ownerIndex < 0) continue;
		//	this.doF3CGroups[ownerIndex].push(this.doF3Visible[z1]);
		//}

		this.onPrepareDrawings.emit([]/*this.objectsF2*/);
		// add/update floating point client
		//this._doF3Viaible.push()
	}


	//-------------------------------------------------------------------------------------
	public prepareCursor(event: any) {
		let proxyX: number = event.clientX - this.state.screen.left;
		let proxyY: number = event.clientY - this.state.screen.top;
		if (proxyX < 0 || proxyX > this.state.container.width ||
			proxyY < 0 || proxyY > this.state.container.height) return;
		this.state.savePointerPosition(proxyX, proxyY);
		this.state.saveClientPosition(event.clientX, event.clientY);
	}

}
