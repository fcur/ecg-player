import * as Long from "@types/long";
import { EventEmitter } from "@angular/core";
import { XDrChange, XDrMode, XDrProxyState, XDrClient, XDrObject } from "./misc";


// -------------------------------------------------------------------------------------------------
// DrawingProxy
// -------------------------------------------------------------------------------------------------
export class XDrawingProxy {
	public state: XDrProxyState;
	public onChangeState: EventEmitter<XDrChange>;
	public drawingObjects: XDrObject[];

	//-------------------------------------------------------------------------------------
	constructor() {
		console.info("DrawingProxy constructor");
		this.init();
	}

	//-------------------------------------------------------------------------------------
	public addDrawingObject(o: XDrObject) {
		this.drawingObjects.push(o);
	}

	//-------------------------------------------------------------------------------------
	private init() {
		this.onChangeState = new EventEmitter<XDrChange>();
		this.drawingObjects = [];
	}

	//-------------------------------------------------------------------------------------
	private collectChanges(): XDrChange {
		console.info("collect changes not implemented");
		let result: XDrChange = new XDrChange();
		return result;
	}


	//-------------------------------------------------------------------------------------
	public gc() {
		// remove unused objects
	}






	//-------------------------------------------------------------------------------------
	public preformClick(event: MouseEvent | TouchEvent) {
		let changes: XDrChange = this.collectChanges();
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
