import { EventEmitter } from "@angular/core";
import {
	XDPSEvent, XDProxyState, XDChangeSender, XAnimation,
	XAnimationType, XCanvasTool, XDCell, XDChangeType,
	XDCoordinates, XDGridMode, XMatrixTool, CursorType
} from "./misc";
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
	XDOType, AnsDrawingObject,
	XDrawingObject, SignalDrawingObject,
	WaveDrawingObject, XDOChangeType
} from "./drawingobject";
import { DrawingData } from "./drawingdata";
import {
	EcgWavePoint, EcgWavePointType, EcgAnnotation, EcgSignal,
	EcgAnnotationCode, EcgLeadCode, EcgRecord
} from "./ecgdata"
import { Subscription, BehaviorSubject } from "rxjs";
import {
	XDrawingPrimitive, XDPrimitiveState, XLabel,
	XLine, XPeak, XPoint, XPolyline, XRectangle
} from "./geometry";

// -------------------------------------------------------------------------------------------------
// DrawingProxy
// -------------------------------------------------------------------------------------------------
export class XDProxy {

	public lastEvent: XDPSEvent;

	public drawingData: DrawingData;
	public onChangeState: EventEmitter<XDPSEvent>;
	
	//public drawingObjects: IDrawingObject[];
	private _clients: IDrawingClient[]; // F2, F3

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
		return this.lastEvent.currentState;
	}
	//-------------------------------------------------------------------------------------
	public get canDragWaveform(): boolean {
		return this.lastEvent.currentState.canDrag;
	}
	//-------------------------------------------------------------------------------------
	public get previousState(): XDProxyState {
		return this.lastEvent.previousState;
	}
	//-------------------------------------------------------------------------------------
	public get drawingClients(): IDrawingClient[] {
		if (!this._clients) return [];
		return this._clients;
	}
	//-------------------------------------------------------------------------------------
	public get scrollWaveform(): boolean {
		return this.lastEvent.previousState.minPx != this.lastEvent.currentState.minPx;
	}

	//-------------------------------------------------------------------------------------
	constructor() {
		//console.info("DrawingProxy constructor");
		this.init();
	}

	//-------------------------------------------------------------------------------------------------
	public updatePrevState() {
		let p: XDProxyState = this.lastEvent.previousState;
		let c: XDProxyState = this.lastEvent.currentState;

		// TODO: merge currnt&previous proxy states
		p.skipPx = c.skipPx;
		p.dragPosition.rebuild(c.dragPosition.left, c.dragPosition.top);
		p.target = c.target;
	}

	//-------------------------------------------------------------------------------------
	public pushClients(...items: IDrawingClient[]) {
		for (let z: number = 0; z < items.length; z++) {
			this._clients.push(items[z]);
		}
		this.doCGroups = new Array(this._clients.length);
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
		this.onChangeState = new EventEmitter<XDPSEvent>();
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
	public pushUpdate() {
		//let timeNow: number = Date.now();
		//if (timeNow - this.lastEvent.timeStamp > 300) {
		//	this.lastEvent.timeStamp = timeNow;
		//	this.lastEvent.count++;
		//	this.onChangeState.emit(this.lastEvent);
		//}
		if (!this.lastEvent.notify) return;
		this.lastEvent.count++;
		this.onChangeState.emit(this.lastEvent);
	}

	//-------------------------------------------------------------------------------------
	//public updateWaveformDrag(endpoint: XPoint) {
	//	let actionPoint: XPoint = this.state.dragPosition.subtract(endpoint);
	//	this.updatePrevState();
	//	this.lastEvent.currentState.scroll(actionPoint.left);
	//	this.lastEvent.currentState.dragPosition.rebuild(endpoint.left, endpoint.top);
	//}


	//-------------------------------------------------------------------------------------
	//public startDtag(v: XPoint) {
	//	this.lastEvent.currentState.updateDragStart(v);
	//}

	//-------------------------------------------------------------------------------------
	public scrollDrawObjGroupsF3() {
		//console.info("scrollDrawObjGroupsF3", this.state.skipPx);
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
		//console.info("rebuildDrawObjGroupsF3");
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
	public forceDrRefresh() {
		this.lastEvent.type = XDChangeType.ForceRefresh;
		this.pushUpdate();
	}

	//-------------------------------------------------------------------------------------
	public performDragStart(event: MouseEvent | TouchEvent) {
		let v: XPoint = this.getEventPosition(event);
		this.updatePrevState();
		//this.lastEvent.previousState.dragPosition.rebuild(v.left, v.top);
		this.lastEvent.currentState.dragPosition.rebuild(v.left, v.top);
		this.lastEvent.cursor = CursorType.Grab;
		this.pushUpdate();
	}

	//-------------------------------------------------------------------------------------
	public performDragMove(event: MouseEvent | TouchEvent) {
		if (!this.state.container) return;

		let endpoint: XPoint = this.getEventPosition(event);
		let move: XPoint = this.state.dragPosition.subtract(endpoint);
		this.updatePrevState();
		this.lastEvent.currentState.dragPosition.rebuild(endpoint.left, endpoint.top);
		this.moveCursor(event);
		// detect drawing object under cursor

		let target: IDObject = this.state.target, z1: number;

		if (target == null) {
			let di: number = this.findDrawingObjectIndex(
				this.state.pointerX + this.state.skipPx,
				this.state.pointerY);
			console.info("grab new rectangle");
			target = di > -1 ? this.doVisible[di] : null;
		}
		

		if (target != null && (target.draggable || target.changeable)) {
			this.lastEvent.type = XDChangeType.Change;
			//this.lastEvent.cursor = CursorType.Move;
			// change DO position/size
			target.owner.drag(move.left, move.top, target, this.state, this.drawingData);
			this.forceUpdate();
		} else {
			this.lastEvent.currentState.scroll(move.left);
			this.lastEvent.type = XDChangeType.Scroll;
			this.lastEvent.cursor = CursorType.EResize;
			// scroll data
			if (this.scrollWaveform) {
				this.scrollDrawObjGroupsF3();
			}
		}
		//this.updateWaveformDrag(this.getEventPosition(event));
		this.lastEvent.sender = XDChangeSender.Drag;
		this.pushUpdate();
	}


	//-------------------------------------------------------------------------------------
	public performDragStop() {
		this.updatePrevState(); // optional
		this.lastEvent.cursor = CursorType.Grab;
		this.lastEvent.previousState.resetDrag();
		this.lastEvent.currentState.resetDrag();
		this.pushUpdate();
	}

	//-------------------------------------------------------------------------------------
	public performMouseClick(event: MouseEvent | TouchEvent) {
		// TODO: merge results with 3X4 grid layot
		//console.info("proxy: preformClick");
		this.prepareCursor(event); // optional
		let target: IDObject = this.state.target;

		if (target == null) {
			let di: number = this.findDrawingObjectIndex(
				this.state.pointerX + this.state.skipPx,
				this.state.pointerY);
			target = di > -1 ? this.doVisible[di] : null;
		}

		if (target != null) {
			target.owner.select(target, this.state);
			this.lastEvent.type = XDChangeType.Change;
			this.lastEvent.sender = XDChangeSender.MouseClick;
			this.pushUpdate();
		}
	}

	//-------------------------------------------------------------------------------------
	public preformDbClick(event: MouseEvent) {
		//let changes: XDrawingChange = this.collectChanges(XDrawingChangeSender.MouseDbClick, event);
		//this.onChangeState.emit(changes);
	}

	//-------------------------------------------------------------------------------------
	private findDrawingObjectIndex(left: number, top: number): number {
		let z1: number,
			zindex: number = -1,
			r: number = -1;
		for (z1 = 0; z1 < this.doVisible.length; z1++) {
			if (!this.doVisible[z1].checkPosition(left, top) ||
				this.doVisible[z1].container.zIndex < zindex) continue;
			zindex = this.doVisible[z1].container.zIndex;
			r = z1;
		}
		return r;
	}

	//-------------------------------------------------------------------------------------
	public performCursorMove(event: MouseEvent | TouchEvent) {
		if (!this.state.container) return;
		this.updatePrevState();
		this.moveCursor(event);
		let l: number = this.state.pointerX + this.state.skipPx,
			t: number = this.state.pointerY;
		//console.log(l, t);
		let di: number = this.findDrawingObjectIndex(l, t),
			z1: number = 0,
			target: IDObject = null,
			draggable: boolean = false;

		if (di > -1) {
			target = this.doVisible[di];
			draggable = target.draggable;
			this.lastEvent.currentState.target = target;
		} else {
			this.lastEvent.currentState.target = null;
		}

		this.lastEvent.cursor = draggable ? CursorType.Move : (di > -1 ? CursorType.Pointer : CursorType.Grab);
		for (; z1 < this.doVisible.length; z1++) {
			this.doVisible[z1].owner.hover(z1 === di, this.doVisible[z1], this.state);
		}

		this.lastEvent.type = XDChangeType.ForceRefresh;
		this.lastEvent.sender = XDChangeSender.MouseHover;
		this.pushUpdate();
	}

	//----------------------------------------------------------------------------------------------
	private getEventPosition(event: any): XPoint {
		// TODO: handle device pixel ratio
		let left: number = 0, top: number = 0;
		if (event.clientX) {
			left = event.clientX;
			top = event.clientY;
		} else if (event.touches && event.touches[0]) {
			left = event.touches[0].clientX;
			top = event.touches[0].clientY;
		}
		return new XPoint(left, top);
	}

	//-------------------------------------------------------------------------------------
	private prepareCursor(event: any) {
		let proxyX: number = event.clientX - this.state.screen.left;
		let proxyY: number = event.clientY - this.state.screen.top;
		if (proxyX < 0 || proxyX > this.state.container.width ||
			proxyY < 0 || proxyY > this.state.container.height) return;
		this.state.savePointerPosition(proxyX, proxyY);
		this.state.saveClientPosition(event.clientX, event.clientY);
	}

	//-------------------------------------------------------------------------------------
	private moveCursor(event: any) {
		this.prepareCursor(event);
		let z1: number;
		for (z1 = 0; z1 < this.doVisible.length; z1++) {
			if (!this.doVisible[z1].hud) continue;
			this.doVisible[z1].updateState(this.drawingData, this.state);
		}
	}

	//-------------------------------------------------------------------------------------
	private forceUpdate() {
		let z1: number;
		for (z1 = 0; z1 < this.doVisible.length; z1++) {
			if (!this.doVisible[z1].alwaysUpdate) continue;
			this.doVisible[z1].updateState(this.drawingData, this.state);
		}
	}



}
