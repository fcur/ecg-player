import { EventEmitter } from "@angular/core";
import { XDrawingChange, XDrawingProxyState, XDrawingChangeSender } from "./misc";
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
	BeatsRangeDrawingObject, IDrawingObject,
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
export class XDrawingProxy {
	public state: XDrawingProxyState;
	public drawingData: DrawingData;
	//public onChangeState: EventEmitter<XDrawingChange>;
	public onPrepareDrawings: EventEmitter<IDrawingObject[][]>;
	//public drawingObjects: IDrawingObject[];
	private _clients: IDrawingClient[]; // F2, F3
	//public objectsF2: IDrawingObject[][];
	// feature3
	/** All prepared drawing objects. */
	public doF3All: IDrawingObject[];
	/** HUD drawing objects, always visible on surface. */
	public doF3Hud: IDrawingObject[];
	/** Visible drawing objects. */
	public doF3Visible: IDrawingObject[];
	/** Hidden from the left drawing objects. */
	public doF3HidLeft: IDrawingObject[];
	/** Hidden from the right drawing objects. */
	public doF3HidRight: IDrawingObject[];
	/** Groupped visible drawing objects [i][j].
		[i] - index of DO client, max(i)= clients.length-1
		[j] - index of DO
	*/
	public doF3CGroups: IDrawingObject[][];


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
		this.doF3CGroups = new Array(this._clients.length);
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
		return this.doF3CGroups.length > 0 || this.doF3Hud.length > 0;
	}

	//-------------------------------------------------------------------------------------
	private init() {
		//this.drawingObjects = [];
		this._clients = [];
		this.doF3CGroups = [];
		this.doF3Hud = [];
		this.doF3Visible = [];
		this.doF3HidLeft = [];
		this.doF3HidRight = [];
		this.drawingData = new DrawingData();
		this.state = new XDrawingProxyState();
		//this.onChangeState = new EventEmitter<XDrawingChange>();
		this.onPrepareDrawings = new EventEmitter<IDrawingObject[][]>();
	}

	//-------------------------------------------------------------------------------------
	public scrollDrawObjGroupsF3() {
		// TODO
		// movement < 0 >> scrolling forward, sort left, visible 
		// movement > 0 >> scrolling back, sort right, visible
		if (!Array.isArray(this.doF3All) ||
			!Array.isArray(this.doF3Visible) ||
			!Array.isArray(this.doF3HidLeft) ||
			!Array.isArray(this.doF3HidRight)) return;

		this.resetDOF3Groups();
		// handle mouse actions (move, drag, click)
		//let log: string = "";
		//log += `\nV: ${this._doF3Viaible.length} L: ${this._doF3HidLeft.length} R: ${this._doF3HidRight.length} A: ${this._doF3All.length}`;
		let z: number,
			y: number,
			minOx: number,
			maxOx: number;

		this.doF3Visible.length = 0;
		this.doF3HidLeft.length = 0;
		this.doF3HidRight.length = 0;

		for (z = 0; z < this.doF3All.length; z++) {
			minOx = this.doF3All[z].container.minOx;
			maxOx = this.doF3All[z].container.maxOx;
			if (maxOx < this.state.minPx) {
				this.doF3All[z].hidden = true;
				this.doF3HidLeft.push(this.doF3All[z]);
			} else if (minOx > this.state.maxPx) {
				this.doF3All[z].hidden = true;
				this.doF3HidRight.push(this.doF3All[z]);
			} else {
				this.doF3All[z].hidden = false;
				this.doF3Visible.push(this.doF3All[z]);
			}
		}

		//log += `\nV: ${this.doF3Visible.length} L: ${this.doF3HidLeft.length} R: ${this.doF3HidRight.length} A: ${this.doF3All.length}`;
		//console.log(`scrolling ${this.state.movDelta > 0 ? "back" : "forward"}`, this.state.skipPx, this.state.movDelta, log);
		this.sortDrawObjGroups();

		let ownerIndex: number, doAllIndex: number;

		for (z = 0; z < this.doF3Visible.length; z++) {
			doAllIndex = this.doF3All.indexOf(this.doF3Visible[z]);
			if (doAllIndex < 0 || this.doF3All[doAllIndex].hidden != this.doF3Visible[z].hidden) {
				console.warn("scrollDrawObjGroupsF3");
			}
			ownerIndex = this._clients.indexOf(this.doF3Visible[z].owner);
			if (ownerIndex < 0) continue;
			this.doF3CGroups[ownerIndex].push(this.doF3Visible[z]);
		}
	}

	//-------------------------------------------------------------------------------------
	public resetDOF3Groups() {
		for (let z: number = 0; z < this.doF3CGroups.length; z++) {
			if (Array.isArray(this.doF3CGroups[z])) {
				this.doF3CGroups[z].length = 0; // clear
				continue;
			}
			this.doF3CGroups[z] = [];
		}
	}

	//-------------------------------------------------------------------------------------
	public rebuildDrawObjGroupsF3() {
		// prepare groups of objects
		this.projectDrawObjF3();
		this.doF3Visible = [];
		this.doF3HidLeft = [];
		this.doF3HidRight = [];
		this.resetDOF3Groups();
		let z: number,
			minOx: number,
			maxOx: number;
		for (let z: number = 0; z < this.doF3All.length; z++) {
			minOx = this.doF3All[z].container.minOx;
			maxOx = this.doF3All[z].container.maxOx;
			this.doF3All[z].hidden = true;
			if (maxOx < this.state.minPx) {
				this.doF3HidLeft.push(this.doF3All[z]);
			} else if (minOx > this.state.maxPx) {
				this.doF3HidRight.push(this.doF3All[z]);
			} else {
				this.doF3Visible.push(this.doF3All[z]);
			}
		}
		//console.log(`F3 visible: ${this.visibleObjectsF3.length} left: ${this.leftObjectsF3.length} right: ${this.rightObjectsF3.length}`)
	}

	//-------------------------------------------------------------------------------------
	public projectDrawObjF3() {
		let data: IDrawingObject[] = new Array();
		// prepare list of drawing objects
		this.doF3All = [];
		this.doF3Hud = [];
		let z: number,
			y: number;
		for (z = 0; z < this._clients.length; z++) {
			//data = this._clientsF2[z].prepareDrawings(this.drawingData, this.state);
			data = this._clients[z].prepareAllDrawings(this.drawingData, this.state);
			for (y = 0; y < data.length; y++) {
				this.doF3All.push(data[y]);
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

		for (z1 = 0; z1 < this.doF3Visible.length; z1++) {
			if (!this.doF3Visible[z1].hud) continue;
			this.doF3Visible[z1].updateState(this.drawingData,this.state);
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
		this.state.pointerX = proxyX;
		this.state.pointerY = proxyY;
	}

}
