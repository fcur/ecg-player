import { Component, HostListener } from '@angular/core';

@Component({
		selector: 'app-root',
		templateUrl: './app.component.html',
		styleUrls: ['./app.component.css']
})

// -------------------------------------------------------------------------------------------------
// AppComponent
// -------------------------------------------------------------------------------------------------
export class AppComponent {

		public title: string = 'app';

		//-------------------------------------------------------------------------------------
		constructor() {
		}

		//-------------------------------------------------------------------------------------
		ngOnInit() {
				//console.info("AppComponent: init");
		}

		//-------------------------------------------------------------------------------------
		ngOnDestroy() {
				//console.info("AppComponent: destroy");
		}
}
