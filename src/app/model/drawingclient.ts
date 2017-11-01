﻿
// -------------------------------------------------------------------------------------------------
// Drawing mode
// -------------------------------------------------------------------------------------------------
export enum XDrawingMode {
  Canvas = 0,
  SVG,
  Mix
}

// -------------------------------------------------------------------------------------------------
// Drawing client
// -------------------------------------------------------------------------------------------------
export class XDrawingClient {
  public mode: XDrawingMode;
  public draw: Function;


}


