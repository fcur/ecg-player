import {
	Component, OnInit, ElementRef, HostListener,
	ViewChild, Input
} from '@angular/core';
import {
	BeatsRangeDrawingObject, IDObject,
	GridCellDrawingObject, CursorDrawingObject, PeakDrawingObject,
	WavepointDrawingObject, DemoRectDrawingObject, XDOChangeType,
	SignalDrawingObject, XDrawingObject,
	XDOType, AnsDrawingObject, WaveDrawingObject
} from "../model/drawingobject";

@Component({
	selector: 'app-drawingobject',
	templateUrl: './drawingobject.component.html',
	styleUrls: ['./drawingobject.component.css']
})

// -------------------------------------------------------------------------------------------------
// Drawingobject component
// -------------------------------------------------------------------------------------------------
export class DrawingobjectComponent implements OnInit {
	private _data: XDrawingObject;
	private _index: number;

	//----------------------------------------------------------------------------------------------
	@Input("data")
	public set data(value: XDrawingObject) { this._data = value; }
	@Input("index")
	public set index(value: number) { this._index = value; }
	//----------------------------------------------------------------------------------------------
	public get data(): XDrawingObject { return this._data; }
	public get index(): number { return this._index; }

	//-------------------------------------------------------------------------------------
	constructor() {

	}

	//-------------------------------------------------------------------------------------
	ngOnInit() {
		//console.log(this.data);
	}

}
