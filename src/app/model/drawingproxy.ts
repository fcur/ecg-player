import { EventEmitter } from "@angular/core";
import { XDrawingChange, XDrawingProxyState, XDrawingChangeSender } from "./misc";
import {
	BeatsDrawingClient, IDrawingClient, SignalDrawingClient,
	XDrawingClient, XDrawingMode, AnsDrawingClient,
	CellDrawingClient, ClickablePointDrawingClient,
	FPointDrawingClient, GridCellDrawingClient
} from "./drawingclient";
import {
	XDrawingObject, XDrawingObjectType, AnsDrawingObject,
	BeatsDrawingObject, IDrawingObject
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
	private _clientsF2: IDrawingClient[];
	public objectsF2: IDrawingObject[][];

	// feature3
	public allObjectsF3: IDrawingObject[];
	public visibleObjectsF3: IDrawingObject[];
	public leftObjectsF3: IDrawingObject[];
	public rightObjectsF3: IDrawingObject[];


	//-------------------------------------------------------------------------------------
	constructor() {
		//console.info("DrawingProxy constructor");
		this.init();
		//this.f3Test();
	}

	//-------------------------------------------------------------------------------------
	public f3Test() {
		let objCount: number = 15, leftCount: number = 3, visibleCount: number = 9, rightCount: number = 3;
		let z: number, y: number, x: number;

		let clients: XDrawingClient[] = [
			new ClickablePointDrawingClient(),
			new GridCellDrawingClient(),
			new FPointDrawingClient(),
			new SignalDrawingClient(),
			new BeatsDrawingClient(),
			new BeatsDrawingClient(),
			new CellDrawingClient(),
			new AnsDrawingClient(),
			new XDrawingClient()
		];

		this.allObjectsF3 = new Array(objCount);
		let xdo: XDrawingObject;
		for (z = 0, y = 0; z < this.allObjectsF3.length; z++ , y++) {
			if (y >= clients.length) y = 0;
			xdo = new XDrawingObject();
			xdo.index = z;
			xdo.cellIndex = z;
			xdo.container = new XRectangle(0, 0, 300, 100);
			xdo.owner = clients[y];
			this.allObjectsF3[z] = xdo;
		}

		this.leftObjectsF3 = new Array(leftCount); // 30
		this.visibleObjectsF3 = new Array(visibleCount); // 90
		this.rightObjectsF3 = new Array(rightCount); // 30

		let dest: IDrawingObject[];

		for (z = 0, y = 0, x = 0; z < this.allObjectsF3.length; z++ , y++) {
			if (z < leftCount) {
				dest = this.leftObjectsF3;
				y = z;
			} else if (leftCount <= z && z < visibleCount + leftCount) {
				dest = this.visibleObjectsF3;
				y = z - leftCount;
			} else if (z >= visibleCount + leftCount) {
				dest = this.rightObjectsF3;
				y = z - (visibleCount + leftCount);
			}
			dest[y] = this.allObjectsF3[z];
		}

		//console.info("OBJECTS: INIT", "\nall:", this.allObjects, "\nleft: ", this.leftObjects, "\nvisible:", this.visibleObjects, "\nright:", this.rightObjects);
		//let ti: number = 25;
		//let la: XDrawingObject, va: XDrawingObject, ra: XDrawingObject, laIndex: number, vaIndex: number, raIndex: number;

		//la = this.leftObjects[ti]; // this.allObjects[ti]
		//va = this.visibleObjects[ti]; //this.allObjects[ti + leftCount]
		//ra = this.rightObjects[ti]; //this.allObjects[ti + leftCount + visibleCount]
		//laIndex = this.leftObjects.indexOf(la); // 25
		//vaIndex = this.visibleObjects.indexOf(va);// 25
		//raIndex = this.rightObjects.indexOf(ra);// 25
		//la.cellIndex = 112;
		//va.cellIndex = 112;
		//ra.cellIndex = 112;


		let start: number, deleteCount: number, newLeft: XDrawingObject, newVisible: XDrawingObject, newRight: XDrawingObject;
		// scroll left
		// first v > last l, first r > last v

		start = 0; deleteCount = 1;
		newLeft = this.visibleObjectsF3.splice(start, deleteCount)[0] as XDrawingObject;
		newLeft.cellIndex--; // -2
		//this.leftObjects.push(newLeft);
		start = this.leftObjectsF3.length; deleteCount = 0;
		this.leftObjectsF3.splice(start, deleteCount, newLeft); // add to end of array

		start = 0; deleteCount = 1;
		newVisible = this.rightObjectsF3.splice(start, deleteCount)[0] as XDrawingObject;
		newVisible.cellIndex--; // -2
		//this.visibleObjects.push(newVisible);
		start = this.visibleObjectsF3.length; deleteCount = 0;
		this.visibleObjectsF3.splice(start, deleteCount, newVisible); // add to end of array

		//console.info("\n\nOBJECTS: SCROLL LEFT", "\nall:", this.allObjects, "\nleft: ", this.leftObjects, "\nvisible:", this.visibleObjects, "\nright:", this.rightObjects);

		// scroll right (restore initial state)
		// last v > first r, last l > first v
		start = this.visibleObjectsF3.length - 1;
		deleteCount = 1;
		newRight = this.visibleObjectsF3.splice(start, deleteCount)[0] as XDrawingObject;
		newRight.cellIndex++; // -1
		start = 0; deleteCount = 0;
		this.rightObjectsF3.splice(start, deleteCount, newRight); // add to start of array

		start = this.leftObjectsF3.length - 1;
		deleteCount = 1;
		newVisible = this.leftObjectsF3.splice(start, deleteCount)[0] as XDrawingObject;
		newVisible.cellIndex++; // -1
		start = 0; deleteCount = 0;
		this.visibleObjectsF3.splice(start, deleteCount, newVisible); // add to start of array

		// release refferences
		newLeft = null; newVisible = null; newRight = null;

		//console.info("\n\nOBJECTS: SCROLL RIGHT", "\nall:", this.allObjects, "\nleft: ", this.leftObjects, "\nvisible:", this.visibleObjects, "\nright:", this.rightObjects);


		let omap: Map<string, XDrawingObject> = new Map();
		omap.set("first-left", this.leftObjectsF3[0] as XDrawingObject);
		omap.set("last-left", this.leftObjectsF3[this.leftObjectsF3.length - 1] as XDrawingObject);
		omap.set("first-visible", this.visibleObjectsF3[0] as XDrawingObject);
		omap.set("last-visible", this.visibleObjectsF3[this.visibleObjectsF3.length - 1] as XDrawingObject);
		omap.set("first-right", this.rightObjectsF3[0] as XDrawingObject);
		omap.set("last-right", this.rightObjectsF3[this.rightObjectsF3.length - 1] as XDrawingObject);
		//  {
		//  "first-left": this.leftObjects[0],
		//  "last-left": this.leftObjects[this.leftObjects.length - 1],
		//  "first-visible": this.visibleObjects[0],
		//  "last-visible": this.visibleObjects[this.visibleObjects.length - 1],
		//  "first-right": this.rightObjects[0],
		//  "last-right": this.rightObjects[this.rightObjects.length - 1],
		//};
		//omap["first-left"].cellIndex = 112;
		//omap["last-left"].cellIndex = 911;
		//omap["first-visible"].cellIndex = 112;
		//omap["last-visible"].cellIndex = 911;
		//omap["first-right"].cellIndex = 112;
		//omap["last-right"].cellIndex = 911;

		omap.get("first-left").cellIndex = 112;
		omap.get("last-left").cellIndex = 911;
		omap.get("first-visible").cellIndex = 112;
		omap.get("last-visible").cellIndex = 911;
		omap.get("first-right").cellIndex = 112;
		omap.get("last-right").cellIndex = 911;
		console.info("\n\nMap", "\nall:", this.allObjectsF3, "\nleft: ", this.leftObjectsF3, "\nvisible:", this.visibleObjectsF3, "\nright:", this.rightObjectsF3);
	}

	//-------------------------------------------------------------------------------------
	//public addClient(v: IDrawingClient) {
	//  this._clientsF2.push(v);
	//}

	//-------------------------------------------------------------------------------------
	public get drawingClients(): IDrawingClient[] {
		if (!this._clientsF2) return [];
		return this._clientsF2;
	}

	//-------------------------------------------------------------------------------------
	public pushClients(...items: IDrawingClient[]) {
		for (let z: number = 0; z < items.length; z++) {
			this._clientsF2.push(items[z]);
		}
	}

	//-------------------------------------------------------------------------------------
	public reset() {
		//console.info("drawing proxy not implemented");
	}

	//-------------------------------------------------------------------------------------
	public scroll(delta: number) {
		this.state.scroll = -delta;
	}

	//-------------------------------------------------------------------------------------
	//public buildWavepoints(list: EcgRecord[], client: XDrawingClient) {
	//  //console.info("prepare wavepoints for client", "create XDrawingObject for eacg  EcgWavePoint element.");
	//  let o: XDrawingObject;
	//  // TODO group wavepoints
	//  for (let z: number = 0; z < list.length - 1; z++) {
	//    for (let y: number = 0; y < list[z].wavePoints.length; y++) {
	//      o = XDrawingObject.PreparePqrstComplex(y,
	//        [list[z].wavePoints[y], list[z].wavePoints[y + 1]],
	//        [y, y + 1],
	//        this.state, client, list[z].signal.channels[0].length);
	//      this.drawingObjects.push(o);
	//    }
	//  }
	//}

	//-------------------------------------------------------------------------------------
	//public buildSignal(list: EcgRecord[], client: XDrawingClient) {
	//  if (!Array.isArray(list) || !client) return;
	//  let o: XDrawingObject;
	//  let s: EcgSignal;
	//  let skipPx: number = 0;
	//  for (let z: number = 0; z < list.length; z++) {
	//    o = XDrawingObject.PrepareSignal(z, list[z].signal, this.state, client, skipPx);
	//    skipPx = o.container.maxOx;
	//    this.drawingObjects.push(o);
	//  }
	//}

	//-------------------------------------------------------------------------------------
	//public buildBeats(list: EcgRecord[], client: XDrawingClient, pinBeats: boolean) {
	//  if (!Array.isArray(list) || !client) return;
	//  let o: XDrawingObject;
	//  let skipPx: number = 0;
	//  for (let z: number = 0; z < list.length; z++) {
	//    if (!Array.isArray(list[z].beats)) continue; // beats

	//    let signalObjects: XDrawingObject[] = this.findSignal(skipPx, this.state);

	//    o = XDrawingObject.PrepareBeats(z, signalObjects, list[z].beats, this.state, client, skipPx, list[z].signal.channels[0].length, pinBeats);
	//    this.drawingObjects.push(o);
	//    skipPx = o.container.maxOx;
	//  }
	//}

	//-------------------------------------------------------------------------------------
	//public buildFloatingPeaks(list: EcgRecord[], client: XDrawingClient, rowIndex: number) {
	//  let o: XDrawingObject;
	//  let skipPx: number = 0;

	//  // use beats positions as peaks positions
	//  for (let z: number = 0; z < list.length; z++) {
	//    if (!Array.isArray(list[z].beats)) continue; // beats

	//  }
	//  this.drawingObjects.push(o);
	//  skipPx = o.container.maxOx;
	//}

	//-------------------------------------------------------------------------------------
	//public buildFloatingObjects(client: XDrawingClient) {
	//  let obj: XDrawingObject = XDrawingObject.PrepareFloatingDrawings(client, this.state);
	//  this.drawingObjects.push(obj);
	//  //for (let z: number = 0; z < this.state.gridCells.length; z++) {
	//  //  // prepare floating peak for each grid
	//  //}
	//}

	//-------------------------------------------------------------------------------------
	//private findSignal(skipPx: number, state: XDrawingProxyState): XDrawingObject[] {
	//  let result = new Array();
	//  // TODO: use skipPx for array of records
	//  for (let z: number = 0; z < this.drawingObjects.length; z++) {
	//    if (this.drawingObjects[z].container.maxOx < state.minPx
	//      || this.drawingObjects[z].container.minOx > state.maxPx
	//      || this.drawingObjects[z].type != XDrawingObjectType.Signal) continue;
	//    result.push(this.drawingObjects[z]);
	//  }
	//  return result;
	//}

	//-------------------------------------------------------------------------------------
	//public buildAnnotations(list: EcgRecord[], client: XDrawingClient) {
	//  let o: XDrawingObject;
	//  for (let z: number = 0; z < list.length; z++) {
	//    for (let y: number = 0; y < list[z].annotations.length; y++) {
	//      o = XDrawingObject.PrepareAnnotation(z, list[z].annotations[y], this.state, client);
	//      this.drawingObjects.push(o)
	//    }
	//  }
	//}

	//-------------------------------------------------------------------------------------
	//public addDrawingObject(o: XDrawingObject) {
	//  this.drawingObjects.push(o);
	//}

	//-------------------------------------------------------------------------------------
	private init() {
		//this.drawingObjects = [];
		this._clientsF2 = new Array();
		this.drawingData = new DrawingData();
		this.state = new XDrawingProxyState();
		//this.onChangeState = new EventEmitter<XDrawingChange>();
		this.onPrepareDrawings = new EventEmitter<IDrawingObject[][]>();
	}

	//-------------------------------------------------------------------------------------
	//private collectChanges(sender: XDrawingChangeSender, event: any = null): XDrawingChange {
	//  //console.info("collect changes not implemented");
	//  let result: XDrawingChange = new XDrawingChange();
	//  result.sender = sender;
	//  result.curState = this.state;
	//  result.objects = new Array();
	//  result.clients = new Array();
	//  let outOfRange: boolean = true;
	//  for (let z: number = 0; z < this.drawingObjects.length; z++) {
	//    outOfRange = this.drawingObjects[z].container.maxOx < this.state.minPx
	//      || this.drawingObjects[z].container.minOx > this.state.maxPx;
	//    if (outOfRange) continue;
	//    result.objects.push(this.drawingObjects[z]);
	//    //if (this.drawingObjects[z].container.left < this.state.skipPx)
	//  }
	//  return result;
	//}

	//-------------------------------------------------------------------------------------
	public prepareDrawingObjectsF2(): IDrawingObject[][] {
		let data: IDrawingObject[][] = new Array();
		for (let z: number = 0; z < this._clientsF2.length; z++) {
			data[z] = this._clientsF2[z].prepareDrawings(this.drawingData, this.state);
			//data = data.concat(this._clientsF2[z].prepareDrawings(this.drawingData, this.state));
		}
		return data;
	}

	//-------------------------------------------------------------------------------------
	public rebuildDrawObjGroupsF3() {
		// prepare groups of objects
		this.projectDrawObjF3();
		this.visibleObjectsF3 = new Array();
		this.leftObjectsF3 = new Array();
		this.rightObjectsF3 = new Array();
		let z: number;
		for (let z: number = 0; z < this.allObjectsF3.length; z++) {
			// if(allObjectsF3[z].end < state.start) >> leftObjectsF3
			// else if (allObjectsF3[z] in state) >> visibleObjectsF3
			// else allObjectsF3[z] >> visibleObjectsF3
		}
	}

	//-------------------------------------------------------------------------------------
	public projectDrawObjF3() {
		let data: IDrawingObject[] = new Array();
		// prepare list of drawing objects
		this.allObjectsF3 = new Array();
		let z: number, y: number;
		for (z= 0; z < this._clientsF2.length; z++) {
			data = this._clientsF2[z].prepareDrawings(this.drawingData, this.state);
			//data = this._clientsF2[z].prepareDrawings2(this.drawingData);
			for (y = 0; y < data.length; y++) {
				this.allObjectsF3.push(data[y]);
			}
		}
	}

	//-------------------------------------------------------------------------------------
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
		this.objectsF2 = this.prepareDrawingObjectsF2();
		//this.onChangeState.emit(changes);
		//this.onPrepareDrawings.emit(objects);
		this.onPrepareDrawings.emit(this.objectsF2);
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
		//console.info("proxy: mouse move", proxyX, proxyY);
		this.preparePointer(event);
		//this.prepareFloatingObjects(this.state.pointerX, this.state.pointerY);
		//let objects: IDrawingObject[][] = this.prepareDrawingObjectsF2();
		//console.info("proxy mouse move: ", this.objectsF2);
		this.objectsF2 = this.prepareDrawingObjectsF2();
		//let changes: XDrawingChange = this.collectChanges(XDrawingChangeSender.MouseMove, event);
		//this.onChangeState.emit(changes);
		//this.onPrepareDrawings.emit(objects);
		this.onPrepareDrawings.emit(this.objectsF2);
	}


	//-------------------------------------------------------------------------------------
	public preparePointer(event: any) {
		let proxyX: number = event.clientX - this.state.screen.left;
		let proxyY: number = event.clientY - this.state.screen.top;
		if (proxyX < 0 || proxyX > this.state.container.width ||
			proxyY < 0 || proxyY > this.state.container.height) return;
		this.state.pointerX = proxyX;
		this.state.pointerY = proxyY;
	}

}
