import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { DrawableComponent } from './drawable/drawable.component';
import { DataService } from "./service/data.service"
import { FileDropModule } from "ngx-file-drop/lib/ngx-drop";

@NgModule({
	declarations: [
		AppComponent,
		DrawableComponent
	],
	imports: [
			BrowserModule,
			FileDropModule
	],
	providers: [DataService],
	bootstrap: [AppComponent]
})
export class AppModule { }
