import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { DrawableComponent } from './drawable/drawable.component';
import { DataService } from "./service/data.service";
import { DrawingobjectComponent } from './drawingobject/drawingobject.component'

@NgModule({
	declarations: [
		AppComponent,
		DrawableComponent,
		DrawingobjectComponent
	],
	imports: [
		BrowserModule
	],
	providers: [DataService],
	bootstrap: [AppComponent]
})
export class AppModule { }
